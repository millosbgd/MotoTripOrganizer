using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MotoTripOrganizer.Domain.Entities;

namespace MotoTripOrganizer.Infrastructure.Data.Configurations;

public class AccommodationEntryConfiguration : IEntityTypeConfiguration<AccommodationEntry>
{
    public void Configure(EntityTypeBuilder<AccommodationEntry> builder)
    {
        builder.ToTable("AccommodationEntries");

        builder.HasKey(a => a.Id);

        builder.Property(a => a.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(a => a.AccommodationType)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(a => a.CheckInDate)
            .IsRequired();

        builder.Property(a => a.CheckOutDate)
            .IsRequired();

        builder.Property(a => a.Amount)
            .IsRequired()
            .HasPrecision(18, 2);

        builder.Property(a => a.Currency)
            .IsRequired()
            .HasMaxLength(3)
            .HasDefaultValue("EUR");

        builder.Property(a => a.Location)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(a => a.Note)
            .HasMaxLength(1000);

        builder.Property(a => a.CreatedAt)
            .IsRequired();

        // Concurrency token
        builder.Property(a => a.RowVersion)
            .IsRowVersion();

        // Relationships
        builder.HasOne(a => a.Trip)
            .WithMany()
            .HasForeignKey(a => a.TripId)
            .OnDelete(DeleteBehavior.Cascade);

        // Indexes
        builder.HasIndex(a => a.TripId);
        builder.HasIndex(a => a.CheckInDate);
        builder.HasIndex(a => a.CheckOutDate);
    }
}
