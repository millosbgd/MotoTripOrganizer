using FluentValidation;
using MotoTripOrganizer.Application.DTOs;

namespace MotoTripOrganizer.Application.Validators;

public class CreateTripRequestValidator : AbstractValidator<CreateTripRequest>
{
    public CreateTripRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Trip name is required")
            .MaximumLength(200).WithMessage("Trip name must not exceed 200 characters");

        RuleFor(x => x.StartDate)
            .NotEmpty().WithMessage("Start date is required");

        RuleFor(x => x.EndDate)
            .GreaterThanOrEqualTo(x => x.StartDate)
            .When(x => x.EndDate.HasValue)
            .WithMessage("End date must be after start date");

        RuleFor(x => x.BaseCurrency)
            .NotEmpty().WithMessage("Base currency is required")
            .Length(3).WithMessage("Currency must be a 3-letter code (e.g., EUR, USD)");
    }
}

public class CreateStageRequestValidator : AbstractValidator<CreateStageRequest>
{
    public CreateStageRequestValidator()
    {
        RuleFor(x => x.Date)
            .NotEmpty().WithMessage("Stage date is required");

        RuleFor(x => x.StartText)
            .NotEmpty().WithMessage("Start location is required")
            .MaximumLength(500).WithMessage("Start text must not exceed 500 characters");

        RuleFor(x => x.EndText)
            .NotEmpty().WithMessage("End location is required")
            .MaximumLength(500).WithMessage("End text must not exceed 500 characters");

        RuleFor(x => x.PlannedKm)
            .GreaterThan(0).When(x => x.PlannedKm.HasValue)
            .WithMessage("Planned km must be greater than 0");

        RuleFor(x => x.Notes)
            .MaximumLength(2000).WithMessage("Notes must not exceed 2000 characters");
    }
}

public class CreateItemRequestValidator : AbstractValidator<CreateItemRequest>
{
    public CreateItemRequestValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Title is required")
            .MaximumLength(500).WithMessage("Title must not exceed 500 characters");

        RuleFor(x => x.Body)
            .MaximumLength(5000).WithMessage("Body must not exceed 5000 characters");

        RuleFor(x => x.Url)
            .MaximumLength(2000).WithMessage("URL must not exceed 2000 characters");
    }
}

public class CreateExpenseRequestValidator : AbstractValidator<CreateExpenseRequest>
{
    public CreateExpenseRequestValidator()
    {
        RuleFor(x => x.Category)
            .NotEmpty().WithMessage("Category is required")
            .MaximumLength(100).WithMessage("Category must not exceed 100 characters");

        RuleFor(x => x.Amount)
            .GreaterThan(0).WithMessage("Amount must be greater than 0");

        RuleFor(x => x.Currency)
            .NotEmpty().WithMessage("Currency is required")
            .Length(3).WithMessage("Currency must be a 3-letter code");

        RuleFor(x => x.PaidByUserId)
            .GreaterThan(0).WithMessage("PaidByUserId must be specified");
    }
}
