using MotoTripOrganizer.Domain.Enums;

namespace MotoTripOrganizer.Domain.Entities;

/// <summary>
/// Represents membership in a trip. Each trip member has a role (Owner/Editor/Viewer).
/// This is the authorization mechanism - only members can access trip data.
/// </summary>
public class TripMember
{
    public int TripId { get; set; }
    public int UserId { get; set; }
    public TripMemberRole Role { get; set; }
    public DateTime JoinedAt { get; set; }

    // Navigation properties
    public Trip Trip { get; set; } = null!;
    public User User { get; set; } = null!;
}
