using Microsoft.EntityFrameworkCore;
using MotoTripOrganizer.Domain.Entities;
using MotoTripOrganizer.Domain.Enums;

namespace MotoTripOrganizer.Infrastructure.Data;

/// <summary>
/// Seeds initial data for development and testing.
/// </summary>
public static class DbSeeder
{
    public static async Task SeedAsync(ApplicationDbContext context)
    {
        // Check if already seeded
        if (await context.Users.AnyAsync())
        {
            return;
        }

        // Seed a sample user (for development/testing only)
        var sampleUser = new User
        {
            Auth0Subject = "auth0|sample-user-123",
            DisplayName = "Sample User",
            CreatedAt = DateTime.UtcNow
        };

        context.Users.Add(sampleUser);
        await context.SaveChangesAsync();

        // Optionally seed a sample trip
        var sampleTrip = new Trip
        {
            OwnerUserId = sampleUser.Id,
            Name = "Sample Trip to Alps",
            StartDate = DateTime.UtcNow.Date.AddDays(30),
            EndDate = DateTime.UtcNow.Date.AddDays(37),
            BaseCurrency = "EUR"
        };

        context.Trips.Add(sampleTrip);
        await context.SaveChangesAsync();

        // Add owner as trip member
        var tripMember = new TripMember
        {
            TripId = sampleTrip.Id,
            UserId = sampleUser.Id,
            Role = TripMemberRole.Owner,
            JoinedAt = DateTime.UtcNow
        };

        context.TripMembers.Add(tripMember);
        await context.SaveChangesAsync();
    }
}
