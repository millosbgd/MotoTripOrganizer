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
[Route("api/trips/{tripId}/accommodations")]
public class AccommodationEntriesController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly ILogger<AccommodationEntriesController> _logger;

    public AccommodationEntriesController(
        ApplicationDbContext context,
        ICurrentUserService currentUserService,
        ILogger<AccommodationEntriesController> logger)
    {
        _context = context;
        _currentUserService = currentUserService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<AccommodationEntryDto>>> GetAccommodationEntries(int tripId)
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

            var accommodationEntries = await _context.AccommodationEntries
                .Where(a => a.TripId == tripId)
                .OrderByDescending(a => a.CheckInDate)
                .Select(a => new AccommodationEntryDto
                {
                    Id = a.Id,
                    TripId = a.TripId,
                    Name = a.Name,
                    AccommodationType = a.AccommodationType,
                    CheckInDate = a.CheckInDate,
                    CheckOutDate = a.CheckOutDate,
                    Amount = a.Amount,
                    Currency = a.Currency,
                    Location = a.Location,
                    Note = a.Note,
                    CreatedByUserId = a.CreatedByUserId,
                    CreatedAt = a.CreatedAt,
                    UpdatedAt = a.UpdatedAt
                })
                .ToListAsync();

            return Ok(accommodationEntries);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting accommodation entries for trip {TripId}", tripId);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<AccommodationEntryDto>> GetAccommodationEntry(int tripId, int id)
    {
        try
        {
            var userId = _currentUserService.GetUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            var accommodationEntry = await _context.AccommodationEntries
                .Include(a => a.Trip)
                    .ThenInclude(t => t.Members)
                .FirstOrDefaultAsync(a => a.Id == id && a.TripId == tripId);

            if (accommodationEntry == null || (accommodationEntry.Trip.UserId != userId.Value && !accommodationEntry.Trip.Members.Any(m => m.UserId == userId.Value)))
            {
                return NotFound(new { message = "Accommodation entry not found" });
            }

            var dto = new AccommodationEntryDto
            {
                Id = accommodationEntry.Id,
                TripId = accommodationEntry.TripId,
                Name = accommodationEntry.Name,
                AccommodationType = accommodationEntry.AccommodationType,
                CheckInDate = accommodationEntry.CheckInDate,
                CheckOutDate = accommodationEntry.CheckOutDate,
                Amount = accommodationEntry.Amount,
                Currency = accommodationEntry.Currency,
                Location = accommodationEntry.Location,
                Note = accommodationEntry.Note,
                CreatedByUserId = accommodationEntry.CreatedByUserId,
                CreatedAt = accommodationEntry.CreatedAt,
                UpdatedAt = accommodationEntry.UpdatedAt
            };

            return Ok(dto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting accommodation entry {Id} for trip {TripId}", id, tripId);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpPost]
    public async Task<ActionResult<AccommodationEntryDto>> CreateAccommodationEntry(int tripId, [FromBody] CreateAccommodationEntryDto dto)
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

            var accommodationEntry = new AccommodationEntry
            {
                TripId = tripId,
                Name = dto.Name,
                AccommodationType = dto.AccommodationType,
                CheckInDate = dto.CheckInDate,
                CheckOutDate = dto.CheckOutDate,
                Amount = dto.Amount,
                Currency = dto.Currency,
                Location = dto.Location,
                Note = dto.Note,
                CreatedByUserId = userId.Value,
                CreatedAt = DateTime.UtcNow
            };

            _context.AccommodationEntries.Add(accommodationEntry);
            await _context.SaveChangesAsync();

            var resultDto = new AccommodationEntryDto
            {
                Id = accommodationEntry.Id,
                TripId = accommodationEntry.TripId,
                Name = accommodationEntry.Name,
                AccommodationType = accommodationEntry.AccommodationType,
                CheckInDate = accommodationEntry.CheckInDate,
                CheckOutDate = accommodationEntry.CheckOutDate,
                Amount = accommodationEntry.Amount,
                Currency = accommodationEntry.Currency,
                Location = accommodationEntry.Location,
                Note = accommodationEntry.Note,
                CreatedByUserId = accommodationEntry.CreatedByUserId,
                CreatedAt = accommodationEntry.CreatedAt,
                UpdatedAt = accommodationEntry.UpdatedAt
            };

            return CreatedAtAction(nameof(GetAccommodationEntry), new { tripId, id = accommodationEntry.Id }, resultDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating accommodation entry for trip {TripId}", tripId);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<AccommodationEntryDto>> UpdateAccommodationEntry(int tripId, int id, [FromBody] UpdateAccommodationEntryDto dto)
    {
        try
        {
            var userId = _currentUserService.GetUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            var accommodationEntry = await _context.AccommodationEntries
                .Include(a => a.Trip)
                    .ThenInclude(t => t.Members)
                .FirstOrDefaultAsync(a => a.Id == id && a.TripId == tripId);

            if (accommodationEntry == null || (accommodationEntry.Trip.UserId != userId.Value && !accommodationEntry.Trip.Members.Any(m => m.UserId == userId.Value)))
            {
                return NotFound(new { message = "Accommodation entry not found" });
            }

            accommodationEntry.Name = dto.Name;
            accommodationEntry.AccommodationType = dto.AccommodationType;
            accommodationEntry.CheckInDate = dto.CheckInDate;
            accommodationEntry.CheckOutDate = dto.CheckOutDate;
            accommodationEntry.Amount = dto.Amount;
            accommodationEntry.Currency = dto.Currency;
            accommodationEntry.Location = dto.Location;
            accommodationEntry.Note = dto.Note;
            accommodationEntry.UpdatedByUserId = userId.Value;
            accommodationEntry.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var resultDto = new AccommodationEntryDto
            {
                Id = accommodationEntry.Id,
                TripId = accommodationEntry.TripId,
                Name = accommodationEntry.Name,
                AccommodationType = accommodationEntry.AccommodationType,
                CheckInDate = accommodationEntry.CheckInDate,
                CheckOutDate = accommodationEntry.CheckOutDate,
                Amount = accommodationEntry.Amount,
                Currency = accommodationEntry.Currency,
                Location = accommodationEntry.Location,
                Note = accommodationEntry.Note,
                CreatedByUserId = accommodationEntry.CreatedByUserId,
                CreatedAt = accommodationEntry.CreatedAt,
                UpdatedAt = accommodationEntry.UpdatedAt
            };

            return Ok(resultDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating accommodation entry {Id} for trip {TripId}", id, tripId);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteAccommodationEntry(int tripId, int id)
    {
        try
        {
            var userId = _currentUserService.GetUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            var accommodationEntry = await _context.AccommodationEntries
                .Include(a => a.Trip)
                    .ThenInclude(t => t.Members)
                .FirstOrDefaultAsync(a => a.Id == id && a.TripId == tripId);

            if (accommodationEntry == null || (accommodationEntry.Trip.UserId != userId.Value && !accommodationEntry.Trip.Members.Any(m => m.UserId == userId.Value)))
            {
                return NotFound(new { message = "Accommodation entry not found" });
            }

            _context.AccommodationEntries.Remove(accommodationEntry);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting accommodation entry {Id} for trip {TripId}", id, tripId);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }
}
