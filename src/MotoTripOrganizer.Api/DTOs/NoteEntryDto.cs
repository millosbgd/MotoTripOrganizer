using System;

namespace MotoTripOrganizer.Api.DTOs
{
    public class NoteEntryDto
    {
        public int Id { get; set; }
        public int TripId { get; set; }
        public string Content { get; set; } = string.Empty;
        public int CreatedByUserId { get; set; }
        public string CreatedByUserDisplayName { get; set; } = string.Empty;
        public int? UpdatedByUserId { get; set; }
        public string? UpdatedByUserDisplayName { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class CreateNoteEntryDto
    {
        public string Content { get; set; } = string.Empty;
    }

    public class UpdateNoteEntryDto
    {
        public string Content { get; set; } = string.Empty;
    }
}
