'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, CreateTripDto, Trip } from '@/lib/api';

export default function NewTripPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    
    const tripData: CreateTripDto = {
      name: formData.get('name') as string,
      description: formData.get('description') as string || undefined,
      startDate: formData.get('startDate') as string,
      endDate: formData.get('endDate') as string || undefined,
      status: (formData.get('status') as Trip['status']) || 'Planned',
    };

    try {
      await api.createTrip(tripData);
      router.push('/trips');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create trip');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/trips"
            className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white mb-4 inline-block"
          >
            ◀ Nazad na listu
          </Link>
          <h1 className="text-3xl font-bold text-black dark:text-white">
            Novi Trip 🏍️
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Kreiraj novu moto avanturu
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
          <div className="space-y-6">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-black dark:text-white mb-2">
                Naziv Trip-a *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                placeholder="npr. Zlatibor 2026"
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-black dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-black dark:text-white mb-2">
                Opis
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                placeholder="Kratki opis trip-a..."
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-black dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              />
            </div>

            {/* Start Date */}
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-black dark:text-white mb-2">
                Datum početka *
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                required
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              />
            </div>

            {/* End Date */}
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-black dark:text-white mb-2">
                Datum završetka
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              />
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-black dark:text-white mb-2">
                Status
              </label>
              <select
                id="status"
                name="status"
                defaultValue="Planned"
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              >
                <option value="Planned">Planned</option>
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Kreiram...' : 'Kreiraj Trip'}
            </button>
            <Link
              href="/trips"
              className="px-4 py-2 text-sm font-medium text-black dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
            >
              Otkaži
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
