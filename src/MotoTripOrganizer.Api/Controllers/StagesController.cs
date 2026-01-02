using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MotoTripOrganizer.Domain.Entities;
using MotoTripOrganizer.Domain.Interfaces;
using MotoTripOrganizer.Infrastructure.Data;

namespace MotoTripOrganizer.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/trips/{tripId}/[controller]")]
public class StagesController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly ILogger<StagesController> _logger;

    public StagesController(
        ApplicationDbContext context,
        ICurrentUserService currentUserService,
        ILogger<StagesController> logger)
    {
        _context = context;
        _currentUserService = currentUserService;
        _logger = logger;
    }

    [HttpPost]
    public async Task<ActionResult<StageDto>> CreateStage(int tripId, [FromBody] CreateStageDto dto)
    {
        try
        {
            var userId = _currentUserService.GetUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            var trip = await _context.Trips
                .Include(t => t.Stages)
                .FirstOrDefaultAsync(t => t.Id == tripId && t.UserId == userId.Value);

            if (trip == null)
            {
                return NotFound(new { message = "Trip not found" });
            }

            var stage = new Stage
            {
                TripId = tripId,
                DayNumber = dto.DayNumber,
                Date = dto.Date,
                StartLocation = dto.StartLocation,
                EndLocation = dto.EndLocation,
                Distance = dto.Distance,
                Description = dto.Description,
                CreatedAt = DateTime.UtcNow
            };

            _context.Stages.Add(stage);
            
            // Update trip total distance
            trip.TotalDistance = trip.Stages.Sum(s => s.Distance) + dto.Distance;
            
            await _context.SaveChangesAsync();

            _logger.LogInformation("Created stage {StageId} for trip {TripId}", stage.Id, tripId);

            var result = new StageDto
            {
                Id = stage.Id,
                DayNumber = stage.DayNumber,
                Date = stage.Date,
                StartLocation = stage.StartLocation,
                EndLocation = stage.EndLocation,
                Distance = stage.Distance,
                Description = stage.Description
            };

            return CreatedAtAction(nameof(GetStage), new { tripId, id = stage.Id }, result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating stage for trip {TripId}", tripId);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<StageDto>> GetStage(int tripId, int id)
    {
        try
        {
            var userId = _currentUserService.GetUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            var stage = await _context.Stages
                .Include(s => s.Trip)
                .FirstOrDefaultAsync(s => s.Id == id && s.TripId == tripId && s.Trip.UserId == userId.Value);

            if (stage == null)
            {
                return NotFound(new { message = "Stage not found" });
            }

            var result = new StageDto
            {
                Id = stage.Id,
                DayNumber = stage.DayNumber,
                Date = stage.Date,
                StartLocation = stage.StartLocation,
                EndLocation = stage.EndLocation,
                Distance = stage.Distance,
                Description = stage.Description
            };

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting stage {StageId}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<StageDto>> UpdateStage(int tripId, int id, [FromBody] UpdateStageDto dto)
    {
        try
        {
            var userId = _currentUserService.GetUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            var stage = await _context.Stages
                .Include(s => s.Trip)
                .ThenInclude(t => t.Stages)
                .FirstOrDefaultAsync(s => s.Id == id && s.TripId == tripId && s.Trip.UserId == userId.Value);

            if (stage == null)
            {
                return NotFound(new { message = "Stage not found" });
            }

            var oldDistance = stage.Distance;

            stage.DayNumber = dto.DayNumber;
            stage.Date = dto.Date;
            stage.StartLocation = dto.StartLocation;
            stage.EndLocation = dto.EndLocation;
            stage.Distance = dto.Distance;
            stage.Description = dto.Description;

            // Update trip total distance
            stage.Trip.TotalDistance = stage.Trip.TotalDistance - oldDistance + dto.Distance;

            await _context.SaveChangesAsync();

            var result = new StageDto
            {
                Id = stage.Id,
                DayNumber = stage.DayNumber,
                Date = stage.Date,
                StartLocation = stage.StartLocation,
                EndLocation = stage.EndLocation,
                Distance = stage.Distance,
                Description = stage.Description
            };

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating stage {StageId}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteStage(int tripId, int id)
    {
        try
        {
            var userId = _currentUserService.GetUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            var stage = await _context.Stages
                .Include(s => s.Trip)
                .ThenInclude(t => t.Stages)
                .FirstOrDefaultAsync(s => s.Id == id && s.TripId == tripId && s.Trip.UserId == userId.Value);

            if (stage == null)
            {
                return NotFound(new { message = "Stage not found" });
            }

            var distance = stage.Distance;
            
            _context.Stages.Remove(stage);
            
            // Update trip total distance
            stage.Trip.TotalDistance = stage.Trip.Stages.Where(s => s.Id != id).Sum(s => s.Distance);
            
            await _context.SaveChangesAsync();

            _logger.LogInformation("Deleted stage {StageId}", id);

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting stage {StageId}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }
}

public record CreateStageDto
{
    public int DayNumber { get; init; }
    public DateTime Date { get; init; }
    public string StartLocation { get; init; } = string.Empty;
    public string EndLocation { get; init; } = string.Empty;
    public decimal Distance { get; init; }
    public string Description { get; init; } = string.Empty;
}

public record UpdateStageDto
{
    public int DayNumber { get; init; }
    public DateTime Date { get; init; }
    public string StartLocation { get; init; } = string.Empty;
    public string EndLocation { get; init; } = string.Empty;
    public decimal Distance { get; init; }
    public string Description { get; init; } = string.Empty;
}
