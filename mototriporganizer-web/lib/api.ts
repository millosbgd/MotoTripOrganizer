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
}

export interface CreateExpenseDto {
  date: string;
  category: string;
  description: string;
  amount: number;
  currency?: string;
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
};
