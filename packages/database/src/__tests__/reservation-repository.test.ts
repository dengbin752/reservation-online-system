/**
 * Unit tests for ReservationRepository
 * @package @database/reservation-system
 */

import { ReservationStatus } from "@shared/reservation-system";

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
		return this.cluster.bucket("default").collection("reservations");
	}
}

// Import after mocking
import { ReservationRepository } from "../repositories/reservation-repository.js";
import type { ReservationModel } from "../models/reservation.js";

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
	toBeGreaterThanOrEqual: (expected: number) => void;
	toBeGreaterThan: (expected: number) => void;
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

describe("ReservationRepository", () => {
	let repository: ReservationRepository;
	let connection: MockCouchbaseConnection;

	beforeEach(async () => {
		connection = new MockCouchbaseConnection();
		await connection.connect();
		repository = new ReservationRepository(connection as any);
	});

	afterEach(async () => {
		await connection.disconnect();
	});

	describe("create", () => {
		it("should create a new reservation", async () => {
			const reservationData: Partial<ReservationModel> = {
				customerId: "customer-123",
				tableId: "table-456",
				date: new Date("2024-01-15"),
				time: "18:00",
				partySize: 4,
				status: ReservationStatus.PENDING,
				contactInfo: "+1234567890",
			};

			const result = await repository.create(reservationData);

			expect(result).toBeTruthy();
			expect(result.customerId).toBe(reservationData.customerId);
			expect(result.tableId).toBe(reservationData.tableId);
			expect(result.date).toBe(reservationData.date);
			expect(result.time).toBe(reservationData.time);
			expect(result.partySize).toBe(reservationData.partySize);
			expect(result.status).toBe(ReservationStatus.PENDING);
		});
	});

	describe("findById", () => {
		it("should find reservation by id", async () => {
			const reservationData: Partial<ReservationModel> = {
				id: "res-123",
				customerId: "customer-123",
				tableId: "table-456",
				date: new Date("2024-01-15"),
				time: "18:00",
				partySize: 4,
				status: ReservationStatus.PENDING,
			};

			await repository.create(reservationData);
			const result = await repository.findById("res-123");

			expect(result).toBeTruthy();
			expect(result?.customerId).toBe(reservationData.customerId);
		});

		it("should return null for non-existent id", async () => {
			const result = await repository.findById("non-existent-id");
			expect(result).toBeNull();
		});
	});

	describe("updateStatusById", () => {
		it("should update reservation status", async () => {
			const reservationData: Partial<ReservationModel> = {
				id: "status-test-res",
				customerId: "customer-123",
				tableId: "table-456",
				date: new Date("2024-01-15"),
				time: "18:00",
				partySize: 4,
				status: ReservationStatus.PENDING,
			};

			await repository.create(reservationData);
			const result = await repository.updateStatusById(
				"status-test-res",
				ReservationStatus.CONFIRMED
			);

			expect(result).toBeTruthy();
			expect(result?.status).toBe(ReservationStatus.CONFIRMED);
		});
	});

	describe("findByCustomerId", () => {
		it("should find reservations by customer id", async () => {
			const customerId = "customer-789";

			// Create multiple reservations for same customer
			await repository.create({
				customerId,
				tableId: "table-1",
				date: new Date("2024-01-15"),
				time: "18:00",
				partySize: 2,
				status: ReservationStatus.PENDING,
			});

			await repository.create({
				customerId,
				tableId: "table-2",
				date: new Date("2024-01-16"),
				time: "19:00",
				partySize: 4,
				status: ReservationStatus.CONFIRMED,
			});

			const results = await repository.findByCustomerId(customerId);

			expect(results).toBeTruthy();
			expect(results.length).toBeGreaterThanOrEqual(2);
		});
	});

	describe("findByTableId", () => {
		it("should find reservations by table id", async () => {
			const tableId = "table-999";

			await repository.create({
				customerId: "customer-1",
				tableId,
				date: new Date("2024-01-20"),
				time: "20:00",
				partySize: 4,
				status: ReservationStatus.PENDING,
			});

			const results = await repository.findByTableId(tableId);

			expect(results).toBeTruthy();
			expect(results.length).toBeGreaterThanOrEqual(1);
		});
	});

	describe("deleteByDocId", () => {
		it("should delete reservation by doc id", async () => {
			const reservationData: Partial<ReservationModel> = {
				id: "delete-test-res",
				customerId: "customer-123",
				tableId: "table-456",
				date: new Date("2024-01-15"),
				time: "18:00",
				partySize: 4,
				status: ReservationStatus.PENDING,
			};

			await repository.create(reservationData);

			// Delete the reservation
			await repository.deleteByDocId("delete-test-res");

			// Verify it's deleted
			const result = await repository.findById("delete-test-res");
			expect(result).toBeNull();
		});
	});
});
