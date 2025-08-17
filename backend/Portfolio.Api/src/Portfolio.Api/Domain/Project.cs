namespace Portfolio.Api.Domain;

public class Project
{
    public string Id { get; set; } = default!;
    public string Title { get; set; } = default!;
    public string Description { get; set; } = default!;
    public string[] Techs { get; set; } = Array.Empty<string>();
    public string? Url { get; set; }
    public string? Image { get; set; }
    public string Status { get; set; } = "draft"; // draft | published
    public string CreatedAt { get; set; } = DateTimeOffset.UtcNow.ToString("O"); // ISO-8601
}

public record CreateProjectDto(string Title, string Description, string[] Techs, string? Url, string? Image, string Status = "draft");
public record UpdateProjectDto(string? Title, string? Description, string[]? Techs, string? Url, string? Image, string? Status);