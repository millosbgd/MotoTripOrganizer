using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MotoTripOrganizer.Application.DTOs;
using MotoTripOrganizer.Infrastructure.Data;

namespace MotoTripOrganizer.Api.Controllers;

/// <summary>
/// Read-only šifarnik opreme - dostupan svim autentikovanim korisnicima.
/// </summary>
[Authorize]
[ApiController]
[Route("api/equipment-catalog")]
public class EquipmentCatalogController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<EquipmentCatalogController> _logger;

    public EquipmentCatalogController(
        ApplicationDbContext context,
        ILogger<EquipmentCatalogController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<List<EquipmentCatalogItemDto>>> GetAll()
    {
        try
        {
            var items = await _context.EquipmentCatalogItems
                .OrderBy(e => e.Category)
                .ThenBy(e => e.Name)
                .Select(e => new EquipmentCatalogItemDto
                {
                    Id = e.Id,
                    Name = e.Name,
                    Description = e.Description,
                    Category = e.Category
                })
                .ToListAsync();

            return Ok(items);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting equipment catalog");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }
}
