using System;

namespace MotoTripOrganizer.Domain.Entities
{
    public class NoteEntry
    {
        public int Id { get; set; }
        
        public int TripId { get; set; }
        
        public string Content { get; set; } = string.Empty;
        
        // Audit fields
        public int CreatedByUserId { get; set; }
        public int? UpdatedByUserId { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        
        // Concurrency token
        public byte[] RowVersion { get; set; } = Array.Empty<byte>();
        
        // Navigation properties
        public Trip Trip { get; set; } = null!;
        public User CreatedByUser { get; set; } = null!;
        public User? UpdatedByUser { get; set; }
    }
}
