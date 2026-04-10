namespace MotoTripOrganizer.Domain.Entities;

/// <summary>
/// Šifarnik opreme - predefinisane stavke opreme koje članovi grupe mogu nositi na putu.
/// </summary>
public class EquipmentCatalogItem
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Category { get; set; } = string.Empty;

    // Navigation properties
    public ICollection<TripEquipmentEntry> TripEquipmentEntries { get; set; } = new List<TripEquipmentEntry>();
}
