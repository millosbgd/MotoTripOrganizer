using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MotoTripOrganizer.Domain.Entities;

namespace MotoTripOrganizer.Infrastructure.Data.Configurations;

public class ExpenseConfiguration : IEntityTypeConfiguration<Expense>
{
    public void Configure(EntityTypeBuilder<Expense> builder)
    {
        builder.ToTable("Expenses");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.Category)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(e => e.Amount)
            .IsRequired()
            .HasPrecision(18, 2);

        builder.Property(e => e.Currency)
            .IsRequired()
            .HasMaxLength(3);

        builder.Property(e => e.Note)
            .HasMaxLength(1000);

        builder.Property(e => e.CreatedAt)
            .IsRequired();

        // Concurrency token
        builder.Property(e => e.RowVersion)
            .IsRowVersion();

        // Relationships
        builder.HasOne(e => e.Trip)
            .WithMany(t => t.Expenses)
            .HasForeignKey(e => e.TripId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.Stage)
            .WithMany(s => s.Expenses)
            .HasForeignKey(e => e.StageId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(e => e.PaidBy)
            .WithMany(u => u.PaidExpenses)
            .HasForeignKey(e => e.PaidByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.CreatedBy)
            .WithMany(u => u.CreatedExpenses)
            .HasForeignKey(e => e.CreatedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.UpdatedBy)
            .WithMany(u => u.UpdatedExpenses)
            .HasForeignKey(e => e.UpdatedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(e => e.Attachments)
            .WithOne(a => a.Expense)
            .HasForeignKey(a => a.ExpenseId)
            .OnDelete(DeleteBehavior.Cascade);

        // Indexes
        builder.HasIndex(e => e.TripId);
        builder.HasIndex(e => new { e.TripId, e.Category });
        builder.HasIndex(e => e.PaidByUserId);
    }
}
