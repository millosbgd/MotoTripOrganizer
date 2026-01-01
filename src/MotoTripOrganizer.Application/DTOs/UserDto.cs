namespace MotoTripOrganizer.Application.DTOs;

public class UserDto
{
    public int Id { get; set; }
    public string Auth0Subject { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
}

public class CreateUserRequest
{
    public string DisplayName { get; set; } = string.Empty;
}
