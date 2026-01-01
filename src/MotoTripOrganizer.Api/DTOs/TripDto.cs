using MotoTripOrganizer.Domain.Enums;

namespace MotoTripOrganizer.Application.DTOs;

public class TripDto
{
    public int Id { get; set; }
    public int OwnerUserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string BaseCurrency { get; set; } = string.Empty;
}

public class TripDetailDto : TripDto
{
    public List<TripMemberDto> Members { get; set; } = new();
}

public class CreateTripRequest
{
    public string Name { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string BaseCurrency { get; set; } = "EUR";
}

public class TripMemberDto
{
    public int UserId { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public TripMemberRole Role { get; set; }
    public DateTime JoinedAt { get; set; }
}
