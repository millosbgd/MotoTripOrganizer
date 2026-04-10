'use client';

import { useState, useEffect, FormEvent, ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api, Trip, Expense, TripMember, FuelEntry, AccommodationEntry, ServiceEntry, NoteEntry, EmergencyInfo, UpsertEmergencyInfoDto, EquipmentCatalogItem, TripEquipmentEntry, CreateTripEquipmentEntryDto, UpdateTripEquipmentEntryDto } from '@/lib/api';

export default function EditTripPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [members, setMembers] = useState<TripMember[]>([]);
  const [fuelEntries, setFuelEntries] = useState<FuelEntry[]>([]);
  const [accommodationEntries, setAccommodationEntries] = useState<AccommodationEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [loadingFuel, setLoadingFuel] = useState(false);
  const [loadingAccommodation, setLoadingAccommodation] = useState(false);
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
    note: '',
    isFull: false
  });
  const [showAccommodationForm, setShowAccommodationForm] = useState(false);
  const [editingAccommodationId, setEditingAccommodationId] = useState<number | null>(null);
  const [accommodationFormData, setAccommodationFormData] = useState({
    name: '',
    accommodationType: 'Hotel',
    checkInDate: new Date().toISOString().split('T')[0],
    checkOutDate: new Date().toISOString().split('T')[0],
    amount: '',
    currency: 'EUR',
    location: '',
    note: '',
    paymentDueDate: ''
  });

  // Service state
  const [serviceEntries, setServiceEntries] = useState<ServiceEntry[]>([]);
  const [loadingService, setLoadingService] = useState(false);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<number | null>(null);
  const [serviceFormData, setServiceFormData] = useState({
    serviceType: 'Podmazivanje lanca',
    description: '',
    serviceDate: new Date().toISOString().split('T')[0],
    amount: '',
    currency: 'EUR',
    location: '',
    mileage: '',
    note: ''
  });

  // Note state
  const [noteEntries, setNoteEntries] = useState<NoteEntry[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [noteFormData, setNoteFormData] = useState({
    content: '',
    isPublic: false
  });

  // Balance calculation state
  const [showBalancePanel, setShowBalancePanel] = useState(false);

  // Fuel statistics state
  const [showFuelStats, setShowFuelStats] = useState(false);

  // Emergency info state
  const [emergencyInfos, setEmergencyInfos] = useState<EmergencyInfo[]>([]);
  const [loadingEmergency, setLoadingEmergency] = useState(false);
  const [savingEmergency, setSavingEmergency] = useState(false);
  const [emergencyFormData, setEmergencyFormData] = useState<UpsertEmergencyInfoDto>({
    emergencyContactName: '',
    emergencyContactPhone: '',
    bloodType: '',
    healthInsurancePolicyNumber: ''
  });
  const [emergencyFormLoaded, setEmergencyFormLoaded] = useState(false);

  const [activeTab, setActiveTab] = useState<'general' | 'sharedExpenses' | 'personalExpenses' | 'fuel' | 'accommodation' | 'service' | 'notes' | 'members' | 'emergency' | 'equipment'>('general');

  // Equipment state
  const [equipmentEntries, setEquipmentEntries] = useState<TripEquipmentEntry[]>([]);
  const [equipmentCatalog, setEquipmentCatalog] = useState<EquipmentCatalogItem[]>([]);
  const [loadingEquipment, setLoadingEquipment] = useState(false);
  const [showEquipmentForm, setShowEquipmentForm] = useState(false);
  const [editingEquipmentEntry, setEditingEquipmentEntry] = useState<TripEquipmentEntry | null>(null);
  const [equipmentFormData, setEquipmentFormData] = useState<{ equipmentCatalogItemId: string; carriedByUserId: string; quantity: string; note: string }>({
    equipmentCatalogItemId: '',
    carriedByUserId: '',
    quantity: '1',
    note: '',
  });
  const [savingEquipment, setSavingEquipment] = useState(false);
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
        loadAccommodationEntries(p.id);
        loadServiceEntries(p.id);
        loadNoteEntries(p.id);
        loadEmergencyInfos(p.id);
        loadEquipmentData(p.id);
      }
    });
  }, []);

  // Reload tab data whenever the active tab changes
  useEffect(() => {
    if (!tripId) return;
    switch (activeTab) {
      case 'sharedExpenses':
      case 'personalExpenses':
        loadExpenses(tripId);
        break;
      case 'fuel':
        loadFuelEntries(tripId);
        break;
      case 'accommodation':
        loadAccommodationEntries(tripId);
        break;
      case 'service':
        loadServiceEntries(tripId);
        break;
      case 'notes':
        loadNoteEntries(tripId);
        break;
      case 'emergency':
        loadEmergencyInfos(tripId);
        break;
      case 'equipment':
        loadEquipmentData(tripId);
        break;
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

  const loadAccommodationEntries = async (id: string) => {
    try {
      setLoadingAccommodation(true);
      const data = await api.getAccommodationEntries(parseInt(id));
      setAccommodationEntries(data);
    } catch (err) {
      console.error('Failed to load accommodation entries:', err);
    } finally {
      setLoadingAccommodation(false);
    }
  };

  const loadServiceEntries = async (id: string) => {
    try {
      setLoadingService(true);
      const data = await api.getServiceEntries(parseInt(id));
      setServiceEntries(data);
    } catch (err) {
      console.error('Failed to load service entries:', err);
    } finally {
      setLoadingService(false);
    }
  };

  const loadNoteEntries = async (id: string) => {
    try {
      setLoadingNotes(true);
      const data = await api.getNoteEntries(parseInt(id));
      setNoteEntries(data);
    } catch (err) {
      console.error('Failed to load note entries:', err);
    } finally {
      setLoadingNotes(false);
    }
  };

  const loadEmergencyInfos = async (id: string) => {
    try {
      setLoadingEmergency(true);
      const data = await api.getEmergencyInfo(parseInt(id));
      setEmergencyInfos(data);
      // Pre-fill form with current user's data
      const mine = data.find(e => e.isCurrentUser);
      if (mine) {
        setEmergencyFormData({
          emergencyContactName: mine.emergencyContactName ?? '',
          emergencyContactPhone: mine.emergencyContactPhone ?? '',
          bloodType: mine.bloodType ?? '',
          healthInsurancePolicyNumber: mine.healthInsurancePolicyNumber ?? ''
        });
      }
      setEmergencyFormLoaded(true);
    } catch (err) {
      console.error('Failed to load emergency info:', err);
      setEmergencyFormLoaded(true);
    } finally {
      setLoadingEmergency(false);
    }
  };

  const loadEquipmentData = async (id: string) => {
    try {
      setLoadingEquipment(true);
      const [entries, catalog] = await Promise.all([
        api.getEquipmentEntries(parseInt(id)),
        api.getEquipmentCatalog(),
      ]);
      setEquipmentEntries(entries);
      setEquipmentCatalog(catalog);
    } catch (err) {
      console.error('Failed to load equipment data:', err);
    } finally {
      setLoadingEquipment(false);
    }
  };

  const handleEquipmentSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!tripId) return;
    setSavingEquipment(true);
    try {
      const payload = {
        equipmentCatalogItemId: parseInt(equipmentFormData.equipmentCatalogItemId),
        carriedByUserId: parseInt(equipmentFormData.carriedByUserId),
        quantity: parseInt(equipmentFormData.quantity) || 1,
        note: equipmentFormData.note || undefined,
      };
      if (editingEquipmentEntry) {
        await api.updateEquipmentEntry(parseInt(tripId), editingEquipmentEntry.id, payload);
      } else {
        await api.createEquipmentEntry(parseInt(tripId), payload);
      }
      setShowEquipmentForm(false);
      setEditingEquipmentEntry(null);
      setEquipmentFormData({ equipmentCatalogItemId: '', carriedByUserId: '', quantity: '1', note: '' });
      loadEquipmentData(tripId);
    } catch (err) {
      console.error('Failed to save equipment entry:', err);
    } finally {
      setSavingEquipment(false);
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

  const openEquipmentEdit = (entry: TripEquipmentEntry) => {
    setEditingEquipmentEntry(entry);
    setEquipmentFormData({
      equipmentCatalogItemId: String(entry.equipmentCatalogItemId),
      carriedByUserId: String(entry.carriedByUserId),
      quantity: String(entry.quantity),
      note: entry.note ?? '',
    });
    setShowEquipmentForm(true);
  };

  const handleEmergencySubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!tripId) return;
    try {
      setSavingEmergency(true);
      const saved = await api.upsertMyEmergencyInfo(parseInt(tripId), emergencyFormData);
      setEmergencyInfos(prev => {
        const idx = prev.findIndex(x => x.isCurrentUser);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = saved;
          return updated;
        }
        return [...prev, saved];
      });
    } catch (err) {
      alert('Greška pri čuvanju hitnih podataka');
    } finally {
      setSavingEmergency(false);
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
        note: fuelFormData.note || undefined,
        isFull: fuelFormData.isFull
      };

      if (editingFuelId) {
        await api.updateFuelEntry(parseInt(tripId), editingFuelId, fuelData);
      } else {
        await api.createFuelEntry(parseInt(tripId), fuelData);
        const wantsExpense = window.confirm('Da li želite da unesete trošak za ovo sipanje goriva?');
        if (wantsExpense) {
          const currentUser = members.find(m => m.isCurrentUser);
          if (currentUser) {
            await api.createExpense(parseInt(tripId), {
              date: fuelFormData.date,
              category: 'Gorivo',
              description: fuelFormData.location ? `Gorivo - ${fuelFormData.location}` : 'Gorivo',
              amount: parseFloat(fuelFormData.amount),
              currency: fuelFormData.currency,
              isShared: false,
              paidByUserId: currentUser.userId,
            });
          }
        }
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
        note: '',
        isFull: false
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
      note: fuel.note || '',
      isFull: fuel.isFull || false
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

  const handleAccommodationFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!tripId) return;

    try {
      const accommodationData = {
        name: accommodationFormData.name,
        accommodationType: accommodationFormData.accommodationType,
        checkInDate: accommodationFormData.checkInDate + 'T12:00:00Z',
        checkOutDate: accommodationFormData.checkOutDate + 'T12:00:00Z',
        amount: parseFloat(accommodationFormData.amount),
        currency: accommodationFormData.currency,
        location: accommodationFormData.location,
        note: accommodationFormData.note || undefined,
        paymentDueDate: accommodationFormData.paymentDueDate ? accommodationFormData.paymentDueDate + 'T12:00:00Z' : undefined
      };

      if (editingAccommodationId) {
        await api.updateAccommodationEntry(parseInt(tripId), editingAccommodationId, accommodationData);
      } else {
        await api.createAccommodationEntry(parseInt(tripId), accommodationData);
      }

      setShowAccommodationForm(false);
      setEditingAccommodationId(null);
      setAccommodationFormData({
        name: '',
        accommodationType: 'Hotel',
        checkInDate: new Date().toISOString().split('T')[0],
        checkOutDate: new Date().toISOString().split('T')[0],
        amount: '',
        currency: 'EUR',
        location: '',
        note: '',
        paymentDueDate: ''
      });
      await loadAccommodationEntries(tripId);
    } catch (err) {
      alert('Greška pri čuvanju smeštaja');
    }
  };

  const handleEditAccommodation = (accommodation: AccommodationEntry) => {
    setEditingAccommodationId(accommodation.id);
    setAccommodationFormData({
      name: accommodation.name,
      accommodationType: accommodation.accommodationType,
      checkInDate: accommodation.checkInDate.split('T')[0],
      checkOutDate: accommodation.checkOutDate.split('T')[0],
      amount: accommodation.amount.toString(),
      currency: accommodation.currency,
      location: accommodation.location,
      note: accommodation.note || '',
      paymentDueDate: accommodation.paymentDueDate ? accommodation.paymentDueDate.split('T')[0] : ''
    });
    setShowAccommodationForm(true);
  };

  const handleDeleteAccommodation = async (accommodationId: number) => {
    if (!tripId || !confirm('Da li si siguran da želiš da obrišeš ovaj smeštaj?')) {
      return;
    }

    try {
      await api.deleteAccommodationEntry(parseInt(tripId), accommodationId);
      setAccommodationEntries(accommodationEntries.filter(a => a.id !== accommodationId));
    } catch (err) {
      alert('Greška pri brisanju smeštaja');
    }
  };

  const handleServiceFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!tripId) return;

    try {
      const serviceData = {
        serviceType: serviceFormData.serviceType,
        description: serviceFormData.description,
        serviceDate: serviceFormData.serviceDate + 'T12:00:00Z',
        amount: parseFloat(serviceFormData.amount),
        currency: serviceFormData.currency,
        location: serviceFormData.location,
        mileage: serviceFormData.mileage ? parseInt(serviceFormData.mileage) : undefined,
        note: serviceFormData.note || undefined
      };

      if (editingServiceId) {
        await api.updateServiceEntry(parseInt(tripId), editingServiceId, serviceData);
      } else {
        await api.createServiceEntry(parseInt(tripId), serviceData);
      }

      await loadServiceEntries(tripId);
      setShowServiceForm(false);
      setEditingServiceId(null);
      setServiceFormData({
        serviceType: 'Podmazivanje lanca',
        description: '',
        serviceDate: new Date().toISOString().split('T')[0],
        amount: '',
        currency: 'EUR',
        location: '',
        mileage: '',
        note: ''
      });
    } catch (err) {
      alert('Greška pri čuvanju servisa');
    }
  };

  const handleEditService = (service: ServiceEntry) => {
    setEditingServiceId(service.id);
    setServiceFormData({
      serviceType: service.serviceType,
      description: service.description,
      serviceDate: service.serviceDate.split('T')[0],
      amount: service.amount.toString(),
      currency: service.currency,
      location: service.location,
      mileage: service.mileage?.toString() || '',
      note: service.note || ''
    });
    setShowServiceForm(true);
  };

  const handleDeleteService = async (serviceId: number) => {
    if (!tripId || !confirm('Da li si siguran da želiš da obrišeš ovaj servis?')) {
      return;
    }

    try {
      await api.deleteServiceEntry(parseInt(tripId), serviceId);
      setServiceEntries(serviceEntries.filter(s => s.id !== serviceId));
    } catch (err) {
      alert('Greška pri brisanju servisa');
    }
  };

  const handleNoteFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!tripId || !noteFormData.content.trim()) return;

    try {
      const noteData = {
        content: noteFormData.content,
        isPublic: noteFormData.isPublic
      };

      if (editingNoteId) {
        await api.updateNoteEntry(parseInt(tripId), editingNoteId, noteData);
      } else {
        await api.createNoteEntry(parseInt(tripId), noteData);
      }

      await loadNoteEntries(tripId);
      setShowNoteForm(false);
      setEditingNoteId(null);
      setNoteFormData({
        content: '',
        isPublic: false
      });
    } catch (err) {
      alert('Greška pri čuvanju beleške');
    }
  };

  const handleEditNote = (note: NoteEntry) => {
    setEditingNoteId(note.id);
    setNoteFormData({
      content: note.content,
      isPublic: note.isPublic
    });
    setShowNoteForm(true);
  };;

  const handleDeleteNote = async (noteId: number) => {
    if (!tripId || !confirm('Da li si siguran da želiš da obrišeš ovu belešku?')) {
      return;
    }

    try {
      await api.deleteNoteEntry(parseInt(tripId), noteId);
      setNoteEntries(noteEntries.filter(n => n.id !== noteId));
    } catch (err) {
      alert('Greška pri brisanju beleške');
    }
  };

  const calculateBalance = () => {
    const sharedExpenses = expenses.filter(e => e.isShared);
    
    if (sharedExpenses.length === 0 || members.length === 0) {
      return { balances: [], settlements: [], total: 0, sharePerPerson: 0 };
    }

    const tolerance = 0.01;
    const total = sharedExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const sharePerPerson = total / members.length;

    console.log('=== BALANCE CALCULATION DEBUG ===');
    console.log('Total shared:', total, 'Members:', members.length, 'Share/person:', sharePerPerson);
    console.log('Members:', members.map(m => `${m.displayName} (userId=${m.userId})`));
    console.log('Shared expenses:', sharedExpenses.map(e => 
      `${e.description}: ${e.amount} by userId=${e.paidByUserId} (${e.paidByDisplayName})`
    ));

    // Struktura: userId -> { displayName, paid, owes, net }
    const participants: Record<number, { 
      userId: number; 
      displayName: string; 
      paid: number; 
      owes: number; 
      net: number;
    }> = {};

    // Dodaj sve trenutne članove
    members.forEach(member => {
      participants[member.userId] = {
        userId: member.userId,
        displayName: member.displayName,
        paid: 0,
        owes: sharePerPerson, // Svaki član duguje svoj deo
        net: 0
      };
    });

    // Saberi plaćanja
    sharedExpenses.forEach(expense => {
      console.log(`Processing expense: ${expense.description}, paidByUserId=${expense.paidByUserId}, exists in participants=${!!participants[expense.paidByUserId]}`);
      if (participants[expense.paidByUserId]) {
        participants[expense.paidByUserId].paid += expense.amount;
      } else {
        // Ex-member koji je platio - ne duguje ništa
        console.log(`Creating new participant for userId=${expense.paidByUserId} (${expense.paidByDisplayName})`);
        participants[expense.paidByUserId] = {
          userId: expense.paidByUserId,
          displayName: expense.paidByDisplayName,
          paid: expense.amount,
          owes: 0,
          net: 0
        };
      }
    });

    // NET = Paid - Owes (+ treba da dobije, - treba da plati)
    const balanceList = Object.values(participants).map(p => {
      const net = p.paid - p.owes;
      return {
        userId: p.userId,
        displayName: p.displayName,
        paid: p.paid,
        owes: p.owes,
        net: Math.abs(net) <= tolerance ? 0 : Math.round(net * 100) / 100
      };
    });

    console.log('Balances:', balanceList.map(b => `${b.displayName}: paid=${b.paid}, owes=${b.owes}, net=${b.net}`));

    // Greedy algoritam - matchuj najveće dužnike sa najvećim kreditorima
    // Garantuje direktne transakcije BEZ lanaca (A → B → C postaje A → C direktno)
    
    // Creditors (+ net): ljudi koji treba da dobiju
    const creditors = balanceList
      .filter(p => p.net > 0.01)
      .map(p => ({ ...p }))
      .sort((a, b) => b.net - a.net); // Najveći credit prvi

    // Debtors (- net): ljudi koji treba da plate
    const debtors = balanceList
      .filter(p => p.net < -0.01)
      .map(p => ({ ...p }))
      .sort((a, b) => a.net - b.net); // Najveći dug prvi (najmanji net broj)

    console.log('Creditors:', creditors.map(c => `${c.displayName}: +${c.net}`));
    console.log('Debtors:', debtors.map(d => `${d.displayName}: ${d.net}`));

    const settlements: { from: string; to: string; amount: number }[] = [];

    let i = 0; // debtor index
    let j = 0; // creditor index

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];

      // Koliko treba platiti: minimum od duga i kredita
      const amount = Math.min(Math.abs(debtor.net), creditor.net);
      const roundedAmount = Math.round(amount * 100) / 100;

      if (roundedAmount > 0.01) {
        settlements.push({
          from: debtor.displayName,
          to: creditor.displayName,
          amount: roundedAmount
        });
      }

      // Umanji balanse
      debtor.net += roundedAmount; // dužnik plaća, net ide ka 0
      creditor.net -= roundedAmount; // kreditor prima, net ide ka 0

      // Pomeri pokazivač kad je neko finished
      if (Math.abs(debtor.net) < 0.01) i++;
      if (Math.abs(creditor.net) < 0.01) j++;
    }

    console.log('Settlements (greedy):', settlements);

    return {
      balances: balanceList.map(b => ({
        userId: b.userId,
        displayName: b.displayName,
        paid: Math.round(b.paid * 100) / 100,
        owed: Math.round(b.owes * 100) / 100,
        balance: b.net
      })),
      settlements,
      total: Math.round(total * 100) / 100,
      sharePerPerson: Math.round(sharePerPerson * 100) / 100
    };
  };

  const calculateFuelStats = () => {
    // Pronađi trenutnog korisnika
    const currentUser = members.find(m => m.isCurrentUser);
    if (!currentUser || fuelEntries.length === 0) {
      return null;
    }

    // Filtriraj fuel entries samo za trenutnog korisnika
    const userFuelEntries = fuelEntries
      .filter(f => f.createdByUserId === currentUser.userId)
      .sort((a, b) => a.mileage - b.mileage);

    // Filtriraj samo puna sipanja
    const fullTankEntries = userFuelEntries.filter(f => f.isFull === true);

    if (fullTankEntries.length < 2) {
      return { error: 'Potrebna su najmanje 2 puna sipanja za tačan proračun potrošnje' };
    }

    // Uzmi prvo i poslednje puno sipanje
    const firstFull = fullTankEntries[0];
    const lastFull = fullTankEntries[fullTankEntries.length - 1];

    // Kilometraža između prvog i poslednjeg punog sipanja
    const totalKm = lastFull.mileage - firstFull.mileage;

    // Ukupna količina: SVA sipanja (puna i nepuna) između prvog i poslednjeg punog, 
    // OSIM količine prvog punog sipanja
    const entriesBetween = userFuelEntries.filter(
      entry => entry.mileage >= firstFull.mileage && entry.mileage <= lastFull.mileage
    );
    const totalFuel = entriesBetween.reduce((sum, entry) => {
      // Preskoči količinu prvog punog sipanja
      if (entry.id === firstFull.id) return sum;
      return sum + entry.quantity;
    }, 0);

    // Prosečna potrošnja na 100km
    const avgConsumption = totalKm > 0 ? (totalFuel / totalKm) * 100 : 0;

    return {
      totalKm: Math.round(totalKm),
      totalFuel: Math.round(totalFuel * 100) / 100,
      avgConsumption: Math.round(avgConsumption * 100) / 100,
      entryCount: fullTankEntries.length
    };
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
            className="flex items-center gap-1 text-sm text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Svi tripovi
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
            <div className="p-6 relative">
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
                        const date = new Date(expense.date).toLocaleDateString('sr-Latn', { 
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
                      <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-3 px-1">
                        {date}
                      </h3>
                      <div className="space-y-3">
                        {groupExpenses.map((expense) => {
                          const getCategoryStyle = (category: string) => {
                            const styles: Record<string, { border: string; bg: string; iconColor: string; icon: ReactNode }> = {
                              'Gorivo': { 
                                border: 'border border-red-600 border-l-8', 
                                bg: 'bg-gradient-to-r from-red-100 to-white dark:from-red-900/30 dark:to-zinc-800', 
                                iconColor: 'text-red-600',
                                icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 2h10v18H3z"/><path strokeLinecap="round" strokeLinejoin="round" d="M13 6h2a2 2 0 012 2v10a2 2 0 01-2 2h-1"/><path strokeLinecap="round" strokeLinejoin="round" d="M17 10h3"/><circle cx="8" cy="10" r="2"/></svg>
                              },
                              'Hrana': { 
                                border: 'border border-orange-600 border-l-8', 
                                bg: 'bg-gradient-to-r from-orange-100 to-white dark:from-orange-900/30 dark:to-zinc-800', 
                                iconColor: 'text-orange-600',
                                icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 2v7c0 1.1.9 2 2 2h2"/><path strokeLinecap="round" strokeLinejoin="round" d="M7 2v20"/><path strokeLinecap="round" strokeLinejoin="round" d="M21 15V2M17 15V2"/></svg>
                              },
                              'Smeštaj': { 
                                border: 'border border-blue-600 border-l-8', 
                                bg: 'bg-gradient-to-r from-blue-100 to-white dark:from-blue-900/30 dark:to-zinc-800', 
                                iconColor: 'text-blue-600',
                                icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path strokeLinecap="round" strokeLinejoin="round" d="M9 22V12h6v10"/></svg>
                              },
                              'Transport': { 
                                border: 'border border-purple-600 border-l-8', 
                                bg: 'bg-gradient-to-r from-purple-100 to-white dark:from-purple-900/30 dark:to-zinc-800', 
                                iconColor: 'text-purple-600',
                                icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 17h14v-5H5v5z"/><path strokeLinecap="round" strokeLinejoin="round" d="M3 17h2m14 0h2M7 21a2 2 0 100-4 2 2 0 000 4zm10 0a2 2 0 100-4 2 2 0 000 4z"/><path strokeLinecap="round" strokeLinejoin="round" d="M5 12V6l2-3h10l2 3v6"/></svg>
                              },
                              'Ulaznice': { 
                                border: 'border border-green-600 border-l-8', 
                                bg: 'bg-gradient-to-r from-green-100 to-white dark:from-green-900/30 dark:to-zinc-800', 
                                iconColor: 'text-green-600',
                                icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="2"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12M6 10h1M6 14h1M17 10h1M17 14h1"/></svg>
                              },
                              'Oprema': { 
                                border: 'border border-cyan-600 border-l-8', 
                                bg: 'bg-gradient-to-r from-cyan-100 to-white dark:from-cyan-900/30 dark:to-zinc-800', 
                                iconColor: 'text-cyan-600',
                                icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 6H9M19 6a2 2 0 012 2v10a2 2 0 01-2 2H9a2 2 0 01-2-2V8a2 2 0 012-2M19 6V4a1 1 0 00-1-1H6a1 1 0 00-1 1v2"/><rect x="3" y="8" width="4" height="10" rx="1"/></svg>
                              },
                              'Poslovna pratnja': { 
                                border: 'border border-indigo-600 border-l-8', 
                                bg: 'bg-gradient-to-r from-indigo-100 to-white dark:from-indigo-900/30 dark:to-zinc-800', 
                                iconColor: 'text-indigo-600',
                                icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><rect x="4" y="7" width="16" height="12" rx="2"/><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 12v3"/></svg>
                              },
                              'Ostalo': { 
                                border: 'border border-yellow-500 border-l-8', 
                                bg: 'bg-gradient-to-r from-yellow-100 to-white dark:from-yellow-900/30 dark:to-zinc-800', 
                                iconColor: 'text-yellow-600',
                                icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h8M12 8v8"/></svg>
                              }
                            };
                            return styles[category] || { 
                              border: 'border border-gray-600 border-l-8', 
                              bg: 'bg-gradient-to-r from-gray-100 to-white dark:from-gray-900/30 dark:to-zinc-800', 
                              iconColor: 'text-gray-600',
                              icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01"/></svg>
                            };
                          };
                          
                          const style = getCategoryStyle(expense.category);
                          
                          return (
                            <div
                              key={expense.id}
                              onClick={() => router.push(`/trips/${tripId}/expenses/${expense.id}/edit`)}
                              className={`${style.bg} ${style.border} rounded-lg p-4 hover:shadow-lg cursor-pointer transition-all hover:scale-[1.02] duration-200`}
                            >
                              <div className="flex items-start gap-4">
                                <div className={`flex-shrink-0 mt-1 ${style.iconColor}`}>
                                  {style.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-base font-semibold text-black dark:text-white truncate">
                                    {expense.description || expense.category}
                                  </h4>
                                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 font-medium">
                                    {expense.category}
                                  </p>
                                  <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-2 flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                                    </svg>
                                    Platio: <span className="font-medium">{expense.paidByDisplayName}</span>
                                  </p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <div className="text-xl font-bold text-black dark:text-white">
                                    {expense.amount.toFixed(2)}
                                  </div>
                                  <div className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
                                    {expense.currency}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Balance Panel Modal */}
              {showBalancePanel && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowBalancePanel(false)}>
                  <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                    <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-700 p-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">Σ</span>
                        <h3 className="text-lg font-bold text-black dark:text-white">Balans troškova</h3>
                      </div>
                      <button
                        onClick={() => setShowBalancePanel(false)}
                        className="text-zinc-500 hover:text-black dark:hover:text-white transition-colors"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <div className="p-4 space-y-4">
                      {(() => {
                        const { balances, settlements, total, sharePerPerson } = calculateBalance();
                        
                        if (!balances || balances.length === 0) {
                          return (
                            <p className="text-center text-zinc-600 dark:text-zinc-400">
                              Nema zajedničkih troškova ili članova za prikaz balansa.
                            </p>
                          );
                        }

                        return (
                          <>
                            {/* Summary */}
                            <div className="grid grid-cols-2 gap-3 mb-6">
                              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">Ukupno troškova</p>
                                <p className="text-xl font-bold text-blue-900 dark:text-blue-100">
                                  {total?.toFixed(2) || '0.00'} EUR
                                </p>
                              </div>
                              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
                                <p className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">Po osobi</p>
                                <p className="text-xl font-bold text-green-900 dark:text-green-100">
                                  {sharePerPerson?.toFixed(2) || '0.00'} EUR
                                </p>
                              </div>
                            </div>

                            {/* Settlements */}
                            {settlements && settlements.length > 0 && (
                              <div>
                                <h4 className="text-base font-semibold text-black dark:text-white mb-3">Ko kome treba da plati</h4>
                                <div className="space-y-3">
                                  {settlements.filter(s => s.from !== s.to).map((settlement, index) => (
                                    <div 
                                      key={index}
                                      className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4"
                                    >
                                      <div className="flex flex-col items-center gap-2">
                                        <div className="text-center">
                                          <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mb-1">Plaća</p>
                                          <p className="font-bold text-lg text-black dark:text-white">{settlement.from}</p>
                                        </div>
                                        
                                        <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                        </svg>
                                        
                                        <div className="bg-amber-100 dark:bg-amber-800/30 rounded-lg px-6 py-3 border-2 border-amber-300 dark:border-amber-700">
                                          <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                                            {settlement.amount.toFixed(2)} EUR
                                          </p>
                                        </div>
                                        
                                        <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                        </svg>
                                        
                                        <div className="text-center">
                                          <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mb-1">Prima</p>
                                          <p className="font-bold text-lg text-black dark:text-white">{settlement.to}</p>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {settlements && settlements.length === 0 && (
                              <div className="text-center py-6">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-3">
                                  <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                                <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                                  Svi su uravnoteženi! 🎉
                                </p>
                                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                                  Nema dugovanja između učesnika.
                                </p>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {/* Floating Action Buttons */}
              <button
                onClick={() => setShowBalancePanel(true)}
                className="fixed bottom-20 right-24 w-14 h-14 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 transition-all hover:scale-110 flex items-center justify-center z-50"
                title="Prikaži balans"
              >
                <span className="text-2xl font-bold">Σ</span>
              </button>
              <button
                onClick={() => router.push(`/trips/${tripId}/expenses/new?shared=true`)}
                className="fixed bottom-20 right-8 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-110 flex items-center justify-center z-50"
                title="Dodaj trošak"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          )}

          {activeTab === 'personalExpenses' && (
            <div className="p-6 relative">
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
                        const date = new Date(expense.date).toLocaleDateString('sr-Latn', { 
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
                      <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-3 px-1">
                        {date}
                      </h3>
                      <div className="space-y-3">
                        {groupExpenses.map((expense) => {
                          const getCategoryStyle = (category: string) => {
                            const styles: Record<string, { border: string; bg: string; iconColor: string; icon: ReactNode }> = {
                              'Gorivo': { 
                                border: 'border border-red-600 border-l-8', 
                                bg: 'bg-gradient-to-r from-red-100 to-white dark:from-red-900/30 dark:to-zinc-800', 
                                iconColor: 'text-red-600',
                                icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 2h10v18H3z"/><path strokeLinecap="round" strokeLinejoin="round" d="M13 6h2a2 2 0 012 2v10a2 2 0 01-2 2h-1"/><path strokeLinecap="round" strokeLinejoin="round" d="M17 10h3"/><circle cx="8" cy="10" r="2"/></svg>
                              },
                              'Hrana': { 
                                border: 'border border-orange-600 border-l-8', 
                                bg: 'bg-gradient-to-r from-orange-100 to-white dark:from-orange-900/30 dark:to-zinc-800', 
                                iconColor: 'text-orange-600',
                                icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 2v7c0 1.1.9 2 2 2h2"/><path strokeLinecap="round" strokeLinejoin="round" d="M7 2v20"/><path strokeLinecap="round" strokeLinejoin="round" d="M21 15V2M17 15V2"/></svg>
                              },
                              'Smeštaj': { 
                                border: 'border border-blue-600 border-l-8', 
                                bg: 'bg-gradient-to-r from-blue-100 to-white dark:from-blue-900/30 dark:to-zinc-800', 
                                iconColor: 'text-blue-600',
                                icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path strokeLinecap="round" strokeLinejoin="round" d="M9 22V12h6v10"/></svg>
                              },
                              'Transport': { 
                                border: 'border border-purple-600 border-l-8', 
                                bg: 'bg-gradient-to-r from-purple-100 to-white dark:from-purple-900/30 dark:to-zinc-800', 
                                iconColor: 'text-purple-600',
                                icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 17h14v-5H5v5z"/><path strokeLinecap="round" strokeLinejoin="round" d="M3 17h2m14 0h2M7 21a2 2 0 100-4 2 2 0 000 4zm10 0a2 2 0 100-4 2 2 0 000 4z"/><path strokeLinecap="round" strokeLinejoin="round" d="M5 12V6l2-3h10l2 3v6"/></svg>
                              },
                              'Ulaznice': { 
                                border: 'border border-green-600 border-l-8', 
                                bg: 'bg-gradient-to-r from-green-100 to-white dark:from-green-900/30 dark:to-zinc-800', 
                                iconColor: 'text-green-600',
                                icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="2"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12M6 10h1M6 14h1M17 10h1M17 14h1"/></svg>
                              },
                              'Oprema': { 
                                border: 'border border-cyan-600 border-l-8', 
                                bg: 'bg-gradient-to-r from-cyan-100 to-white dark:from-cyan-900/30 dark:to-zinc-800', 
                                iconColor: 'text-cyan-600',
                                icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 6H9M19 6a2 2 0 012 2v10a2 2 0 01-2 2H9a2 2 0 01-2-2V8a2 2 0 012-2M19 6V4a1 1 0 00-1-1H6a1 1 0 00-1 1v2"/><rect x="3" y="8" width="4" height="10" rx="1"/></svg>
                              },
                              'Poslovna pratnja': { 
                                border: 'border border-indigo-600 border-l-8', 
                                bg: 'bg-gradient-to-r from-indigo-100 to-white dark:from-indigo-900/30 dark:to-zinc-800', 
                                iconColor: 'text-indigo-600',
                                icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><rect x="4" y="7" width="16" height="12" rx="2"/><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 12v3"/></svg>
                              },
                              'Ostalo': { 
                                border: 'border border-yellow-500 border-l-8', 
                                bg: 'bg-gradient-to-r from-yellow-100 to-white dark:from-yellow-900/30 dark:to-zinc-800', 
                                iconColor: 'text-yellow-600',
                                icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h8M12 8v8"/></svg>
                              }
                            };
                            return styles[category] || { 
                              border: 'border border-gray-600 border-l-8', 
                              bg: 'bg-gradient-to-r from-gray-100 to-white dark:from-gray-900/30 dark:to-zinc-800', 
                              iconColor: 'text-gray-600',
                              icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01"/></svg>
                            };
                          };
                          
                          const style = getCategoryStyle(expense.category);
                          
                          return (
                            <div
                              key={expense.id}
                              onClick={() => router.push(`/trips/${tripId}/expenses/${expense.id}/edit`)}
                              className={`${style.bg} ${style.border} rounded-lg p-4 hover:shadow-lg cursor-pointer transition-all hover:scale-[1.02] duration-200`}
                            >
                              <div className="flex items-start gap-4">
                                <div className={`flex-shrink-0 mt-1 ${style.iconColor}`}>
                                  {style.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-base font-semibold text-black dark:text-white truncate">
                                    {expense.description || expense.category}
                                  </h4>
                                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 font-medium">
                                    {expense.category}
                                  </p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <div className="text-xl font-bold text-black dark:text-white">
                                    {expense.amount.toFixed(2)}
                                  </div>
                                  <div className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
                                    {expense.currency}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Floating Action Button */}
              <button
                onClick={() => router.push(`/trips/${tripId}/expenses/new?shared=false`)}
                className="fixed bottom-20 right-8 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-110 flex items-center justify-center z-50"
                title="Dodaj trošak"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
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
                      <div className="md:col-span-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={fuelFormData.isFull}
                            onChange={(e) => setFuelFormData({...fuelFormData, isFull: e.target.checked})}
                            className="w-4 h-4 text-blue-600 bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Pun rezervoar
                          </span>
                        </label>
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
                <div className="space-y-6">
                  {/* Fuel entries grouped by date */}
                  {Object.entries(
                    fuelEntries.reduce((acc, fuel) => {
                      const date = new Date(fuel.date).toLocaleDateString('sr-Latn');
                      if (!acc[date]) acc[date] = [];
                      acc[date].push(fuel);
                      return acc;
                    }, {} as Record<string, typeof fuelEntries>)
                  ).map(([date, fuels]) => (
                    <div key={date}>
                      <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mb-3 px-1">
                        {date}
                      </h3>
                      <div className="space-y-2">
                        {fuels.map((fuel) => (
                          <div
                            key={fuel.id}
                            onClick={() => handleEditFuel(fuel)}
                            className="relative bg-gradient-to-r from-red-50 to-white dark:from-red-950/20 dark:to-zinc-900 p-4 rounded-lg cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border border-red-600 dark:border-red-500 border-l-8"
                          >
                            <div className="flex items-start gap-4">
                              {/* Fuel icon */}
                              <div className="flex-shrink-0 mt-1">
                                <svg className="w-6 h-6 text-red-600 dark:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                              </div>
                              
                              {/* Content */}
                              <div className="flex-grow min-w-0">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-grow min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h4 className="font-semibold text-black dark:text-white text-base">
                                        {fuel.location}
                                      </h4>
                                      {fuel.isFull && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-full">
                                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                          </svg>
                                          Pun
                                        </span>
                                      )}
                                    </div>
                                    {fuel.note && (
                                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                                        {fuel.note}
                                      </p>
                                    )}
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                                      <span className="flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                        </svg>
                                        {fuel.quantity.toFixed(2)} L
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {fuel.unitPrice.toFixed(2)} {fuel.currency}/L
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                        {fuel.mileage.toLocaleString()} km
                                      </span>
                                    </div>
                                  </div>
                                  
                                  {/* Amount and Delete */}
                                  <div className="flex items-start gap-2 flex-shrink-0">
                                    <div className="text-right">
                                      <div className="text-lg font-bold text-black dark:text-white">
                                        {fuel.amount.toFixed(2)}
                                      </div>
                                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                                        {fuel.currency}
                                      </div>
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteFuel(fuel.id);
                                      }}
                                      className="p-1.5 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                      title="Obriši"
                                    >
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}

              {/* Fuel Statistics Modal */}
              {showFuelStats && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowFuelStats(false)}>
                  <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                    <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-700 p-4 flex items-center justify-between rounded-t-lg">
                      <div className="flex items-center gap-2">
                        <svg className="w-6 h-6 text-amber-600 dark:text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <h3 className="text-lg font-bold text-black dark:text-white">Statistika goriva</h3>
                      </div>
                      <button
                        onClick={() => setShowFuelStats(false)}
                        className="text-zinc-500 hover:text-black dark:hover:text-white transition-colors"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <div className="p-6">
                      {(() => {
                        const stats = calculateFuelStats();
                        
                        if (!stats) {
                          return (
                            <p className="text-center text-zinc-600 dark:text-zinc-400 py-8">
                              Nema evidencije sipanja goriva za prikaz statistike.
                            </p>
                          );
                        }

                        if (stats.error) {
                          return (
                            <div className="text-center py-8">
                              <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full mb-3">
                                <svg className="w-8 h-8 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                              </div>
                              <p className="text-zinc-600 dark:text-zinc-400">{stats.error}</p>
                            </div>
                          );
                        }

                        return (
                          <div className="space-y-6">
                            {/* Statistics Cards */}
                            <div className="space-y-3">
                              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                                <div className="flex items-center gap-3">
                                  <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                  </svg>
                                  <div className="flex-1">
                                    <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Ukupna kilometraža</p>
                                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                                      {stats.totalKm!.toLocaleString()} km
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                                <div className="flex items-center gap-3">
                                  <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                  </svg>
                                  <div className="flex-1">
                                    <p className="text-sm text-green-600 dark:text-green-400 font-medium">Ukupna količina goriva</p>
                                    <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                                      {stats.totalFuel!.toFixed(2)} L
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
                                <div className="flex items-center gap-3">
                                  <svg className="w-8 h-8 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                  </svg>
                                  <div className="flex-1">
                                    <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">Prosečna potrošnja</p>
                                    <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                                      {stats.avgConsumption!.toFixed(2)} L/100km
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Additional Info */}
                            <div className="text-center pt-4 border-t border-zinc-200 dark:border-zinc-700">
                              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                Statistika zasnovana na {stats.entryCount!} {stats.entryCount === 1 ? 'sipanju' : stats.entryCount! < 5 ? 'sipanja' : 'sipanja'}
                              </p>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {/* Floating Action Buttons */}
              {/* Fuel Statistics Button */}
              <button
                onClick={() => setShowFuelStats(true)}
                className="fixed bottom-20 right-24 w-14 h-14 bg-amber-600 text-white rounded-full shadow-lg hover:bg-amber-700 transition-all hover:scale-110 flex items-center justify-center z-50"
                title="Prikaži statistiku goriva"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </button>
              
              {/* Add Fuel Entry Button */}
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
                    note: '',
                    isFull: false
                  });
                  setShowFuelForm(true);
                }}
                className="fixed bottom-20 right-8 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-110 flex items-center justify-center z-50"
                title="Dodaj sipanje"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          )}

          {activeTab === 'accommodation' && (
            <div className="p-6 relative">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-black dark:text-white">Smeštaj</h2>
              </div>

              {showAccommodationForm && (
                <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 border border-zinc-200 dark:border-zinc-700">
                  <div className="flex items-center gap-3 mb-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAccommodationForm(false);
                        setEditingAccommodationId(null);
                      }}
                      className="text-black dark:text-white hover:opacity-70 transition-opacity text-2xl"
                    >
                      ◀
                    </button>
                    <h3 className="text-lg font-semibold text-black dark:text-white">
                      {editingAccommodationId ? 'Uredi smeštaj' : 'Novi smeštaj'}
                    </h3>
                  </div>
                  <form onSubmit={handleAccommodationFormSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                          Naziv
                        </label>
                        <input
                          type="text"
                          value={accommodationFormData.name}
                          onChange={(e) => setAccommodationFormData({...accommodationFormData, name: e.target.value})}
                          required
                          placeholder="Hotel Putnik, Apartman Centar..."
                          className="w-full px-4 py-2 bg-white dark:bg-zinc-900 text-black dark:text-white border border-zinc-300 dark:border-zinc-700 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                          Tip smeštaja
                        </label>
                        <select
                          value={accommodationFormData.accommodationType}
                          onChange={(e) => setAccommodationFormData({...accommodationFormData, accommodationType: e.target.value})}
                          required
                          className="w-full px-4 py-2 bg-white dark:bg-zinc-900 text-black dark:text-white border border-zinc-300 dark:border-zinc-700 rounded-lg"
                        >
                          <option value="Hotel">Hotel</option>
                          <option value="Apartman">Apartman</option>
                          <option value="Kamp">Kamp</option>
                          <option value="Kod prijatelja">Kod prijatelja</option>
                          <option value="Ostalo">Ostalo</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                          Check-in
                        </label>
                        <input
                          type="date"
                          value={accommodationFormData.checkInDate}
                          onChange={(e) => setAccommodationFormData({...accommodationFormData, checkInDate: e.target.value})}
                          required
                          className="w-full px-4 py-2 bg-white dark:bg-zinc-900 text-black dark:text-white border border-zinc-300 dark:border-zinc-700 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                          Check-out
                        </label>
                        <input
                          type="date"
                          value={accommodationFormData.checkOutDate}
                          onChange={(e) => setAccommodationFormData({...accommodationFormData, checkOutDate: e.target.value})}
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
                          value={accommodationFormData.amount}
                          onChange={(e) => setAccommodationFormData({...accommodationFormData, amount: e.target.value})}
                          required
                          placeholder="0.00"
                          className="w-full px-4 py-2 bg-white dark:bg-zinc-900 text-black dark:text-white border border-zinc-300 dark:border-zinc-700 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                          Valuta
                        </label>
                        <select
                          value={accommodationFormData.currency}
                          onChange={(e) => setAccommodationFormData({...accommodationFormData, currency: e.target.value})}
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
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                          Lokacija
                        </label>
                        <input
                          type="text"
                          value={accommodationFormData.location}
                          onChange={(e) => setAccommodationFormData({...accommodationFormData, location: e.target.value})}
                          required
                          placeholder="Beograd, Srbija"
                          className="w-full px-4 py-2 bg-white dark:bg-zinc-900 text-black dark:text-white border border-zinc-300 dark:border-zinc-700 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                          Plaćanje do
                        </label>
                        <input
                          type="date"
                          value={accommodationFormData.paymentDueDate}
                          onChange={(e) => setAccommodationFormData({...accommodationFormData, paymentDueDate: e.target.value})}
                          className="w-full px-4 py-2 bg-white dark:bg-zinc-900 text-black dark:text-white border border-zinc-300 dark:border-zinc-700 rounded-lg"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                          Napomena
                        </label>
                        <textarea
                          value={accommodationFormData.note}
                          onChange={(e) => setAccommodationFormData({...accommodationFormData, note: e.target.value})}
                          rows={3}
                          placeholder="Dodatne informacije..."
                          className="w-full px-4 py-2 bg-white dark:bg-zinc-900 text-black dark:text-white border border-zinc-300 dark:border-zinc-700 rounded-lg"
                        />
                      </div>
                    </div>
                    <div className="flex gap-3 pt-4">
                      <button
                        type="submit"
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Sačuvaj
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAccommodationForm(false);
                          setEditingAccommodationId(null);
                        }}
                        className="px-6 py-2 bg-zinc-500 text-white rounded-lg hover:bg-zinc-600 transition-colors"
                      >
                        Otkaži
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {!showAccommodationForm && (loadingAccommodation ? (
                <div className="flex justify-center items-center py-12">
                  <div className="text-zinc-600 dark:text-zinc-400">Učitavanje...</div>
                </div>
              ) : accommodationEntries.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-zinc-600 dark:text-zinc-400">Još nema unetih smeštaja</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-2">
                    Klikni "Dodaj smeštaj" da uneseš prvi smeštaj
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Accommodation entries grouped by check-in date */}
                  {Object.entries(
                    accommodationEntries.reduce((acc, accommodation) => {
                      const date = new Date(accommodation.checkInDate).toLocaleDateString('sr-Latn');
                      if (!acc[date]) acc[date] = [];
                      acc[date].push(accommodation);
                      return acc;
                    }, {} as Record<string, typeof accommodationEntries>)
                  ).map(([date, accommodations]) => (
                    <div key={date}>
                      <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mb-3 px-1">
                        {date}
                      </h3>
                      <div className="space-y-2">
                        {accommodations.map((accommodation) => (
                          <div
                            key={accommodation.id}
                            onClick={() => handleEditAccommodation(accommodation)}
                            className="relative bg-gradient-to-r from-blue-50 to-white dark:from-blue-950/20 dark:to-zinc-900 p-4 rounded-lg cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border border-blue-600 dark:border-blue-500 border-l-8"
                          >
                            <div className="flex items-start gap-4">
                              {/* Accommodation icon */}
                              <div className="flex-shrink-0 mt-1">
                                <svg className="w-6 h-6 text-blue-600 dark:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                              </div>
                              
                              {/* Content */}
                              <div className="flex-grow min-w-0">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-grow min-w-0">
                                    <h4 className="font-semibold text-black dark:text-white text-base">
                                      {accommodation.name}
                                    </h4>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-0.5">
                                      {accommodation.accommodationType}
                                    </p>
                                    {accommodation.note && (
                                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                                        {accommodation.note}
                                      </p>
                                    )}
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                                      <span className="flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        {accommodation.location}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        {new Date(accommodation.checkInDate).toLocaleDateString('sr-Latn')} - {new Date(accommodation.checkOutDate).toLocaleDateString('sr-Latn')}
                                      </span>
                                      {accommodation.paymentDueDate && (
                                        <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400 font-medium">
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                          </svg>
                                          Plaćanje do: {new Date(accommodation.paymentDueDate).toLocaleDateString('sr-Latn')}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Amount and Delete */}
                                  <div className="flex items-start gap-2 flex-shrink-0">
                                    <div className="text-right">
                                      <div className="text-lg font-bold text-black dark:text-white">
                                        {accommodation.amount.toFixed(2)}
                                      </div>
                                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                                        {accommodation.currency}
                                      </div>
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteAccommodation(accommodation.id);
                                      }}
                                      className="p-1.5 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                      title="Obriši"
                                    >
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}

              {/* Floating Action Button */}
              <button
                onClick={() => {
                  setEditingAccommodationId(null);
                  setAccommodationFormData({
                    name: '',
                    accommodationType: 'Hotel',
                    checkInDate: new Date().toISOString().split('T')[0],
                    checkOutDate: new Date().toISOString().split('T')[0],
                    amount: '',
                    currency: 'EUR',
                    location: '',
                    note: '',
                    paymentDueDate: ''
                  });
                  setShowAccommodationForm(true);
                }}
                className="fixed bottom-20 right-8 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-110 flex items-center justify-center z-50"
                title="Dodaj smeštaj"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          )}

          {activeTab === 'service' && (
            <div className="p-6 relative">
              <div className="flex items-center mb-4">
                {showServiceForm && (
                  <button
                    onClick={() => {
                      setShowServiceForm(false);
                      setEditingServiceId(null);
                      setServiceFormData({
                        serviceType: 'Podmazivanje lanca',
                        description: '',
                        serviceDate: new Date().toISOString().split('T')[0],
                        amount: '',
                        currency: 'EUR',
                        location: '',
                        mileage: '',
                        note: ''
                      });
                    }}
                    className="mr-3 text-black dark:text-white hover:text-zinc-600 dark:hover:text-zinc-400"
                    title="Nazad"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}
                <h2 className="text-xl font-semibold text-black dark:text-white">
                  {showServiceForm ? (editingServiceId ? 'Izmeni servis' : 'Dodaj servis') : 'Servisi'}
                </h2>
              </div>

              {showServiceForm && (
                <form onSubmit={handleServiceFormSubmit} className="mb-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-black dark:text-white mb-1">Tip servisa *</label>
                      <select
                        value={serviceFormData.serviceType}
                        onChange={(e) => setServiceFormData({ ...serviceFormData, serviceType: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-black dark:text-white"
                      >
                        <option value="Podmazivanje lanca">Podmazivanje lanca</option>
                        <option value="Promena ulja">Promena ulja</option>
                        <option value="Promena guma">Promena guma</option>
                        <option value="Servis kočnica">Servis kočnica</option>
                        <option value="Ostalo">Ostalo</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-black dark:text-white mb-1">Datum *</label>
                      <input
                        type="date"
                        value={serviceFormData.serviceDate}
                        onChange={(e) => setServiceFormData({ ...serviceFormData, serviceDate: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-black dark:text-white"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-black dark:text-white mb-1">Opis *</label>
                      <input
                        type="text"
                        value={serviceFormData.description}
                        onChange={(e) => setServiceFormData({ ...serviceFormData, description: e.target.value })}
                        required
                        placeholder="Npr. Podmazivanje lanca DID lancem"
                        className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-black dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-black dark:text-white mb-1">Iznos *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={serviceFormData.amount}
                        onChange={(e) => setServiceFormData({ ...serviceFormData, amount: e.target.value })}
                        required
                        placeholder="0.00"
                        className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-black dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-black dark:text-white mb-1">Valuta *</label>
                      <select
                        value={serviceFormData.currency}
                        onChange={(e) => setServiceFormData({ ...serviceFormData, currency: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-black dark:text-white"
                      >
                        <option value="EUR">EUR</option>
                        <option value="RSD">RSD</option>
                        <option value="USD">USD</option>
                        <option value="BAM">BAM</option>
                        <option value="HRK">HRK</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-black dark:text-white mb-1">Lokacija *</label>
                      <input
                        type="text"
                        value={serviceFormData.location}
                        onChange={(e) => setServiceFormData({ ...serviceFormData, location: e.target.value })}
                        required
                        placeholder="Npr. Beograd, Srbija"
                        className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-black dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-black dark:text-white mb-1">Kilometraža</label>
                      <input
                        type="number"
                        value={serviceFormData.mileage}
                        onChange={(e) => setServiceFormData({ ...serviceFormData, mileage: e.target.value })}
                        placeholder="npr. 15000"
                        className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-black dark:text-white"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-black dark:text-white mb-1">Napomena</label>
                      <textarea
                        value={serviceFormData.note}
                        onChange={(e) => setServiceFormData({ ...serviceFormData, note: e.target.value })}
                        rows={3}
                        placeholder="Dodatne informacije..."
                        className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-black dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowServiceForm(false);
                        setEditingServiceId(null);
                        setServiceFormData({
                          serviceType: 'Podmazivanje lanca',
                          description: '',
                          serviceDate: new Date().toISOString().split('T')[0],
                          amount: '',
                          currency: 'EUR',
                          location: '',
                          mileage: '',
                          note: ''
                        });
                      }}
                      className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded text-black dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      Otkaži
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      {editingServiceId ? 'Sačuvaj' : 'Dodaj'}
                    </button>
                  </div>
                </form>
              )}

              {!showServiceForm && (
                <div>
                  {loadingService ? (
                    <p className="text-zinc-600 dark:text-zinc-400">Učitavanje...</p>
                  ) : serviceEntries.length === 0 ? (
                    <p className="text-zinc-600 dark:text-zinc-400">Nema evidentiranih servisa.</p>
                  ) : (
                    <div className="space-y-3">
                      {serviceEntries.map((service) => {
                        const getServiceStyle = (type: string) => {
                          const styles: Record<string, { border: string; bg: string; iconColor: string; icon: React.ReactNode }> = {
                            'Promena ulja': {
                              border: 'border border-amber-600 border-l-8',
                              bg: 'bg-gradient-to-r from-amber-100 to-white dark:from-amber-900/30 dark:to-zinc-800',
                              iconColor: 'text-amber-600',
                              icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 3v1m0 0a3 3 0 106 0M9 4h6m-6 0V3m6 1V3M7 7h10M7 7v10a2 2 0 002 2h6a2 2 0 002-2V7M7 7H5m14 0h2M9 11v4m6-4v4"/></svg>
                            },
                            'Promena guma': {
                              border: 'border border-slate-600 border-l-8',
                              bg: 'bg-gradient-to-r from-slate-100 to-white dark:from-slate-900/30 dark:to-zinc-800',
                              iconColor: 'text-slate-600',
                              icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="2"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2m0 14v2M3 12h2m14 0h2"/></svg>
                            },
                            'Servis kočnica': {
                              border: 'border border-red-600 border-l-8',
                              bg: 'bg-gradient-to-r from-red-100 to-white dark:from-red-900/30 dark:to-zinc-800',
                              iconColor: 'text-red-600',
                              icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 8V4m0 16v-4m4-4h4M4 12h4"/></svg>
                            },
                            'Podmazivanje lanca': {
                              border: 'border border-lime-600 border-l-8',
                              bg: 'bg-gradient-to-r from-lime-100 to-white dark:from-lime-900/30 dark:to-zinc-800',
                              iconColor: 'text-lime-600',
                              icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
                            },
                            'Ostalo': {
                              border: 'border border-purple-600 border-l-8',
                              bg: 'bg-gradient-to-r from-purple-100 to-white dark:from-purple-900/30 dark:to-zinc-800',
                              iconColor: 'text-purple-600',
                              icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                            }
                          };
                          return styles[type] || {
                            border: 'border border-gray-600 border-l-8',
                            bg: 'bg-gradient-to-r from-gray-100 to-white dark:from-gray-900/30 dark:to-zinc-800',
                            iconColor: 'text-gray-600',
                            icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01"/></svg>
                          };
                        };
                        
                        const style = getServiceStyle(service.serviceType);
                        
                        return (
                          <div
                            key={service.id}
                            onClick={() => handleEditService(service)}
                            className={`${style.bg} ${style.border} rounded-lg p-4 hover:shadow-lg cursor-pointer transition-all hover:scale-[1.02] duration-200 relative`}
                          >
                            <div className="flex items-start gap-4">
                              <div className={`flex-shrink-0 mt-1 ${style.iconColor}`}>
                                {style.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-base font-semibold text-black dark:text-white">
                                  {service.description}
                                </h4>
                                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 font-medium">
                                  {service.serviceType}
                                </p>
                                <div className="mt-2 space-y-1">
                                  <p className="text-xs text-zinc-500 dark:text-zinc-500 flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                    </svg>
                                    {new Date(service.serviceDate).toLocaleDateString('sr-Latn')}
                                  </p>
                                  <p className="text-xs text-zinc-500 dark:text-zinc-500 flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                                    </svg>
                                    {service.location}
                                  </p>
                                  {service.mileage && (
                                    <p className="text-xs text-zinc-500 dark:text-zinc-500 flex items-center gap-1">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10"/>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2"/>
                                      </svg>
                                      {service.mileage} km
                                    </p>
                                  )}
                                  {service.note && (
                                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 italic">
                                      {service.note}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <div className="text-xl font-bold text-black dark:text-white">
                                  {service.amount.toFixed(2)}
                                </div>
                                <div className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
                                  {service.currency}
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteService(service.id);
                                  }}
                                  className="mt-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                  title="Obriši"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Floating Action Button */}
              {!showServiceForm && (
                <button
                  onClick={() => setShowServiceForm(true)}
                  className="fixed bottom-20 right-8 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-110 flex items-center justify-center z-50"
                  title="Dodaj servis"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="p-6 relative">
              <div className="flex items-center mb-4">
                {showNoteForm && (
                  <button
                    onClick={() => {
                      setShowNoteForm(false);
                      setEditingNoteId(null);
                      setNoteFormData({
                        content: '',
                        isPublic: false
                      });
                    }}
                    className="mr-3 text-black dark:text-white hover:text-zinc-600 dark:hover:text-zinc-400"
                    title="Nazad"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}
                <h2 className="text-xl font-semibold text-black dark:text-white">
                  {showNoteForm ? (editingNoteId ? 'Izmeni belešku' : 'Dodaj belešku') : 'Beleške'}
                </h2>
              </div>

              {showNoteForm && (
                <form onSubmit={handleNoteFormSubmit} className="mb-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-black dark:text-white mb-1">Sadržaj *</label>
                    <textarea
                      value={noteFormData.content}
                      onChange={(e) => setNoteFormData({ ...noteFormData, content: e.target.value })}
                      required
                      rows={6}
                      placeholder="Unesite belešku..."
                      className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-black dark:text-white"
                    />
                  </div>

                  {/* Public toggle */}
                  <div className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800">
                    <div>
                      <p className="text-sm font-medium text-black dark:text-white">Vidljivost</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {noteFormData.isPublic ? 'Javna — vidljiva svim članovima' : 'Privatna — vidljiva samo tebi'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNoteFormData({ ...noteFormData, isPublic: !noteFormData.isPublic })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        noteFormData.isPublic ? 'bg-green-500' : 'bg-zinc-300 dark:bg-zinc-600'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        noteFormData.isPublic ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowNoteForm(false);
                        setEditingNoteId(null);
                        setNoteFormData({
                          content: '',
                          isPublic: false
                        });
                      }}
                      className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded text-black dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      Otkaži
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      {editingNoteId ? 'Sačuvaj' : 'Dodaj'}
                    </button>
                  </div>
                </form>
              )}

              {!showNoteForm && (
                <div>
                  {loadingNotes ? (
                    <p className="text-zinc-600 dark:text-zinc-400">Učitavanje...</p>
                  ) : noteEntries.length === 0 ? (
                    <p className="text-zinc-600 dark:text-zinc-400">Nema beleški.</p>
                  ) : (
                    <div className="space-y-3">
                      {noteEntries.map((note) => {
                        return (
                          <div
                            key={note.id}
                            onClick={() => handleEditNote(note)}
                            className="border border-indigo-600 border-l-8 bg-gradient-to-r from-indigo-100 to-white dark:from-indigo-900/30 dark:to-zinc-800 rounded-lg p-4 hover:shadow-lg cursor-pointer transition-all hover:scale-[1.02] duration-200 relative"
                          >
                            <div className="absolute top-3 right-10">
                              {note.isPublic ? (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium">Javna</span>
                              ) : (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 font-medium">Privatna</span>
                              )}
                            </div>
                            <div className="flex items-start gap-4">
                              <div className="flex-shrink-0 mt-1 text-indigo-600">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-base text-black dark:text-white whitespace-pre-wrap">
                                  {note.content}
                                </p>
                                <div className="mt-3 space-y-1">
                                  <p className="text-xs text-zinc-500 dark:text-zinc-500 flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                                    </svg>
                                    Dodao: <span className="font-medium">{note.createdByUserDisplayName}</span>
                                    {' '} - {' '}
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                    </svg>
                                    {new Date(note.createdAt).toLocaleDateString('sr-Latn', { 
                                      year: 'numeric', 
                                      month: 'short', 
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                  {note.updatedAt && note.updatedByUserDisplayName && (
                                    <p className="text-xs text-zinc-500 dark:text-zinc-500 flex items-center gap-1">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                                      </svg>
                                      Izmenio: <span className="font-medium">{note.updatedByUserDisplayName}</span>
                                      {' '} - {' '}
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                      </svg>
                                      {new Date(note.updatedAt).toLocaleDateString('sr-Latn', { 
                                        year: 'numeric', 
                                        month: 'short', 
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex-shrink-0">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteNote(note.id);
                                  }}
                                  className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                  title="Obriši"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Floating Action Button */}
              {!showNoteForm && (
                <button
                  onClick={() => setShowNoteForm(true)}
                  className="fixed bottom-20 right-8 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-110 flex items-center justify-center z-50"
                  title="Dodaj belešku"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              )}
            </div>
          )}

          {activeTab === 'emergency' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-black dark:text-white mb-6">Emergency podaci</h2>

              {/* My Emergency Info Form */}
              <div className="mb-8 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-5">
                <h3 className="text-base font-semibold text-red-800 dark:text-red-300 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
                  Moji emergency podaci
                </h3>
                {!emergencyFormLoaded ? (
                  <p className="text-zinc-500 dark:text-zinc-400">Učitavam...</p>
                ) : (
                  <form onSubmit={handleEmergencySubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-black dark:text-white mb-1">
                          Kontakt u hitnom slučaju — ime
                        </label>
                        <input
                          type="text"
                          value={emergencyFormData.emergencyContactName ?? ''}
                          onChange={(e) => setEmergencyFormData(d => ({ ...d, emergencyContactName: e.target.value }))}
                          placeholder="Ime i prezime"
                          maxLength={200}
                          className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-black dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-400"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-black dark:text-white mb-1">
                          Kontakt u hitnom slučaju — telefon
                        </label>
                        <input
                          type="tel"
                          value={emergencyFormData.emergencyContactPhone ?? ''}
                          onChange={(e) => setEmergencyFormData(d => ({ ...d, emergencyContactPhone: e.target.value }))}
                          placeholder="+381 60 123 4567"
                          maxLength={50}
                          className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-black dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-400"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-black dark:text-white mb-1">
                          Krvna grupa
                        </label>
                        <input
                          type="text"
                          value={emergencyFormData.bloodType ?? ''}
                          onChange={(e) => setEmergencyFormData(d => ({ ...d, bloodType: e.target.value }))}
                          placeholder="npr. A+, O-, AB+"
                          maxLength={10}
                          className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-black dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-400"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-black dark:text-white mb-1">
                          Broj polise zdravstvenog osiguranja
                        </label>
                        <input
                          type="text"
                          value={emergencyFormData.healthInsurancePolicyNumber ?? ''}
                          onChange={(e) => setEmergencyFormData(d => ({ ...d, healthInsurancePolicyNumber: e.target.value }))}
                          placeholder="Broj polise"
                          maxLength={100}
                          className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-black dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-400"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={savingEmergency}
                        className="px-5 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 font-medium"
                      >
                        {savingEmergency ? 'Čuvam...' : 'Sačuvaj'}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* All Members Emergency Info */}
              <h3 className="text-base font-semibold text-black dark:text-white mb-3 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                Emergency podaci svih članova
              </h3>
              {loadingEmergency ? (
                <p className="text-zinc-500 dark:text-zinc-400">Učitavam...</p>
              ) : emergencyInfos.length === 0 ? (
                <p className="text-zinc-500 dark:text-zinc-400">Nema unetih hitnih podataka.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {emergencyInfos.map((info) => (
                    <div
                      key={info.userId}
                      className={`rounded-lg border p-4 ${info.isCurrentUser ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/10' : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50'}`}
                    >
                      {/* Header: ime člana + krvna grupa */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-black dark:text-white">{info.userDisplayName}</span>
                          {info.isCurrentUser && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400">ja</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-zinc-500 dark:text-zinc-400">Krvna grupa:</span>
                          {info.bloodType ? (
                            <span className="px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-bold text-sm">
                              {info.bloodType}
                            </span>
                          ) : (
                            <span className="text-sm text-zinc-400 dark:text-zinc-500">—</span>
                          )}
                        </div>
                      </div>
                      {/* Podaci */}
                      <div className="grid grid-cols-1 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-500 dark:text-zinc-400 w-32 shrink-0">Kontakt ime:</span>
                          <span className="text-black dark:text-white">{info.emergencyContactName || '—'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-500 dark:text-zinc-400 w-32 shrink-0">Kontakt tel:</span>
                          {info.emergencyContactPhone ? (
                            <a href={`tel:${info.emergencyContactPhone}`} className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                              {info.emergencyContactPhone}
                            </a>
                          ) : <span className="text-black dark:text-white">—</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-500 dark:text-zinc-400 w-32 shrink-0">Polisa:</span>
                          <span className="text-black dark:text-white">{info.healthInsurancePolicyNumber || '—'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
          {/* ── OPREMA TAB ── */}
          {activeTab === 'equipment' && (
            <div className="p-6 relative">
              <div className="flex items-center mb-4">
                {showEquipmentForm && (
                  <button
                    onClick={() => {
                      setShowEquipmentForm(false);
                      setEditingEquipmentEntry(null);
                      setEquipmentFormData({ equipmentCatalogItemId: '', carriedByUserId: '', quantity: '1', note: '' });
                    }}
                    className="mr-3 text-black dark:text-white hover:text-zinc-600 dark:hover:text-zinc-400"
                    title="Nazad"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}
                <h2 className="text-xl font-semibold text-black dark:text-white">
                  {showEquipmentForm ? (editingEquipmentEntry ? 'Izmeni opremu' : 'Dodaj opremu') : 'Oprema'}
                </h2>
              </div>

              {/* Forma */}
              {showEquipmentForm && (
                <form onSubmit={handleEquipmentSubmit} className="mb-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-black dark:text-white mb-1">Oprema *</label>
                      <select
                        required
                        value={equipmentFormData.equipmentCatalogItemId}
                        onChange={e => setEquipmentFormData(p => ({ ...p, equipmentCatalogItemId: e.target.value }))}
                        className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-black dark:text-white"
                      >
                        <option value="" disabled>— Izaberite opremu —</option>
                        {Object.entries(
                          equipmentCatalog.reduce<Record<string, EquipmentCatalogItem[]>>((acc, item) => {
                            if (!acc[item.category]) acc[item.category] = [];
                            acc[item.category].push(item);
                            return acc;
                          }, {})
                        ).sort(([a], [b]) => a.localeCompare(b)).map(([cat, items]) => (
                          <optgroup key={cat} label={cat}>
                            {items.map(item => (
                              <option key={item.id} value={item.id}>{item.name}</option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-black dark:text-white mb-1">Ko nosi *</label>
                      <select
                        required
                        value={equipmentFormData.carriedByUserId}
                        onChange={e => setEquipmentFormData(p => ({ ...p, carriedByUserId: e.target.value }))}
                        className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-black dark:text-white"
                      >
                        <option value="" disabled>— Izaberite člana —</option>
                        {members.map(m => (
                          <option key={m.userId} value={m.userId}>
                            {m.displayName}{m.isCurrentUser ? ' (ja)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-black dark:text-white mb-1">Količina</label>
                      <input
                        type="number"
                        min={1}
                        value={equipmentFormData.quantity}
                        onChange={e => setEquipmentFormData(p => ({ ...p, quantity: e.target.value }))}
                        className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-black dark:text-white"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-black dark:text-white mb-1">Napomena</label>
                      <textarea
                        value={equipmentFormData.note}
                        onChange={e => setEquipmentFormData(p => ({ ...p, note: e.target.value }))}
                        rows={3}
                        placeholder="Dodatne informacije..."
                        className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-black dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEquipmentForm(false);
                        setEditingEquipmentEntry(null);
                        setEquipmentFormData({ equipmentCatalogItemId: '', carriedByUserId: '', quantity: '1', note: '' });
                      }}
                      className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded text-black dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      Otkaži
                    </button>
                    <button
                      type="submit"
                      disabled={savingEquipment}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {savingEquipment ? 'Čuvam...' : editingEquipmentEntry ? 'Sačuvaj' : 'Dodaj'}
                    </button>
                  </div>
                </form>
              )}

              {/* Lista */}
              {!showEquipmentForm && (
                <div>
                  {loadingEquipment ? (
                    <p className="text-zinc-600 dark:text-zinc-400 text-sm">Učitavam...</p>
                  ) : equipmentEntries.length === 0 ? (
                    <div className="text-center py-10 text-zinc-500 dark:text-zinc-400">
                      <div className="text-4xl mb-3">🎒</div>
                      <p className="text-sm">Nema unesene opreme</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {Object.entries(
                        equipmentEntries.reduce<Record<string, TripEquipmentEntry[]>>((acc, e) => {
                          if (!acc[e.equipmentCategory]) acc[e.equipmentCategory] = [];
                          acc[e.equipmentCategory].push(e);
                          return acc;
                        }, {})
                      ).sort(([a], [b]) => a.localeCompare(b)).map(([category, entries]) => (
                        <div key={category}>
                          <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">{category}</p>
                          <div className="space-y-2">
                            {entries.map(entry => (
                              <div
                                key={entry.id}
                                onClick={() => openEquipmentEdit(entry)}
                                className="flex items-center justify-between border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-3 cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all duration-200 bg-white dark:bg-zinc-800"
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-black dark:text-white">
                                    {entry.equipmentName}
                                    {entry.quantity > 1 && <span className="ml-2 text-sm text-zinc-500">× {entry.quantity}</span>}
                                  </div>
                                  <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">👤 {entry.carriedByDisplayName}</div>
                                  {entry.note && <div className="text-xs text-zinc-400 italic mt-0.5">{entry.note}</div>}
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteEquipmentEntry(entry.id);
                                  }}
                                  className="ml-4 flex-shrink-0 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                  title="Obriši"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Floating Action Button */}
              {!showEquipmentForm && (
                <button
                  onClick={() => {
                    setEditingEquipmentEntry(null);
                    setEquipmentFormData({ equipmentCatalogItemId: '', carriedByUserId: '', quantity: '1', note: '' });
                    setShowEquipmentForm(true);
                  }}
                  className="fixed bottom-20 right-8 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-110 flex items-center justify-center z-50"
                  title="Dodaj opremu"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
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
                  onClick={() => setActiveTab('equipment')}
                  title="Oprema"
                  className={`flex-1 py-4 px-3 transition-colors border-b-2 ${
                    activeTab === 'equipment'
                      ? 'border-black dark:border-white text-black dark:text-white'
                      : 'border-transparent text-zinc-400 dark:text-zinc-600 hover:text-black dark:hover:text-white'
                  }`}
                >
                  <svg className="w-6 h-6 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                    <line x1="3" y1="6" x2="21" y2="6"/>
                    <path d="M16 10a4 4 0 0 1-8 0"/>
                  </svg>
                </button>
                <button
                  onClick={() => setActiveTab('emergency')}
                  title="Emergency podaci"
                  className={`flex-1 py-4 px-3 transition-colors border-b-2 ${
                    activeTab === 'emergency'
                      ? 'border-black dark:border-white text-black dark:text-white'
                      : 'border-transparent text-zinc-400 dark:text-zinc-600 hover:text-black dark:hover:text-white'
                  }`}
                >
                  <svg className="w-6 h-6 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
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
      </div>
    </div>
  );
}


