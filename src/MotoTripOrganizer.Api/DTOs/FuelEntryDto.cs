namespace MotoTripOrganizer.Application.DTOs;

public class FuelEntryDto
{
    public int Id { get; set; }
    public int TripId { get; set; }
    public DateTime Date { get; set; }
    public decimal Quantity { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public int Mileage { get; set; }
    public string Location { get; set; } = string.Empty;
    public string? Note { get; set; }
    public int CreatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateFuelEntryDto
{
    public DateTime Date { get; set; }
    public decimal Quantity { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "EUR";
    public int Mileage { get; set; }
    public string Location { get; set; } = string.Empty;
    public string? Note { get; set; }
}

public class UpdateFuelEntryDto
{
    public DateTime Date { get; set; }
    public decimal Quantity { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "EUR";
    public int Mileage { get; set; }
    public string Location { get; set; } = string.Empty;
    public string? Note { get; set; }
}
