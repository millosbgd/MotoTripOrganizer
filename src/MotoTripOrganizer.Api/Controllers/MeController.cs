using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MotoTripOrganizer.Domain.Entities;
using MotoTripOrganizer.Domain.Interfaces;
using MotoTripOrganizer.Infrastructure.Data;

namespace MotoTripOrganizer.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class MeController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly ILogger<MeController> _logger;

    public MeController(
        ApplicationDbContext context,
        ICurrentUserService currentUserService,
        ILogger<MeController> logger)
    {
        _context = context;
        _currentUserService = currentUserService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<UserDto>> GetCurrentUser()
    {
        try
        {
            var auth0UserId = _currentUserService.GetAuth0UserId();
            var email = _currentUserService.GetEmail();

            if (string.IsNullOrEmpty(auth0UserId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            // Check if user exists
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Auth0UserId == auth0UserId);

            if (user == null)
            {
                // Bootstrap new user
                user = new User
                {
                    Auth0UserId = auth0UserId,
                    Email = email ?? "unknown@example.com",
                    FirstName = "",
                    LastName = "",
                    CreatedAt = DateTime.UtcNow
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation("Created new user with Auth0UserId: {Auth0UserId}", auth0UserId);
            }

            return Ok(new UserDto
            {
                Id = user.Id,
                Auth0UserId = user.Auth0UserId,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting current user");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpPut]
    public async Task<ActionResult<UserDto>> UpdateProfile([FromBody] UpdateProfileDto dto)
    {
        try
        {
            var userId = _currentUserService.GetUserId();

            if (!userId.HasValue)
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            var user = await _context.Users.FindAsync(userId.Value);

            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            user.FirstName = dto.FirstName;
            user.LastName = dto.LastName;

            await _context.SaveChangesAsync();

            return Ok(new UserDto
            {
                Id = user.Id,
                Auth0UserId = user.Auth0UserId,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user profile");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }
}

public record UserDto
{
    public int Id { get; init; }
    public string Auth0UserId { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string FirstName { get; init; } = string.Empty;
    public string LastName { get; init; } = string.Empty;
}

public record UpdateProfileDto
{
    public string FirstName { get; init; } = string.Empty;
    public string LastName { get; init; } = string.Empty;
}
