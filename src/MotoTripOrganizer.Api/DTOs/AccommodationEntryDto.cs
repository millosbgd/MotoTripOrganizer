namespace MotoTripOrganizer.Application.DTOs;

public class AccommodationEntryDto
{
    public int Id { get; set; }
    public int TripId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string AccommodationType { get; set; } = string.Empty;
    public DateTime CheckInDate { get; set; }
    public DateTime CheckOutDate { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string? Note { get; set; }
    public int CreatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateAccommodationEntryDto
{
    public string Name { get; set; } = string.Empty;
    public string AccommodationType { get; set; } = string.Empty;
    public DateTime CheckInDate { get; set; }
    public DateTime CheckOutDate { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "EUR";
    public string Location { get; set; } = string.Empty;
    public string? Note { get; set; }
}

public class UpdateAccommodationEntryDto
{
    public string Name { get; set; } = string.Empty;
    public string AccommodationType { get; set; } = string.Empty;
    public DateTime CheckInDate { get; set; }
    public DateTime CheckOutDate { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "EUR";
    public string Location { get; set; } = string.Empty;
    public string? Note { get; set; }
}
