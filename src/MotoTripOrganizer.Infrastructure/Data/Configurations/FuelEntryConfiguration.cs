using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MotoTripOrganizer.Domain.Entities;

namespace MotoTripOrganizer.Infrastructure.Data.Configurations;

public class FuelEntryConfiguration : IEntityTypeConfiguration<FuelEntry>
{
    public void Configure(EntityTypeBuilder<FuelEntry> builder)
    {
        builder.ToTable("FuelEntries");

        builder.HasKey(f => f.Id);

        builder.Property(f => f.Quantity)
            .IsRequired()
            .HasPrecision(10, 2);

        builder.Property(f => f.Amount)
            .IsRequired()
            .HasPrecision(18, 2);

        builder.Property(f => f.Currency)
            .IsRequired()
            .HasMaxLength(3)
            .HasDefaultValue("EUR");

        builder.Property(f => f.UnitPrice)
            .IsRequired()
            .HasPrecision(18, 3);

        builder.Property(f => f.Mileage)
            .IsRequired();

        builder.Property(f => f.Location)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(f => f.Note)
            .HasMaxLength(1000);

        builder.Property(f => f.Date)
            .IsRequired();

        builder.Property(f => f.CreatedAt)
            .IsRequired();

        // Concurrency token
        builder.Property(f => f.RowVersion)
            .IsRowVersion();

        // Relationships
        builder.HasOne(f => f.Trip)
            .WithMany()
            .HasForeignKey(f => f.TripId)
            .OnDelete(DeleteBehavior.Cascade);

        // Indexes for common queries
        builder.HasIndex(f => f.TripId);
        builder.HasIndex(f => f.Date);
        builder.HasIndex(f => f.Mileage);
    }
}
