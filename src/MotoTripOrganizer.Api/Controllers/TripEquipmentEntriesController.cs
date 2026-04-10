using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MotoTripOrganizer.Application.DTOs;
using MotoTripOrganizer.Domain.Entities;
using MotoTripOrganizer.Domain.Interfaces;
using MotoTripOrganizer.Infrastructure.Data;

namespace MotoTripOrganizer.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/trips/{tripId}/equipment-entries")]
public class TripEquipmentEntriesController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly ILogger<TripEquipmentEntriesController> _logger;

    public TripEquipmentEntriesController(
        ApplicationDbContext context,
        ICurrentUserService currentUserService,
        ILogger<TripEquipmentEntriesController> logger)
    {
        _context = context;
        _currentUserService = currentUserService;
        _logger = logger;
    }

    private async Task<bool> HasTripAccess(int tripId, int userId)
        => await _context.Trips
            .Where(t => t.Id == tripId)
            .AnyAsync(t => t.UserId == userId || t.Members.Any(m => m.UserId == userId));

    [HttpGet]
    public async Task<ActionResult<List<TripEquipmentEntryDto>>> GetEntries(int tripId)
    {
        try
        {
            var userId = _currentUserService.GetUserId();
            if (!userId.HasValue)
                return Unauthorized(new { message = "User not authenticated" });

            if (!await HasTripAccess(tripId, userId.Value))
                return NotFound(new { message = "Trip not found or access denied" });

            var entries = await _context.TripEquipmentEntries
                .Where(e => e.TripId == tripId)
                .Include(e => e.EquipmentCatalogItem)
                .Include(e => e.CarriedByUser)
                .OrderBy(e => e.EquipmentCatalogItem.Category)
                .ThenBy(e => e.EquipmentCatalogItem.Name)
                .Select(e => new TripEquipmentEntryDto
                {
                    Id = e.Id,
                    TripId = e.TripId,
                    EquipmentCatalogItemId = e.EquipmentCatalogItemId,
                    EquipmentName = e.EquipmentCatalogItem.Name,
                    EquipmentCategory = e.EquipmentCatalogItem.Category,
                    CarriedByUserId = e.CarriedByUserId,
                    CarriedByDisplayName = e.CarriedByUser.DisplayName,
                    Quantity = e.Quantity,
                    Note = e.Note,
                    CreatedByUserId = e.CreatedByUserId,
                    CreatedAt = e.CreatedAt,
                    UpdatedAt = e.UpdatedAt
                })
                .ToListAsync();

            return Ok(entries);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting equipment entries for trip {TripId}", tripId);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpPost]
    public async Task<ActionResult<TripEquipmentEntryDto>> CreateEntry(int tripId, [FromBody] CreateTripEquipmentEntryDto dto)
    {
        try
        {
            var userId = _currentUserService.GetUserId();
            if (!userId.HasValue)
                return Unauthorized(new { message = "User not authenticated" });

            if (!await HasTripAccess(tripId, userId.Value))
                return NotFound(new { message = "Trip not found or access denied" });

            // Validacija: CarriedByUserId mora biti član tripa ili owner
            var carriedByIsOnTrip = await _context.Trips
                .Where(t => t.Id == tripId)
                .AnyAsync(t => t.UserId == dto.CarriedByUserId || t.Members.Any(m => m.UserId == dto.CarriedByUserId));

            if (!carriedByIsOnTrip)
                return BadRequest(new { message = "CarriedByUserId must be a trip member" });

            // Validacija: katalog stavka mora postojati
            var catalogItemExists = await _context.EquipmentCatalogItems.AnyAsync(e => e.Id == dto.EquipmentCatalogItemId);
            if (!catalogItemExists)
                return BadRequest(new { message = "Equipment catalog item not found" });

            var entry = new TripEquipmentEntry
            {
                TripId = tripId,
                EquipmentCatalogItemId = dto.EquipmentCatalogItemId,
                CarriedByUserId = dto.CarriedByUserId,
                Quantity = dto.Quantity > 0 ? dto.Quantity : 1,
                Note = dto.Note,
                CreatedByUserId = userId.Value,
                CreatedAt = DateTime.UtcNow
            };

            _context.TripEquipmentEntries.Add(entry);
            await _context.SaveChangesAsync();

            // Reload sa navigation properties za response
            await _context.Entry(entry).Reference(e => e.EquipmentCatalogItem).LoadAsync();
            await _context.Entry(entry).Reference(e => e.CarriedByUser).LoadAsync();

            var result = new TripEquipmentEntryDto
            {
                Id = entry.Id,
                TripId = entry.TripId,
                EquipmentCatalogItemId = entry.EquipmentCatalogItemId,
                EquipmentName = entry.EquipmentCatalogItem.Name,
                EquipmentCategory = entry.EquipmentCatalogItem.Category,
                CarriedByUserId = entry.CarriedByUserId,
                CarriedByDisplayName = entry.CarriedByUser.DisplayName,
                Quantity = entry.Quantity,
                Note = entry.Note,
                CreatedByUserId = entry.CreatedByUserId,
                CreatedAt = entry.CreatedAt,
                UpdatedAt = entry.UpdatedAt
            };

            return CreatedAtAction(nameof(GetEntries), new { tripId }, result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating equipment entry for trip {TripId}", tripId);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<TripEquipmentEntryDto>> UpdateEntry(int tripId, int id, [FromBody] UpdateTripEquipmentEntryDto dto)
    {
        try
        {
            var userId = _currentUserService.GetUserId();
            if (!userId.HasValue)
                return Unauthorized(new { message = "User not authenticated" });

            var entry = await _context.TripEquipmentEntries
                .Include(e => e.Trip)
                    .ThenInclude(t => t.Members)
                .FirstOrDefaultAsync(e => e.Id == id && e.TripId == tripId);

            if (entry == null || (entry.Trip.UserId != userId.Value && !entry.Trip.Members.Any(m => m.UserId == userId.Value)))
                return NotFound(new { message = "Equipment entry not found" });

            // Validacija: CarriedByUserId mora biti član tripa
            var carriedByIsOnTrip = entry.Trip.UserId == dto.CarriedByUserId ||
                                    entry.Trip.Members.Any(m => m.UserId == dto.CarriedByUserId);
            if (!carriedByIsOnTrip)
                return BadRequest(new { message = "CarriedByUserId must be a trip member" });

            var catalogItemExists = await _context.EquipmentCatalogItems.AnyAsync(e => e.Id == dto.EquipmentCatalogItemId);
            if (!catalogItemExists)
                return BadRequest(new { message = "Equipment catalog item not found" });

            entry.EquipmentCatalogItemId = dto.EquipmentCatalogItemId;
            entry.CarriedByUserId = dto.CarriedByUserId;
            entry.Quantity = dto.Quantity > 0 ? dto.Quantity : 1;
            entry.Note = dto.Note;
            entry.UpdatedByUserId = userId.Value;
            entry.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            await _context.Entry(entry).Reference(e => e.EquipmentCatalogItem).LoadAsync();
            await _context.Entry(entry).Reference(e => e.CarriedByUser).LoadAsync();

            var result = new TripEquipmentEntryDto
            {
                Id = entry.Id,
                TripId = entry.TripId,
                EquipmentCatalogItemId = entry.EquipmentCatalogItemId,
                EquipmentName = entry.EquipmentCatalogItem.Name,
                EquipmentCategory = entry.EquipmentCatalogItem.Category,
                CarriedByUserId = entry.CarriedByUserId,
                CarriedByDisplayName = entry.CarriedByUser.DisplayName,
                Quantity = entry.Quantity,
                Note = entry.Note,
                CreatedByUserId = entry.CreatedByUserId,
                CreatedAt = entry.CreatedAt,
                UpdatedAt = entry.UpdatedAt
            };

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating equipment entry {Id} for trip {TripId}", id, tripId);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteEntry(int tripId, int id)
    {
        try
        {
            var userId = _currentUserService.GetUserId();
            if (!userId.HasValue)
                return Unauthorized(new { message = "User not authenticated" });

            var entry = await _context.TripEquipmentEntries
                .Include(e => e.Trip)
                    .ThenInclude(t => t.Members)
                .FirstOrDefaultAsync(e => e.Id == id && e.TripId == tripId);

            if (entry == null || (entry.Trip.UserId != userId.Value && !entry.Trip.Members.Any(m => m.UserId == userId.Value)))
                return NotFound(new { message = "Equipment entry not found" });

            _context.TripEquipmentEntries.Remove(entry);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting equipment entry {Id} for trip {TripId}", id, tripId);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }
}
