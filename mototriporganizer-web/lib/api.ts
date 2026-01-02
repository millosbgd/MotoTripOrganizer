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

// Helper to get auth token from cookie
async function getAuthToken(): Promise<string | null> {
  try {
    const response = await fetch('/api/me');
    if (response.ok) {
      const data = await response.json();
      // For now, we'll handle token separately
      return null; // TODO: Implement token retrieval
    }
  } catch (error) {
    console.error('Failed to get auth token:', error);
  }
  return null;
}

// API calls
export const api = {
  // Get all trips
  async getTrips(): Promise<Trip[]> {
    const response = await fetch(`${API_URL}/api/trips`, {
      headers: {
        'Content-Type': 'application/json',
      },
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
      headers: {
        'Content-Type': 'application/json',
      },
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
      headers: {
        'Content-Type': 'application/json',
      },
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
      headers: {
        'Content-Type': 'application/json',
      },
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
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete trip: ${response.statusText}`);
    }
  },
};
