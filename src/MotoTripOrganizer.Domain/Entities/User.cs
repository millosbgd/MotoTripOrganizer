namespace MotoTripOrganizer.Domain.Entities;

/// <summary>
/// Represents an application user. Users can belong to multiple trips.
/// Auth0Subject is the unique identifier from Auth0 (sub claim).
/// </summary>
public class User
{
    public int Id { get; set; }
    public string Auth0Subject { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }

    // Navigation properties
    public ICollection<Trip> OwnedTrips { get; set; } = new List<Trip>();
    public ICollection<TripMember> TripMemberships { get; set; } = new List<TripMember>();
    public ICollection<Stage> CreatedStages { get; set; } = new List<Stage>();
    public ICollection<Stage> UpdatedStages { get; set; } = new List<Stage>();
    public ICollection<Item> CreatedItems { get; set; } = new List<Item>();
    public ICollection<Item> UpdatedItems { get; set; } = new List<Item>();
    public ICollection<Expense> PaidExpenses { get; set; } = new List<Expense>();
    public ICollection<Expense> CreatedExpenses { get; set; } = new List<Expense>();
    public ICollection<Expense> UpdatedExpenses { get; set; } = new List<Expense>();
    public ICollection<Attachment> CreatedAttachments { get; set; } = new List<Attachment>();
}
