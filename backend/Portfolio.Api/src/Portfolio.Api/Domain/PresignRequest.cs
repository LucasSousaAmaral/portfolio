using System;

public record PresignRequest(string? ContentType = null, string? FileName = null, string? Folder = null);
