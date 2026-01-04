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
[Route("api/trips/{tripId}/fuel-entries")]
public class FuelEntriesController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly ILogger<FuelEntriesController> _logger;

    public FuelEntriesController(
        ApplicationDbContext context,
        ICurrentUserService currentUserService,
        ILogger<FuelEntriesController> logger)
    {
        _context = context;
        _currentUserService = currentUserService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<List<FuelEntryDto>>> GetFuelEntries(int tripId)
    {
        try
        {
            var userId = _currentUserService.GetUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            // Check if user has access to this trip (owner or member)
            var hasAccess = await _context.Trips
                .Where(t => t.Id == tripId)
                .AnyAsync(t => t.UserId == userId.Value || 
                              t.Members.Any(m => m.UserId == userId.Value));

            if (!hasAccess)
            {
                return NotFound(new { message = "Trip not found or access denied" });
            }

            var fuelEntries = await _context.FuelEntries
                .Where(f => f.TripId == tripId)
                .OrderByDescending(f => f.Date)
                .ThenByDescending(f => f.Mileage)
                .Select(f => new FuelEntryDto
                {
                    Id = f.Id,
                    TripId = f.TripId,
                    Date = f.Date,
                    Quantity = f.Quantity,
                    Amount = f.Amount,
                    Currency = f.Currency,
                    UnitPrice = f.UnitPrice,
                    Mileage = f.Mileage,
                    Location = f.Location,
                    Note = f.Note,
                    CreatedByUserId = f.CreatedByUserId,
                    CreatedAt = f.CreatedAt,
                    UpdatedAt = f.UpdatedAt
                })
                .ToListAsync();

            return Ok(fuelEntries);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting fuel entries for trip {TripId}", tripId);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<FuelEntryDto>> GetFuelEntry(int tripId, int id)
    {
        try
        {
            var userId = _currentUserService.GetUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            var fuelEntry = await _context.FuelEntries
                .Include(f => f.Trip)
                    .ThenInclude(t => t.Members)
                .FirstOrDefaultAsync(f => f.Id == id && f.TripId == tripId);

            if (fuelEntry == null || (fuelEntry.Trip.UserId != userId.Value && !fuelEntry.Trip.Members.Any(m => m.UserId == userId.Value)))
            {
                return NotFound(new { message = "Fuel entry not found" });
            }

            var dto = new FuelEntryDto
            {
                Id = fuelEntry.Id,
                TripId = fuelEntry.TripId,
                Date = fuelEntry.Date,
                Quantity = fuelEntry.Quantity,
                Amount = fuelEntry.Amount,
                UnitPrice = fuelEntry.UnitPrice,
                Mileage = fuelEntry.Mileage,
                Location = fuelEntry.Location,
                Note = fuelEntry.Note,
                CreatedByUserId = fuelEntry.CreatedByUserId,
                CreatedAt = fuelEntry.CreatedAt,
                UpdatedAt = fuelEntry.UpdatedAt
            };

            return Ok(dto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting fuel entry {Id} for trip {TripId}", id, tripId);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpPost]
    public async Task<ActionResult<FuelEntryDto>> CreateFuelEntry(int tripId, [FromBody] CreateFuelEntryDto dto)
    {
        try
        {
            var userId = _currentUserService.GetUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            // Check if user has access to this trip (owner or member)
            var hasAccess = await _context.Trips
                .Where(t => t.Id == tripId)
                .AnyAsync(t => t.UserId == userId.Value || 
                              t.Members.Any(m => m.UserId == userId.Value));

            if (!hasAccess)
            {
                return NotFound(new { message = "Trip not found" });
            }

            // Calculate unit price
            var unitPrice = dto.Quantity > 0 ? dto.Amount / dto.Quantity : 0;

            var fuelEntry = new FuelEntry
            {
                TripId = tripId,
                Date = dto.Date,
                Quantity = dto.Quantity,
                Amount = dto.Amount,
                Currency = dto.Currency,
                UnitPrice = unitPrice,
                Mileage = dto.Mileage,
                Location = dto.Location,
                Note = dto.Note,
                CreatedByUserId = userId.Value,
                CreatedAt = DateTime.UtcNow
            };

            _context.FuelEntries.Add(fuelEntry);
            await _context.SaveChangesAsync();

            var resultDto = new FuelEntryDto
            {
                Id = fuelEntry.Id,
                TripId = fuelEntry.TripId,
                Date = fuelEntry.Date,
                Quantity = fuelEntry.Quantity,
                Amount = fuelEntry.Amount,
                Currency = fuelEntry.Currency,
                UnitPrice = fuelEntry.UnitPrice,
                Mileage = fuelEntry.Mileage,
                Location = fuelEntry.Location,
                Note = fuelEntry.Note,
                CreatedByUserId = fuelEntry.CreatedByUserId,
                CreatedAt = fuelEntry.CreatedAt,
                UpdatedAt = fuelEntry.UpdatedAt
            };

            return CreatedAtAction(nameof(GetFuelEntry), new { tripId, id = fuelEntry.Id }, resultDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating fuel entry for trip {TripId}", tripId);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<FuelEntryDto>> UpdateFuelEntry(int tripId, int id, [FromBody] UpdateFuelEntryDto dto)
    {
        try
        {
            var userId = _currentUserService.GetUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            var fuelEntry = await _context.FuelEntries
                .Include(f => f.Trip)
                    .ThenInclude(t => t.Members)
                .FirstOrDefaultAsync(f => f.Id == id && f.TripId == tripId);

            if (fuelEntry == null || (fuelEntry.Trip.UserId != userId.Value && !fuelEntry.Trip.Members.Any(m => m.UserId == userId.Value)))
            {
                return NotFound(new { message = "Fuel entry not found" });
            }

            // Calculate unit price
            var unitPrice = dto.Quantity > 0 ? dto.Amount / dto.Quantity : 0;

            fuelEntry.Date = dto.Date;
            fuelEntry.Quantity = dto.Quantity;
            fuelEntry.Amount = dto.Amount;
            fuelEntry.Currency = dto.Currency;
            fuelEntry.UnitPrice = unitPrice;
            fuelEntry.Mileage = dto.Mileage;
            fuelEntry.Location = dto.Location;
            fuelEntry.Note = dto.Note;
            fuelEntry.UpdatedByUserId = userId.Value;
            fuelEntry.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var resultDto = new FuelEntryDto
            {
                Id = fuelEntry.Id,
                TripId = fuelEntry.TripId,
                Date = fuelEntry.Date,
                Quantity = fuelEntry.Quantity,
                Amount = fuelEntry.Amount,
                Currency = fuelEntry.Currency,
                UnitPrice = fuelEntry.UnitPrice,
                Mileage = fuelEntry.Mileage,
                Location = fuelEntry.Location,
                Note = fuelEntry.Note,
                CreatedByUserId = fuelEntry.CreatedByUserId,
                CreatedAt = fuelEntry.CreatedAt,
                UpdatedAt = fuelEntry.UpdatedAt
            };

            return Ok(resultDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating fuel entry {Id} for trip {TripId}", id, tripId);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteFuelEntry(int tripId, int id)
    {
        try
        {
            var userId = _currentUserService.GetUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            var fuelEntry = await _context.FuelEntries
                .Include(f => f.Trip)
                    .ThenInclude(t => t.Members)
                .FirstOrDefaultAsync(f => f.Id == id && f.TripId == tripId);

            if (fuelEntry == null || (fuelEntry.Trip.UserId != userId.Value && !fuelEntry.Trip.Members.Any(m => m.UserId == userId.Value)))
            {
                return NotFound(new { message = "Fuel entry not found" });
            }

            _context.FuelEntries.Remove(fuelEntry);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting fuel entry {Id} for trip {TripId}", id, tripId);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }
}
