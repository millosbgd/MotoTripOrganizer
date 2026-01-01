'use client';

import { useEffect, useState } from 'react';
import { tripsApi } from '@/lib/api';
import type { Trip } from '@/types/api';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

export default function DashboardPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    try {
      const data = await tripsApi.getAll();
      setTrips(data);
    } catch (error) {
      console.error('Failed to load trips:', error);
      toast.error('Failed to load trips');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTrip = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      const trip = await tripsApi.create({
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        startDate: formData.get('startDate') as string,
        endDate: formData.get('endDate') as string || undefined,
      });
      toast.success('Trip created!');
      setShowCreateModal(false);
      router.push(`/dashboard/trips/${trip.id}`);
    } catch (error) {
      console.error('Failed to create trip:', error);
      toast.error('Failed to create trip');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Trips</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary mt-4 sm:mt-0"
        >
          + New Trip
        </button>
      </div>

      {trips.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏍️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No trips yet</h3>
          <p className="text-gray-600 mb-4">
            Create your first trip to start planning your adventure!
          </p>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary">
            Create Your First Trip
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => (
            <div
              key={trip.id}
              onClick={() => router.push(`/dashboard/trips/${trip.id}`)}
              className="card hover:shadow-lg transition-shadow cursor-pointer"
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{trip.name}</h3>
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {trip.description || 'No description'}
              </p>
              <div className="flex items-center text-sm text-gray-500 space-x-4">
                <div className="flex items-center">
                  <span className="mr-1">📅</span>
                  {format(new Date(trip.startDate), 'MMM d, yyyy')}
                  {trip.endDate && ` - ${format(new Date(trip.endDate), 'MMM d, yyyy')}`}
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-gray-500">
                <span className="mr-1">👥</span>
                {trip.members?.length || 0} member{trip.members?.length !== 1 ? 's' : ''}
                <span className="mx-2">•</span>
                <span className="mr-1">🗺️</span>
                {trip.stages?.length || 0} stage{trip.stages?.length !== 1 ? 's' : ''}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Trip Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Create New Trip</h2>
            <form onSubmit={handleCreateTrip}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trip Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  className="input-field"
                  placeholder="e.g., Summer Road Trip 2026"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  className="input-field"
                  placeholder="Optional trip description"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  name="startDate"
                  required
                  className="input-field"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  name="endDate"
                  className="input-field"
                />
              </div>
              <div className="flex space-x-3">
                <button type="submit" className="btn-primary flex-1">
                  Create Trip
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
