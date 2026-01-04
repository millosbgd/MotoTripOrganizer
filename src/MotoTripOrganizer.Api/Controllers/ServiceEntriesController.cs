using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MotoTripOrganizer.Api.DTOs;
using MotoTripOrganizer.Domain.Entities;
using MotoTripOrganizer.Domain.Interfaces;
using MotoTripOrganizer.Infrastructure.Data;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace MotoTripOrganizer.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/trips/{tripId}/services")]
    public class ServiceEntriesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ICurrentUserService _currentUserService;

        public ServiceEntriesController(
            ApplicationDbContext context,
            ICurrentUserService currentUserService)
        {
            _context = context;
            _currentUserService = currentUserService;
        }

        // GET: api/trips/{tripId}/services
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ServiceEntryDto>>> GetServiceEntries(int tripId)
        {
            var userId = _currentUserService.GetUserId();

            if (!userId.HasValue)
            {
                return Unauthorized();
            }

            // Check if user has access to the trip (owner or member)
            var hasAccess = await _context.Trips
                .Where(t => t.Id == tripId)
                .AnyAsync(t => t.UserId == userId.Value || t.Members.Any(m => m.UserId == userId.Value));

            if (!hasAccess)
            {
                return NotFound();
            }

            var serviceEntries = await _context.ServiceEntries
                .Where(se => se.TripId == tripId)
                .OrderByDescending(se => se.ServiceDate)
                .Select(se => new ServiceEntryDto
                {
                    Id = se.Id,
                    TripId = se.TripId,
                    ServiceType = se.ServiceType,
                    Description = se.Description,
                    ServiceDate = se.ServiceDate,
                    Amount = se.Amount,
                    Currency = se.Currency,
                    Location = se.Location,
                    Mileage = se.Mileage,
                    Note = se.Note,
                    CreatedByUserId = se.CreatedByUserId,
                    UpdatedByUserId = se.UpdatedByUserId,
                    CreatedAt = se.CreatedAt,
                    UpdatedAt = se.UpdatedAt
                })
                .ToListAsync();

            return Ok(serviceEntries);
        }

        // GET: api/trips/{tripId}/services/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<ServiceEntryDto>> GetServiceEntry(int tripId, int id)
        {
            var userId = _currentUserService.GetUserId();

            if (!userId.HasValue)
            {
                return Unauthorized();
            }

            var serviceEntry = await _context.ServiceEntries
                .Include(se => se.Trip)
                    .ThenInclude(t => t.Members)
                .FirstOrDefaultAsync(se => se.Id == id && se.TripId == tripId);

            if (serviceEntry == null)
            {
                return NotFound();
            }

            // Check if user has access to the trip
            if (serviceEntry.Trip.UserId != userId.Value && 
                !serviceEntry.Trip.Members.Any(m => m.UserId == userId.Value))
            {
                return NotFound();
            }

            var dto = new ServiceEntryDto
            {
                Id = serviceEntry.Id,
                TripId = serviceEntry.TripId,
                ServiceType = serviceEntry.ServiceType,
                Description = serviceEntry.Description,
                ServiceDate = serviceEntry.ServiceDate,
                Amount = serviceEntry.Amount,
                Currency = serviceEntry.Currency,
                Location = serviceEntry.Location,
                Mileage = serviceEntry.Mileage,
                Note = serviceEntry.Note,
                CreatedByUserId = serviceEntry.CreatedByUserId,
                UpdatedByUserId = serviceEntry.UpdatedByUserId,
                CreatedAt = serviceEntry.CreatedAt,
                UpdatedAt = serviceEntry.UpdatedAt
            };

            return Ok(dto);
        }

        // POST: api/trips/{tripId}/services
        [HttpPost]
        public async Task<ActionResult<ServiceEntryDto>> CreateServiceEntry(int tripId, CreateServiceEntryDto dto)
        {
            var userId = _currentUserService.GetUserId();

            if (!userId.HasValue)
            {
                return Unauthorized();
            }

            // Check if user has access to the trip (owner or member)
            var hasAccess = await _context.Trips
                .Where(t => t.Id == tripId)
                .AnyAsync(t => t.UserId == userId.Value || t.Members.Any(m => m.UserId == userId.Value));

            if (!hasAccess)
            {
                return NotFound();
            }

            var serviceEntry = new ServiceEntry
            {
                TripId = tripId,
                ServiceType = dto.ServiceType,
                Description = dto.Description,
                ServiceDate = dto.ServiceDate,
                Amount = dto.Amount,
                Currency = dto.Currency,
                Location = dto.Location,
                Mileage = dto.Mileage,
                Note = dto.Note,
                CreatedByUserId = userId.Value,
                CreatedAt = DateTime.UtcNow
            };

            _context.ServiceEntries.Add(serviceEntry);
            await _context.SaveChangesAsync();

            var resultDto = new ServiceEntryDto
            {
                Id = serviceEntry.Id,
                TripId = serviceEntry.TripId,
                ServiceType = serviceEntry.ServiceType,
                Description = serviceEntry.Description,
                ServiceDate = serviceEntry.ServiceDate,
                Amount = serviceEntry.Amount,
                Currency = serviceEntry.Currency,
                Location = serviceEntry.Location,
                Mileage = serviceEntry.Mileage,
                Note = serviceEntry.Note,
                CreatedByUserId = serviceEntry.CreatedByUserId,
                UpdatedByUserId = serviceEntry.UpdatedByUserId,
                CreatedAt = serviceEntry.CreatedAt,
                UpdatedAt = serviceEntry.UpdatedAt
            };

            return CreatedAtAction(nameof(GetServiceEntry), new { tripId, id = serviceEntry.Id }, resultDto);
        }

        // PUT: api/trips/{tripId}/services/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateServiceEntry(int tripId, int id, UpdateServiceEntryDto dto)
        {
            var userId = _currentUserService.GetUserId();

            if (!userId.HasValue)
            {
                return Unauthorized();
            }

            var serviceEntry = await _context.ServiceEntries
                .Include(se => se.Trip)
                    .ThenInclude(t => t.Members)
                .FirstOrDefaultAsync(se => se.Id == id && se.TripId == tripId);

            if (serviceEntry == null)
            {
                return NotFound();
            }

            // Check if user has access to the trip
            if (serviceEntry.Trip.UserId != userId.Value && 
                !serviceEntry.Trip.Members.Any(m => m.UserId == userId.Value))
            {
                return NotFound();
            }

            serviceEntry.ServiceType = dto.ServiceType;
            serviceEntry.Description = dto.Description;
            serviceEntry.ServiceDate = dto.ServiceDate;
            serviceEntry.Amount = dto.Amount;
            serviceEntry.Currency = dto.Currency;
            serviceEntry.Location = dto.Location;
            serviceEntry.Mileage = dto.Mileage;
            serviceEntry.Note = dto.Note;
            serviceEntry.UpdatedByUserId = userId.Value;
            serviceEntry.UpdatedAt = DateTime.UtcNow;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await ServiceEntryExists(id))
                {
                    return NotFound();
                }
                throw;
            }

            return NoContent();
        }

        // DELETE: api/trips/{tripId}/services/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteServiceEntry(int tripId, int id)
        {
            var userId = _currentUserService.GetUserId();

            if (!userId.HasValue)
            {
                return Unauthorized();
            }

            var serviceEntry = await _context.ServiceEntries
                .Include(se => se.Trip)
                    .ThenInclude(t => t.Members)
                .FirstOrDefaultAsync(se => se.Id == id && se.TripId == tripId);

            if (serviceEntry == null)
            {
                return NotFound();
            }

            // Check if user has access to the trip
            if (serviceEntry.Trip.UserId != userId.Value && 
                !serviceEntry.Trip.Members.Any(m => m.UserId == userId.Value))
            {
                return NotFound();
            }

            _context.ServiceEntries.Remove(serviceEntry);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private async Task<bool> ServiceEntryExists(int id)
        {
            return await _context.ServiceEntries.AnyAsync(e => e.Id == id);
        }
    }
}
