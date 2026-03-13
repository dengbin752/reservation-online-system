import type { Request } from "express";
import type {
	AuthResponse,
	PaginatedResponse,
	Reservation,
	Table,
	User,
} from "../types/index.js";

export interface AuthenticatedRequest extends Request {
	user?: User;
}

export interface IAuthService {
	login(email: string, password: string): Promise<AuthResponse>;
	register(userData: any): Promise<AuthResponse>;
	refreshToken(email: string, refreshToken: string): Promise<AuthResponse>;
	logout(token: string): Promise<void>;
	getUserById(id: string): Promise<User | null>;
	getUserByEmail(email: string): Promise<User | null>;
}

export interface IReservationService {
	createReservation(input: any): Promise<Reservation>;
	getReservation(id: string): Promise<Reservation | null>;
	getReservations(
		filters: any,
		pagination: any,
	): Promise<PaginatedResponse<Reservation>>;
	updateReservation(id: string, input: any): Promise<Reservation>;
	cancelReservation(id: string): Promise<Reservation>;
	updateReservationStatus(id: string, status: string): Promise<Reservation>;
	getAvailableTables(
		date: Date,
		time: string,
		partySize: number,
	): Promise<Table[]>;
	getCustomerReservations(customerId: string): Promise<Reservation[]>;
}

export interface ITableService {
	createTable(input: any): Promise<Table>;
	getTable(id: string): Promise<Table | null>;
	getTables(): Promise<Table[]>;
	updateTable(id: string, input: any): Promise<Table>;
	deleteTable(id: string): Promise<void>;
	updateTableStatus(id: string, status: string): Promise<Table>;
}

export interface IUserService {
	createUser(userData: any): Promise<User>;
	getUser(id: string): Promise<User | null>;
	getUsers(): Promise<User[]>;
	updateUser(id: string, userData: any): Promise<User>;
	deleteUser(id: string): Promise<void>;
}

export interface ICouchbaseService {
	connect(): Promise<void>;
	disconnect(): Promise<void>;
	getBucket(): any;
	query(query: string, params?: any): Promise<any>;
	upsert(document: any, id?: string): Promise<any>;
	get(id: string): Promise<any>;
	delete(id: string): Promise<void>;
	createIndex(name: string, fields: string[]): Promise<void>;
}

export interface IEmailService {
	sendReservationConfirmation(reservation: Reservation): Promise<void>;
	sendReservationCancellation(reservation: Reservation): Promise<void>;
	sendReservationReminder(reservation: Reservation): Promise<void>;
}

export interface ApiResponse<T = any> {
	success: boolean;
	data?: T;
	message?: string;
	error?: string;
}

export interface GraphQLContext {
	req: AuthenticatedRequest;
	user?: User;
	services: {
		authService: IAuthService;
		reservationService: IReservationService;
		tableService: ITableService;
		userService: IUserService;
		couchbaseService: ICouchbaseService;
	};
}

export interface ValidationSchema {
	body?: any;
	params?: any;
	query?: any;
}

export interface PaginationOptions {
	page: number;
	limit: number;
	sortBy: string;
	sortOrder: "asc" | "desc";
}

export interface SearchOptions {
	query: string;
	fields: string[];
	fuzzy?: boolean;
}
