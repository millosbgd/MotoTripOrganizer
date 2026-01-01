namespace MotoTripOrganizer.Domain.Entities;

/// <summary>
/// A trip is the core aggregate root. Every trip has an owner and members.
/// "Trip is sacred" - all data access must be scoped to TripId with membership verification.
/// </summary>
public class Trip
{
    public int Id { get; set; }
    public int OwnerUserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string BaseCurrency { get; set; } = "EUR";

    // Navigation properties
    public User Owner { get; set; } = null!;
    public ICollection<TripMember> Members { get; set; } = new List<TripMember>();
    public ICollection<Stage> Stages { get; set; } = new List<Stage>();
    public ICollection<Item> Items { get; set; } = new List<Item>();
    public ICollection<Expense> Expenses { get; set; } = new List<Expense>();
    public ICollection<Attachment> Attachments { get; set; } = new List<Attachment>();
}
