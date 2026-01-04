// API base URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://mototriporg-dev-api-cjf6c5a9dhfyf4h8.westeurope-01.azurewebsites.net';

// Types
export interface Trip {
  id: number;
  name: string;
  description?: string;
  startDate: string;
  endDate?: string;
  status: 'Planned' | 'Active' | 'Completed' | 'Cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface CreateTripDto {
  name: string;
  description?: string;
  startDate: string;
  endDate?: string;
  status?: 'Planned' | 'Active' | 'Completed' | 'Cancelled';
}

export interface Expense {
  id: number;
  date: string;
  category: string;
  description: string;
  amount: number;
  currency: string;
  isShared: boolean;
}

export interface CreateExpenseDto {
  date: string;
  category: string;
  description: string;
  amount: number;
  currency?: string;
  isShared: boolean;
}

export interface TripMember {
  userId: number;
  displayName: string;
  role: 'Owner' | 'Editor' | 'Viewer';
  joinedAt: string;
}

export interface AddMemberDto {
  email: string;
  role?: 'Editor' | 'Viewer';
}
export interface FuelEntry {
  id: number;
  tripId: number;
  date: string;
  quantity: number;
  amount: number;
  currency: string;
  unitPrice: number;
  mileage: number;
  location: string;
  note?: string;
  createdByUserId: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateFuelEntryDto {
  date: string;
  quantity: number;
  amount: number;
  currency: string;
  mileage: number;
  location: string;
  note?: string;
}

export interface UpdateFuelEntryDto {
  date: string;
  quantity: number;
  amount: number;
  currency: string;
  mileage: number;
  location: string;
  note?: string;
}

export interface AccommodationEntry {
  id: number;
  tripId: number;
  name: string;
  accommodationType: string;
  checkInDate: string;
  checkOutDate: string;
  amount: number;
  currency: string;
  location: string;
  note?: string;
  createdByUserId: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateAccommodationEntryDto {
  name: string;
  accommodationType: string;
  checkInDate: string;
  checkOutDate: string;
  amount: number;
  currency: string;
  location: string;
  note?: string;
}

export interface UpdateAccommodationEntryDto {
  name: string;
  accommodationType: string;
  checkInDate: string;
  checkOutDate: string;
  amount: number;
  currency: string;
  location: string;
  note?: string;
}

export interface ServiceEntry {
  id: number;
  tripId: number;
  serviceType: string;
  description: string;
  serviceDate: string;
  amount: number;
  currency: string;
  location: string;
  mileage?: number;
  note?: string;
  createdByUserId: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateServiceEntryDto {
  serviceType: string;
  description: string;
  serviceDate: string;
  amount: number;
  currency: string;
  location: string;
  mileage?: number;
  note?: string;
}

export interface UpdateServiceEntryDto {
  serviceType: string;
  description: string;
  serviceDate: string;
  amount: number;
  currency: string;
  location: string;
  mileage?: number;
  note?: string;
}

// Helper to get auth token
async function getAuthToken(): Promise<string | null> {
  try {
    const response = await fetch('/api/auth/me');
    if (response.ok) {
      const data = await response.json();
      return data.accessToken || null;
    }
  } catch (error) {
    console.error('Failed to get auth token:', error);
  }
  return null;
}

// Helper to build headers with optional auth token
async function buildHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  const token = await getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

// API calls
export const api = {
  // Get all trips
  async getTrips(): Promise<Trip[]> {
    const response = await fetch(`${API_URL}/api/trips`, {
      headers: await buildHeaders(),
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch trips: ${response.statusText}`);
    }

    return response.json();
  },

  // Get single trip
  async getTrip(id: number): Promise<Trip> {
    const response = await fetch(`${API_URL}/api/trips/${id}`, {
      headers: await buildHeaders(),
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch trip: ${response.statusText}`);
    }

    return response.json();
  },

  // Create trip
  async createTrip(data: CreateTripDto): Promise<Trip> {
    const response = await fetch(`${API_URL}/api/trips`, {
      method: 'POST',
      headers: await buildHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to create trip: ${response.statusText}`);
    }

    return response.json();
  },

  // Update trip
  async updateTrip(id: number, data: Partial<CreateTripDto>): Promise<void> {
    const response = await fetch(`${API_URL}/api/trips/${id}`, {
      method: 'PUT',
      headers: await buildHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to update trip: ${response.statusText}`);
    }
  },

  // Delete trip
  async deleteTrip(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/api/trips/${id}`, {
      method: 'DELETE',
      headers: await buildHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete trip: ${response.statusText}`);
    }
  },

