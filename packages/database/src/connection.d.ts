import type { ICouchbaseService } from "@shared/reservation-system";
import { type Bucket, type Collection } from "couchbase";
export declare class CouchbaseConnection implements ICouchbaseService {
    private connectionString;
    private username;
    private password;
    private bucketName;
    private cluster;
    private bucket;
    private collection;
    private connected;
    constructor(connectionString: string, username: string, password: string, bucketName?: string);
    createIndex(name: string, fields: string[]): Promise<void>;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    getBucket(): Bucket;
    getCollection(): Collection;
    query(query: string, params?: any): Promise<any>;
    upsert(document: any, id?: string): Promise<any>;
    get(id: string): Promise<any>;
    delete(id: string): Promise<void>;
    private generateDocumentId;
    isConnected(): boolean;
    healthCheck(): Promise<boolean>;
}
export declare function createCouchbaseConnection(bucket?: string): CouchbaseConnection;
//# sourceMappingURL=connection.d.ts.map