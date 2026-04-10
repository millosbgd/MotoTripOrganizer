using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MotoTripOrganizer.Domain.Entities;

namespace MotoTripOrganizer.Infrastructure.Data.Configurations;

public class TripEquipmentEntryConfiguration : IEntityTypeConfiguration<TripEquipmentEntry>
{
    public void Configure(EntityTypeBuilder<TripEquipmentEntry> builder)
    {
        builder.ToTable("TripEquipmentEntries");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.Quantity)
            .IsRequired()
            .HasDefaultValue(1);

        builder.Property(e => e.Note)
            .HasMaxLength(500);

        builder.Property(e => e.CreatedAt)
            .IsRequired();

        // Concurrency token
        builder.Property(e => e.RowVersion)
            .IsRowVersion();

        // Relationships
        builder.HasOne(e => e.Trip)
            .WithMany()
            .HasForeignKey(e => e.TripId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.EquipmentCatalogItem)
            .WithMany(c => c.TripEquipmentEntries)
            .HasForeignKey(e => e.EquipmentCatalogItemId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.CarriedByUser)
            .WithMany()
            .HasForeignKey(e => e.CarriedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Indexes
        builder.HasIndex(e => e.TripId);
        builder.HasIndex(e => e.EquipmentCatalogItemId);
        builder.HasIndex(e => e.CarriedByUserId);
    }
}
