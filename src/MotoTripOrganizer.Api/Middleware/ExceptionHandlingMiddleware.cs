using Microsoft.AspNetCore.Mvc;
using MotoTripOrganizer.Domain.Exceptions;
using System.Net;
using System.Text.Json;

namespace MotoTripOrganizer.Api.Middleware;

/// <summary>
/// Global exception handling middleware.
/// Converts exceptions to ProblemDetails responses.
/// Enforces the "Trip is sacred" rule by returning 403 for TripAccessDeniedException.
/// </summary>
public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var problemDetails = new ProblemDetails
        {
            Instance = context.Request.Path
        };

        switch (exception)
        {
            case TripAccessDeniedException tripAccessEx:
                // CRITICAL: "Trip is sacred" enforcement - return 403 Forbidden
                _logger.LogWarning(tripAccessEx, "Trip access denied: {Message}", tripAccessEx.Message);
                problemDetails.Status = (int)HttpStatusCode.Forbidden;
                problemDetails.Title = "Access Denied";
                problemDetails.Detail = tripAccessEx.Message;
                break;

            case DbUpdateConcurrencyException:
                _logger.LogWarning(exception, "Concurrency conflict");
                problemDetails.Status = (int)HttpStatusCode.Conflict;
                problemDetails.Title = "Concurrency Conflict";
                problemDetails.Detail = "The record was modified by another user. Please refresh and try again.";
                break;

            case ArgumentException argEx:
                _logger.LogWarning(argEx, "Invalid argument: {Message}", argEx.Message);
                problemDetails.Status = (int)HttpStatusCode.BadRequest;
                problemDetails.Title = "Bad Request";
                problemDetails.Detail = argEx.Message;
                break;

            case InvalidOperationException invalidOpEx:
                _logger.LogWarning(invalidOpEx, "Invalid operation: {Message}", invalidOpEx.Message);
                problemDetails.Status = (int)HttpStatusCode.BadRequest;
                problemDetails.Title = "Invalid Operation";
                problemDetails.Detail = invalidOpEx.Message;
                break;

            default:
                _logger.LogError(exception, "Unhandled exception occurred");
                problemDetails.Status = (int)HttpStatusCode.InternalServerError;
                problemDetails.Title = "Internal Server Error";
                problemDetails.Detail = "An unexpected error occurred. Please try again later.";
                break;
        }

        context.Response.StatusCode = problemDetails.Status.Value;
        context.Response.ContentType = "application/problem+json";

        var json = JsonSerializer.Serialize(problemDetails, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        await context.Response.WriteAsync(json);
    }
}
