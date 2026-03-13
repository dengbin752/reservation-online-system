import { Cluster, } from "couchbase";
export class CouchbaseConnection {
    connectionString;
    username;
    password;
    bucketName;
    cluster = null;
    bucket = null;
    collection = null;
    connected = false;
    constructor(connectionString, username, password, bucketName = "reservations") {
        this.connectionString = connectionString;
        this.username = username;
        this.password = password;
        this.bucketName = bucketName;
    }
    // create index is also in .sh file, so here we just throw an error
    createIndex(name, fields) {
        throw new Error("Method not implemented.");
    }
    async connect() {
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
            // await this.createIndexes();
            this.connected = true;
            console.log(`Connected to Couchbase cluster: ${this.connectionString}`);
            console.log(`Using bucket: ${this.bucketName}`);
        }
        catch (error) {
            console.error("Failed to connect to Couchbase:", error);
            throw error;
        }
    }
    async disconnect() {
        try {
            if (this.cluster) {
                await this.cluster.close();
                this.cluster = null;
                this.bucket = null;
                this.collection = null;
                this.connected = false;
                console.log("Disconnected from Couchbase");
            }
        }
        catch (error) {
            console.error("Failed to disconnect from Couchbase:", error);
            throw error;
        }
    }
    getBucket() {
        if (!this.bucket) {
            throw new Error("Bucket not available. Please connect first.");
        }
        return this.bucket;
    }
    getCollection() {
        if (!this.collection) {
            throw new Error("Collection not available. Please connect first.");
        }
        return this.collection;
    }
    async query(query, params) {
        if (!this.cluster) {
            throw new Error("Cluster not connected");
        }
        try {
            const options = {};
            if (params) {
                options.parameters = params;
            }
            const result = await this.cluster.query(query, options);
            return result.rows;
        }
        catch (error) {
            console.error("Query failed:", error);
            throw error;
        }
    }
    async upsert(document, id) {
        if (!this.collection) {
            throw new Error("Collection not available");
        }
        try {
            const documentId = id || this.generateDocumentId();
            const result = await this.collection.upsert(documentId, document);
            return { id: documentId, ...document, cas: result.cas };
        }
        catch (error) {
            console.error("Upsert failed:", error);
            throw error;
        }
    }
    async get(id) {
        if (!this.collection) {
            throw new Error("Collection not available");
        }
        try {
            const result = await this.collection.get(id);
            return result.content;
        }
        catch (error) {
            if (error.message.includes("document not found")) {
                return null;
            }
            console.error("Get failed:", error);
            throw error;
        }
    }
    async delete(id) {
        if (!this.collection) {
            throw new Error("Collection not available");
        }
        try {
            await this.collection.remove(id);
        }
        catch (error) {
            if (error.message.includes("document not found")) {
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
    generateDocumentId() {
        return Math.random().toString(36).substr(2, 9);
    }
    isConnected() {
        return this.connected;
    }
    async healthCheck() {
        try {
            if (!this.cluster) {
                return false;
            }
            await this.cluster.ping();
            return true;
        }
        catch (error) {
            console.error("Health check failed:", error);
            return false;
        }
    }
}
export function createCouchbaseConnection(bucket = '') {
    const connectionString = process.env.COUCHBASE_HOST || "localhost";
    const username = process.env.COUCHBASE_USERNAME || "Administrator";
    const password = process.env.COUCHBASE_PASSWORD || "password";
    const bucketName = bucket || process.env.COUCHBASE_BUCKET || "reservations";
    return new CouchbaseConnection(connectionString, username, password, bucketName);
}
//# sourceMappingURL=connection.js.map