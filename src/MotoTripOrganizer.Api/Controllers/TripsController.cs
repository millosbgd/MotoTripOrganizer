using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MotoTripOrganizer.Domain.Entities;
using MotoTripOrganizer.Domain.Interfaces;
using MotoTripOrganizer.Infrastructure.Data;

namespace MotoTripOrganizer.Api.Controllers;

// TODO: Re-enable authorization after frontend token handling is implemented
// [Authorize]
[ApiController]
[Route("api/[controller]")]
public class TripsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly ILogger<TripsController> _logger;

    public TripsController(
        ApplicationDbContext context,
        ICurrentUserService currentUserService,
        ILogger<TripsController> logger)
    {
        _context = context;
        _currentUserService = currentUserService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<List<TripDto>>> GetTrips()
    {
        try
        {
            var userId = _currentUserService.GetUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            var trips = await _context.Trips
                .Where(t => t.UserId == userId.Value)
                .Include(t => t.Stages)
                .Include(t => t.Items)
                .Include(t => t.Expenses)
                .OrderByDescending(t => t.StartDate)
                .ToListAsync();

            var result = trips.Select(t => new TripDto
            {
                Id = t.Id,
                Name = t.Name,
                Description = t.Description,
                StartDate = t.StartDate,
                EndDate = t.EndDate,
                TotalDistance = t.TotalDistance,
                Status = t.Status,
                StagesCount = t.Stages.Count,
                ItemsCount = t.Items.Count,
                TotalExpenses = t.Expenses.Sum(e => e.Amount)
            }).ToList();

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting trips");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<TripDetailDto>> GetTrip(int id)
    {
        try
        {
            var userId = _currentUserService.GetUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            var trip = await _context.Trips
                .Include(t => t.Stages.OrderBy(s => s.DayNumber))
                .Include(t => t.Items)
                .Include(t => t.Expenses)
                .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId.Value);

            if (trip == null)
            {
                return NotFound(new { message = "Trip not found" });
            }

            var result = new TripDetailDto
            {
                Id = trip.Id,
                Name = trip.Name,
                Description = trip.Description,
                StartDate = trip.StartDate,
                EndDate = trip.EndDate,
                TotalDistance = trip.TotalDistance,
                Status = trip.Status,
                Stages = trip.Stages.Select(s => new StageDto
                {
                    Id = s.Id,
                    DayNumber = s.DayNumber,
                    Date = s.Date,
                    StartLocation = s.StartLocation,
                    EndLocation = s.EndLocation,
                    Distance = s.Distance,
                    Description = s.Description
                }).ToList(),
                Items = trip.Items.Select(i => new ItemDto
                {
                    Id = i.Id,
                    Name = i.Name,
                    Category = i.Category,
                    Quantity = i.Quantity,
                    IsPacked = i.IsPacked,
                    Notes = i.Notes
                }).ToList(),
                Expenses = trip.Expenses.Select(e => new ExpenseDto
                {
                    Id = e.Id,
                    Date = e.Date,
                    Category = e.Category,
                    Description = e.Description,
                    Amount = e.Amount,
                    Currency = e.Currency
                }).ToList()
            };

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting trip {TripId}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpPost]
    public async Task<ActionResult<TripDto>> CreateTrip([FromBody] CreateTripDto dto)
    {
        try
        {
            var userId = _currentUserService.GetUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            var trip = new Trip
            {
                UserId = userId.Value,
                Name = dto.Name,
                Description = dto.Description,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                TotalDistance = 0,
                Status = "Planning",
                CreatedAt = DateTime.UtcNow
            };

            _context.Trips.Add(trip);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Created trip {TripId} for user {UserId}", trip.Id, userId.Value);

            var result = new TripDto
            {
                Id = trip.Id,
                Name = trip.Name,
                Description = trip.Description,
                StartDate = trip.StartDate,
                EndDate = trip.EndDate,
                TotalDistance = trip.TotalDistance,
                Status = trip.Status,
                StagesCount = 0,
                ItemsCount = 0,
                TotalExpenses = 0
            };

            return CreatedAtAction(nameof(GetTrip), new { id = trip.Id }, result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating trip");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<TripDto>> UpdateTrip(int id, [FromBody] UpdateTripDto dto)
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
                .Include(t => t.Items)
                .Include(t => t.Expenses)
                .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId.Value);

            if (trip == null)
            {
                return NotFound(new { message = "Trip not found" });
            }

            trip.Name = dto.Name;
            trip.Description = dto.Description;
            trip.StartDate = dto.StartDate;
            trip.EndDate = dto.EndDate;
            trip.Status = dto.Status;

            await _context.SaveChangesAsync();

            var result = new TripDto
            {
                Id = trip.Id,
                Name = trip.Name,
                Description = trip.Description,
                StartDate = trip.StartDate,
                EndDate = trip.EndDate,
                TotalDistance = trip.TotalDistance,
                Status = trip.Status,
                StagesCount = trip.Stages.Count,
                ItemsCount = trip.Items.Count,
                TotalExpenses = trip.Expenses.Sum(e => e.Amount)
            };

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating trip {TripId}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteTrip(int id)
    {
        try
        {
            var userId = _currentUserService.GetUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            var trip = await _context.Trips
                .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId.Value);

            if (trip == null)
            {
                return NotFound(new { message = "Trip not found" });
            }

            _context.Trips.Remove(trip);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Deleted trip {TripId}", id);

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting trip {TripId}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }
}

public record TripDto
{
    public int Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public DateTime StartDate { get; init; }
    public DateTime? EndDate { get; init; }
    public decimal TotalDistance { get; init; }
    public string Status { get; init; } = string.Empty;
    public int StagesCount { get; init; }
    public int ItemsCount { get; init; }
    public decimal TotalExpenses { get; init; }
}

public record TripDetailDto
{
    public int Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public DateTime StartDate { get; init; }
    public DateTime? EndDate { get; init; }
    public decimal TotalDistance { get; init; }
    public string Status { get; init; } = string.Empty;
    public List<StageDto> Stages { get; init; } = new();
    public List<ItemDto> Items { get; init; } = new();
    public List<ExpenseDto> Expenses { get; init; } = new();
}

public record CreateTripDto
{
    public string Name { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public DateTime StartDate { get; init; }
    public DateTime? EndDate { get; init; }
}

public record UpdateTripDto
{
    public string Name { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public DateTime StartDate { get; init; }
    public DateTime? EndDate { get; init; }
    public string Status { get; init; } = string.Empty;
}

public record StageDto
{
    public int Id { get; init; }
    public int DayNumber { get; init; }
    public DateTime Date { get; init; }
    public string StartLocation { get; init; } = string.Empty;
    public string EndLocation { get; init; } = string.Empty;
    public decimal Distance { get; init; }
    public string Description { get; init; } = string.Empty;
}

public record ItemDto
{
    public int Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string Category { get; init; } = string.Empty;
    public int Quantity { get; init; }
    public bool IsPacked { get; init; }
    public string Notes { get; init; } = string.Empty;
}

public record ExpenseDto
{
    public int Id { get; init; }
    public DateTime Date { get; init; }
    public string Category { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public decimal Amount { get; init; }
    public string Currency { get; init; } = string.Empty;
}
