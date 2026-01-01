using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace MotoTripOrganizer.Infrastructure.Auth;

public interface ICurrentUserService
{
    string? Auth0Subject { get; }
    int? UserId { get; }
    bool IsAuthenticated { get; }
}

/// <summary>
/// Service to retrieve the current authenticated user's information from JWT claims.
/// Auth0Subject comes from the "sub" claim in the JWT token.
/// UserId is the internal database user ID (set after bootstrap).
/// </summary>
public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public string? Auth0Subject => _httpContextAccessor.HttpContext?.User
        ?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

    public int? UserId
    {
        get
        {
            var userIdClaim = _httpContextAccessor.HttpContext?.User
                ?.FindFirst("user_id")?.Value;
            
            return int.TryParse(userIdClaim, out var userId) ? userId : null;
        }
    }

    public bool IsAuthenticated => _httpContextAccessor.HttpContext?.User?.Identity?.IsAuthenticated ?? false;
}
