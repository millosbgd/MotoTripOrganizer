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
public class ItemsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly ILogger<ItemsController> _logger;

    public ItemsController(
        ApplicationDbContext context,
        ICurrentUserService currentUserService,
        ILogger<ItemsController> logger)
    {
        _context = context;
        _currentUserService = currentUserService;
        _logger = logger;
    }

    [HttpPost]
    public async Task<ActionResult<ItemDto>> CreateItem(int tripId, [FromBody] CreateItemDto dto)
    {
        try
        {
            var userId = _currentUserService.GetUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            var trip = await _context.Trips
                .FirstOrDefaultAsync(t => t.Id == tripId && t.UserId == userId.Value);

            if (trip == null)
            {
                return NotFound(new { message = "Trip not found" });
            }

            var item = new Item
            {
                TripId = tripId,
                Name = dto.Name,
                Category = dto.Category,
                Quantity = dto.Quantity,
                IsPacked = false,
                Notes = dto.Notes,
                CreatedAt = DateTime.UtcNow
            };

            _context.Items.Add(item);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Created item {ItemId} for trip {TripId}", item.Id, tripId);

            var result = new ItemDto
            {
                Id = item.Id,
                Name = item.Name,
                Category = item.Category,
                Quantity = item.Quantity,
                IsPacked = item.IsPacked,
                Notes = item.Notes
            };

            return CreatedAtAction(nameof(GetItem), new { tripId, id = item.Id }, result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating item for trip {TripId}", tripId);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ItemDto>> GetItem(int tripId, int id)
    {
        try
        {
            var userId = _currentUserService.GetUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            var item = await _context.Items
                .Include(i => i.Trip)
                .FirstOrDefaultAsync(i => i.Id == id && i.TripId == tripId && i.Trip.UserId == userId.Value);

            if (item == null)
            {
                return NotFound(new { message = "Item not found" });
            }

            var result = new ItemDto
            {
                Id = item.Id,
                Name = item.Name,
                Category = item.Category,
                Quantity = item.Quantity,
                IsPacked = item.IsPacked,
                Notes = item.Notes
            };

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting item {ItemId}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ItemDto>> UpdateItem(int tripId, int id, [FromBody] UpdateItemDto dto)
    {
        try
        {
            var userId = _currentUserService.GetUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            var item = await _context.Items
                .Include(i => i.Trip)
                .FirstOrDefaultAsync(i => i.Id == id && i.TripId == tripId && i.Trip.UserId == userId.Value);

            if (item == null)
            {
                return NotFound(new { message = "Item not found" });
            }

            item.Name = dto.Name;
            item.Category = dto.Category;
            item.Quantity = dto.Quantity;
            item.IsPacked = dto.IsPacked;
            item.Notes = dto.Notes;

            await _context.SaveChangesAsync();

            var result = new ItemDto
            {
                Id = item.Id,
                Name = item.Name,
                Category = item.Category,
                Quantity = item.Quantity,
                IsPacked = item.IsPacked,
                Notes = item.Notes
            };

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating item {ItemId}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteItem(int tripId, int id)
    {
        try
        {
            var userId = _currentUserService.GetUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            var item = await _context.Items
                .Include(i => i.Trip)
                .FirstOrDefaultAsync(i => i.Id == id && i.TripId == tripId && i.Trip.UserId == userId.Value);

            if (item == null)
            {
                return NotFound(new { message = "Item not found" });
            }

            _context.Items.Remove(item);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Deleted item {ItemId}", id);

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting item {ItemId}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpPatch("{id}/toggle-packed")]
    public async Task<ActionResult<ItemDto>> TogglePacked(int tripId, int id)
    {
        try
        {
            var userId = _currentUserService.GetUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            var item = await _context.Items
                .Include(i => i.Trip)
                .FirstOrDefaultAsync(i => i.Id == id && i.TripId == tripId && i.Trip.UserId == userId.Value);

            if (item == null)
            {
                return NotFound(new { message = "Item not found" });
            }

            item.IsPacked = !item.IsPacked;
            await _context.SaveChangesAsync();

            var result = new ItemDto
            {
                Id = item.Id,
                Name = item.Name,
                Category = item.Category,
                Quantity = item.Quantity,
                IsPacked = item.IsPacked,
                Notes = item.Notes
            };

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error toggling packed status for item {ItemId}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }
}

public record CreateItemDto
{
    public string Name { get; init; } = string.Empty;
    public string Category { get; init; } = string.Empty;
    public int Quantity { get; init; } = 1;
    public string Notes { get; init; } = string.Empty;
}

public record UpdateItemDto
{
    public string Name { get; init; } = string.Empty;
    public string Category { get; init; } = string.Empty;
    public int Quantity { get; init; } = 1;
    public bool IsPacked { get; init; }
    public string Notes { get; init; } = string.Empty;
}
