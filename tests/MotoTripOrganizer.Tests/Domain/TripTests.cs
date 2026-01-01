using Xunit;
using FluentAssertions;
using MotoTripOrganizer.Domain.Entities;
using MotoTripOrganizer.Domain.Enums;

namespace MotoTripOrganizer.Tests.Domain;

public class TripTests
{
    [Fact]
    public void Trip_ShouldBeCreatedWithValidData()
    {
        // Arrange
        var ownerId = 1;
        var name = "Alps Adventure 2026";
        var startDate = new DateTime(2026, 6, 1);
        var endDate = new DateTime(2026, 6, 7);

        // Act
        var trip = new Trip
        {
            OwnerUserId = ownerId,
            Name = name,
            StartDate = startDate,
            EndDate = endDate,
            BaseCurrency = "EUR"
        };

        // Assert
        trip.OwnerUserId.Should().Be(ownerId);
        trip.Name.Should().Be(name);
        trip.StartDate.Should().Be(startDate);
        trip.EndDate.Should().Be(endDate);
        trip.BaseCurrency.Should().Be("EUR");
    }

    [Fact]
    public void TripMember_ShouldHaveCorrectRole()
    {
        // Arrange & Act
        var tripMember = new TripMember
        {
            TripId = 1,
            UserId = 1,
            Role = TripMemberRole.Owner,
            JoinedAt = DateTime.UtcNow
        };

        // Assert
        tripMember.Role.Should().Be(TripMemberRole.Owner);
    }
}
