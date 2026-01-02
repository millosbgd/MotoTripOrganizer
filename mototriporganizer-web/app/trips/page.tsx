'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, Trip } from '@/lib/api';

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getTrips();
      setTrips(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trips');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Da li ste sigurni da želite da obrišete ovaj trip?')) {
      return;
    }

    try {
      await api.deleteTrip(id);
      setTrips(trips.filter(t => t.id !== id));
    } catch (err) {
      alert('Greška pri brisanju trip-a');
    }
  };

  const getStatusBadgeColor = (status: Trip['status']) => {
    switch (status) {
      case 'Planned': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'Active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Completed': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      case 'Cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sr-RS', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-black dark:text-white">
                Moji Trip-ovi 🏍️
              </h1>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Organizuj i planiraj svoje moto avanture
              </p>
            </div>
            <Link
              href="/trips/new"
              className="inline-flex items-center justify-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              + Novi Trip
            </Link>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black dark:border-white"></div>
            <p className="mt-4 text-zinc-600 dark:text-zinc-400">Učitavam trip-ove...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && trips.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <p className="text-xl text-zinc-600 dark:text-zinc-400 mb-4">
              Nemaš još nijedan trip 😕
            </p>
            <Link
              href="/trips/new"
              className="inline-flex items-center justify-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              Kreiraj prvi trip
            </Link>
          </div>
        )}

        {/* Trips grid */}
        {!loading && !error && trips.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => (
              <div
                key={trip.id}
                className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 hover:shadow-lg transition-shadow"
              >
                {/* Status badge */}
                <div className="mb-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(trip.status)}`}>
                    {trip.status}
                  </span>
                </div>

                {/* Trip name */}
                <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
                  {trip.name}
                </h3>

                {/* Description */}
                {trip.description && (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 line-clamp-2">
                    {trip.description}
                  </p>
                )}

                {/* Dates */}
                <div className="text-xs text-zinc-500 dark:text-zinc-500 mb-4">
                  <p>📅 {formatDate(trip.startDate)}</p>
                  {trip.endDate && (
                    <p className="mt-1">🏁 {formatDate(trip.endDate)}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                  <Link
                    href={`/trips/${trip.id}`}
                    className="flex-1 text-center px-3 py-2 text-sm font-medium text-black dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
                  >
                    Detalji
                  </Link>
                  <Link
                    href={`/trips/${trip.id}/edit`}
                    className="flex-1 text-center px-3 py-2 text-sm font-medium text-black dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(trip.id)}
                    className="px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                  >
                    Obriši
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
