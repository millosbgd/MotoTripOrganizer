namespace MotoTripOrganizer.Domain.Entities;

/// <summary>
/// Tracks expenses for the trip. Can be linked to a specific stage or trip-level.
/// Amount and Currency allow multi-currency support with conversion at reporting time.
/// </summary>
public class Expense
{
    public int Id { get; set; }
    public int TripId { get; set; }
    public int? StageId { get; set; }
    public DateTime Date { get; set; }
    public string Category { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "EUR";
    public int PaidByUserId { get; set; }
    public string? Note { get; set; }
    
    public int CreatedByUserId { get; set; }
    public int? UpdatedByUserId { get; set; }
    
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    
    // Concurrency token
    public byte[] RowVersion { get; set; } = null!;

    // Navigation properties
    public Trip Trip { get; set; } = null!;
    public Stage? Stage { get; set; }
    public User PaidBy { get; set; } = null!;
    public User CreatedBy { get; set; } = null!;
    public User? UpdatedBy { get; set; }
    public ICollection<Attachment> Attachments { get; set; } = new List<Attachment>();
}
