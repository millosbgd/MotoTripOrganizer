using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MotoTripOrganizer.Domain.Entities;

namespace MotoTripOrganizer.Infrastructure.Data.Configurations;

public class ItemConfiguration : IEntityTypeConfiguration<Item>
{
    public void Configure(EntityTypeBuilder<Item> builder)
    {
        builder.ToTable("Items");

        builder.HasKey(i => i.Id);

        builder.Property(i => i.Type)
            .IsRequired();

        builder.Property(i => i.Title)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(i => i.Body)
            .HasMaxLength(5000);

        builder.Property(i => i.Url)
            .HasMaxLength(2000);

        builder.Property(i => i.LocationJson)
            .HasMaxLength(1000);

        builder.Property(i => i.CreatedAt)
            .IsRequired();

        // Concurrency token
        builder.Property(i => i.RowVersion)
            .IsRowVersion();

        // Relationships
        builder.HasOne(i => i.Trip)
            .WithMany(t => t.Items)
            .HasForeignKey(i => i.TripId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(i => i.Stage)
            .WithMany(s => s.Items)
            .HasForeignKey(i => i.StageId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(i => i.CreatedBy)
            .WithMany(u => u.CreatedItems)
            .HasForeignKey(i => i.CreatedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(i => i.UpdatedBy)
            .WithMany(u => u.UpdatedItems)
            .HasForeignKey(i => i.UpdatedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(i => i.Attachments)
            .WithOne(a => a.Item)
            .HasForeignKey(a => a.ItemId)
            .OnDelete(DeleteBehavior.Cascade);

        // Indexes
        builder.HasIndex(i => i.TripId);
        builder.HasIndex(i => new { i.TripId, i.Type });
    }
}
