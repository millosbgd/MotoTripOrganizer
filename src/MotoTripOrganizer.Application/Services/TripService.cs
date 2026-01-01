using Microsoft.EntityFrameworkCore;
using MotoTripOrganizer.Application.DTOs;
using MotoTripOrganizer.Domain.Entities;
using MotoTripOrganizer.Domain.Enums;
using MotoTripOrganizer.Domain.Interfaces;

namespace MotoTripOrganizer.Application.Services;

public interface ITripService
{
    Task<List<TripDto>> GetUserTripsAsync(CancellationToken cancellationToken = default);
    Task<TripDetailDto?> GetTripByIdAsync(int tripId, CancellationToken cancellationToken = default);
    Task<TripDto> CreateTripAsync(CreateTripRequest request, CancellationToken cancellationToken = default);
}

public class TripService : ITripService
{
    private readonly ApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly ITripAuthorizationService _authService;
    private readonly IUnitOfWork _unitOfWork;

    public TripService(
        ApplicationDbContext context,
        ICurrentUserService currentUserService,
        ITripAuthorizationService authService,
        IUnitOfWork unitOfWork)
    {
        _context = context;
        _currentUserService = currentUserService;
        _authService = authService;
        _unitOfWork = unitOfWork;
    }

    /// <summary>
    /// Returns only trips where the current user is a member.
    /// "No community" - users can never see trips they don't belong to.
    /// </summary>
    public async Task<List<TripDto>> GetUserTripsAsync(CancellationToken cancellationToken = default)
    {
        if (!_currentUserService.UserId.HasValue)
            return new List<TripDto>();

        var trips = await _context.TripMembers
            .Where(tm => tm.UserId == _currentUserService.UserId.Value)
            .Select(tm => new TripDto
            {
                Id = tm.Trip.Id,
                OwnerUserId = tm.Trip.OwnerUserId,
                Name = tm.Trip.Name,
                StartDate = tm.Trip.StartDate,
                EndDate = tm.Trip.EndDate,
                BaseCurrency = tm.Trip.BaseCurrency
            })
            .ToListAsync(cancellationToken);

        return trips;
    }

    /// <summary>
    /// Gets trip details. Enforces membership check - "Trip is sacred".
    /// </summary>
    public async Task<TripDetailDto?> GetTripByIdAsync(int tripId, CancellationToken cancellationToken = default)
    {
        // CRITICAL: Enforce trip access
        await _authService.EnsureTripAccessAsync(tripId, cancellationToken);

        var trip = await _context.Trips
            .Where(t => t.Id == tripId)
            .Select(t => new TripDetailDto
            {
                Id = t.Id,
                OwnerUserId = t.OwnerUserId,
                Name = t.Name,
                StartDate = t.StartDate,
                EndDate = t.EndDate,
                BaseCurrency = t.BaseCurrency,
                Members = t.Members.Select(m => new TripMemberDto
                {
                    UserId = m.UserId,
                    DisplayName = m.User.DisplayName,
                    Role = m.Role,
                    JoinedAt = m.JoinedAt
                }).ToList()
            })
            .FirstOrDefaultAsync(cancellationToken);

        return trip;
    }

    /// <summary>
    /// Creates a new trip and adds the creator as Owner.
    /// </summary>
    public async Task<TripDto> CreateTripAsync(CreateTripRequest request, CancellationToken cancellationToken = default)
    {
        if (!_currentUserService.UserId.HasValue)
            throw new InvalidOperationException("User must be authenticated");

        var trip = new Trip
        {
            OwnerUserId = _currentUserService.UserId.Value,
            Name = request.Name,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            BaseCurrency = request.BaseCurrency
        };

        _context.Trips.Add(trip);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Add creator as trip member with Owner role
        var tripMember = new TripMember
        {
            TripId = trip.Id,
            UserId = _currentUserService.UserId.Value,
            Role = TripMemberRole.Owner,
            JoinedAt = DateTime.UtcNow
        };

        _context.TripMembers.Add(tripMember);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new TripDto
        {
            Id = trip.Id,
            OwnerUserId = trip.OwnerUserId,
            Name = trip.Name,
            StartDate = trip.StartDate,
            EndDate = trip.EndDate,
            BaseCurrency = trip.BaseCurrency
        };
    }
}
