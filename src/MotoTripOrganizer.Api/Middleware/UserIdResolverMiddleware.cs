using MotoTripOrganizer.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace MotoTripOrganizer.Api.Middleware;

/// <summary>
/// Middleware that automatically resolves UserId from Auth0Subject and adds it as a claim.
/// This allows CurrentUserService to access UserId without requiring it in the JWT token.
/// Runs after authentication but before authorization.
/// </summary>
public class UserIdResolverMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<UserIdResolverMiddleware> _logger;

    public UserIdResolverMiddleware(RequestDelegate next, ILogger<UserIdResolverMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, ApplicationDbContext dbContext)
    {
        // Only process authenticated requests
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var auth0Subject = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (!string.IsNullOrEmpty(auth0Subject))
            {
                // Check if user_id claim already exists (in case it's in JWT)
                var existingUserIdClaim = context.User.FindFirst("user_id");

                if (existingUserIdClaim == null)
                {
                    // Look up UserId from database
                    var userId = await dbContext.Users
                        .Where(u => u.Auth0Subject == auth0Subject)
                        .Select(u => u.Id)
                        .FirstOrDefaultAsync();

                    if (userId > 0)
                    {
                        // Add userId as a claim to the current request
                        var identity = context.User.Identity as ClaimsIdentity;
                        identity?.AddClaim(new Claim("user_id", userId.ToString()));

                        _logger.LogDebug("Resolved UserId {UserId} for Auth0Subject {Auth0Subject}", userId, auth0Subject);
                    }
                    else
                    {
                        // User not bootstrapped yet - this is OK for /api/me/bootstrap endpoint
                        _logger.LogDebug("User not found for Auth0Subject {Auth0Subject} - needs bootstrap", auth0Subject);
                    }
                }
            }
        }

        await _next(context);
    }
}