  // Get all expenses for a trip
  async getExpenses(tripId: number): Promise<Expense[]> {
    const response = await fetch(`${API_URL}/api/trips/${tripId}/expenses`, {
      headers: await buildHeaders(),
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch expenses: ${response.statusText}`);
    }

    return response.json();
  },

  // Get single expense
  async getExpense(tripId: number, id: number): Promise<Expense> {
    const response = await fetch(`${API_URL}/api/trips/${tripId}/expenses/${id}`, {
      headers: await buildHeaders(),
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch expense: ${response.statusText}`);
    }

    return response.json();
  },

  // Create expense
  async createExpense(tripId: number, data: CreateExpenseDto): Promise<Expense> {
    const response = await fetch(`${API_URL}/api/trips/${tripId}/expenses`, {
      method: 'POST',
      headers: await buildHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to create expense: ${response.statusText}`);
    }

    return response.json();
  },

  // Update expense
  async updateExpense(tripId: number, id: number, data: Partial<CreateExpenseDto>): Promise<void> {
    const response = await fetch(`${API_URL}/api/trips/${tripId}/expenses/${id}`, {
      method: 'PUT',
      headers: await buildHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to update expense: ${response.statusText}`);
    }
  },

  // Delete expense
  async deleteExpense(tripId: number, id: number): Promise<void> {
    const response = await fetch(`${API_URL}/api/trips/${tripId}/expenses/${id}`, {
      method: 'DELETE',
      headers: await buildHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete expense: ${response.statusText}`);
    }
  },

  // Get trip members
  async getMembers(tripId: number): Promise<TripMember[]> {
    const response = await fetch(`${API_URL}/api/trips/${tripId}/members`, {
      headers: await buildHeaders(),
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch members: ${response.statusText}`);
    }

    return response.json();
  },

  // Add member to trip
  async addMember(tripId: number, data: AddMemberDto): Promise<void> {
    const response = await fetch(`${API_URL}/api/trips/${tripId}/members`, {
      method: 'POST',
      headers: await buildHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to add member: ${response.statusText}`);
    }
  },

  // Remove member from trip
  async removeMember(tripId: number, userId: number): Promise<void> {
    const response = await fetch(`${API_URL}/api/trips/${tripId}/members/${userId}`, {
      method: 'DELETE',
      headers: await buildHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to remove member: ${response.statusText}`);
    }
  },

  // Get fuel entries
  async getFuelEntries(tripId: number): Promise<FuelEntry[]> {
    const response = await fetch(`${API_URL}/api/trips/${tripId}/fuel-entries`, {
      headers: await buildHeaders(),
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch fuel entries: ${response.statusText}`);
    }

    return response.json();
  },

  // Get single fuel entry
  async getFuelEntry(tripId: number, id: number): Promise<FuelEntry> {
    const response = await fetch(`${API_URL}/api/trips/${tripId}/fuel-entries/${id}`, {
      headers: await buildHeaders(),
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch fuel entry: ${response.statusText}`);
    }

    return response.json();
  },

