import type { ICouchbaseService } from "@shared/reservation-system";
import {
	type Bucket,
	Cluster,
	type Collection,
	type QueryOptions,
} from "couchbase";
import { randomUUID } from "crypto";

export class CouchbaseConnection implements ICouchbaseService {
	private cluster: Cluster | null = null;
	private bucket: Bucket | null = null;
	private collection: Collection | null = null;
	private connected: boolean = false;
	private connecting: Promise<void> | null = null;

	constructor(
		private connectionString: string,
		private username: string,
		private password: string,
		private bucketName: string = "reservations",
	) {}

	// create index is also in .sh file, so here we just throw an error
	createIndex(name: string, fields: string[]): Promise<void> {
		throw new Error("Method not implemented.");
	}

	// Auto-connect if not connected, with promise caching to prevent multiple concurrent connections
	private async ensureConnected(): Promise<void> {
		if (this.connected && this.cluster) {
			return;
		}

		// If already connecting, wait for that connection to complete
		if (this.connecting) {
			await this.connecting;
			return;
		}

		// Start a new connection
		this.connecting = this.connect();
		await this.connecting;
		this.connecting = null;
	}

	async connect(): Promise<void> {
		// Prevent duplicate connections
		if (this.connected && this.cluster) {
			return;
		}

		try {
			const options = {
				username: this.username,
				password: this.password,
				timeout: 30000,
				configTimeout: 30000,
			};

			this.cluster = await Cluster.connect(this.connectionString, options);

			if (!this.cluster) {
				throw new Error("Failed to connect to Couchbase cluster");
			}

			this.bucket = this.cluster.bucket(this.bucketName);
			this.collection = this.bucket.defaultCollection();

			if (!this.bucket || !this.collection) {
				throw new Error("Failed to get bucket and collection");
			}

			this.connected = true;

			console.log(`Connected to Couchbase cluster: ${this.connectionString}`);
			console.log(`Using bucket: ${this.bucketName}`);
		} catch (error) {
			this.connected = false;
			this.connecting = null;
			console.error("Failed to connect to Couchbase:", error);
			throw error;
		}
	}

	async disconnect(): Promise<void> {
		try {
			if (this.cluster) {
				await this.cluster.close();
				this.cluster = null;
				this.bucket = null;
				this.collection = null;
				this.connected = false;
				console.log("Disconnected from Couchbase");
			}
		} catch (error) {
			console.error("Failed to disconnect from Couchbase:", error);
			throw error;
		}
	}

	getBucket(): Bucket {
		if (!this.bucket) {
			throw new Error("Bucket not available. Please connect first.");
		}
		return this.bucket;
	}

	getCollection(): Collection {
		if (!this.collection) {
			throw new Error("Collection not available. Please connect first.");
		}
		return this.collection;
	}

	async query(query: string, params?: any): Promise<any> {
		await this.ensureConnected();

		try {
			const options: QueryOptions = {};
			if (params) {
				options.parameters = params;
			}

			const result = await this.cluster!.query(query, options);
			return result.rows;
		} catch (error) {
			console.error("Query failed:", error);
			throw error;
		}
	}

	async upsert(document: any, id?: string): Promise<any> {
		await this.ensureConnected();

		try {
			const documentId = id || this.generateDocumentId();
			const result = await this.collection!.upsert(documentId, document);
			return { id: documentId, ...document, cas: result.cas };
		} catch (error) {
			console.error("Upsert failed:", error);
			throw error;
		}
	}

	async get(id: string): Promise<any> {
		await this.ensureConnected();

		try {
			const result = await this.collection!.get(id);
			return result.content;
		} catch (error) {
			if ((error as Error).message.includes("document not found")) {
				return null;
			}
			console.error("Get failed:", error);
			throw error;
		}
	}

