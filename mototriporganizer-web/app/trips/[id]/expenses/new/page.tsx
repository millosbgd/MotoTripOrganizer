'use client';

import { useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

interface PageParams {
  id: string;
}

export default function NewExpensePage({ params }: { params: Promise<PageParams> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tripId, setTripId] = useState<string | null>(null);
  const isShared = searchParams.get('isShared') === 'true';

  useState(() => {
    params.then(p => setTripId(p.id));
  });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!tripId) return;

    const formData = new FormData(e.currentTarget);
    
    const expense = {
      date: formData.get('date') as string,
      category: formData.get('category') as string,
      description: formData.get('description') as string,
      amount: parseFloat(formData.get('amount') as string),
      currency: formData.get('currency') as string || 'EUR',
      isShared: isShared,
    };

    try {
      setLoading(true);
      setError(null);
      await api.createExpense(parseInt(tripId), expense);
      router.push(`/trips/${tripId}/edit`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create expense');
    } finally {
      setLoading(false);
    }
  };

  if (!tripId) {
    return (
      <div className="min-h-screen bg-white dark:bg-black p-6">
        <p className="text-zinc-600 dark:text-zinc-400">Učitavam...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="max-w-2xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href={`/trips/${tripId}/edit`}
            className="text-black dark:text-white hover:opacity-70 transition-opacity text-2xl"
          >
            ←
          </Link>
          <h1 className="text-xl font-semibold text-black dark:text-white">Novi trošak</h1>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
          <div className="space-y-6">
            {/* Date */}
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-black dark:text-white mb-2">
                Datum *
              </label>
              <input
                type="date"
                id="date"
                name="date"
                required
                defaultValue={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              />
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-black dark:text-white mb-2">
                Kategorija *
              </label>
              <select
                id="category"
                name="category"
                required
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              >
                <option value="">Izaberi kategoriju</option>
                <option value="Gorivo">Gorivo</option>
                <option value="Hrana">Hrana</option>
                <option value="Smeštaj">Smeštaj</option>
                <option value="Parking">Parking</option>
                <option value="Putarina">Putarina</option>
                <option value="Servis">Servis</option>
                <option value="Oprema">Oprema</option>
                <option value="Ostalo">Ostalo</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-black dark:text-white mb-2">
                Opis
              </label>
              <input
                type="text"
                id="description"
                name="description"
                placeholder="Dodatni opis troška..."
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-black dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              />
            </div>

            {/* Amount */}
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-black dark:text-white mb-2">
                Iznos *
              </label>
              <input
                type="number"
                id="amount"
                name="amount"
                required
                step="0.01"
                min="0"
                placeholder="0.00"
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-black dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              />
            </div>

            {/* Currency */}
            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-black dark:text-white mb-2">
                Valuta
              </label>
              <select
                id="currency"
                name="currency"
                defaultValue="EUR"
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              >
                <option value="EUR">EUR (€)</option>
                <option value="RSD">RSD (дин)</option>
                <option value="USD">USD ($)</option>
                <option value="BAM">BAM (KM)</option>
                <option value="HRK">HRK (kn)</option>
              </select>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black dark:bg-white text-white dark:text-black py-3 px-4 rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Čuvam...' : 'Sačuvaj trošak'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
