namespace MotoTripOrganizer.Domain.Interfaces;

public interface ICurrentUserService
{
    string? GetCurrentUserId();
    string GetCurrentUserIdOrThrow();
}
