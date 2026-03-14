namespace MotoTripOrganizer.Domain.Entities;

/// <summary>
/// Emergency information for a trip member.
/// Each member can manage their own entry; all members of the trip can view all entries.
/// </summary>
public class EmergencyInfo
{
    public int Id { get; set; }
    public int TripId { get; set; }
    public int UserId { get; set; }

    /// <summary>
    /// Name of the person to contact in case of emergency.
    /// </summary>
    public string? EmergencyContactName { get; set; }

    /// <summary>
    /// Phone number of the emergency contact.
    /// </summary>
    public string? EmergencyContactPhone { get; set; }

    /// <summary>
    /// Blood type (e.g. A+, O-, AB+)
    /// </summary>
    public string? BloodType { get; set; }

    /// <summary>
    /// Health insurance policy number.
    /// </summary>
    public string? HealthInsurancePolicyNumber { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public Trip Trip { get; set; } = null!;
    public User User { get; set; } = null!;
}
