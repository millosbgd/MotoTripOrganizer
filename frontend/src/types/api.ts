// TypeScript types for API models

export interface User {
  id: number;
  auth0Subject: string;
  displayName: string;
  createdAt: string;
}

export interface Trip {
  id: number;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  ownerId: number;
  createdAt: string;
  updatedAt: string;
  stages: Stage[];
  members: TripMember[];
}

export interface TripMember {
  id: number;
  tripId: number;
  userId: number;
  role: 'Owner' | 'Editor' | 'Viewer';
  joinedAt: string;
  user: User;
}

export interface Stage {
  id: number;
  tripId: number;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
  items: Item[];
}

export interface Item {
  id: number;
  stageId: number;
  type: 'Accommodation' | 'Activity' | 'Transport' | 'Food' | 'Other';
  name: string;
  description: string | null;
  location: string | null;
  startTime: string | null;
  endTime: string | null;
  estimatedCost: number | null;
  actualCost: number | null;
  notes: string | null;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: number;
  tripId: number;
  itemId: number | null;
  paidByUserId: number;
  amount: number;
  currency: string;
  description: string;
  expenseDate: string;
  createdAt: string;
  updatedAt: string;
  paidByUser: User;
  item: Item | null;
  splits: ExpenseSplit[];
}

export interface ExpenseSplit {
  id: number;
  expenseId: number;
  userId: number;
  amount: number;
  isPaid: boolean;
  user: User;
}

export interface Attachment {
  id: number;
  tripId: number;
  stageId: number | null;
  itemId: number | null;
  fileName: string;
  fileSize: number;
  contentType: string;
  blobUrl: string;
  uploadedByUserId: number;
  uploadedAt: string;
}

// DTOs for API requests
export interface CreateTripRequest {
  name: string;
  description?: string;
  startDate: string;
  endDate?: string;
}

export interface UpdateTripRequest {
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
}

export interface CreateStageRequest {
  name: string;
  description?: string;
  startDate: string;
  endDate?: string;
  orderIndex: number;
}

export interface UpdateStageRequest {
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  orderIndex?: number;
}

export interface CreateItemRequest {
  type: 'Accommodation' | 'Activity' | 'Transport' | 'Food' | 'Other';
  name: string;
  description?: string;
  location?: string;
  startTime?: string;
  endTime?: string;
  estimatedCost?: number;
  actualCost?: number;
  notes?: string;
  orderIndex: number;
}

export interface UpdateItemRequest {
  type?: 'Accommodation' | 'Activity' | 'Transport' | 'Food' | 'Other';
  name?: string;
  description?: string;
  location?: string;
  startTime?: string;
  endTime?: string;
  estimatedCost?: number;
  actualCost?: number;
  notes?: string;
  orderIndex?: number;
}

export interface CreateExpenseRequest {
  itemId?: number;
  amount: number;
  currency: string;
  description: string;
  expenseDate: string;
  splits: { userId: number; amount: number }[];
}

export interface AddTripMemberRequest {
  userEmail: string;
  role: 'Editor' | 'Viewer';
}

export interface UpdateTripMemberRequest {
  role: 'Editor' | 'Viewer';
}

export interface BootstrapRequest {
  displayName: string;
}
