namespace MotoTripOrganizer.Application.DTOs;

public class StageDto
{
    public int Id { get; set; }
    public int TripId { get; set; }
    public DateTime Date { get; set; }
    public string StartText { get; set; } = string.Empty;
    public string EndText { get; set; } = string.Empty;
    public int? PlannedKm { get; set; }
    public string? Notes { get; set; }
    public int CreatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateStageRequest
{
    public DateTime Date { get; set; }
    public string StartText { get; set; } = string.Empty;
    public string EndText { get; set; } = string.Empty;
    public int? PlannedKm { get; set; }
    public string? Notes { get; set; }
}

public class UpdateStageRequest
{
    public DateTime Date { get; set; }
    public string StartText { get; set; } = string.Empty;
    public string EndText { get; set; } = string.Empty;
    public int? PlannedKm { get; set; }
    public string? Notes { get; set; }
}
