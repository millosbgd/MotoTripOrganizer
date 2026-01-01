'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { tripsApi, stagesApi, itemsApi } from '@/lib/api';
import type { Trip, Stage, Item } from '@/types/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function TripDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = parseInt(params.id as string);
  
  const [trip, setTrip] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showStageModal, setShowStageModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState<number | null>(null);

  useEffect(() => {
    loadTrip();
  }, [tripId]);

  const loadTrip = async () => {
    try {
      const data = await tripsApi.getById(tripId);
      setTrip(data);
    } catch (error) {
      console.error('Failed to load trip:', error);
      toast.error('Failed to load trip');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateStage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      await stagesApi.create(tripId, {
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        startDate: formData.get('startDate') as string,
        endDate: formData.get('endDate') as string || undefined,
        orderIndex: trip?.stages?.length || 0,
      });
      toast.success('Stage created!');
      setShowStageModal(false);
      loadTrip();
    } catch (error) {
      console.error('Failed to create stage:', error);
      toast.error('Failed to create stage');
    }
  };

  const handleCreateItem = async (e: React.FormEvent<HTMLFormElement>, stageId: number) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      await itemsApi.create(tripId, stageId, {
        type: formData.get('type') as any,
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        location: formData.get('location') as string,
        orderIndex: 0,
      });
      toast.success('Item created!');
      setShowItemModal(null);
      loadTrip();
    } catch (error) {
      console.error('Failed to create item:', error);
      toast.error('Failed to create item');
    }
  };

  const handleDeleteTrip = async () => {
    if (!confirm('Are you sure you want to delete this trip?')) return;

    try {
      await tripsApi.delete(tripId);
      toast.success('Trip deleted');
      router.push('/dashboard');
    } catch (error) {
      console.error('Failed to delete trip:', error);
      toast.error('Failed to delete trip');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!trip) {
    return <div className="text-center py-12">Trip not found</div>;
  }

  const itemTypeEmoji: Record<string, string> = {
    Accommodation: '🏨',
    Activity: '🎯',
    Transport: '🚗',
    Food: '🍽️',
    Other: '📌',
  };

  return (
    <div>
      <div className="mb-6">
        <button onClick={() => router.back()} className="text-gray-600 hover:text-gray-900 mb-4">
          ← Back to Trips
        </button>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{trip.name}</h1>
            <p className="text-gray-600">{trip.description}</p>
            <div className="mt-2 text-sm text-gray-500">
              📅 {format(new Date(trip.startDate), 'MMM d, yyyy')}
              {trip.endDate && ` - ${format(new Date(trip.endDate), 'MMM d, yyyy')}`}
            </div>
          </div>
          <div className="flex space-x-2">
            <button onClick={() => setShowStageModal(true)} className="btn-primary">
              + Add Stage
            </button>
            <button onClick={handleDeleteTrip} className="btn-danger">
              Delete Trip
            </button>
          </div>
        </div>
      </div>

      {trip.stages?.length === 0 ? (
        <div className="text-center py-12 card">
          <div className="text-6xl mb-4">🗺️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No stages yet</h3>
          <p className="text-gray-600 mb-4">
            Add stages to organize your trip day by day
          </p>
          <button onClick={() => setShowStageModal(true)} className="btn-primary">
            Add First Stage
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {trip.stages?.map((stage: Stage) => (
            <div key={stage.id} className="card">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">{stage.name}</h2>
                  <p className="text-gray-600 text-sm">{stage.description}</p>
                  <div className="mt-1 text-sm text-gray-500">
                    📅 {format(new Date(stage.startDate), 'MMM d, yyyy')}
                    {stage.endDate && ` - ${format(new Date(stage.endDate), 'MMM d, yyyy')}`}
                  </div>
                </div>
                <button
                  onClick={() => setShowItemModal(stage.id)}
                  className="btn-secondary text-sm"
                >
                  + Add Item
                </button>
              </div>

              {stage.items && stage.items.length > 0 && (
                <div className="space-y-2">
                  {stage.items.map((item: Item) => (
                    <div
                      key={item.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <span className="text-2xl">{itemTypeEmoji[item.type]}</span>
                          <div>
                            <h4 className="font-medium text-gray-900">{item.name}</h4>
                            {item.description && (
                              <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                            )}
                            {item.location && (
                              <p className="text-sm text-gray-500 mt-1">📍 {item.location}</p>
                            )}
                            {item.estimatedCost && (
                              <p className="text-sm text-gray-500 mt-1">
                                💰 ${item.estimatedCost}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Stage Modal */}
      {showStageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Add Stage</h2>
            <form onSubmit={handleCreateStage}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stage Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  className="input-field"
                  placeholder="e.g., Day 1: Belgrade to Novi Sad"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={2}
                  className="input-field"
                  placeholder="Optional description"
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
                  Add Stage
                </button>
                <button
                  type="button"
                  onClick={() => setShowStageModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Item Modal */}
      {showItemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Add Item</h2>
            <form onSubmit={(e) => handleCreateItem(e, showItemModal)}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type *
                </label>
                <select name="type" required className="input-field">
                  <option value="Accommodation">🏨 Accommodation</option>
                  <option value="Activity">🎯 Activity</option>
                  <option value="Transport">🚗 Transport</option>
                  <option value="Food">🍽️ Food</option>
                  <option value="Other">📌 Other</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  className="input-field"
                  placeholder="e.g., Hotel Grand"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={2}
                  className="input-field"
                  placeholder="Optional description"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  className="input-field"
                  placeholder="e.g., Belgrade, Serbia"
                />
              </div>
              <div className="flex space-x-3">
                <button type="submit" className="btn-primary flex-1">
                  Add Item
                </button>
                <button
                  type="button"
                  onClick={() => setShowItemModal(null)}
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
