using MotoTripOrganizer.Domain.Enums;

namespace MotoTripOrganizer.Application.DTOs;

public class ItemDto
{
    public int Id { get; set; }
    public int TripId { get; set; }
    public int? StageId { get; set; }
    public ItemType Type { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Body { get; set; }
    public string? Url { get; set; }
    public string? LocationJson { get; set; }
    public int CreatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateItemRequest
{
    public int? StageId { get; set; }
    public ItemType Type { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Body { get; set; }
    public string? Url { get; set; }
    public string? LocationJson { get; set; }
}

public class UpdateItemRequest
{
    public int? StageId { get; set; }
    public ItemType Type { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Body { get; set; }
    public string? Url { get; set; }
    public string? LocationJson { get; set; }
}
