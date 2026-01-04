'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, Trip } from '@/lib/api';

export default function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [tripId, setTripId] = useState<string | null>(null);

  useEffect(() => {
    params.then(p => {
      setTripId(p.id);
      loadTrip(p.id);
    });
  }, []);

  const loadTrip = async (id: string) => {
    try {
      setLoading(true);
      const data = await api.getTrip(parseInt(id));
      setTrip(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trip');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!tripId || !confirm('Da li si siguran da želiš da obrišeš ovaj trip?')) {
      return;
    }

    try {
      setDeleting(true);
      await api.deleteTrip(parseInt(tripId));
      router.push('/trips');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete trip');
      setDeleting(false);
    }
  };

  const getStatusColor = (status: Trip['status']) => {
    const colors = {
      'Planned': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      'Active': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      'Completed': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
      'Cancelled': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    };
    return colors[status] || colors['Planned'];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sr-RS', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">Učitavam...</p>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
              Greška
            </h2>
            <p className="text-red-600 dark:text-red-300">{error || 'Trip nije pronađen'}</p>
            <Link
              href="/trips"
              className="mt-4 inline-block text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
            >
              ‹ Nazad na listu
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/trips"
            className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white mb-4 inline-block"
          >
            ‹ Nazad na listu
          </Link>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-black dark:text-white">
                {trip.name}
              </h1>
              <div className="mt-2 flex items-center gap-3">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(trip.status)}`}>
                  {trip.status}
                </span>
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  {formatDate(trip.startDate)}
                  {trip.endDate && ` - ${formatDate(trip.endDate)}`}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/trips/${trip.id}/edit`}
                className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-md hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
              >
                Uredi
              </Link>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Brišem...' : 'Obriši'}
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Description */}
          {trip.description && (
            <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
              <h2 className="text-lg font-semibold text-black dark:text-white mb-3">
                Opis
              </h2>
              <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                {trip.description}
              </p>
            </div>
          )}

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
              <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                Datum kreiranja
              </div>
              <div className="text-lg font-semibold text-black dark:text-white">
                {formatDate(trip.createdAt)}
              </div>
            </div>
            
            <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
              <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                Poslednja izmena
              </div>
              <div className="text-lg font-semibold text-black dark:text-white">
                {formatDate(trip.updatedAt)}
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
              <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                Status
              </div>
              <div className="text-lg font-semibold text-black dark:text-white">
                {trip.status}
              </div>
            </div>
          </div>

          {/* Placeholder for future sections */}
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
            <div className="text-center py-8">
              <p className="text-zinc-600 dark:text-zinc-400">
                🚧 Etape, stavke i troškovi dolaze uskoro...
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
