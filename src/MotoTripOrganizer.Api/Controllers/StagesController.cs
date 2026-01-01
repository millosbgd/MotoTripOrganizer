using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MotoTripOrganizer.Application.DTOs;
using MotoTripOrganizer.Application.Services;
using MotoTripOrganizer.Domain.Entities;
using MotoTripOrganizer.Infrastructure.Auth;
using MotoTripOrganizer.Infrastructure.Data;
using MotoTripOrganizer.Infrastructure.Repositories;

namespace MotoTripOrganizer.Api.Controllers;

[ApiController]
[Route("api/trips/{tripId}/stages")]
[Authorize]
public class StagesController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ITripAuthorizationService _authService;
    private readonly ICurrentUserService _currentUserService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IValidator<CreateStageRequest> _createValidator;
    private readonly ILogger<StagesController> _logger;

    public StagesController(
        ApplicationDbContext context,
        ITripAuthorizationService authService,
        ICurrentUserService currentUserService,
        IUnitOfWork unitOfWork,
        IValidator<CreateStageRequest> createValidator,
        ILogger<StagesController> logger)
    {
        _context = context;
        _authService = authService;
        _currentUserService = currentUserService;
        _unitOfWork = unitOfWork;
        _createValidator = createValidator;
        _logger = logger;
    }

    /// <summary>
    /// Gets all stages for a trip, ordered by date.
    /// "Trip is sacred" - membership verified automatically.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<StageDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<List<StageDto>>> GetStages(int tripId, CancellationToken cancellationToken)
    {
        // CRITICAL: Enforce trip access
        await _authService.EnsureTripAccessAsync(tripId, cancellationToken);

        var stages = await _context.Stages
            .Where(s => s.TripId == tripId)
            .OrderBy(s => s.Date)
            .Select(s => new StageDto
            {
                Id = s.Id,
                TripId = s.TripId,
                Date = s.Date,
                StartText = s.StartText,
                EndText = s.EndText,
                PlannedKm = s.PlannedKm,
                Notes = s.Notes,
                CreatedByUserId = s.CreatedByUserId,
                CreatedAt = s.CreatedAt,
                UpdatedAt = s.UpdatedAt
            })
            .ToListAsync(cancellationToken);

        return Ok(stages);
    }

    /// <summary>
    /// Creates a new stage for the trip.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(StageDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<StageDto>> CreateStage(
        int tripId,
        [FromBody] CreateStageRequest request,
        CancellationToken cancellationToken)
    {
        // CRITICAL: Enforce trip access
        await _authService.EnsureTripAccessAsync(tripId, cancellationToken);

        var validationResult = await _createValidator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return BadRequest(validationResult.Errors);
        }

        var stage = new Stage
        {
            TripId = tripId,
            Date = request.Date,
            StartText = request.StartText,
            EndText = request.EndText,
            PlannedKm = request.PlannedKm,
            Notes = request.Notes,
            CreatedByUserId = _currentUserService.UserId!.Value,
            CreatedAt = DateTime.UtcNow
        };

        _context.Stages.Add(stage);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(GetStages), new { tripId }, new StageDto
        {
            Id = stage.Id,
            TripId = stage.TripId,
            Date = stage.Date,
            StartText = stage.StartText,
            EndText = stage.EndText,
            PlannedKm = stage.PlannedKm,
            Notes = stage.Notes,
            CreatedByUserId = stage.CreatedByUserId,
            CreatedAt = stage.CreatedAt
        });
    }

    /// <summary>
    /// Updates an existing stage. Uses optimistic concurrency via RowVersion.
    /// </summary>
    [HttpPut("{stageId}")]
    [ProducesResponseType(typeof(StageDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<StageDto>> UpdateStage(
        int tripId,
        int stageId,
        [FromBody] UpdateStageRequest request,
        CancellationToken cancellationToken)
    {
        // CRITICAL: Enforce trip access
        await _authService.EnsureTripAccessAsync(tripId, cancellationToken);

        var stage = await _context.Stages
            .FirstOrDefaultAsync(s => s.Id == stageId && s.TripId == tripId, cancellationToken);

        if (stage == null)
        {
            return NotFound();
        }

        stage.Date = request.Date;
        stage.StartText = request.StartText;
        stage.EndText = request.EndText;
        stage.PlannedKm = request.PlannedKm;
        stage.Notes = request.Notes;
        stage.UpdatedByUserId = _currentUserService.UserId!.Value;
        stage.UpdatedAt = DateTime.UtcNow;

        // Concurrency handled by middleware (DbUpdateConcurrencyException)
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Ok(new StageDto
        {
            Id = stage.Id,
            TripId = stage.TripId,
            Date = stage.Date,
            StartText = stage.StartText,
            EndText = stage.EndText,
            PlannedKm = stage.PlannedKm,
            Notes = stage.Notes,
            CreatedByUserId = stage.CreatedByUserId,
            CreatedAt = stage.CreatedAt,
            UpdatedAt = stage.UpdatedAt
        });
    }
}
