/**
 * Unit tests for UserRepository
 * @package @database/reservation-system
 */

import { UserRole } from "@shared/reservation-system";

// Mock CouchbaseConnection
class MockCollection {
	private data: Map<string, any> = new Map();

	async get(id: string): Promise<any> {
		const doc = this.data.get(id);
		if (!doc) {
			const error = new Error("document_not_found") as any;
			error.code = "document_not_found";
			throw error;
		}
		return { content: doc };
	}

	async upsert(id: string, doc: any): Promise<any> {
		this.data.set(id, doc);
		return { id };
	}

	async remove(id: string): Promise<void> {
		this.data.delete(id);
	}

	async exists(id: string): Promise<boolean> {
		return this.data.has(id);
	}
}

class MockBucket {
	private collections: Map<string, MockCollection> = new Map();

	collection(name: string): MockCollection {
		if (!this.collections.has(name)) {
			this.collections.set(name, new MockCollection());
		}
		return this.collections.get(name)!;
	}
}

class MockCluster {
	private buckets: Map<string, MockBucket> = new Map();
	private connected = false;

	async connect(connectionString: string, options: any): Promise<void> {
		this.connected = true;
	}

	async disconnect(): Promise<void> {
		this.connected = false;
	}

	bucket(name: string): MockBucket {
		if (!this.buckets.has(name)) {
			this.buckets.set(name, new MockBucket());
		}
		return this.buckets.get(name)!;
	}

	isConnected(): boolean {
		return this.connected;
	}
}

// Mock CouchbaseConnection class
class MockCouchbaseConnection {
	private cluster: MockCluster | null = null;
	connected = false;

	async connect(): Promise<void> {
		this.cluster = new MockCluster();
		await this.cluster.connect("mock://localhost", {
			username: "admin",
			password: "password",
		});
		this.connected = true;
	}

	async disconnect(): Promise<void> {
		if (this.cluster) {
			await this.cluster.disconnect();
		}
		this.connected = false;
	}

	getCollection(): MockCollection {
		if (!this.cluster) {
			throw new Error("Not connected");
		}
		return this.cluster.bucket("default").collection("users");
	}
}

// Import after mocking
import { UserRepository } from "../repositories/user-repository.js";
import type { UserModel } from "../models/user.js";

// Jest globals
declare const describe: (name: string, fn: () => void) => void;
declare const it: (name: string, fn: () => void | Promise<void>) => void;
declare const expect: (actual: any) => {
	toBe: (expected: any) => void;
	toEqual: (expected: any) => void;
	toBeTruthy: () => void;
	toBeFalsy: () => void;
	toBeNull: () => void;
	toContain: (expected: any) => void;
	toBeUndefined: () => void;
	toThrow: () => void;
	not: {
		toBe: (expected: any) => void;
		toBeNull: () => void;
		toThrow: () => void;
		toBeUndefined: () => void;
	};
};
declare const beforeEach: (fn: () => void | Promise<void>) => void;
declare const afterEach: (fn: () => void | Promise<void>) => void;
declare const jest: {
	fn: () => any;
	setTimeout: (timeout: number) => void;
};

describe("UserRepository", () => {
	let repository: UserRepository;
	let connection: MockCouchbaseConnection;

	beforeEach(async () => {
		connection = new MockCouchbaseConnection();
		await connection.connect();
		repository = new UserRepository(connection as any);
	});

	afterEach(async () => {
		await connection.disconnect();
	});

	describe("create", () => {
		it("should create a new user", async () => {
			const userData: Partial<UserModel> = {
				email: "test@example.com",
				firstName: "John",
				lastName: "Doe",
				password: "hashed_password",
				phone: "+1234567890",
				role: UserRole.CUSTOMER,
			};

			const result = await repository.create(userData);

			expect(result).toBeTruthy();
			expect(result.email).toBe(userData.email);
			expect(result.firstName).toBe(userData.firstName);
			expect(result.lastName).toBe(userData.lastName);
			expect(result.password).toBe(userData.password);
		});
	});

	describe("findById", () => {
		it("should find user by id", async () => {
			const userData: Partial<UserModel> = {
				id: "test-id-123",
				email: "test@example.com",
				firstName: "John",
				lastName: "Doe",
				password: "hashed_password",
				role: UserRole.CUSTOMER,
			};

			await repository.create(userData);
			const result = await repository.findById("test-id-123");

			expect(result).toBeTruthy();
			expect(result?.email).toBe(userData.email);
		});

		it("should return null for non-existent id", async () => {
			const result = await repository.findById("non-existent-id");
			expect(result).toBeNull();
		});
	});

	describe("findByEmail", () => {
		it("should find user by email", async () => {
			const userData: Partial<UserModel> = {
				email: "unique@test.com",
				firstName: "Jane",
				lastName: "Smith",
				password: "hashed_password",
				role: UserRole.CUSTOMER,
			};

			await repository.create(userData);
			const result = await repository.findByEmail("unique@test.com");

			expect(result).toBeTruthy();
			expect(result?.firstName).toBe("Jane");
		});

		it("should return null for non-existent email", async () => {
			const result = await repository.findByEmail("nonexistent@example.com");
			expect(result).toBeNull();
		});
	});

	describe("update", () => {
		it("should update user fields", async () => {
			const userData: Partial<UserModel> = {
				id: "update-test-id",
				email: "update@example.com",
				firstName: "Original",
				lastName: "Name",
				password: "hashed_password",
				role: UserRole.CUSTOMER,
			};

			await repository.create(userData);
			const updated = await repository.update("update-test-id", {
				firstName: "Updated",
			});

			expect(updated.firstName).toBe("Updated");
			expect(updated.lastName).toBe("Name");
		});
	});

	describe("existsByEmail", () => {
		it("should return true if email exists", async () => {
			const userData: Partial<UserModel> = {
				email: "exists@test.com",
				firstName: "Test",
				lastName: "User",
				password: "hashed_password",
				role: UserRole.CUSTOMER,
			};

			await repository.create(userData);
			const exists = await repository.existsByEmail("exists@test.com");

			expect(exists).toBeTruthy();
		});

		it("should return false if email does not exist", async () => {
			const exists = await repository.existsByEmail("nonexistent@test.com");
			expect(exists).toBeFalsy();
		});
	});
});
