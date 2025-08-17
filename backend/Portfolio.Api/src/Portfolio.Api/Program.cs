using Amazon.DynamoDBv2;
using Amazon.Lambda.AspNetCoreServer;
using Amazon.Lambda.AspNetCoreServer.Hosting;
using Portfolio.Api.Domain;
using Portfolio.Api.Infra;
using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.AspNetCore.Mvc;


var builder = WebApplication.CreateBuilder(args);

builder.Services.AddAWSLambdaHosting(LambdaEventSource.HttpApi);
builder.Services.AddCors(o => o.AddDefaultPolicy(p => p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));

// DynamoDB client (usa credenciais do ambiente da Lambda automaticamente)
builder.Services.AddSingleton<IAmazonDynamoDB>(_ => new AmazonDynamoDBClient());
builder.Services.AddSingleton<ProjectsRepository>();

builder.Services.AddSingleton<IAmazonS3>(_ => new AmazonS3Client());

var app = builder.Build();
app.UseCors();

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

app.MapPost("/api/v1/uploads/presign", async (
    [FromServices] IAmazonS3 s3,
    [FromBody] PresignRequest req
) =>
{
    var bucket = Environment.GetEnvironmentVariable("ASSETS_BUCKET");
    if (string.IsNullOrWhiteSpace(bucket))
        return Results.Problem("ASSETS_BUCKET not configured", statusCode: 500);

    // folder seguro (sem // ou ../)
    var folder = string.IsNullOrWhiteSpace(req.Folder) ? "projects" : SanitizeFolder(req.Folder);

    // tenta a extensão via fileName; se não, a partir do contentType
    var ext = GetExtensionFromFileName(req.FileName) ?? GuessExtension(req.ContentType) ?? string.Empty;

    // se veio um nome, reaproveita; senão gera um guid
    var baseName = string.IsNullOrWhiteSpace(req.FileName)
        ? Guid.NewGuid().ToString("N")
        : System.IO.Path.GetFileNameWithoutExtension(req.FileName).Trim();

    var key = $"{folder}/{baseName}-{Guid.NewGuid():N}{ext}";

    var contentType = string.IsNullOrWhiteSpace(req.ContentType)
        ? "application/octet-stream"
        : req.ContentType;

    var pre = new GetPreSignedUrlRequest
    {
        BucketName = bucket,
        Key = key,
        Verb = HttpVerb.PUT,
        Expires = DateTime.UtcNow.AddMinutes(10),
        ContentType = contentType
    };

    var uploadUrl = s3.GetPreSignedURL(pre);

    // dica: se o bucket for privado, esse URL público abaixo NÃO será acessível diretamente.
    // use-o só para gravar no seu objeto "image" do projeto se você pretender servir via CloudFront depois.
    var publicUrl = $"https://{bucket}.s3.amazonaws.com/{key}";

    return Results.Ok(new { uploadUrl, key, url = publicUrl, contentType });
});

// helpers
static string SanitizeFolder(string folder)
{
    var f = folder.Trim().Trim('/').Replace('\\', '/');
    // remove .. e duplicidades simples
    while (f.Contains("//")) f = f.Replace("//", "/");
    f = f.Replace("../", "").Replace("..", "");
    return string.IsNullOrWhiteSpace(f) ? "projects" : f;
}

static string? GetExtensionFromFileName(string? fileName)
{
    if (string.IsNullOrWhiteSpace(fileName)) return null;
    var ext = System.IO.Path.GetExtension(fileName).ToLowerInvariant();
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

app.Run();
public partial class Program { }
