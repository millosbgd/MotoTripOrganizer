using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MotoTripOrganizer.Domain.Entities;

namespace MotoTripOrganizer.Infrastructure.Data.Configurations;

public class EmergencyInfoConfiguration : IEntityTypeConfiguration<EmergencyInfo>
{
    public void Configure(EntityTypeBuilder<EmergencyInfo> builder)
    {
        builder.ToTable("EmergencyInfos");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.Id)
            .ValueGeneratedOnAdd();

        builder.Property(e => e.EmergencyContactName)
            .HasMaxLength(200);

        builder.Property(e => e.EmergencyContactPhone)
            .HasMaxLength(50);

        builder.Property(e => e.BloodType)
            .HasMaxLength(10);

        builder.Property(e => e.HealthInsurancePolicyNumber)
            .HasMaxLength(100);

        builder.Property(e => e.CreatedAt)
            .IsRequired();

        builder.Property(e => e.UpdatedAt)
            .IsRequired(false);

        // One entry per member per trip
        builder.HasIndex(e => new { e.TripId, e.UserId })
            .IsUnique();

        // Relationships
        builder.HasOne(e => e.Trip)
            .WithMany()
            .HasForeignKey(e => e.TripId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.User)
            .WithMany()
            .HasForeignKey(e => e.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
