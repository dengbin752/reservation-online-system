export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN',
  STAFF = 'STAFF'
}

export enum ReservationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  NO_SHOW = 'NO_SHOW'
}

export enum TableStatus {
  AVAILABLE = 'AVAILABLE',
  RESERVED = 'RESERVED',
  OCCUPIED = 'OCCUPIED',
  MAINTENANCE = 'MAINTENANCE'
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface Customer extends User {
  role: UserRole.CUSTOMER;
}

export interface Staff extends User {
  role: UserRole.ADMIN | UserRole.STAFF;
}

export interface Table {
  id: string;
  number: number;
  capacity: number;
  location: string;
  status: TableStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Reservation {
  id: string;
  title?: string;
  customerId: string;
  tableId: string;
  date: Date;
  time: string;
  partySize: number;
  status: ReservationStatus;
  contactInfo?: string;
  specialRequests?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export interface CreateReservationInput {
  customerId: string;
  tableId: string;
  date: Date;
  time: string;
  partySize: number;
  title?: string;
  contactInfo?: string;
  specialRequests?: string;
}

export interface UpdateReservationInput {
  tableId?: string;
  date?: Date;
  time?: string;
  partySize?: number;
  specialRequests?: string;
  status?: ReservationStatus;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface AvailableTablesQuery {
  date: Date;
  time: string;
  partySize: number;
}

export interface ReservationFilters {
  status?: ReservationStatus;
  date?: Date;
  customerId?: string;
  tableId?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}