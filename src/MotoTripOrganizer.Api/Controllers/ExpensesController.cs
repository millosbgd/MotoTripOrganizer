using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MotoTripOrganizer.Domain.Entities;
using MotoTripOrganizer.Domain.Interfaces;
using MotoTripOrganizer.Infrastructure.Data;

namespace MotoTripOrganizer.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/trips/{tripId}/[controller]")]
public class ExpensesController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly ILogger<ExpensesController> _logger;

    public ExpensesController(
        ApplicationDbContext context,
        ICurrentUserService currentUserService,
        ILogger<ExpensesController> logger)
    {
        _context = context;
        _currentUserService = currentUserService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<List<ExpenseDto>>> GetExpenses(int tripId)
    {
        try
        {
            var userId = _currentUserService.GetUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            // Check if user is a member of this trip
            var isMember = await _context.TripMembers
                .AnyAsync(tm => tm.TripId == tripId && tm.UserId == userId.Value);

            if (!isMember)
            {
                return NotFound(new { message = "Trip not found or access denied" });
            }

            var expenses = await _context.Expenses
                .Where(e => e.TripId == tripId)
                .OrderByDescending(e => e.Date)
                .Select(e => new ExpenseDto
                {
                    Id = e.Id,
                    Date = e.Date,
                    Category = e.Category,
                    Description = e.Description,
                    Amount = e.Amount,
                    Currency = e.Currency
                })
                .ToListAsync();

            return Ok(expenses);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting expenses for trip {TripId}", tripId);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpPost]
    public async Task<ActionResult<ExpenseDto>> CreateExpense(int tripId, [FromBody] CreateExpenseDto dto)
    {
        try
        {
            var userId = _currentUserService.GetUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            var trip = await _context.Trips
                .FirstOrDefaultAsync(t => t.Id == tripId && t.UserId == userId.Value);

            if (trip == null)
            {
                return NotFound(new { message = "Trip not found" });
            }

            var expense = new Expense
            {
                TripId = tripId,
                Date = dto.Date,
                Category = dto.Category,
                Description = dto.Description,
                Amount = dto.Amount,
                Currency = dto.Currency,
                PaidByUserId = userId.Value,
                CreatedByUserId = userId.Value,
                CreatedAt = DateTime.UtcNow
            };

            _context.Expenses.Add(expense);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Created expense {ExpenseId} for trip {TripId}", expense.Id, tripId);

            var result = new ExpenseDto
            {
                Id = expense.Id,
                Date = expense.Date,
                Category = expense.Category,
                Description = expense.Description,
                Amount = expense.Amount,
                Currency = expense.Currency
            };

            return CreatedAtAction(nameof(GetExpense), new { tripId, id = expense.Id }, result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating expense for trip {TripId}", tripId);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ExpenseDto>> GetExpense(int tripId, int id)
    {
        try
        {
            var userId = _currentUserService.GetUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            var expense = await _context.Expenses
                .Include(e => e.Trip)
                .FirstOrDefaultAsync(e => e.Id == id && e.TripId == tripId && e.Trip.UserId == userId.Value);

            if (expense == null)
            {
                return NotFound(new { message = "Expense not found" });
            }

            var result = new ExpenseDto
            {
                Id = expense.Id,
                Date = expense.Date,
                Category = expense.Category,
                Description = expense.Description,
                Amount = expense.Amount,
                Currency = expense.Currency
            };

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting expense {ExpenseId}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ExpenseDto>> UpdateExpense(int tripId, int id, [FromBody] UpdateExpenseDto dto)
    {
        try
        {
            var userId = _currentUserService.GetUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            var expense = await _context.Expenses
                .Include(e => e.Trip)
                .FirstOrDefaultAsync(e => e.Id == id && e.TripId == tripId && e.Trip.UserId == userId.Value);

            if (expense == null)
            {
                return NotFound(new { message = "Expense not found" });
            }

            expense.Date = dto.Date;
            expense.Category = dto.Category;
            expense.Description = dto.Description;
            expense.Amount = dto.Amount;
            expense.Currency = dto.Currency;

            await _context.SaveChangesAsync();

            var result = new ExpenseDto
            {
                Id = expense.Id,
                Date = expense.Date,
                Category = expense.Category,
                Description = expense.Description,
                Amount = expense.Amount,
                Currency = expense.Currency
            };

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating expense {ExpenseId}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteExpense(int tripId, int id)
    {
        try
        {
            var userId = _currentUserService.GetUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            var expense = await _context.Expenses
                .Include(e => e.Trip)
                .FirstOrDefaultAsync(e => e.Id == id && e.TripId == tripId && e.Trip.UserId == userId.Value);

            if (expense == null)
            {
                return NotFound(new { message = "Expense not found" });
            }

            _context.Expenses.Remove(expense);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Deleted expense {ExpenseId}", id);

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting expense {ExpenseId}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }
}

public record ExpenseDto
{
    public int Id { get; init; }
    public DateTime Date { get; init; }
    public string Category { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public decimal Amount { get; init; }
    public string Currency { get; init; } = "EUR";
}

public record CreateExpenseDto
{
    public DateTime Date { get; init; }
    public string Category { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public decimal Amount { get; init; }
    public string Currency { get; init; } = "EUR";
}

public record UpdateExpenseDto
{
    public DateTime Date { get; init; }
    public string Category { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public decimal Amount { get; init; }
    public string Currency { get; init; } = "EUR";
}
