namespace MotoTripOrganizer.Domain.Entities;

/// <summary>
/// Tracks accommodation entries for a trip.
/// </summary>
public class AccommodationEntry
{
    public int Id { get; set; }
    public int TripId { get; set; }
    
    /// <summary>
    /// Name of the accommodation (hotel name, apartment address, etc.)
    /// </summary>
    public string Name { get; set; } = string.Empty;
    
    /// <summary>
    /// Type of accommodation: Hotel, Apartment, Camp, Friend, Other
    /// </summary>
    public string AccommodationType { get; set; } = string.Empty;
    
    /// <summary>
    /// Check-in date
    /// </summary>
    public DateTime CheckInDate { get; set; }
    
    /// <summary>
    /// Check-out date
    /// </summary>
    public DateTime CheckOutDate { get; set; }
    
    /// <summary>
    /// Total amount paid
    /// </summary>
    public decimal Amount { get; set; }
    
    /// <summary>
    /// Currency code (e.g., EUR, USD, RSD)
    /// </summary>
    public string Currency { get; set; } = "EUR";
    
    /// <summary>
    /// Location/address of accommodation
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
