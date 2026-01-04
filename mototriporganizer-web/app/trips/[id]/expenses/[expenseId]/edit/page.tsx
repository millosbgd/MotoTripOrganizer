'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, Expense } from '@/lib/api';

interface PageParams {
  id: string;
  expenseId: string;
}

export default function EditExpensePage({ params }: { params: Promise<PageParams> }) {
  const router = useRouter();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tripId, setTripId] = useState<string | null>(null);
  const [expenseId, setExpenseId] = useState<string | null>(null);

  useEffect(() => {
    params.then(p => {
      setTripId(p.id);
      setExpenseId(p.expenseId);
      loadExpense(p.id, p.expenseId);
    });
  }, []);

  const loadExpense = async (tripId: string, expenseId: string) => {
    try {
      setLoading(true);
      const data = await api.getExpense(parseInt(tripId), parseInt(expenseId));
      setExpense(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load expense');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!tripId || !expenseId) return;

    const formData = new FormData(e.currentTarget);
    
    const updatedExpense = {
      date: formData.get('date') as string,
      category: formData.get('category') as string,
      description: formData.get('description') as string,
      amount: parseFloat(formData.get('amount') as string),
      currency: formData.get('currency') as string || 'EUR',
    };

    try {
      setSaving(true);
      setError(null);
      await api.updateExpense(parseInt(tripId), parseInt(expenseId), updatedExpense);
      // Redirect to appropriate tab based on expense type
      const tab = expense?.isShared ? 'sharedExpenses' : 'personalExpenses';
      router.push(`/trips/${tripId}/edit?tab=${tab}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update expense');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!tripId || !expenseId || !confirm('Da li si siguran da želiš da obrišeš ovaj trošak?')) {
      return;
    }

    try {
      setDeleting(true);
      setError(null);
      await api.deleteExpense(parseInt(tripId), parseInt(expenseId));
      // Redirect to appropriate tab based on expense type
      const tab = expense?.isShared ? 'sharedExpenses' : 'personalExpenses';
      router.push(`/trips/${tripId}/edit?tab=${tab}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete expense');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black p-6">
        <p className="text-zinc-600 dark:text-zinc-400">Učitavam...</p>
      </div>
    );
  }

  if (!expense) {
    return (
      <div className="min-h-screen bg-white dark:bg-black p-6">
        <p className="text-red-600 dark:text-red-400">Trošak nije pronađen</p>
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
          <h1 className="text-xl font-semibold text-black dark:text-white">Uredi trošak</h1>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 disabled:opacity-50 transition-opacity"
            title="Obriši trošak"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              <line x1="10" y1="11" x2="10" y2="17"/>
              <line x1="14" y1="11" x2="14" y2="17"/>
            </svg>
          </button>
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
                defaultValue={expense.date.split('T')[0]}
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
                defaultValue={expense.category}
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
                defaultValue={expense.description || ''}
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
                defaultValue={expense.amount}
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
                defaultValue={expense.currency}
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
              disabled={saving}
              className="w-full bg-black dark:bg-white text-white dark:text-black py-3 px-4 rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {saving ? 'Čuvam...' : 'Sačuvaj izmene'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
