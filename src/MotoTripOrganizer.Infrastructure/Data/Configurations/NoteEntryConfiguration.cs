using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MotoTripOrganizer.Domain.Entities;

namespace MotoTripOrganizer.Infrastructure.Data.Configurations
{
    public class NoteEntryConfiguration : IEntityTypeConfiguration<NoteEntry>
    {
        public void Configure(EntityTypeBuilder<NoteEntry> builder)
        {
            builder.ToTable("NoteEntries");

            builder.HasKey(ne => ne.Id);

            builder.Property(ne => ne.Id)
                .ValueGeneratedOnAdd();

            builder.Property(ne => ne.Content)
                .IsRequired()
                .HasMaxLength(5000);

            builder.Property(ne => ne.IsPublic)
                .IsRequired()
                .HasDefaultValue(false);

            builder.Property(ne => ne.CreatedAt)
                .IsRequired();

            builder.Property(ne => ne.UpdatedAt)
                .IsRequired(false);

            builder.Property(ne => ne.RowVersion)
                .IsRowVersion();

            // Relationships
            builder.HasOne(ne => ne.Trip)
                .WithMany()
                .HasForeignKey(ne => ne.TripId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(ne => ne.CreatedByUser)
                .WithMany()
                .HasForeignKey(ne => ne.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(ne => ne.UpdatedByUser)
                .WithMany()
                .HasForeignKey(ne => ne.UpdatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            // Indexes
            builder.HasIndex(ne => ne.TripId);
            builder.HasIndex(ne => ne.CreatedAt);
        }
    }
}
