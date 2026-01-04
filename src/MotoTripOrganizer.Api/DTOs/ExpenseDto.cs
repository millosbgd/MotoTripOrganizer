namespace MotoTripOrganizer.Application.DTOs;

public class ExpenseDto
{
    public int Id { get; set; }
    public int TripId { get; set; }
    public int? StageId { get; set; }
    public string Category { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = string.Empty;
    public int PaidByUserId { get; set; }
    public bool IsShared { get; set; }
    public string? Note { get; set; }
    public int CreatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateExpenseRequest
{
    public int? StageId { get; set; }
    public string Category { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "EUR";
    public int PaidByUserId { get; set; }
    public bool IsShared { get; set; }
    public string? Note { get; set; }
}

public class ExpenseSummaryDto
{
    public string Category { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public string Currency { get; set; } = string.Empty;
}

public class ExpenseSummaryResponse
{
    public List<ExpenseSummaryDto> ByCategory { get; set; } = new();
    public decimal GrandTotal { get; set; }
    public string BaseCurrency { get; set; } = string.Empty;
}
