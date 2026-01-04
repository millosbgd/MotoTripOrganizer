using MotoTripOrganizer.Domain.Entities;
using MotoTripOrganizer.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace MotoTripOrganizer.Api.Middleware;

public class UserBootstrapMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<UserBootstrapMiddleware> _logger;

    public UserBootstrapMiddleware(RequestDelegate next, ILogger<UserBootstrapMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, ApplicationDbContext dbContext)
    {
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var auth0UserId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var email = context.User.FindFirst(ClaimTypes.Email)?.Value;

            if (!string.IsNullOrEmpty(auth0UserId))
            {
                // Check if user exists in database
                var user = await dbContext.Users
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

                    dbContext.Users.Add(user);
                    await dbContext.SaveChangesAsync();

                    _logger.LogInformation("Bootstrapped new user: {Auth0UserId}", auth0UserId);
                }

                // Add user_id claim to the current request's ClaimsPrincipal
                var claims = new List<Claim>(context.User.Claims)
                {
                    new Claim("user_id", user.Id.ToString())
                };

                var identity = new ClaimsIdentity(claims, context.User.Identity.AuthenticationType);
                context.User = new ClaimsPrincipal(identity);
            }
        }

        await _next(context);
    }
}
