using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MotoTripOrganizer.Domain.Entities;

namespace MotoTripOrganizer.Infrastructure.Data.Configurations;

public class EquipmentCatalogItemConfiguration : IEntityTypeConfiguration<EquipmentCatalogItem>
{
    public void Configure(EntityTypeBuilder<EquipmentCatalogItem> builder)
    {
        builder.ToTable("EquipmentCatalogItems");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(e => e.Description)
            .HasMaxLength(500);

        builder.Property(e => e.Category)
            .IsRequired()
            .HasMaxLength(100);

        builder.HasIndex(e => e.Category);
        builder.HasIndex(e => e.Name).IsUnique();
    }
}
