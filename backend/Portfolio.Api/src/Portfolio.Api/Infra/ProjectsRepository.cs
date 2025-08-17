using System.Text;
using System.Text.Json;
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using Portfolio.Api.Domain;
using Amazon.S3;
using Amazon.S3.Model;

namespace Portfolio.Api.Infra;

public class ProjectsRepository
{
    private readonly IAmazonDynamoDB _ddb;
    private readonly string _table;
    private const string GsiName = "gsi_status_createdAt";

    public ProjectsRepository(IAmazonDynamoDB ddb, IConfiguration cfg)
    {
        _ddb = ddb;
        _table = cfg["DDB_PROJECTS_TABLE"] ?? throw new InvalidOperationException("DDB_PROJECTS_TABLE not set");
    }

    // ---------- Reading ----------

    public async Task<Project?> GetAsync(string id)
    {
        var resp = await _ddb.GetItemAsync(new GetItemRequest
        {
            TableName = _table,
            Key = new() { ["id"] = new AttributeValue { S = id } }
        });
        return resp.Item.Count == 0 ? null : FromItem(resp.Item);
    }

    /// <summary>
    /// Lista por status (default: published) ordenado por createdAt DESC (via GSI).
    /// Retorna items + nextCursor (Base64) se houver mais páginas.
    /// </summary>
    public async Task<(List<Project> Items, string? NextCursor)> ListByStatusAsync(
        string status = "published",
        int limit = 20,
        string? cursor = null)
    {
        var req = new QueryRequest
        {
            TableName = _table,
            IndexName = GsiName,
            KeyConditionExpression = "#s = :status",
            ExpressionAttributeNames = new() { ["#s"] = "status" },
            ExpressionAttributeValues = new() { [":status"] = new AttributeValue { S = status } },
            Limit = Math.Clamp(limit, 1, 100),
            ScanIndexForward = false // DESC por createdAt
        };

        if (!string.IsNullOrWhiteSpace(cursor))
        {
            // Cursor é Base64 de {"id":"...","createdAt":"..."}
            var (exId, exCreatedAt) = DecodeCursor(cursor);
            req.ExclusiveStartKey = new Dictionary<string, AttributeValue>
            {
                ["status"] = new AttributeValue { S = status },
                ["createdAt"] = new AttributeValue { S = exCreatedAt },
                ["id"] = new AttributeValue { S = exId }
            };
        }

        var resp = await _ddb.QueryAsync(req);
        var items = resp.Items.Select(FromItem).ToList();

        string? nextCursor = null;
        if (resp.LastEvaluatedKey != null && resp.LastEvaluatedKey.Count > 0)
        {
            // Para reconstruir o cursor, precisamos do sortKey e do id
            var id = resp.LastEvaluatedKey["id"].S;
            var createdAt = resp.LastEvaluatedKey["createdAt"].S;
            nextCursor = EncodeCursor(id, createdAt);
        }

        return (items, nextCursor);
    }

    // ---------- Writing ----------

    public async Task CreateAsync(Project p)
    {
        if (string.IsNullOrWhiteSpace(p.Id)) p.Id = Guid.NewGuid().ToString("N");
        if (string.IsNullOrWhiteSpace(p.CreatedAt)) p.CreatedAt = DateTimeOffset.UtcNow.ToString("O");
        if (string.IsNullOrWhiteSpace(p.Status)) p.Status = "draft";

        var item = ToItem(p);
        await _ddb.PutItemAsync(new PutItemRequest
        {
            TableName = _table,
            Item = item,
            ConditionExpression = "attribute_not_exists(id)"
        });
    }

