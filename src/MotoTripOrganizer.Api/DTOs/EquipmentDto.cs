namespace MotoTripOrganizer.Application.DTOs;

// ── Šifarnik ────────────────────────────────────────────────────────────────

public class EquipmentCatalogItemDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Category { get; set; } = string.Empty;
}

// ── Trip Equipment Entries ───────────────────────────────────────────────────

public class TripEquipmentEntryDto
{
    public int Id { get; set; }
    public int TripId { get; set; }
    public int EquipmentCatalogItemId { get; set; }
    public string EquipmentName { get; set; } = string.Empty;
    public string EquipmentCategory { get; set; } = string.Empty;
    public int CarriedByUserId { get; set; }
    public string CarriedByDisplayName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public string? Note { get; set; }
    public int CreatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateTripEquipmentEntryDto
{
    public int EquipmentCatalogItemId { get; set; }
    public int CarriedByUserId { get; set; }
    public int Quantity { get; set; } = 1;
    public string? Note { get; set; }
}

public class UpdateTripEquipmentEntryDto
{
    public int EquipmentCatalogItemId { get; set; }
    public int CarriedByUserId { get; set; }
    public int Quantity { get; set; } = 1;
    public string? Note { get; set; }
}