	async delete(id: string): Promise<void> {
		await this.ensureConnected();

		try {
			await this.collection!.remove(id);
		} catch (error) {
			if ((error as Error).message.includes("document not found")) {
				return;
			}
			console.error("Delete failed:", error);
			throw error;
		}
	}

	// async createIndex(name: string, fields: string[]): Promise<void> {
	// 	if (!this.cluster) {
	// 		throw new Error("Cluster not connected");
	// 	}

	// 	try {
	// 		const query = `
    //     CREATE INDEX \`${name}\` 
    //     ON \`${this.bucketName}\`(\`${fields.join("`, `")}\`)
    //     WITH {"defer_build": false}
    //   `;
	// 		await this.query(query);
	// 		console.log(`Created index: ${name}`);
	// 	} catch (error) {
	// 		console.error("Failed to create index:", error);
	// 		throw error;
	// 	}
	// }

	// private async createIndexes(): Promise<void> {
	// 	try {
	// 		const existingIndexes = await this.query(`
	// 		SELECT idx.name 
	// 		FROM system:indexes idx 
	// 		WHERE keyspace_id = '${this.bucketName}'
	// 		`);

	// 		const existingIndexNames = existingIndexes.map(idx => idx.name);

	// 		const indexesToCreate = [
	// 			{ name: "idx_reservation_date", fields: ["date"] },
	// 			{ name: "idx_reservation_status", fields: ["status"] },
	// 			{ name: "idx_customer_id", fields: ["customerId"] },
	// 			{ name: "idx_table_id", fields: ["tableId"] },
	// 			{ name: "idx_user_email", fields: ["email"] },
	// 			{ name: "idx_table_status", fields: ["status"] },
	// 			{ name: "idx_user_role", fields: ["role"] }
	// 		].filter(idx => !existingIndexNames.includes(idx.name));
			
	// 		for (const index of indexesToCreate) {
	// 			try {
	// 				await this.createIndex(index.name, index.fields);
	// 			} catch (error) {
	// 				if (!(error as Error).message.includes("already exists")) {
	// 					throw error;
	// 				}
	// 			}
	// 		}

	// 		console.log("Created all necessary indexes");
	// 	} catch (error) {
	// 		console.error("Failed to create indexes:", error);
	// 		throw error;
	// 	}
	// }

	private generateDocumentId(): string {
		return randomUUID();
	}

	isConnected(): boolean {
		return this.connected;
	}

	async healthCheck(): Promise<boolean> {
		try {
			if (!this.cluster) {
				return false;
			}

			await this.cluster.ping();
			return true;
		} catch (error) {
			console.error("Health check failed:", error);
			return false;
		}
	}
}

// Singleton instance for database connection
let couchbaseConnectionInstance: CouchbaseConnection | null = null;

export function getCouchbaseConnection(): CouchbaseConnection {
	if (!couchbaseConnectionInstance) {
		const connectionString = process.env.COUCHBASE_HOST || "localhost";
		const username = process.env.COUCHBASE_USERNAME || "Administrator";
		const password = process.env.COUCHBASE_PASSWORD || "password";
		const bucketName = process.env.COUCHBASE_BUCKET || "reservations";

		couchbaseConnectionInstance = new CouchbaseConnection(
			connectionString,
			username,
			password,
			bucketName,
		);
	}
	return couchbaseConnectionInstance;
}

// Keep createCouchbaseConnection for backward compatibility
export function createCouchbaseConnection(bucket: string = ''): CouchbaseConnection {
	// If a specific bucket is requested, create a new connection
	if (bucket) {
		const connectionString = process.env.COUCHBASE_HOST || "localhost";
		const username = process.env.COUCHBASE_USERNAME || "Administrator";
		const password = process.env.COUCHBASE_PASSWORD || "password";
		const bucketName = bucket || process.env.COUCHBASE_BUCKET || "reservations";

		return new CouchbaseConnection(
			connectionString,
			username,
			password,
			bucketName,
		);
	}
	// Otherwise, use singleton
	return getCouchbaseConnection();
}
