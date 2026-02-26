'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api, TripMember } from '@/lib/api';

interface PageParams {
  id: string;
}

export default function NewExpensePage({ params }: { params: Promise<PageParams> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tripId, setTripId] = useState<string | null>(null);
  const [members, setMembers] = useState<TripMember[]>([]);
  const isShared = searchParams.get('isShared') === 'true';

  useEffect(() => {
    params.then(p => {
      setTripId(p.id);
      loadMembers(p.id);
    });
  }, []);

  const loadMembers = async (id: string) => {
    try {
      setLoadingMembers(true);
      const data = await api.getMembers(parseInt(id));
      setMembers(data);
    } catch (err) {
      console.error('Failed to load members:', err);
    } finally {
      setLoadingMembers(false);
    }
  };

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
      paidByUserId: parseInt(formData.get('paidByUserId') as string),
    };

    try {
      setLoading(true);
      setError(null);
      await api.createExpense(parseInt(tripId), expense);
      // Redirect to appropriate tab based on expense type
      const tab = isShared ? 'sharedExpenses' : 'personalExpenses';
      router.push(`/trips/${tripId}/edit?tab=${tab}`);
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
  if (loadingMembers) {
    return (
      <div className="min-h-screen bg-white dark:bg-black p-6">
        <p className="text-zinc-600 dark:text-zinc-400">Učitavam članove...</p>
      </div>
    );
  }
  const currentUser = members.find(m => m.isCurrentUser);
  const dropdownDefaultValue = currentUser?.userId.toString() || (members.length > 0 ? members[0].userId.toString() : '');

  console.log('=== NEW EXPENSE LOADED ===');
  console.log('Members:', members.map(m => ({ 
    userId: m.userId, 
    displayName: m.displayName, 
    isCurrentUser: m.isCurrentUser 
  })));
  console.log('Current user:', currentUser);
  console.log('Dropdown defaultValue:', dropdownDefaultValue);

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="max-w-2xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href={`/trips/${tripId}/edit`}
            className="text-black dark:text-white hover:opacity-70 transition-opacity text-2xl"
          >
            ◀
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
                <option value="Poslovna pratnja">Poslovna pratnja</option>
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

            {/* Paid By */}
            <div>
              <label htmlFor="paidByUserId" className="block text-sm font-medium text-black dark:text-white mb-2">
                Ko je platio *
              </label>
              <select
                id="paidByUserId"
                name="paidByUserId"
                required
                defaultValue={dropdownDefaultValue}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              >
                {loadingMembers ? (
                  <option value="">Učitavam...</option>
                ) : members.length === 0 ? (
                  <option value="">Nema članova</option>
                ) : (
                  members.map(member => (
                    <option key={member.userId} value={member.userId.toString()}>
                      {member.displayName}
                    </option>
                  ))
                )}
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
