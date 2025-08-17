using Amazon.DynamoDBv2;
using Amazon.Lambda.AspNetCoreServer;
using Amazon.Lambda.AspNetCoreServer.Hosting;
using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.AspNetCore.Mvc;
using Portfolio.Api.Domain;
using Portfolio.Api.Infra;
using System.Text.RegularExpressions;

var builder = WebApplication.CreateBuilder(args);

// Lambda + HTTP API
builder.Services.AddAWSLambdaHosting(LambdaEventSource.HttpApi);

// CORS: restringe ao FRONT_ORIGIN (se definido). Se o API Gateway já injeta CORS, você pode remover esta seção.
var frontOrigin = builder.Configuration["FRONT_ORIGIN"];
builder.Services.AddCors(o =>
{
    o.AddDefaultPolicy(p =>
    {
        if (!string.IsNullOrWhiteSpace(frontOrigin))
            p.WithOrigins(frontOrigin).AllowAnyHeader().AllowAnyMethod();
        else
            p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod(); // fallback
    });
});

// AWS clients (creds/region herdados do ambiente da Lambda)
builder.Services.AddSingleton<IAmazonDynamoDB>(_ => new AmazonDynamoDBClient());
builder.Services.AddSingleton<IAmazonS3>(_ => new AmazonS3Client());

// Repositórios
builder.Services.AddSingleton<ProjectsRepository>();

var app = builder.Build();
app.UseCors();

// Hardening: bloqueia escritas quando ALLOW_WRITES=false (default false)
app.Use(async (ctx, next) =>
{
    var allowWrites = app.Configuration.GetValue("ALLOW_WRITES", false);
    if (!allowWrites && (HttpMethods.IsPost(ctx.Request.Method)
                      || HttpMethods.IsPut(ctx.Request.Method)
                      || HttpMethods.IsPatch(ctx.Request.Method)
                      || HttpMethods.IsDelete(ctx.Request.Method)))
    {
        ctx.Response.StatusCode = StatusCodes.Status403Forbidden;
        await ctx.Response.WriteAsync("writes disabled");
        return;
    }
    await next();
});

// Health
app.MapGet("/health", () => Results.Ok(new { status = "ok", ts = DateTimeOffset.UtcNow }));

// ---- Projects API ----
app.MapGet("/api/v1/projects", async (
    ProjectsRepository repo,
    int? limit,
    string? cursor,
    string? status) =>
{
    var s = string.IsNullOrWhiteSpace(status) ? "published" : status.ToLowerInvariant();
    var (items, nextCursor) = await repo.ListByStatusAsync(s, limit ?? 20, cursor);
    return Results.Ok(new { items, nextCursor });
});

app.MapGet("/api/v1/projects/{id}", async (string id, ProjectsRepository repo) =>
{
    var p = await repo.GetAsync(id);
    return p is null ? Results.NotFound() : Results.Ok(p);
});

app.MapPost("/api/v1/projects", async (CreateProjectDto dto, ProjectsRepository repo) =>
{
    var p = new Project
    {
        Title = dto.Title,
        Description = dto.Description,
        Techs = dto.Techs,
        Url = dto.Url,
        Image = dto.Image,
        Status = dto.Status?.ToLowerInvariant() == "published" ? "published" : "draft"
    };
    await repo.CreateAsync(p);
    return Results.Created($"/api/v1/projects/{p.Id}", p);
});

app.MapPut("/api/v1/projects/{id}", async (string id, UpdateProjectDto dto, ProjectsRepository repo) =>
{
    await repo.UpdateAsync(id, dto);
    var p = await repo.GetAsync(id);
    return p is null ? Results.NotFound() : Results.Ok(p);
});

app.MapDelete("/api/v1/projects/{id}", async (string id, ProjectsRepository repo) =>
{
    await repo.DeleteAsync(id);
    return Results.NoContent();
});

