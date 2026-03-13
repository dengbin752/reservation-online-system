// Mock for shared module in database package

// Define enums locally for testing
export enum UserRole {
	CUSTOMER = "CUSTOMER",
	ADMIN = "ADMIN",
	STAFF = "STAFF",
}

export enum ReservationStatus {
	PENDING = "PENDING",
	CONFIRMED = "CONFIRMED",
	CANCELLED = "CANCELLED",
	COMPLETED = "COMPLETED",
}

export enum TableStatus {
	AVAILABLE = "AVAILABLE",
	OCCUPIED = "OCCUPIED",
	RESERVED = "RESERVED",
	MAINTENANCE = "MAINTENANCE",
}

// User interface
export interface User {
	id: string;
	email: string;
	firstName: string;
	lastName: string;
	password?: string;
	phone?: string;
	role: string;
	refreshToken?: string;
	createdAt?: Date;
	updatedAt?: Date;
}

// Table interface
export interface Table {
	id: string;
	number: number;
	capacity: number;
	location: string;
	status: TableStatus;
	createdAt?: Date;
	updatedAt?: Date;
}

// Reservation interface
export interface Reservation {
	id: string;
	customerId: string;
	tableId: string;
	date: string;
	time: string;
	partySize: number;
	status: ReservationStatus;
	specialRequests?: string;
	contactInfo?: string;
	title?: string;
	createdAt?: Date;
	updatedAt?: Date;
}
