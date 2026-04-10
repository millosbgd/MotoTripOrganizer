'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, Trip, TripMember, EquipmentCatalogItem, TripEquipmentEntry } from '@/lib/api';

type Tab = 'info' | 'equipment';

export default function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [tripId, setTripId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('info');

  // Equipment state
  const [members, setMembers] = useState<TripMember[]>([]);
  const [equipmentEntries, setEquipmentEntries] = useState<TripEquipmentEntry[]>([]);
  const [equipmentCatalog, setEquipmentCatalog] = useState<EquipmentCatalogItem[]>([]);
  const [equipmentLoading, setEquipmentLoading] = useState(false);
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TripEquipmentEntry | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    params.then(p => {
      setTripId(p.id);
      loadTrip(p.id);
    });
  }, []);

  useEffect(() => {
    if (activeTab === 'equipment' && tripId) {
      loadEquipmentData(tripId);
    }
  }, [activeTab, tripId]);

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

  const loadEquipmentData = async (id: string) => {
    setEquipmentLoading(true);
    try {
      const [entries, catalog, memberList] = await Promise.all([
        api.getEquipmentEntries(parseInt(id)),
        api.getEquipmentCatalog(),
        api.getMembers(parseInt(id)),
      ]);
      setEquipmentEntries(entries);
      setEquipmentCatalog(catalog);
      setMembers(memberList);
    } catch (err) {
      console.error('Failed to load equipment data:', err);
    } finally {
      setEquipmentLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!tripId || !confirm('Da li si siguran da želiš da obrišeš ovaj trip?')) return;
    try {
      setDeleting(true);
      await api.deleteTrip(parseInt(tripId));
      router.push('/trips');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete trip');
      setDeleting(false);
    }
  };

  const handleSaveEquipmentEntry = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!tripId) return;
    const formData = new FormData(e.currentTarget);
    const payload = {
      equipmentCatalogItemId: parseInt(formData.get('equipmentCatalogItemId') as string),
      carriedByUserId: parseInt(formData.get('carriedByUserId') as string),
      quantity: parseInt(formData.get('quantity') as string) || 1,
      note: (formData.get('note') as string) || undefined,
    };

    setSaving(true);
    try {
      if (editingEntry) {
        await api.updateEquipmentEntry(parseInt(tripId), editingEntry.id, payload);
      } else {
        await api.createEquipmentEntry(parseInt(tripId), payload);
      }
      setShowEquipmentModal(false);
      setEditingEntry(null);
      loadEquipmentData(tripId);
    } catch (err) {
      console.error('Failed to save equipment entry:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEquipmentEntry = async (entryId: number) => {
    if (!tripId || !confirm('Obrisati ovaj unos?')) return;
    try {
      await api.deleteEquipmentEntry(parseInt(tripId), entryId);
      loadEquipmentData(tripId);
    } catch (err) {
      console.error('Failed to delete equipment entry:', err);
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
      day: 'numeric', month: 'long', year: 'numeric',
    });
  };

  // Grupišemo katalog po kategoriji za <optgroup>
  const catalogByCategory = equipmentCatalog.reduce<Record<string, EquipmentCatalogItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  // Grupišemo unose po kategoriji za prikaz
  const entriesByCategory = equipmentEntries.reduce<Record<string, TripEquipmentEntry[]>>((acc, e) => {
    if (!acc[e.equipmentCategory]) acc[e.equipmentCategory] = [];
    acc[e.equipmentCategory].push(e);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
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
            <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">Greška</h2>
            <p className="text-red-600 dark:text-red-300">{error || 'Trip nije pronađen'}</p>
            <Link href="/trips" className="mt-4 inline-block text-sm text-red-600 dark:text-red-400 hover:text-red-800">
              ◀ Nazad na listu
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
          <Link href="/trips" className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white mb-4 inline-block">
            ◀ Nazad na listu
          </Link>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-black dark:text-white">{trip.name}</h1>
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

        {/* Tab navigacija */}
        <div className="border-b border-zinc-200 dark:border-zinc-800 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('info')}
              className={`py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                activeTab === 'info'
                  ? 'border-black dark:border-white text-black dark:text-white'
                  : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:border-zinc-300'
              }`}
            >
              📋 Info
            </button>
            <button
              onClick={() => setActiveTab('equipment')}
              className={`py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                activeTab === 'equipment'
                  ? 'border-black dark:border-white text-black dark:text-white'
                  : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:border-zinc-300'
              }`}
            >
              🎒 Oprema
            </button>
          </nav>
        </div>

        {/* ── TAB: INFO ── */}
        {activeTab === 'info' && (
          <div className="space-y-6">
            {trip.description && (
              <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
                <h2 className="text-lg font-semibold text-black dark:text-white mb-3">Opis</h2>
                <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{trip.description}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
                <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Datum kreiranja</div>
                <div className="text-lg font-semibold text-black dark:text-white">{formatDate(trip.createdAt)}</div>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
                <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Poslednja izmena</div>
                <div className="text-lg font-semibold text-black dark:text-white">{formatDate(trip.updatedAt)}</div>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
                <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Status</div>
                <div className="text-lg font-semibold text-black dark:text-white">{trip.status}</div>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
              <div className="text-center py-8">
                <p className="text-zinc-600 dark:text-zinc-400">🚧 Etape, stavke i troškovi dolaze uskoro...</p>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: OPREMA ── */}
        {activeTab === 'equipment' && (
          <div>
            <div className="flex justify-end mb-4">
              <button
                onClick={() => { setEditingEntry(null); setShowEquipmentModal(true); }}
                className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-md hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors text-sm"
              >
                + Dodaj opremu
              </button>
            </div>

            {equipmentLoading ? (
              <div className="flex justify-center items-center h-32">
                <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
              </div>
            ) : equipmentEntries.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-12 text-center">
                <div className="text-5xl mb-4">🎒</div>
                <h3 className="text-lg font-semibold text-black dark:text-white mb-2">Nema unesene opreme</h3>
                <p className="text-zinc-600 dark:text-zinc-400 mb-6">Dodajte opremu koju članovi grupe nose na putu</p>
                <button
                  onClick={() => { setEditingEntry(null); setShowEquipmentModal(true); }}
                  className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-md hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors text-sm"
                >
                  Dodaj prvu stavku
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(entriesByCategory).sort(([a], [b]) => a.localeCompare(b)).map(([category, entries]) => (
                  <div key={category}>
                    <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
                      {category}
                    </h3>
                    <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800">
                      {entries.map((entry) => (
                        <div key={entry.id} className="flex items-center justify-between px-5 py-4">
                          <div>
                            <span className="font-medium text-black dark:text-white">
                              {entry.equipmentName}
                            </span>
                            {entry.quantity > 1 && (
                              <span className="ml-2 text-sm text-zinc-500">× {entry.quantity}</span>
                            )}
                            <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                              👤 {entry.carriedByDisplayName}
                            </div>
                            {entry.note && (
                              <div className="text-xs text-zinc-400 mt-0.5 italic">{entry.note}</div>
                            )}
                          </div>
                          <div className="flex gap-3 ml-4 flex-shrink-0">
                            <button
                              onClick={() => { setEditingEntry(entry); setShowEquipmentModal(true); }}
                              className="text-sm text-zinc-500 hover:text-black dark:hover:text-white transition-colors"
                            >
                              Izmeni
                            </button>
                            <button
                              onClick={() => handleDeleteEquipmentEntry(entry.id)}
                              className="text-sm text-red-500 hover:text-red-700 transition-colors"
                            >
                              Obriši
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal: Dodaj/Izmeni opremu */}
      {showEquipmentModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 max-w-md w-full p-6 shadow-xl">
            <h2 className="text-xl font-bold text-black dark:text-white mb-5">
              {editingEntry ? 'Izmeni opremu' : 'Dodaj opremu'}
            </h2>
            <form onSubmit={handleSaveEquipmentEntry} className="space-y-4">

              {/* Oprema iz šifarnika */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Oprema *
                </label>
                <select
                  name="equipmentCatalogItemId"
                  required
                  defaultValue={editingEntry?.equipmentCatalogItemId ?? ''}
                  className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-black dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                >
                  <option value="" disabled>— Izaberite opremu —</option>
                  {Object.entries(catalogByCategory).sort(([a], [b]) => a.localeCompare(b)).map(([cat, items]) => (
                    <optgroup key={cat} label={cat}>
                      {items.map((item) => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Ko nosi */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Ko nosi *
                </label>
                <select
                  name="carriedByUserId"
                  required
                  defaultValue={editingEntry?.carriedByUserId ?? ''}
                  className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-black dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                >
                  <option value="" disabled>— Izaberite člana —</option>
                  {members.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.displayName}{m.isCurrentUser ? ' (ja)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Količina */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Količina
                </label>
                <input
                  type="number"
                  name="quantity"
                  min={1}
                  defaultValue={editingEntry?.quantity ?? 1}
                  className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-black dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                />
              </div>

              {/* Napomena */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Napomena
                </label>
                <input
                  type="text"
                  name="note"
                  defaultValue={editingEntry?.note ?? ''}
                  placeholder="Opciona napomena"
                  className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-black dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-md hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors text-sm disabled:opacity-50"
                >
                  {saving ? 'Čuvam...' : editingEntry ? 'Sačuvaj izmene' : 'Dodaj'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowEquipmentModal(false); setEditingEntry(null); }}
                  className="flex-1 px-4 py-2 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-sm"
                >
                  Otkaži
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
