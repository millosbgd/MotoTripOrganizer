using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MotoTripOrganizer.Domain.Entities;

namespace MotoTripOrganizer.Infrastructure.Data.Configurations;

public class StageConfiguration : IEntityTypeConfiguration<Stage>
{
    public void Configure(EntityTypeBuilder<Stage> builder)
    {
        builder.ToTable("Stages");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.StartText)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(s => s.EndText)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(s => s.Notes)
            .HasMaxLength(2000);

        builder.Property(s => s.Date)
            .IsRequired();

        builder.Property(s => s.CreatedAt)
            .IsRequired();

        // Concurrency token - IMPORTANT for optimistic concurrency
        builder.Property(s => s.RowVersion)
            .IsRowVersion();

        // Relationships
        builder.HasOne(s => s.Trip)
            .WithMany(t => t.Stages)
            .HasForeignKey(s => s.TripId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(s => s.CreatedBy)
            .WithMany(u => u.CreatedStages)
            .HasForeignKey(s => s.CreatedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(s => s.UpdatedBy)
            .WithMany(u => u.UpdatedStages)
            .HasForeignKey(s => s.UpdatedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(s => s.Items)
            .WithOne(i => i.Stage)
            .HasForeignKey(i => i.StageId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(s => s.Expenses)
            .WithOne(e => e.Stage)
            .HasForeignKey(e => e.StageId)
            .OnDelete(DeleteBehavior.SetNull);

        // Index for efficient trip queries
        builder.HasIndex(s => s.TripId);
        builder.HasIndex(s => new { s.TripId, s.Date });
    }
}