  // Create fuel entry
  async createFuelEntry(tripId: number, data: CreateFuelEntryDto): Promise<FuelEntry> {
    const response = await fetch(`${API_URL}/api/trips/${tripId}/fuel-entries`, {
      method: 'POST',
      headers: await buildHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to create fuel entry: ${response.statusText}`);
    }

    return response.json();
  },

  // Update fuel entry
  async updateFuelEntry(tripId: number, id: number, data: UpdateFuelEntryDto): Promise<FuelEntry> {
    const response = await fetch(`${API_URL}/api/trips/${tripId}/fuel-entries/${id}`, {
      method: 'PUT',
      headers: await buildHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to update fuel entry: ${response.statusText}`);
    }

    return response.json();
  },

  // Delete fuel entry
  async deleteFuelEntry(tripId: number, id: number): Promise<void> {
    const response = await fetch(`${API_URL}/api/trips/${tripId}/fuel-entries/${id}`, {
      method: 'DELETE',
      headers: await buildHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete fuel entry: ${response.statusText}`);
    }
  },

  // Get accommodation entries
  async getAccommodationEntries(tripId: number): Promise<AccommodationEntry[]> {
    const response = await fetch(`${API_URL}/api/trips/${tripId}/accommodations`, {
      headers: await buildHeaders(),
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch accommodation entries: ${response.statusText}`);
    }

    return response.json();
  },

  // Get single accommodation entry
  async getAccommodationEntry(tripId: number, id: number): Promise<AccommodationEntry> {
    const response = await fetch(`${API_URL}/api/trips/${tripId}/accommodations/${id}`, {
      headers: await buildHeaders(),
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch accommodation entry: ${response.statusText}`);
    }

    return response.json();
  },

  // Create accommodation entry
  async createAccommodationEntry(tripId: number, data: CreateAccommodationEntryDto): Promise<AccommodationEntry> {
    const response = await fetch(`${API_URL}/api/trips/${tripId}/accommodations`, {
      method: 'POST',
      headers: await buildHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to create accommodation entry: ${response.statusText}`);
    }

    return response.json();
  },

  // Update accommodation entry
  async updateAccommodationEntry(tripId: number, id: number, data: UpdateAccommodationEntryDto): Promise<AccommodationEntry> {
    const response = await fetch(`${API_URL}/api/trips/${tripId}/accommodations/${id}`, {
      method: 'PUT',
      headers: await buildHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to update accommodation entry: ${response.statusText}`);
    }

    return response.json();
  },

  // Delete accommodation entry
  async deleteAccommodationEntry(tripId: number, id: number): Promise<void> {
    const response = await fetch(`${API_URL}/api/trips/${tripId}/accommodations/${id}`, {
      method: 'DELETE',
      headers: await buildHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete accommodation entry: ${response.statusText}`);
    }
  },

  // Service Entries
  async getServiceEntries(tripId: number): Promise<ServiceEntry[]> {
    const response = await fetch(`${API_URL}/api/trips/${tripId}/services`, {
      headers: await buildHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch service entries: ${response.statusText}`);
    }

    return response.json();
  },

  async getServiceEntry(tripId: number, id: number): Promise<ServiceEntry> {
    const response = await fetch(`${API_URL}/api/trips/${tripId}/services/${id}`, {
      headers: await buildHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch service entry: ${response.statusText}`);
    }

    return response.json();
  },

  async createServiceEntry(tripId: number, data: CreateServiceEntryDto): Promise<ServiceEntry> {
    const response = await fetch(`${API_URL}/api/trips/${tripId}/services`, {
      method: 'POST',
      headers: await buildHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to create service entry: ${response.statusText}`);
    }

    return response.json();
  },

  async updateServiceEntry(tripId: number, id: number, data: UpdateServiceEntryDto): Promise<void> {
    const response = await fetch(`${API_URL}/api/trips/${tripId}/services/${id}`, {
      method: 'PUT',
      headers: await buildHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to update service entry: ${response.statusText}`);
    }
  },

  async deleteServiceEntry(tripId: number, id: number): Promise<void> {
    const response = await fetch(`${API_URL}/api/trips/${tripId}/services/${id}`, {
      method: 'DELETE',
      headers: await buildHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete service entry: ${response.statusText}`);
    }
  },
};
