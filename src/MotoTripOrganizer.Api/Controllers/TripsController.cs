using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MotoTripOrganizer.Application.DTOs;
using MotoTripOrganizer.Application.Services;
using FluentValidation;

namespace MotoTripOrganizer.Api.Controllers;

[ApiController]
[Route("api/trips")]
[Authorize]
public class TripsController : ControllerBase
{
    private readonly ITripService _tripService;
    private readonly IValidator<CreateTripRequest> _createTripValidator;
    private readonly ILogger<TripsController> _logger;

    public TripsController(
        ITripService tripService,
        IValidator<CreateTripRequest> createTripValidator,
        ILogger<TripsController> logger)
    {
        _tripService = tripService;
        _createTripValidator = createTripValidator;
        _logger = logger;
    }

    /// <summary>
    /// Gets all trips where the current user is a member.
    /// "No community" - only returns user's trips.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<TripDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<TripDto>>> GetMyTrips(CancellationToken cancellationToken)
    {
        var trips = await _tripService.GetUserTripsAsync(cancellationToken);
        return Ok(trips);
    }

    /// <summary>
    /// Gets a specific trip by ID.
    /// "Trip is sacred" - automatically verifies membership via TripAuthorizationService.
    /// </summary>
    [HttpGet("{tripId}")]
    [ProducesResponseType(typeof(TripDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TripDetailDto>> GetTripById(int tripId, CancellationToken cancellationToken)
    {
        var trip = await _tripService.GetTripByIdAsync(tripId, cancellationToken);

        if (trip == null)
        {
            return NotFound();
        }

        return Ok(trip);
    }

    /// <summary>
    /// Creates a new trip. The creator becomes the owner and first member.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(TripDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<TripDto>> CreateTrip(
        [FromBody] CreateTripRequest request,
        CancellationToken cancellationToken)
    {
        var validationResult = await _createTripValidator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return BadRequest(validationResult.Errors);
        }

        var trip = await _tripService.CreateTripAsync(request, cancellationToken);

        return CreatedAtAction(nameof(GetTripById), new { tripId = trip.Id }, trip);
    }
}
