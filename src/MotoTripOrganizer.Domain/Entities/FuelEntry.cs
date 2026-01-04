namespace MotoTripOrganizer.Domain.Entities;

/// <summary>
/// Tracks fuel refueling entries for a trip.
/// </summary>
public class FuelEntry
{
    public int Id { get; set; }
    public int TripId { get; set; }
    public DateTime Date { get; set; }
    
    /// <summary>
    /// Quantity in liters
    /// </summary>
    public decimal Quantity { get; set; }
    
    /// <summary>
    /// Total amount paid
    /// </summary>
    public decimal Amount { get; set; }
    
    /// <summary>
    /// Unit price per liter (calculated: Amount / Quantity)
    /// </summary>
    public decimal UnitPrice { get; set; }
    
    /// <summary>
    /// Current mileage/odometer reading in kilometers
    /// </summary>
    public int Mileage { get; set; }
    
    /// <summary>
    /// Location where fuel was purchased (e.g., gas station name/city)
    /// </summary>
    public string Location { get; set; } = string.Empty;
    
    public string? Note { get; set; }
    
    public int CreatedByUserId { get; set; }
    public int? UpdatedByUserId { get; set; }
    
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    
    // Concurrency token
    public byte[] RowVersion { get; set; } = null!;

    // Navigation properties
    public Trip Trip { get; set; } = null!;
}
