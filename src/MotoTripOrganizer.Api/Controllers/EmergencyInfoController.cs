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
[Route("api/trips/{tripId}/emergency-info")]
public class EmergencyInfoController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly ILogger<EmergencyInfoController> _logger;

    public EmergencyInfoController(
        ApplicationDbContext context,
        ICurrentUserService currentUserService,
        ILogger<EmergencyInfoController> logger)
    {
        _context = context;
        _currentUserService = currentUserService;
        _logger = logger;
    }

    /// <summary>
    /// Returns emergency info for all members of the trip.
    /// Visible to all trip members.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<EmergencyInfoDto>>> GetAll(int tripId)
    {
        var userId = _currentUserService.GetUserId();
        if (!userId.HasValue)
            return Unauthorized(new { message = "User not authenticated" });

        var isMember = await _context.TripMembers
            .AnyAsync(tm => tm.TripId == tripId && tm.UserId == userId.Value);

        if (!isMember)
            return NotFound(new { message = "Trip not found or access denied" });

        var entries = await _context.EmergencyInfos
            .Where(e => e.TripId == tripId)
            .Include(e => e.User)
            .OrderBy(e => e.User.DisplayName)
            .Select(e => new EmergencyInfoDto
            {
                Id = e.Id,
                TripId = e.TripId,
                UserId = e.UserId,
                UserDisplayName = e.User.DisplayName,
                EmergencyContactName = e.EmergencyContactName,
                EmergencyContactPhone = e.EmergencyContactPhone,
                BloodType = e.BloodType,
                HealthInsurancePolicyNumber = e.HealthInsurancePolicyNumber,
                CreatedAt = e.CreatedAt,
                UpdatedAt = e.UpdatedAt,
                IsCurrentUser = e.UserId == userId.Value
            })
            .ToListAsync();

        return Ok(entries);
    }

    /// <summary>
    /// Creates or updates emergency info for the current user in this trip.
    /// Each member can only manage their own record (upsert pattern).
    /// </summary>
    [HttpPut("me")]
    public async Task<ActionResult<EmergencyInfoDto>> Upsert(int tripId, [FromBody] UpsertEmergencyInfoDto dto)
    {
        try
        {
            var userId = _currentUserService.GetUserId();
            if (!userId.HasValue)
                return Unauthorized(new { message = "User not authenticated" });

            var isMember = await _context.TripMembers
                .AnyAsync(tm => tm.TripId == tripId && tm.UserId == userId.Value);

            if (!isMember)
                return NotFound(new { message = "Trip not found or access denied" });

            var existing = await _context.EmergencyInfos
                .FirstOrDefaultAsync(e => e.TripId == tripId && e.UserId == userId.Value);

            if (existing == null)
            {
                existing = new EmergencyInfo
                {
                    TripId = tripId,
                    UserId = userId.Value,
                    CreatedAt = DateTime.UtcNow
                };
                _context.EmergencyInfos.Add(existing);
            }
            else
            {
                existing.UpdatedAt = DateTime.UtcNow;
            }

            existing.EmergencyContactName = dto.EmergencyContactName;
            existing.EmergencyContactPhone = dto.EmergencyContactPhone;
            existing.BloodType = dto.BloodType;
            existing.HealthInsurancePolicyNumber = dto.HealthInsurancePolicyNumber;

            await _context.SaveChangesAsync();

            var user = await _context.Users.FindAsync(userId.Value);

            return Ok(new EmergencyInfoDto
            {
                Id = existing.Id,
                TripId = existing.TripId,
                UserId = existing.UserId,
                UserDisplayName = user?.DisplayName,
                EmergencyContactName = existing.EmergencyContactName,
                EmergencyContactPhone = existing.EmergencyContactPhone,
                BloodType = existing.BloodType,
                HealthInsurancePolicyNumber = existing.HealthInsurancePolicyNumber,
                CreatedAt = existing.CreatedAt,
                UpdatedAt = existing.UpdatedAt,
                IsCurrentUser = true
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error upserting emergency info for trip {TripId}", tripId);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }
}
