namespace MotoTripOrganizer.Domain.Entities;

/// <summary>
/// Unos opreme za konkretan trip - ko nosi koji komad opreme.
/// Svi unosi su javni u okviru tripa.
/// </summary>
public class TripEquipmentEntry
{
    public int Id { get; set; }
    public int TripId { get; set; }
    public int EquipmentCatalogItemId { get; set; }

    /// <summary>
    /// Koji član grupe nosi opremu (UserId)
    /// </summary>
    public int CarriedByUserId { get; set; }

    public int Quantity { get; set; } = 1;
    public string? Note { get; set; }

    public int CreatedByUserId { get; set; }
    public int? UpdatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    // Concurrency token
    public byte[] RowVersion { get; set; } = null!;

    // Navigation properties
    public Trip Trip { get; set; } = null!;
    public EquipmentCatalogItem EquipmentCatalogItem { get; set; } = null!;
    public User CarriedByUser { get; set; } = null!;
}
