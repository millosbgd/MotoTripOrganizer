namespace MotoTripOrganizer.Application.DTOs;

public class EmergencyInfoDto
{
    public int Id { get; set; }
    public int TripId { get; set; }
    public int UserId { get; set; }
    public string? UserDisplayName { get; set; }
    public string? EmergencyContactName { get; set; }
    public string? EmergencyContactPhone { get; set; }
    public string? BloodType { get; set; }
    public string? HealthInsurancePolicyNumber { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public bool IsCurrentUser { get; set; }
}

public class UpsertEmergencyInfoDto
{
    public string? EmergencyContactName { get; set; }
    public string? EmergencyContactPhone { get; set; }
    public string? BloodType { get; set; }
    public string? HealthInsurancePolicyNumber { get; set; }
}