// ---- Upload Presigned URL (com whitelist de MIME e flag) ----
app.MapPost("/api/v1/uploads/presign", async (
    [FromServices] IAmazonS3 s3,
    [FromBody] PresignRequest req,
    IConfiguration cfg
) =>
{
    // Feature flag: desligado por padrão em produção
    if (!cfg.GetValue("ALLOW_PRESIGN", false))
        return Results.StatusCode(StatusCodes.Status403Forbidden);

    var bucket = Environment.GetEnvironmentVariable("ASSETS_BUCKET");
    if (string.IsNullOrWhiteSpace(bucket))
        return Results.Problem("ASSETS_BUCKET not configured", statusCode: 500);

    // Whitelist de content-type (somente imagens comuns)
    string[] allowed = { "image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif" };
    var contentType = req.ContentType?.ToLowerInvariant();
    if (string.IsNullOrWhiteSpace(contentType) || !allowed.Contains(contentType))
        return Results.StatusCode(StatusCodes.Status415UnsupportedMediaType);

    // folder seguro (sem // ou ../) e catálogo controlado
    var folder = string.IsNullOrWhiteSpace(req.Folder) ? "projects" : SanitizeFolder(req.Folder);

    // baseName “slugado”; se vazio, GUID
    var baseName = Slug(Path.GetFileNameWithoutExtension(req.FileName)) ?? Guid.NewGuid().ToString("N");

    // extensão: prioriza do filename, fallback por content-type
    var ext = GetExtensionFromFileName(req.FileName) ?? GuessExtension(contentType) ?? string.Empty;

    var key = $"{folder}/{baseName}-{Guid.NewGuid():N}{ext}";

    var pre = new GetPreSignedUrlRequest
    {
        BucketName = bucket,
        Key = key,
        Verb = HttpVerb.PUT,
        Expires = DateTime.UtcNow.AddMinutes(10),
        ContentType = contentType
        // Se adicionar cabeçalhos aqui, o cliente deve enviá-los idênticos no PUT
    };

    var uploadUrl = s3.GetPreSignedURL(pre);

    // URL pública “bonita” opcional via CDN de assets
    var assetsCdn = cfg["ASSETS_CDN_BASE"]; // ex.: https://cdn.seu-dominio.dev
    var publicUrl = string.IsNullOrWhiteSpace(assetsCdn)
        ? $"https://{bucket}.s3.amazonaws.com/{key}"
        : $"{assetsCdn.TrimEnd('/')}/{key}";

    return Results.Ok(new { uploadUrl, key, url = publicUrl, contentType });
});

// ----------------- helpers -----------------
static string SanitizeFolder(string folder)
{
    var f = folder.Trim().Trim('/').Replace('\\', '/');
    while (f.Contains("//")) f = f.Replace("//", "/");
    f = f.Replace("../", "").Replace("..", "");
    return string.IsNullOrWhiteSpace(f) ? "projects" : f;
}

static string? GetExtensionFromFileName(string? fileName)
{
    if (string.IsNullOrWhiteSpace(fileName)) return null;
    var ext = Path.GetExtension(fileName).ToLowerInvariant();
    return string.IsNullOrWhiteSpace(ext) ? null : ext;
}

static string? GuessExtension(string? contentType) =>
    contentType?.ToLowerInvariant() switch
    {
        "image/png" => ".png",
        "image/jpeg" => ".jpg",
        "image/jpg" => ".jpg",
        "image/webp" => ".webp",
        "image/gif" => ".gif",
        "image/svg+xml" => ".svg",
        _ => null
    };

static string? Slug(string? s)
{
    if (string.IsNullOrWhiteSpace(s)) return null;
    var cleaned = s.ToLowerInvariant();

    foreach (var ch in Path.GetInvalidFileNameChars())
        cleaned = cleaned.Replace(ch, '-');

    cleaned = Regex.Replace(cleaned, @"[^a-z0-9\-_]+", "-");
    cleaned = Regex.Replace(cleaned, "-{2,}", "-").Trim('-');

    return string.IsNullOrWhiteSpace(cleaned) ? null : cleaned;
}

app.Run();

// Para testes de integração
public partial class Program { }