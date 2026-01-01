using MotoTripOrganizer.Domain.Entities;

namespace MotoTripOrganizer.Domain.Interfaces;

public interface IUnitOfWork : IDisposable
{
    IRepository<User> Users { get; }
    IRepository<Trip> Trips { get; }
    IRepository<Stage> Stages { get; }
    IRepository<Item> Items { get; }
    IRepository<Expense> Expenses { get; }
    IRepository<TripMember> TripMembers { get; }
    IRepository<Attachment> Attachments { get; }
    
    Task<int> SaveChangesAsync();
}
