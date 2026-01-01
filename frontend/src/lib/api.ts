import { apiClient } from './api-client';
import type {
  User,
  Trip,
  Stage,
  Item,
  Expense,
  CreateTripRequest,
  UpdateTripRequest,
  CreateStageRequest,
  UpdateStageRequest,
  CreateItemRequest,
  UpdateItemRequest,
  CreateExpenseRequest,
  AddTripMemberRequest,
  UpdateTripMemberRequest,
  BootstrapRequest,
} from '@/types/api';

// User API
export const userApi = {
  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<User>('/me');
    return response.data;
  },

  bootstrap: async (data: BootstrapRequest): Promise<User> => {
    const response = await apiClient.post<User>('/me/bootstrap', data);
    return response.data;
  },
};

// Trips API
export const tripsApi = {
  getAll: async (): Promise<Trip[]> => {
    const response = await apiClient.get<Trip[]>('/trips');
    return response.data;
  },

  getById: async (id: number): Promise<Trip> => {
    const response = await apiClient.get<Trip>(`/trips/${id}`);
    return response.data;
  },

  create: async (data: CreateTripRequest): Promise<Trip> => {
    const response = await apiClient.post<Trip>('/trips', data);
    return response.data;
  },

  update: async (id: number, data: UpdateTripRequest): Promise<Trip> => {
    const response = await apiClient.put<Trip>(`/trips/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/trips/${id}`);
  },

  addMember: async (tripId: number, data: AddTripMemberRequest): Promise<void> => {
    await apiClient.post(`/trips/${tripId}/members`, data);
  },

  updateMember: async (
    tripId: number,
    memberId: number,
    data: UpdateTripMemberRequest
  ): Promise<void> => {
    await apiClient.put(`/trips/${tripId}/members/${memberId}`, data);
  },

  removeMember: async (tripId: number, memberId: number): Promise<void> => {
    await apiClient.delete(`/trips/${tripId}/members/${memberId}`);
  },
};

// Stages API
export const stagesApi = {
  create: async (tripId: number, data: CreateStageRequest): Promise<Stage> => {
    const response = await apiClient.post<Stage>(`/trips/${tripId}/stages`, data);
    return response.data;
  },

  update: async (tripId: number, stageId: number, data: UpdateStageRequest): Promise<Stage> => {
    const response = await apiClient.put<Stage>(`/trips/${tripId}/stages/${stageId}`, data);
    return response.data;
  },

  delete: async (tripId: number, stageId: number): Promise<void> => {
    await apiClient.delete(`/trips/${tripId}/stages/${stageId}`);
  },
};

// Items API
export const itemsApi = {
  create: async (tripId: number, stageId: number, data: CreateItemRequest): Promise<Item> => {
    const response = await apiClient.post<Item>(
      `/trips/${tripId}/stages/${stageId}/items`,
      data
    );
    return response.data;
  },

  update: async (
    tripId: number,
    stageId: number,
    itemId: number,
    data: UpdateItemRequest
  ): Promise<Item> => {
    const response = await apiClient.put<Item>(
      `/trips/${tripId}/stages/${stageId}/items/${itemId}`,
      data
    );
    return response.data;
  },

  delete: async (tripId: number, stageId: number, itemId: number): Promise<void> => {
    await apiClient.delete(`/trips/${tripId}/stages/${stageId}/items/${itemId}`);
  },
};

// Expenses API
export const expensesApi = {
  getAll: async (tripId: number): Promise<Expense[]> => {
    const response = await apiClient.get<Expense[]>(`/trips/${tripId}/expenses`);
    return response.data;
  },

  create: async (tripId: number, data: CreateExpenseRequest): Promise<Expense> => {
    const response = await apiClient.post<Expense>(`/trips/${tripId}/expenses`, data);
    return response.data;
  },

  delete: async (tripId: number, expenseId: number): Promise<void> => {
    await apiClient.delete(`/trips/${tripId}/expenses/${expenseId}`);
  },
};
