using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MotoTripOrganizer.Application.DTOs;
using MotoTripOrganizer.Application.Services;

namespace MotoTripOrganizer.Api.Controllers;

[ApiController]
[Route("api/me")]
[Authorize]
public class MeController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly ILogger<MeController> _logger;

    public MeController(IUserService userService, ILogger<MeController> logger)
    {
        _userService = userService;
        _logger = logger;
    }

    /// <summary>
    /// Gets the current authenticated user's information.
    /// Returns 404 if user hasn't called bootstrap yet.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UserDto>> GetCurrentUser(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Getting current user info");

        var user = await _userService.GetCurrentUserAsync(cancellationToken);

        if (user == null)
        {
            return NotFound(new { message = "User not found. Please call /api/me/bootstrap first." });
        }

        return Ok(user);
    }

    /// <summary>
    /// Bootstrap endpoint: creates user record if not exists.
    /// This should be called after first login to create the user in the database.
    /// </summary>
    [HttpPost("bootstrap")]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<UserDto>> Bootstrap([FromBody] CreateUserRequest request, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Bootstrap request for user");

        var user = await _userService.GetOrCreateUserAsync(request.DisplayName, cancellationToken);

        if (user == null)
        {
            return BadRequest("Unable to create user");
        }

        return Ok(user);
    }
}
