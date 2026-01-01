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
[Route("api/trips/{tripId}/items")]
[Authorize]
public class ItemsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ITripAuthorizationService _authService;
    private readonly ICurrentUserService _currentUserService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IValidator<CreateItemRequest> _createValidator;
    private readonly ILogger<ItemsController> _logger;

    public ItemsController(
        ApplicationDbContext context,
        ITripAuthorizationService authService,
        ICurrentUserService currentUserService,
        IUnitOfWork unitOfWork,
        IValidator<CreateItemRequest> createValidator,
        ILogger<ItemsController> logger)
    {
        _context = context;
        _authService = authService;
        _currentUserService = currentUserService;
        _unitOfWork = unitOfWork;
        _createValidator = createValidator;
        _logger = logger;
    }

    /// <summary>
    /// Gets all items for a trip. Optionally filter by type or stage.
    /// "Trip is sacred" - membership verified.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<ItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<List<ItemDto>>> GetItems(
        int tripId,
        [FromQuery] int? stageId = null,
        CancellationToken cancellationToken = default)
    {
        // CRITICAL: Enforce trip access
        await _authService.EnsureTripAccessAsync(tripId, cancellationToken);

        var query = _context.Items.Where(i => i.TripId == tripId);

        if (stageId.HasValue)
        {
            query = query.Where(i => i.StageId == stageId.Value);
        }

        var items = await query
            .Select(i => new ItemDto
            {
                Id = i.Id,
                TripId = i.TripId,
                StageId = i.StageId,
                Type = i.Type,
                Title = i.Title,
                Body = i.Body,
                Url = i.Url,
                LocationJson = i.LocationJson,
                CreatedByUserId = i.CreatedByUserId,
                CreatedAt = i.CreatedAt,
                UpdatedAt = i.UpdatedAt
            })
            .ToListAsync(cancellationToken);

        return Ok(items);
    }

    /// <summary>
    /// Creates a new item (note, link, or hotel).
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ItemDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ItemDto>> CreateItem(
        int tripId,
        [FromBody] CreateItemRequest request,
        CancellationToken cancellationToken)
    {
        // CRITICAL: Enforce trip access
        await _authService.EnsureTripAccessAsync(tripId, cancellationToken);

        var validationResult = await _createValidator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return BadRequest(validationResult.Errors);
        }

        var item = new Item
        {
            TripId = tripId,
            StageId = request.StageId,
            Type = request.Type,
            Title = request.Title,
            Body = request.Body,
            Url = request.Url,
            LocationJson = request.LocationJson,
            CreatedByUserId = _currentUserService.UserId!.Value,
            CreatedAt = DateTime.UtcNow
        };

        _context.Items.Add(item);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(GetItems), new { tripId }, new ItemDto
        {
            Id = item.Id,
            TripId = item.TripId,
            StageId = item.StageId,
            Type = item.Type,
            Title = item.Title,
            Body = item.Body,
            Url = item.Url,
            LocationJson = item.LocationJson,
            CreatedByUserId = item.CreatedByUserId,
            CreatedAt = item.CreatedAt
        });
    }
}
