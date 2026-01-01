namespace MotoTripOrganizer.Domain.Entities;

/// <summary>
/// A stage represents a leg of a trip (e.g., Day 1: Munich -> Innsbruck).
/// Belongs to a trip and enforces trip-scoped access.
/// Uses RowVersion for optimistic concurrency control.
/// </summary>
public class Stage
{
    public int Id { get; set; }
    public int TripId { get; set; }
    public DateTime Date { get; set; }
    public string StartText { get; set; } = string.Empty;
    public string EndText { get; set; } = string.Empty;
    public int? PlannedKm { get; set; }
    public string? Notes { get; set; }
    
    public int CreatedByUserId { get; set; }
    public int? UpdatedByUserId { get; set; }
    
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    
    // Concurrency token
    public byte[] RowVersion { get; set; } = null!;

    // Navigation properties
    public Trip Trip { get; set; } = null!;
    public User CreatedBy { get; set; } = null!;
    public User? UpdatedBy { get; set; }
    public ICollection<Item> Items { get; set; } = new List<Item>();
    public ICollection<Expense> Expenses { get; set; } = new List<Expense>();
}
