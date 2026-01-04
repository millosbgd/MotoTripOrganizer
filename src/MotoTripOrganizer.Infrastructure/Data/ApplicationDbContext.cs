using Microsoft.EntityFrameworkCore;
using MotoTripOrganizer.Domain.Entities;

namespace MotoTripOrganizer.Infrastructure.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<Trip> Trips { get; set; }
    public DbSet<TripMember> TripMembers { get; set; }
    public DbSet<Stage> Stages { get; set; }
    public DbSet<Item> Items { get; set; }
    public DbSet<Expense> Expenses { get; set; }
    public DbSet<FuelEntry> FuelEntries { get; set; }
    public DbSet<Attachment> Attachments { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
    }
}
