using Microsoft.EntityFrameworkCore;
using MotoTripOrganizer.Application.DTOs;
using MotoTripOrganizer.Domain.Entities;
using MotoTripOrganizer.Domain.Interfaces;

namespace MotoTripOrganizer.Application.Services;

public interface IUserService
{
    Task<UserDto?> GetCurrentUserAsync(CancellationToken cancellationToken = default);
    Task<UserDto?> GetOrCreateUserAsync(string displayName, CancellationToken cancellationToken = default);
    Task<UserDto?> GetUserByAuth0SubjectAsync(string auth0Subject, CancellationToken cancellationToken = default);
}

public class UserService : IUserService
{
    private readonly ApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IUnitOfWork _unitOfWork;

    public UserService(
        ApplicationDbContext context,
        ICurrentUserService currentUserService,
        IUnitOfWork unitOfWork)
    {
        _context = context;
        _currentUserService = currentUserService;
        _unitOfWork = unitOfWork;
    }

    /// <summary>
    /// Gets the current authenticated user based on Auth0Subject.
    /// </summary>
    public async Task<UserDto?> GetCurrentUserAsync(CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrEmpty(_currentUserService.Auth0Subject))
            return null;

        return await GetUserByAuth0SubjectAsync(_currentUserService.Auth0Subject, cancellationToken);
    }

    /// <summary>
    /// Bootstrap endpoint: creates user if not exists based on Auth0 subject.
    /// </summary>
    public async Task<UserDto?> GetOrCreateUserAsync(string displayName, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrEmpty(_currentUserService.Auth0Subject))
            return null;

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Auth0Subject == _currentUserService.Auth0Subject, cancellationToken);

        if (user == null)
        {
            user = new User
            {
                Auth0Subject = _currentUserService.Auth0Subject,
                DisplayName = displayName,
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        return new UserDto
        {
            Id = user.Id,
            Auth0Subject = user.Auth0Subject,
            DisplayName = user.DisplayName
        };
    }

    public async Task<UserDto?> GetUserByAuth0SubjectAsync(string auth0Subject, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users
            .Where(u => u.Auth0Subject == auth0Subject)
            .Select(u => new UserDto
            {
                Id = u.Id,
                Auth0Subject = u.Auth0Subject,
                DisplayName = u.DisplayName
            })
            .FirstOrDefaultAsync(cancellationToken);

        return user;
    }
}
