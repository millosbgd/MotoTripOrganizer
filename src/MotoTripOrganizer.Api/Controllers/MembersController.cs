using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MotoTripOrganizer.Application.DTOs;
using MotoTripOrganizer.Domain.Entities;
using MotoTripOrganizer.Domain.Enums;
using MotoTripOrganizer.Domain.Interfaces;
using MotoTripOrganizer.Infrastructure.Data;

namespace MotoTripOrganizer.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/trips/{tripId}/[controller]")]
public class MembersController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly ILogger<MembersController> _logger;

    public MembersController(
        ApplicationDbContext context,
        ICurrentUserService currentUserService,
        ILogger<MembersController> logger)
    {
        _context = context;
        _currentUserService = currentUserService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<List<TripMemberDto>>> GetMembers(int tripId)
    {
        try
        {
            var userId = _currentUserService.GetUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            // Check if user is a member of this trip
            var isMember = await _context.TripMembers
                .AnyAsync(tm => tm.TripId == tripId && tm.UserId == userId.Value);

            if (!isMember)
            {
                return NotFound(new { message = "Trip not found or access denied" });
            }

            var members = await _context.TripMembers
                .Where(tm => tm.TripId == tripId)
                .Include(tm => tm.User)
                .OrderBy(tm => tm.Role)
                .ThenBy(tm => tm.JoinedAt)
                .Select(tm => new TripMemberDto
                {
                    UserId = tm.UserId,
                    DisplayName = tm.User.Email,
                    Role = tm.Role,
                    JoinedAt = tm.JoinedAt
                })
                .ToListAsync();

            return Ok(members);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting members for trip {TripId}", tripId);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpPost]
    public async Task<ActionResult> AddMember(int tripId, [FromBody] AddMemberRequest request)
    {
        try
        {
            var userId = _currentUserService.GetUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            // Check if current user is owner or admin
            var currentMember = await _context.TripMembers
                .FirstOrDefaultAsync(tm => tm.TripId == tripId && tm.UserId == userId.Value);

            if (currentMember == null || (currentMember.Role != TripMemberRole.Owner && currentMember.Role != TripMemberRole.Editor))
            {
                return Forbid();
            }

            // Find user by email
            var userToAdd = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == request.Email);

            if (userToAdd == null)
            {
                return NotFound(new { message = "User not found" });
            }

            // Check if already a member
            var existingMember = await _context.TripMembers
                .FirstOrDefaultAsync(tm => tm.TripId == tripId && tm.UserId == userToAdd.Id);

            if (existingMember != null)
            {
                return BadRequest(new { message = "User is already a member" });
            }

            // Add member
            var newMember = new TripMember
            {
                TripId = tripId,
                UserId = userToAdd.Id,
                Role = request.Role ?? TripMemberRole.Viewer,
                JoinedAt = DateTime.UtcNow
            };

            _context.TripMembers.Add(newMember);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Member added successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding member to trip {TripId}", tripId);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpDelete("{userId}")]
    public async Task<ActionResult> RemoveMember(int tripId, int userId)
    {
        try
        {
            var currentUserId = _currentUserService.GetUserId();
            if (!currentUserId.HasValue)
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            // Check if current user is owner or admin
            var currentMember = await _context.TripMembers
                .FirstOrDefaultAsync(tm => tm.TripId == tripId && tm.UserId == currentUserId.Value);

            if (currentMember == null || (currentMember.Role != TripMemberRole.Owner && currentMember.Role != TripMemberRole.Editor))
            {
                return Forbid();
            }

            // Find member to remove
            var memberToRemove = await _context.TripMembers
                .FirstOrDefaultAsync(tm => tm.TripId == tripId && tm.UserId == userId);

            if (memberToRemove == null)
            {
                return NotFound(new { message = "Member not found" });
            }

            // Cannot remove owner
            if (memberToRemove.Role == TripMemberRole.Owner)
            {
                return BadRequest(new { message = "Cannot remove trip owner" });
            }

            _context.TripMembers.Remove(memberToRemove);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Member removed successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing member from trip {TripId}", tripId);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }
}

public class AddMemberRequest
{
    public string Email { get; set; } = string.Empty;
    public TripMemberRole? Role { get; set; }
}
