using MotoTripOrganizer.Domain.Enums;

namespace MotoTripOrganizer.Domain.Entities;

/// <summary>
/// An item can be a note, link, or hotel booking. Can be attached to a stage or trip-level.
/// LocationJson stores GPS coordinates or address in JSON format.
/// </summary>
public class Item
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
    public int? UpdatedByUserId { get; set; }
    
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    
    // Concurrency token
    public byte[] RowVersion { get; set; } = null!;

    // Navigation properties
    public Trip Trip { get; set; } = null!;
    public Stage? Stage { get; set; }
    public User CreatedBy { get; set; } = null!;
    public User? UpdatedBy { get; set; }
    public ICollection<Attachment> Attachments { get; set; } = new List<Attachment>();
}
