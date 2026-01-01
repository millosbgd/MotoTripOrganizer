namespace MotoTripOrganizer.Domain.Exceptions;

public class TripAccessDeniedException : Exception
{
    public TripAccessDeniedException(string message) : base(message)
    {
    }

    public TripAccessDeniedException(int tripId, string userId) 
        : base($"User '{userId}' does not have access to Trip '{tripId}'")
    {
    }
}
