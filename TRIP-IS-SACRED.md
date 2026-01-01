# "Trip is Sacred" - Authorization Enforcement Guide

## Core Principle
**Every API request that touches trip data MUST verify the caller is a Trip member. If not a member → 403 Forbidden.**

## How It Works

### 1. TripAuthorizationService
Located: `src/MotoTripOrganizer.Application/Services/TripAuthorizationService.cs`

This service is responsible for enforcing membership checks:

```csharp
public interface ITripAuthorizationService
{
    // Check if user is a member
    Task<bool> IsTripMemberAsync(int tripId, int userId, CancellationToken cancellationToken = default);
    
    // Get user's role in trip
    Task<TripMemberRole?> GetUserRoleAsync(int tripId, int userId, CancellationToken cancellationToken = default);
    
    // Enforce membership (throws TripAccessDeniedException if not member)
    Task EnsureTripAccessAsync(int tripId, int userId, CancellationToken cancellationToken = default);
    Task EnsureTripAccessAsync(int tripId, CancellationToken cancellationToken = default);
}
```

### 2. Controller Implementation Pattern

**Every controller action that accesses trip data must call `EnsureTripAccessAsync`:**

```csharp
[HttpGet]
public async Task<ActionResult<List<StageDto>>> GetStages(
    int tripId, 
    CancellationToken cancellationToken)
{
    // CRITICAL: Enforce trip access FIRST
    await _authService.EnsureTripAccessAsync(tripId, cancellationToken);

    // Now safe to query trip data
    var stages = await _context.Stages
        .Where(s => s.TripId == tripId)
        .ToListAsync(cancellationToken);

    return Ok(stages);
}
```

### 3. Exception Handling

When a user tries to access a trip they're not a member of:

1. `EnsureTripAccessAsync` throws `TripAccessDeniedException`
2. `ExceptionHandlingMiddleware` catches it
3. Returns `403 Forbidden` with ProblemDetails response

```json
{
  "status": 403,
  "title": "Access Denied",
  "detail": "User '123' does not have access to Trip '456'",
  "instance": "/api/trips/456/stages"
}
```

## Implementation Checklist

✅ **All Controllers**: Every trip-scoped controller injects `ITripAuthorizationService`

✅ **All Actions**: Every action with `{tripId}` parameter calls `EnsureTripAccessAsync`

✅ **Early Check**: Authorization check happens BEFORE any database queries

✅ **Global Handler**: `ExceptionHandlingMiddleware` converts to 403 response

## Examples

### ✅ CORRECT Implementation

```csharp
[HttpGet("{stageId}")]
public async Task<ActionResult<StageDto>> GetStage(int tripId, int stageId)
{
    // 1. Check membership FIRST
    await _authService.EnsureTripAccessAsync(tripId);
    
    // 2. Now query is safe - user is confirmed member
    var stage = await _context.Stages
        .FirstOrDefaultAsync(s => s.Id == stageId && s.TripId == tripId);
    
    return stage == null ? NotFound() : Ok(stage);
}
```

### ❌ WRONG Implementation (Security Vulnerability!)

```csharp
[HttpGet("{stageId}")]
public async Task<ActionResult<StageDto>> GetStage(int tripId, int stageId)
{
    // WRONG: Querying without membership check!
    var stage = await _context.Stages
        .FirstOrDefaultAsync(s => s.Id == stageId && s.TripId == tripId);
    
    return stage == null ? NotFound() : Ok(stage);
}
```

This would allow ANY authenticated user to access ANY trip's data!

## Query Safety

### User's Trips Only
When listing user's trips, use `TripMembers` table:

```csharp
public async Task<List<TripDto>> GetUserTripsAsync()
{
    // Only returns trips where user is a member
    return await _context.TripMembers
        .Where(tm => tm.UserId == _currentUserService.UserId)
        .Select(tm => tm.Trip)
        .ToListAsync();
}
```

### Never Query Globally
❌ NEVER do this:
```csharp
// WRONG: Global query across all trips
var allTrips = await _context.Trips.ToListAsync();
```

✅ Always scope to user's trips:
```csharp
// CORRECT: Only user's trips
var myTrips = await _context.TripMembers
    .Where(tm => tm.UserId == currentUserId)
    .Select(tm => tm.Trip)
    .ToListAsync();
```

## Testing Authorization

### Unit Test Example
```csharp
[Fact]
public async Task GetStages_WithoutMembership_Returns403()
{
    // Arrange
    var tripId = 1;
    var userId = 999; // Not a member
    
    // Act & Assert
    await Assert.ThrowsAsync<TripAccessDeniedException>(
        () => _authService.EnsureTripAccessAsync(tripId, userId)
    );
}
```

### Integration Test Example
```csharp
[Fact]
public async Task GetStages_WithoutMembership_Returns403()
{
    // Arrange
    var client = _factory.CreateClient();
    var tripId = 1;
    
    // Act
    var response = await client.GetAsync($"/api/trips/{tripId}/stages");
    
    // Assert
    response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
}
```

## Common Patterns

### Creating Trip Resources
When creating stages/items/expenses, verify trip access:

```csharp
[HttpPost]
public async Task<ActionResult<StageDto>> CreateStage(
    int tripId, 
    CreateStageRequest request)
{
    // Verify membership before allowing creation
    await _authService.EnsureTripAccessAsync(tripId);
    
    var stage = new Stage
    {
        TripId = tripId,
        // ... other properties
    };
    
    await _context.Stages.AddAsync(stage);
    await _unitOfWork.SaveChangesAsync();
    
    return CreatedAtAction(nameof(GetStages), new { tripId }, stage);
}
```

### Updating Resources
Always verify both trip access AND resource ownership:

```csharp
[HttpPut("{stageId}")]
public async Task<ActionResult> UpdateStage(
    int tripId, 
    int stageId, 
    UpdateStageRequest request)
{
    // 1. Verify trip membership
    await _authService.EnsureTripAccessAsync(tripId);
    
    // 2. Ensure stage belongs to this trip
    var stage = await _context.Stages
        .FirstOrDefaultAsync(s => s.Id == stageId && s.TripId == tripId);
    
    if (stage == null) return NotFound();
    
    // 3. Update is safe
    stage.Update(request);
    await _unitOfWork.SaveChangesAsync();
    
    return Ok(stage);
}
```

## Role-Based Authorization (Future Enhancement)

Currently, all members have equal access. To add role-based permissions:

```csharp
// Check for specific role
var role = await _authService.GetUserRoleAsync(tripId, userId);

if (role != TripMemberRole.Owner && role != TripMemberRole.Editor)
{
    throw new TripAccessDeniedException("Only owners and editors can modify stages");
}
```

## Summary

The "Trip is Sacred" principle is enforced through:

1. ✅ **TripAuthorizationService** - centralized membership verification
2. ✅ **Controller checks** - every action calls `EnsureTripAccessAsync`
3. ✅ **Exception handling** - automatic 403 responses
4. ✅ **Query scoping** - all queries scoped to user's trips
5. ✅ **No global queries** - no cross-trip data access

**Remember: If it touches trip data, it MUST check membership first!**