    public async Task UpdateAsync(string id, UpdateProjectDto dto)
    {
        var names = new Dictionary<string, string>();
        var values = new Dictionary<string, AttributeValue>();
        var sets = new List<string>();

        void Set(string field, AttributeValue val)
        {
            names[$"#{field}"] = field;
            values[$":{field}"] = val;
            sets.Add($"#{field} = :{field}");
        }

        if (dto.Title is not null) Set("Title", new AttributeValue { S = dto.Title });
        if (dto.Description is not null) Set("Description", new AttributeValue { S = dto.Description });

        if (dto.Techs is not null)
        {
            var techs = dto.Techs.Where(t => !string.IsNullOrWhiteSpace(t))
                                 .Select(t => t.Trim())
                                 .Distinct(StringComparer.OrdinalIgnoreCase)
                                 .ToList();
            if (techs.Count > 0)
                Set("Techs", new AttributeValue { SS = techs });
            else
            {
                // Remove o atributo quando lista está vazia
                names["#Techs"] = "Techs";
                sets.Add("REMOVE #Techs");
            }
        }

        if (dto.Url is not null)
            Set("Url", string.IsNullOrWhiteSpace(dto.Url) ? new AttributeValue { NULL = true } : new AttributeValue { S = dto.Url });

        if (dto.Image is not null)
            Set("Image", string.IsNullOrWhiteSpace(dto.Image) ? new AttributeValue { NULL = true } : new AttributeValue { S = dto.Image });

        if (dto.Status is not null)
            Set("status", new AttributeValue { S = dto.Status });

        if (sets.Count == 0) return;

        await _ddb.UpdateItemAsync(new UpdateItemRequest
        {
            TableName = _table,
            Key = new() { ["id"] = new AttributeValue { S = id } },
            UpdateExpression = "SET " + string.Join(", ", sets.Where(x => !x.StartsWith("REMOVE "))) +
                               (sets.Any(x => x.StartsWith("REMOVE ")) ? " " + string.Join(" ", sets.Where(x => x.StartsWith("REMOVE "))) : ""),
            ExpressionAttributeNames = names,
            ExpressionAttributeValues = values.Count == 0 ? null : values,
            ConditionExpression = "attribute_exists(id)"
        });
    }

    public async Task DeleteAsync(string id)
    {
        await _ddb.DeleteItemAsync(new DeleteItemRequest
        {
            TableName = _table,
            Key = new() { ["id"] = new AttributeValue { S = id } },
            ConditionExpression = "attribute_exists(id)"
        });
    }

    // ---------- Mapping ----------

    private static Dictionary<string, AttributeValue> ToItem(Project p)
    {
        var item = new Dictionary<string, AttributeValue>
        {
            ["id"] = new AttributeValue { S = p.Id },
            ["Title"] = new AttributeValue { S = p.Title },
            ["Description"] = new AttributeValue { S = p.Description ?? string.Empty },
            ["status"] = new AttributeValue { S = p.Status },
            ["createdAt"] = new AttributeValue { S = p.CreatedAt }
        };

        // Techs: set não pode ser vazio
        var techs = (p.Techs ?? Array.Empty<string>())
            .Where(t => !string.IsNullOrWhiteSpace(t))
            .Select(t => t.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (techs.Count > 0)
            item["Techs"] = new AttributeValue { SS = techs };

        item["Url"] = p.Url is null ? new AttributeValue { NULL = true } : new AttributeValue { S = p.Url };
        item["Image"] = p.Image is null ? new AttributeValue { NULL = true } : new AttributeValue { S = p.Image };

        return item;
    }

    private static Project FromItem(Dictionary<string, AttributeValue> i) => new()
    {
        Id = i["id"].S,
        Title = i["Title"].S,
        Description = i.ContainsKey("Description") ? i["Description"].S : null,
        Techs = i.ContainsKey("Techs") && i["Techs"].SS != null ? i["Techs"].SS.ToArray() : Array.Empty<string>(),
        Url = i.ContainsKey("Url") && i["Url"].NULL == false ? i["Url"].S : null,
        Image = i.ContainsKey("Image") && i["Image"].NULL == false ? i["Image"].S : null,
        Status = i["status"].S,
        CreatedAt = i["createdAt"].S
    };

    // ---------- Cursor helpers ----------

    private static string EncodeCursor(string id, string createdAt)
    {
        var json = JsonSerializer.Serialize(new Cursor { Id = id, CreatedAt = createdAt });
        return Convert.ToBase64String(Encoding.UTF8.GetBytes(json));
    }

    private static (string Id, string CreatedAt) DecodeCursor(string cursor)
    {
        var json = Encoding.UTF8.GetString(Convert.FromBase64String(cursor));
        var c = JsonSerializer.Deserialize<Cursor>(json)!;
        return (c.Id, c.CreatedAt);
    }

    private record Cursor
    {
        public string Id { get; init; } = default!;
        public string CreatedAt { get; init; } = default!;
    }
}