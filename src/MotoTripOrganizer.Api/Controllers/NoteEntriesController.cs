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
using System.Threading.Tasks;

namespace MotoTripOrganizer.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/trips/{tripId}/notes")]
    public class NoteEntriesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ICurrentUserService _currentUserService;

        public NoteEntriesController(
            ApplicationDbContext context,
            ICurrentUserService currentUserService)
        {
            _context = context;
            _currentUserService = currentUserService;
        }

        // GET: api/trips/{tripId}/notes
        [HttpGet]
        public async Task<ActionResult<IEnumerable<NoteEntryDto>>> GetNoteEntries(int tripId)
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

            var noteEntries = await _context.NoteEntries
                .Where(ne => ne.TripId == tripId)
                .Include(ne => ne.CreatedByUser)
                .Include(ne => ne.UpdatedByUser)
                .OrderByDescending(ne => ne.CreatedAt)
                .Select(ne => new NoteEntryDto
                {
                    Id = ne.Id,
                    TripId = ne.TripId,
                    Content = ne.Content,
                    CreatedByUserId = ne.CreatedByUserId,
                    CreatedByUserDisplayName = ne.CreatedByUser.DisplayName,
                    UpdatedByUserId = ne.UpdatedByUserId,
                    UpdatedByUserDisplayName = ne.UpdatedByUser != null ? ne.UpdatedByUser.DisplayName : null,
                    CreatedAt = ne.CreatedAt,
                    UpdatedAt = ne.UpdatedAt
                })
                .ToListAsync();

            return Ok(noteEntries);
        }

        // GET: api/trips/{tripId}/notes/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<NoteEntryDto>> GetNoteEntry(int tripId, int id)
        {
            var userId = _currentUserService.GetUserId();

            if (!userId.HasValue)
            {
                return Unauthorized();
            }

            var noteEntry = await _context.NoteEntries
                .Include(ne => ne.Trip)
                    .ThenInclude(t => t.Members)
                .Include(ne => ne.CreatedByUser)
                .Include(ne => ne.UpdatedByUser)
                .FirstOrDefaultAsync(ne => ne.Id == id && ne.TripId == tripId);

            if (noteEntry == null)
            {
                return NotFound();
            }

            // Check if user has access to the trip
            if (noteEntry.Trip.UserId != userId.Value && 
                !noteEntry.Trip.Members.Any(m => m.UserId == userId.Value))
            {
                return NotFound();
            }

            var dto = new NoteEntryDto
            {
                Id = noteEntry.Id,
                TripId = noteEntry.TripId,
                Content = noteEntry.Content,
                CreatedByUserId = noteEntry.CreatedByUserId,
                CreatedByUserDisplayName = noteEntry.CreatedByUser.DisplayName,
                UpdatedByUserId = noteEntry.UpdatedByUserId,
                UpdatedByUserDisplayName = noteEntry.UpdatedByUser?.DisplayName,
                CreatedAt = noteEntry.CreatedAt,
                UpdatedAt = noteEntry.UpdatedAt
            };

            return Ok(dto);
        }

        // POST: api/trips/{tripId}/notes
        [HttpPost]
        public async Task<ActionResult<NoteEntryDto>> CreateNoteEntry(int tripId, CreateNoteEntryDto dto)
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

            var noteEntry = new NoteEntry
            {
                TripId = tripId,
                Content = dto.Content,
                CreatedByUserId = userId.Value,
                CreatedAt = DateTime.UtcNow
            };

            _context.NoteEntries.Add(noteEntry);
            await _context.SaveChangesAsync();

            // Load user information for response
            await _context.Entry(noteEntry)
                .Reference(ne => ne.CreatedByUser)
                .LoadAsync();

            var resultDto = new NoteEntryDto
            {
                Id = noteEntry.Id,
                TripId = noteEntry.TripId,
                Content = noteEntry.Content,
                CreatedByUserId = noteEntry.CreatedByUserId,
                CreatedByUserDisplayName = noteEntry.CreatedByUser.DisplayName,
                UpdatedByUserId = noteEntry.UpdatedByUserId,
                UpdatedByUserDisplayName = null,
                CreatedAt = noteEntry.CreatedAt,
                UpdatedAt = noteEntry.UpdatedAt
            };

            return CreatedAtAction(nameof(GetNoteEntry), new { tripId, id = noteEntry.Id }, resultDto);
        }

        // PUT: api/trips/{tripId}/notes/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateNoteEntry(int tripId, int id, UpdateNoteEntryDto dto)
        {
            var userId = _currentUserService.GetUserId();

            if (!userId.HasValue)
            {
                return Unauthorized();
            }

            var noteEntry = await _context.NoteEntries
                .Include(ne => ne.Trip)
                    .ThenInclude(t => t.Members)
                .FirstOrDefaultAsync(ne => ne.Id == id && ne.TripId == tripId);

            if (noteEntry == null)
            {
                return NotFound();
            }

            // Check if user has access to the trip
            if (noteEntry.Trip.UserId != userId.Value && 
                !noteEntry.Trip.Members.Any(m => m.UserId == userId.Value))
            {
                return NotFound();
            }

            noteEntry.Content = dto.Content;
            noteEntry.UpdatedByUserId = userId.Value;
            noteEntry.UpdatedAt = DateTime.UtcNow;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await NoteEntryExists(id))
                {
                    return NotFound();
                }
                throw;
            }

            return NoContent();
        }

        // DELETE: api/trips/{tripId}/notes/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteNoteEntry(int tripId, int id)
        {
            var userId = _currentUserService.GetUserId();

            if (!userId.HasValue)
            {
                return Unauthorized();
            }

            var noteEntry = await _context.NoteEntries
                .Include(ne => ne.Trip)
                    .ThenInclude(t => t.Members)
                .FirstOrDefaultAsync(ne => ne.Id == id && ne.TripId == tripId);

            if (noteEntry == null)
            {
                return NotFound();
            }

            // Check if user has access to the trip
            if (noteEntry.Trip.UserId != userId.Value && 
                !noteEntry.Trip.Members.Any(m => m.UserId == userId.Value))
            {
                return NotFound();
            }

            _context.NoteEntries.Remove(noteEntry);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private async Task<bool> NoteEntryExists(int id)
        {
            return await _context.NoteEntries.AnyAsync(e => e.Id == id);
        }
    }
}
