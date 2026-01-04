using System;

namespace MotoTripOrganizer.Api.DTOs
{
    public class ServiceEntryDto
    {
        public int Id { get; set; }
        public int TripId { get; set; }
        public string ServiceType { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime ServiceDate { get; set; }
        public decimal Amount { get; set; }
        public string Currency { get; set; } = "EUR";
        public string Location { get; set; } = string.Empty;
        public int? Mileage { get; set; }
        public string? Note { get; set; }
        public int CreatedByUserId { get; set; }
        public int? UpdatedByUserId { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class CreateServiceEntryDto
    {
        public string ServiceType { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime ServiceDate { get; set; }
        public decimal Amount { get; set; }
        public string Currency { get; set; } = "EUR";
        public string Location { get; set; } = string.Empty;
        public int? Mileage { get; set; }
        public string? Note { get; set; }
    }

    public class UpdateServiceEntryDto
    {
        public string ServiceType { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime ServiceDate { get; set; }
        public decimal Amount { get; set; }
        public string Currency { get; set; } = "EUR";
        public string Location { get; set; } = string.Empty;
        public int? Mileage { get; set; }
        public string? Note { get; set; }
    }
}
