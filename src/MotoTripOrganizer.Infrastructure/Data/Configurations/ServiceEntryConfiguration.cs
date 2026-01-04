using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MotoTripOrganizer.Domain.Entities;

namespace MotoTripOrganizer.Infrastructure.Data.Configurations
{
    public class ServiceEntryConfiguration : IEntityTypeConfiguration<ServiceEntry>
    {
        public void Configure(EntityTypeBuilder<ServiceEntry> builder)
        {
            builder.ToTable("ServiceEntries");

            builder.HasKey(se => se.Id);

            builder.Property(se => se.Id)
                .ValueGeneratedOnAdd();

            builder.Property(se => se.ServiceType)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(se => se.Description)
                .IsRequired()
                .HasMaxLength(500);

            builder.Property(se => se.ServiceDate)
                .IsRequired();

            builder.Property(se => se.Amount)
                .IsRequired()
                .HasPrecision(18, 2);

            builder.Property(se => se.Currency)
                .IsRequired()
                .HasMaxLength(3)
                .HasDefaultValue("EUR");

            builder.Property(se => se.Location)
                .IsRequired()
                .HasMaxLength(200);

            builder.Property(se => se.Mileage)
                .IsRequired(false);

            builder.Property(se => se.Note)
                .HasMaxLength(1000);

            builder.Property(se => se.CreatedAt)
                .IsRequired();

            builder.Property(se => se.UpdatedAt)
                .IsRequired(false);

            builder.Property(se => se.RowVersion)
                .IsRowVersion();

            // Relationships
            builder.HasOne(se => se.Trip)
                .WithMany()
                .HasForeignKey(se => se.TripId)
                .OnDelete(DeleteBehavior.Cascade);

            // Indexes
            builder.HasIndex(se => se.TripId);
            builder.HasIndex(se => se.ServiceDate);
        }
    }
}
