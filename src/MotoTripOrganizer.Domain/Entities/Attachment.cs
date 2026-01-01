namespace MotoTripOrganizer.Domain.Entities;

/// <summary>
/// Represents a file attachment stored in Azure Blob Storage.
/// Only metadata is stored in the database; actual file is in blob storage.
/// Can be attached to an Item or Expense.
/// </summary>
public class Attachment
{
    public int Id { get; set; }
    public int TripId { get; set; }
    public int? ItemId { get; set; }
    public int? ExpenseId { get; set; }
    public string BlobUrl { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string MimeType { get; set; } = string.Empty;
    public long Size { get; set; }
    
    public int CreatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; }

    // Navigation properties
    public Trip Trip { get; set; } = null!;
    public Item? Item { get; set; }
    public Expense? Expense { get; set; }
    public User CreatedBy { get; set; } = null!;
}
