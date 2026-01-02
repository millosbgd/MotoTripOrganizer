namespace MotoTripOrganizer.Domain.Interfaces;

public interface ICurrentUserService
{
    string? GetCurrentUserId();
    string GetCurrentUserIdOrThrow();
    string? GetAuth0UserId();
    string? GetEmail();
    int? GetUserId();
}
