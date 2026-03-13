// Mock for database module
// This provides mock implementations for testing

import { UserRole } from "@shared/reservation-system";

// Mock UserModel
export interface MockUser {
	id: string;
	email: string;
	firstName: string;
	lastName: string;
	password?: string;
	phone?: string;
	role: UserRole;
	refreshToken?: string;
	createdAt?: Date;
	updatedAt?: Date;
}

// In-memory user store for testing
export const mockUsers: Map<string, MockUser> = new Map();

// Mock UserRepository
export class MockUserRepository {
	async create(userData: Partial<MockUser>): Promise<MockUser> {
		const user: MockUser = {
			id: userData.id || "test-id",
			email: userData.email || "",
			firstName: userData.firstName || "",
			lastName: userData.lastName || "",
			password: userData.password,
			phone: userData.phone,
			role: userData.role || UserRole.CUSTOMER,
			refreshToken: userData.refreshToken,
			createdAt: new Date(),
			updatedAt: new Date(),
		};
		mockUsers.set(user.email, user);
		return user;
	}

	async findById(id: string): Promise<MockUser | null> {
		for (const user of mockUsers.values()) {
			if (user.id === id) return user;
		}
		return null;
	}

	async findByEmail(email: string): Promise<MockUser | null> {
		return mockUsers.get(email) || null;
	}

	async update(id: string, updates: Partial<MockUser>): Promise<MockUser> {
		const user = await this.findById(id);
		if (!user) throw new Error("User not found");
		const updated = { ...user, ...updates, updatedAt: new Date() };
		mockUsers.set(user.email, updated);
		return updated;
	}

	async updateByDocId(id: string, updates: Partial<MockUser>): Promise<MockUser | null> {
		const user = await this.findById(id);
		if (!user) return null;
		const updated = { ...user, ...updates, updatedAt: new Date() };
		mockUsers.set(user.email, updated);
		return updated;
	}
}

// Mock CouchbaseConnection
export class MockCouchbaseConnection {
	private connected = false;

	async connect(): Promise<void> {
		this.connected = true;
	}

	async disconnect(): Promise<void> {
		this.connected = false;
	}

	isConnected(): boolean {
		return this.connected;
	}
}

// Factory functions
export const createCouchbaseConnection = (): MockCouchbaseConnection => {
	return new MockCouchbaseConnection();
};

export const UserRepository = MockUserRepository;

// Export types
export type UserModel = MockUser;
