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
[Route("api/trips/{tripId}/expenses")]
[Authorize]
public class ExpensesController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ITripAuthorizationService _authService;
    private readonly ICurrentUserService _currentUserService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IValidator<CreateExpenseRequest> _createValidator;
    private readonly ILogger<ExpensesController> _logger;

    public ExpensesController(
        ApplicationDbContext context,
        ITripAuthorizationService authService,
        ICurrentUserService currentUserService,
        IUnitOfWork unitOfWork,
        IValidator<CreateExpenseRequest> createValidator,
        ILogger<ExpensesController> logger)
    {
        _context = context;
        _authService = authService;
        _currentUserService = currentUserService;
        _unitOfWork = unitOfWork;
        _createValidator = createValidator;
        _logger = logger;
    }

    /// <summary>
    /// Gets all expenses for a trip.
    /// "Trip is sacred" - membership verified.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<ExpenseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<List<ExpenseDto>>> GetExpenses(
        int tripId,
        CancellationToken cancellationToken)
    {
        // CRITICAL: Enforce trip access
        await _authService.EnsureTripAccessAsync(tripId, cancellationToken);

        var expenses = await _context.Expenses
            .Where(e => e.TripId == tripId)
            .OrderByDescending(e => e.CreatedAt)
            .Select(e => new ExpenseDto
            {
                Id = e.Id,
                TripId = e.TripId,
                StageId = e.StageId,
                Category = e.Category,
                Amount = e.Amount,
                Currency = e.Currency,
                PaidByUserId = e.PaidByUserId,
                Note = e.Note,
                CreatedByUserId = e.CreatedByUserId,
                CreatedAt = e.CreatedAt,
                UpdatedAt = e.UpdatedAt
            })
            .ToListAsync(cancellationToken);

        return Ok(expenses);
    }

    /// <summary>
    /// Creates a new expense record.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ExpenseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ExpenseDto>> CreateExpense(
        int tripId,
        [FromBody] CreateExpenseRequest request,
        CancellationToken cancellationToken)
    {
        // CRITICAL: Enforce trip access
        await _authService.EnsureTripAccessAsync(tripId, cancellationToken);

        var validationResult = await _createValidator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return BadRequest(validationResult.Errors);
        }

        var expense = new Expense
        {
            TripId = tripId,
            StageId = request.StageId,
            Category = request.Category,
            Amount = request.Amount,
            Currency = request.Currency,
            PaidByUserId = request.PaidByUserId,
            Note = request.Note,
            CreatedByUserId = _currentUserService.UserId!.Value,
            CreatedAt = DateTime.UtcNow
        };

        _context.Expenses.Add(expense);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(GetExpenses), new { tripId }, new ExpenseDto
        {
            Id = expense.Id,
            TripId = expense.TripId,
            StageId = expense.StageId,
            Category = expense.Category,
            Amount = expense.Amount,
            Currency = expense.Currency,
            PaidByUserId = expense.PaidByUserId,
            Note = expense.Note,
            CreatedByUserId = expense.CreatedByUserId,
            CreatedAt = expense.CreatedAt
        });
    }

    /// <summary>
    /// Gets expense summary grouped by category.
    /// </summary>
    [HttpGet("summary")]
    [ProducesResponseType(typeof(ExpenseSummaryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ExpenseSummaryResponse>> GetExpenseSummary(
        int tripId,
        CancellationToken cancellationToken)
    {
        // CRITICAL: Enforce trip access
        await _authService.EnsureTripAccessAsync(tripId, cancellationToken);

        var trip = await _context.Trips.FindAsync(new object[] { tripId }, cancellationToken);
        if (trip == null)
        {
            return NotFound();
        }

        var expensesByCategory = await _context.Expenses
            .Where(e => e.TripId == tripId)
            .GroupBy(e => e.Category)
            .Select(g => new ExpenseSummaryDto
            {
                Category = g.Key,
                TotalAmount = g.Sum(e => e.Amount),
                Currency = g.First().Currency
            })
            .ToListAsync(cancellationToken);

        var grandTotal = expensesByCategory.Sum(e => e.TotalAmount);

        return Ok(new ExpenseSummaryResponse
        {
            ByCategory = expensesByCategory,
            GrandTotal = grandTotal,
            BaseCurrency = trip.BaseCurrency
        });
    }
}
