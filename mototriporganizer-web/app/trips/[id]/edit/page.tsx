'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api, Trip, Expense, TripMember, FuelEntry } from '@/lib/api';

export default function EditTripPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [members, setMembers] = useState<TripMember[]>([]);
  const [fuelEntries, setFuelEntries] = useState<FuelEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [loadingFuel, setLoadingFuel] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tripId, setTripId] = useState<string | null>(null);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [addingMember, setAddingMember] = useState(false);
  const [showFuelForm, setShowFuelForm] = useState(false);
  const [editingFuelId, setEditingFuelId] = useState<number | null>(null);
  const [fuelFormData, setFuelFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    quantity: '',
    amount: '',
    currency: 'EUR',
    mileage: '',
    location: '',
    note: ''
  });
  const [activeTab, setActiveTab] = useState<'general' | 'sharedExpenses' | 'personalExpenses' | 'fuel' | 'accommodation' | 'service' | 'notes' | 'members'>('general');
  const [isEditMode, setIsEditMode] = useState(true); // true = from edit icon (show only Info & Members), false = from region click (show all except Info & Members)

  useEffect(() => {
    // Set initial tab from query param
    const tab = searchParams.get('tab') as typeof activeTab;
    if (tab) {
      setActiveTab(tab);
      // Detect mode: if tab is 'general', user came from edit icon; otherwise from region click
      setIsEditMode(tab === 'general');
    }
    
    params.then(p => {
      setTripId(p.id);
      loadTrip(p.id);
      if (p.id) {
        loadExpenses(p.id);
        loadMembers(p.id);
        loadFuelEntries(p.id);
      }
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

  const loadExpenses = async (id: string) => {
    try {
      setLoadingExpenses(true);
      const data = await api.getExpenses(parseInt(id));
      setExpenses(data);
    } catch (err) {
      console.error('Failed to load expenses:', err);
    } finally {
      setLoadingExpenses(false);
    }
  };

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

  const loadFuelEntries = async (id: string) => {
    try {
      setLoadingFuel(true);
      const data = await api.getFuelEntries(parseInt(id));
      setFuelEntries(data);
    } catch (err) {
      console.error('Failed to load fuel entries:', err);
    } finally {
      setLoadingFuel(false);
    }
  };

  const handleDeleteExpense = async (expenseId: number) => {
    if (!tripId || !confirm('Da li si siguran da želiš da obrišeš ovaj trošak?')) {
      return;
    }

    try {
      await api.deleteExpense(parseInt(tripId), expenseId);
      setExpenses(expenses.filter(e => e.id !== expenseId));
    } catch (err) {
      alert('Greška pri brisanju troška');
    }
  };

  const handleAddMember = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!tripId || !newMemberEmail.trim()) return;

    try {
      setAddingMember(true);
      await api.addMember(parseInt(tripId), { email: newMemberEmail });
      setNewMemberEmail('');
      await loadMembers(tripId);
    } catch (err) {
      alert('Greška pri dodavanju člana');
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!tripId || !confirm('Da li si siguran da želiš da ukloniš ovog člana?')) {
      return;
    }

    try {
      await api.removeMember(parseInt(tripId), userId);
      setMembers(members.filter(m => m.userId !== userId));
    } catch (err) {
      alert('Greška pri uklanjanju člana');
    }
  };

  const handleFuelFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!tripId) return;

    try {
      const fuelData = {
        date: fuelFormData.date + 'T12:00:00Z',
        quantity: parseFloat(fuelFormData.quantity),
        amount: parseFloat(fuelFormData.amount),
        currency: fuelFormData.currency,
        mileage: parseInt(fuelFormData.mileage),
        location: fuelFormData.location,
        note: fuelFormData.note || undefined
      };

      if (editingFuelId) {
        await api.updateFuelEntry(parseInt(tripId), editingFuelId, fuelData);
      } else {
        await api.createFuelEntry(parseInt(tripId), fuelData);
      }

      setShowFuelForm(false);
      setEditingFuelId(null);
      setFuelFormData({
        date: new Date().toISOString().split('T')[0],
        quantity: '',
        amount: '',
        currency: 'EUR',
        mileage: '',
        location: '',
        note: ''
      });
      await loadFuelEntries(tripId);
    } catch (err) {
      alert('Greška pri čuvanju sipanja goriva');
    }
  };

  const handleEditFuel = (fuel: FuelEntry) => {
    setEditingFuelId(fuel.id);
    setFuelFormData({
      date: fuel.date.split('T')[0],
      quantity: fuel.quantity.toString(),
      amount: fuel.amount.toString(),
      currency: fuel.currency,
      mileage: fuel.mileage.toString(),
      location: fuel.location,
      note: fuel.note || ''
    });
    setShowFuelForm(true);
  };

  const handleDeleteFuel = async (fuelId: number) => {
    if (!tripId || !confirm('Da li si siguran da želiš da obrišeš ovo sipanje?')) {
      return;
    }

    try {
      await api.deleteFuelEntry(parseInt(tripId), fuelId);
      setFuelEntries(fuelEntries.filter(f => f.id !== fuelId));
    } catch (err) {
      alert('Greška pri brisanju sipanja goriva');
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!tripId) return;
    
    setSaving(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    
    const updateData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string || undefined,
      startDate: formData.get('startDate') as string,
      endDate: formData.get('endDate') as string || undefined,
      status: formData.get('status') as Trip['status'],
    };

    try {
      await api.updateTrip(parseInt(tripId), updateData);
      router.push(`/trips`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update trip');
      setSaving(false);
    }
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

  if (!trip) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
              Greška
            </h2>
            <p className="text-red-600 dark:text-red-300">Trip nije pronađen</p>
            <Link
              href="/trips"
              className="mt-4 inline-block text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
            >
              ◀ Nazad na listu
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/trips"
            className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white"
          >
            ◀
          </Link>
          <h1 className="text-lg font-semibold text-black dark:text-white">{trip.name}</h1>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Tab Content */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
          {activeTab === 'general' && (
            <form onSubmit={handleSubmit} className="p-6">
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
                    defaultValue={trip.name}
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
                    defaultValue={trip.description}
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
                    defaultValue={trip.startDate.split('T')[0]}
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
                    defaultValue={trip.endDate ? trip.endDate.split('T')[0] : ''}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                  />
                </div>

                {/* Status */}
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-black dark:text-white mb-2">
                    Status *
                  </label>
                  <select
                    id="status"
                    name="status"
                    required
                    defaultValue={trip.status}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                  >
                    <option value="Planned">Planirano</option>
                    <option value="Active">Aktivno</option>
                    <option value="Completed">Završeno</option>
                    <option value="Cancelled">Otkazano</option>
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-8 flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-md hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Čuvam...' : 'Sačuvaj izmene'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'sharedExpenses' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-black dark:text-white mb-4">Zajednički troškovi</h2>
              
              {loadingExpenses ? (
                <p className="text-zinc-600 dark:text-zinc-400">Učitavam troškove...</p>
              ) : expenses.filter(e => e.isShared).length === 0 ? (
                <p className="text-zinc-600 dark:text-zinc-400">Nema unetih troškova</p>
              ) : (
                <div className="space-y-6">
                  {Object.entries(
                    expenses
                      .filter(e => e.isShared)
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .reduce((groups, expense) => {
                        const date = new Date(expense.date).toLocaleDateString('sr-RS', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        });
                        if (!groups[date]) {
                          groups[date] = [];
                        }
                        groups[date].push(expense);
                        return groups;
                      }, {} as Record<string, typeof expenses>)
                  ).map(([date, groupExpenses]) => (
                    <div key={date}>
                      <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2 px-3">
                        {date}
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <tbody>
                            {groupExpenses.map((expense) => (
                              <tr
                                key={expense.id}
                                className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors"
                                onClick={() => router.push(`/trips/${tripId}/expenses/${expense.id}/edit`)}
                              >
                                <td className="py-3 px-3 text-black dark:text-white">{expense.description || expense.category}</td>
                                <td className="py-3 px-3 text-right text-black dark:text-white">{expense.amount.toFixed(2)}</td>
                                <td className="py-3 px-3 text-center text-black dark:text-white">{expense.currency}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'personalExpenses' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-black dark:text-white mb-4">Sopstveni troškovi</h2>
              
              {loadingExpenses ? (
                <p className="text-zinc-600 dark:text-zinc-400">Učitavam troškove...</p>
              ) : expenses.filter(e => !e.isShared).length === 0 ? (
                <p className="text-zinc-600 dark:text-zinc-400">Nema unetih troškova</p>
              ) : (
                <div className="space-y-6">
                  {Object.entries(
                    expenses
                      .filter(e => !e.isShared)
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .reduce((groups, expense) => {
                        const date = new Date(expense.date).toLocaleDateString('sr-RS', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        });
                        if (!groups[date]) {
                          groups[date] = [];
                        }
                        groups[date].push(expense);
                        return groups;
                      }, {} as Record<string, typeof expenses>)
                  ).map(([date, groupExpenses]) => (
                    <div key={date}>
                      <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2 px-3">
                        {date}
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <tbody>
                            {groupExpenses.map((expense) => (
                              <tr
                                key={expense.id}
                                className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors"
                                onClick={() => router.push(`/trips/${tripId}/expenses/${expense.id}/edit`)}
                              >
                                <td className="py-3 px-3 text-black dark:text-white">{expense.description || expense.category}</td>
                                <td className="py-3 px-3 text-right text-black dark:text-white">{expense.amount.toFixed(2)}</td>
                                <td className="py-3 px-3 text-center text-black dark:text-white">{expense.currency}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'fuel' && (
            <div className="p-6 relative">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-black dark:text-white">Gorivo</h2>
              </div>

              {showFuelForm && (
                <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 border border-zinc-200 dark:border-zinc-700">
                  <div className="flex items-center gap-3 mb-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowFuelForm(false);
                        setEditingFuelId(null);
                      }}
                      className="text-black dark:text-white hover:opacity-70 transition-opacity text-2xl"
                    >
                      ◀
                    </button>
                    <h3 className="text-lg font-semibold text-black dark:text-white">
                      {editingFuelId ? 'Uredi sipanje' : 'Novo sipanje'}
                    </h3>
                  </div>
                  <form onSubmit={handleFuelFormSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                          Datum
                        </label>
                        <input
                          type="date"
                          value={fuelFormData.date}
                          onChange={(e) => setFuelFormData({...fuelFormData, date: e.target.value})}
                          required
                          className="w-full px-4 py-2 bg-white dark:bg-zinc-900 text-black dark:text-white border border-zinc-300 dark:border-zinc-700 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                          Količina (L)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={fuelFormData.quantity}
                          onChange={(e) => setFuelFormData({...fuelFormData, quantity: e.target.value})}
                          required
                          className="w-full px-4 py-2 bg-white dark:bg-zinc-900 text-black dark:text-white border border-zinc-300 dark:border-zinc-700 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                          Iznos
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={fuelFormData.amount}
                          onChange={(e) => setFuelFormData({...fuelFormData, amount: e.target.value})}
                          required
                          className="w-full px-4 py-2 bg-white dark:bg-zinc-900 text-black dark:text-white border border-zinc-300 dark:border-zinc-700 rounded-lg"
                        />
                        {fuelFormData.quantity && fuelFormData.amount && (
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                            Cena po litri: {(parseFloat(fuelFormData.amount) / parseFloat(fuelFormData.quantity)).toFixed(2)}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                          Valuta
                        </label>
                        <select
                          value={fuelFormData.currency}
                          onChange={(e) => setFuelFormData({...fuelFormData, currency: e.target.value})}
                          required
                          className="w-full px-4 py-2 bg-white dark:bg-zinc-900 text-black dark:text-white border border-zinc-300 dark:border-zinc-700 rounded-lg"
                        >
                          <option value="EUR">EUR</option>
                          <option value="RSD">RSD</option>
                          <option value="USD">USD</option>
                          <option value="BAM">BAM</option>
                          <option value="HRK">HRK</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                          Kilometraža
                        </label>
                        <input
                          type="number"
                          value={fuelFormData.mileage}
                          onChange={(e) => setFuelFormData({...fuelFormData, mileage: e.target.value})}
                          required
                          className="w-full px-4 py-2 bg-white dark:bg-zinc-900 text-black dark:text-white border border-zinc-300 dark:border-zinc-700 rounded-lg"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                          Lokacija
                        </label>
                        <input
                          type="text"
                          value={fuelFormData.location}
                          onChange={(e) => setFuelFormData({...fuelFormData, location: e.target.value})}
                          required
                          placeholder="Npr. NIS Petrol, Beograd"
                          className="w-full px-4 py-2 bg-white dark:bg-zinc-900 text-black dark:text-white border border-zinc-300 dark:border-zinc-700 rounded-lg"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                          Napomena (opciono)
                        </label>
                        <textarea
                          value={fuelFormData.note}
                          onChange={(e) => setFuelFormData({...fuelFormData, note: e.target.value})}
                          rows={2}
                          className="w-full px-4 py-2 bg-white dark:bg-zinc-900 text-black dark:text-white border border-zinc-300 dark:border-zinc-700 rounded-lg"
                        />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        {editingFuelId ? 'Sačuvaj izmene' : 'Dodaj sipanje'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowFuelForm(false);
                          setEditingFuelId(null);
                        }}
                        className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 text-black dark:text-white rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
                      >
                        Otkaži
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {!showFuelForm && (loadingFuel ? (
                <div className="flex justify-center items-center py-12">
                  <div className="text-zinc-600 dark:text-zinc-400">Učitavanje...</div>
                </div>
              ) : fuelEntries.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-zinc-600 dark:text-zinc-400">Još nema sipanja goriva</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-2">
                    Klikni "Dodaj sipanje" da uneseš prvo sipanje
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-700">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Datum</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Lokacija</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Količina</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Iznos</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Cena/L</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Kilometraža</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {fuelEntries.map((fuel) => (
                        <tr 
                          key={fuel.id} 
                          onClick={() => handleEditFuel(fuel)}
                          className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer"
                        >
                          <td className="py-3 px-4 text-sm text-black dark:text-white">
                            {new Date(fuel.date).toLocaleDateString('sr-RS')}
                          </td>
                          <td className="py-3 px-4 text-sm text-black dark:text-white">
                            {fuel.location}
                            {fuel.note && (
                              <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{fuel.note}</div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm text-right text-black dark:text-white">
                            {fuel.quantity.toFixed(2)} L
                          </td>
                          <td className="py-3 px-4 text-sm text-right text-black dark:text-white">
                            {fuel.amount.toFixed(2)} {fuel.currency}
                          </td>
                          <td className="py-3 px-4 text-sm text-right text-black dark:text-white">
                            {fuel.unitPrice.toFixed(2)} {fuel.currency}
                          </td>
                          <td className="py-3 px-4 text-sm text-right text-black dark:text-white">
                            {fuel.mileage.toLocaleString()} km
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteFuel(fuel.id);
                              }}
                              className="p-2 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                              title="Obriši"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}

              {/* Floating Action Button */}
              <button
                onClick={() => {
                  setEditingFuelId(null);
                  setFuelFormData({
                    date: new Date().toISOString().split('T')[0],
                    quantity: '',
                    amount: '',
                    currency: 'EUR',
                    mileage: '',
                    location: '',
                    note: ''
                  });
                  setShowFuelForm(true);
                }}
                className="fixed bottom-8 right-8 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-110 flex items-center justify-center z-10"
                title="Dodaj sipanje"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          )}

          {activeTab === 'accommodation' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-black dark:text-white mb-4">Smeštaj</h2>
              <p className="text-zinc-600 dark:text-zinc-400">Funkcionalnost smeštaja u izradi...</p>
            </div>
          )}

          {activeTab === 'service' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-black dark:text-white mb-4">Servis</h2>
              <p className="text-zinc-600 dark:text-zinc-400">Funkcionalnost servisa u izradi...</p>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-black dark:text-white mb-4">Beleške</h2>
              <p className="text-zinc-600 dark:text-zinc-400">Funkcionalnost beleški u izradi...</p>
            </div>
          )}

          {activeTab === 'members' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-black dark:text-white mb-4">Članovi</h2>
              
              {/* Add Member Form */}
              <form onSubmit={handleAddMember} className="mb-6 bg-zinc-50 dark:bg-zinc-800 p-4 rounded-lg">
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Dodaj člana
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    placeholder="Email adresa"
                    required
                    className="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-black dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                  />
                  <button
                    type="submit"
                    disabled={addingMember}
                    className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-md hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50"
                  >
                    {addingMember ? 'Dodajem...' : 'Dodaj'}
                  </button>
                </div>
              </form>

              {/* Members List */}
              {loadingMembers ? (
                <p className="text-zinc-600 dark:text-zinc-400">Učitavam članove...</p>
              ) : members.length === 0 ? (
                <p className="text-zinc-600 dark:text-zinc-400">Nema članova na ovom tripu</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-800">
                        <th className="text-left py-3 px-3 text-black dark:text-white font-medium">Ime</th>
                        <th className="text-left py-3 px-3 text-black dark:text-white font-medium">Uloga</th>
                        <th className="text-left py-3 px-3 text-black dark:text-white font-medium">Pridružen</th>
                        <th className="text-right py-3 px-3 text-black dark:text-white font-medium">Akcije</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((member) => (
                        <tr
                          key={member.userId}
                          className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                        >
                          <td className="py-3 px-3 text-black dark:text-white">{member.displayName}</td>
                          <td className="py-3 px-3 text-zinc-600 dark:text-zinc-400">
                            {member.role === 'Owner' ? 'Vlasnik' : member.role === 'Editor' ? 'Urednik' : 'Gledaoc'}
                          </td>
                          <td className="py-3 px-3 text-zinc-600 dark:text-zinc-400">
                            {new Date(member.joinedAt).toLocaleDateString('sr-RS')}
                          </td>
                          <td className="py-3 px-3 text-right">
                            {member.role !== 'Owner' && (
                              <button
                                onClick={() => handleRemoveMember(member.userId)}
                                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
                              >
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6"/>
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                  <line x1="10" y1="11" x2="10" y2="17"/>
                                  <line x1="14" y1="11" x2="14" y2="17"/>
                                </svg>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Fixed Bottom Tab Menu */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 shadow-lg">
        <div className="max-w-4xl mx-auto px-2">
          <div className="flex overflow-x-auto">
            {/* Info tab - visible only in edit mode (from edit icon) */}
            {isEditMode && (
              <button
                onClick={() => setActiveTab('general')}
                title="Opšti podaci"
                className={`flex-1 py-4 px-3 transition-colors border-b-2 ${
                  activeTab === 'general'
                    ? 'border-black dark:border-white text-black dark:text-white'
                    : 'border-transparent text-zinc-400 dark:text-zinc-600 hover:text-black dark:hover:text-white'
                }`}
              >
                <svg className="w-6 h-6 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
              </button>
            )}
            {/* Expense tabs - visible only in view mode (from region click) */}
            {!isEditMode && (
              <>
                <button
                  onClick={() => setActiveTab('sharedExpenses')}
                  title="Zajednički troškovi"
                  className={`flex-1 py-4 px-3 transition-colors border-b-2 ${
                    activeTab === 'sharedExpenses'
                      ? 'border-black dark:border-white text-black dark:text-white'
                      : 'border-transparent text-zinc-400 dark:text-zinc-600 hover:text-black dark:hover:text-white'
                  }`}
                >
                  <svg className="w-6 h-6 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </button>
                <button
                  onClick={() => setActiveTab('personalExpenses')}
                  title="Sopstveni troškovi"
                  className={`flex-1 py-4 px-3 transition-colors border-b-2 ${
                    activeTab === 'personalExpenses'
                      ? 'border-black dark:border-white text-black dark:text-white'
                      : 'border-transparent text-zinc-400 dark:text-zinc-600 hover:text-black dark:hover:text-white'
                  }`}
                >
                  <svg className="w-6 h-6 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </button>
                <button
                  onClick={() => setActiveTab('fuel')}
                  title="Gorivo"
                  className={`flex-1 py-4 px-3 transition-colors border-b-2 ${
                    activeTab === 'fuel'
                      ? 'border-black dark:border-white text-black dark:text-white'
                      : 'border-transparent text-zinc-400 dark:text-zinc-600 hover:text-black dark:hover:text-white'
                  }`}
                >
                  <svg className="w-6 h-6 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 2h10v18H3z"/>
                    <path d="M13 6h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-1"/>
                    <path d="M17 10h3"/>
                    <path d="M21 8v6"/>
                  </svg>
                </button>
                <button
                  onClick={() => setActiveTab('accommodation')}
                  title="Smeštaj"
                  className={`flex-1 py-4 px-3 transition-colors border-b-2 ${
                    activeTab === 'accommodation'
                      ? 'border-black dark:border-white text-black dark:text-white'
                      : 'border-transparent text-zinc-400 dark:text-zinc-600 hover:text-black dark:hover:text-white'
                  }`}
                >
                  <svg className="w-6 h-6 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                </button>
                <button
                  onClick={() => setActiveTab('service')}
                  title="Servis"
                  className={`flex-1 py-4 px-3 transition-colors border-b-2 ${
                    activeTab === 'service'
                      ? 'border-black dark:border-white text-black dark:text-white'
                      : 'border-transparent text-zinc-400 dark:text-zinc-600 hover:text-black dark:hover:text-white'
                  }`}
                >
                  <svg className="w-6 h-6 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                  </svg>
                </button>
                <button
                  onClick={() => setActiveTab('notes')}
                  title="Beleške"
                  className={`flex-1 py-4 px-3 transition-colors border-b-2 ${
                    activeTab === 'notes'
                      ? 'border-black dark:border-white text-black dark:text-white'
                      : 'border-transparent text-zinc-400 dark:text-zinc-600 hover:text-black dark:hover:text-white'
                  }`}
                >
                  <svg className="w-6 h-6 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <line x1="10" y1="9" x2="8" y2="9"/>
                  </svg>
                </button>
              </>
            )}
            {/* Members tab - visible only in edit mode (from edit icon) */}
            {isEditMode && (
              <button
                onClick={() => setActiveTab('members')}
                title="Članovi"
                className={`flex-1 py-4 px-3 transition-colors border-b-2 ${
                  activeTab === 'members'
                    ? 'border-black dark:border-white text-black dark:text-white'
                    : 'border-transparent text-zinc-400 dark:text-zinc-600 hover:text-black dark:hover:text-white'
                }`}
              >
                <svg className="w-6 h-6 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Floating Add Button - visible only on expense tabs */}
        {(activeTab === 'sharedExpenses' || activeTab === 'personalExpenses') && tripId && (
          <button
            onClick={() => {
              const isShared = activeTab === 'sharedExpenses';
              router.push(`/trips/${tripId}/expenses/new?isShared=${isShared}`);
            }}
            className="fixed bottom-24 right-8 w-14 h-14 bg-black dark:bg-white text-white dark:text-black rounded-full shadow-lg hover:scale-110 transition-transform flex items-center justify-center text-2xl font-light"
          >
            +
          </button>
        )}
      </div>
    </div>
  );
}
