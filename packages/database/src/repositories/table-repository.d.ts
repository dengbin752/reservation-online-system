import type { ICouchbaseService } from "@shared/reservation-system";
import { type TableModel } from "../models/table";
export declare class TableRepository {
    private couchbaseService;
    constructor(couchbaseService: ICouchbaseService);
    create(tableData: Partial<TableModel>): Promise<TableModel>;
    findById(id: string): Promise<TableModel | null>;
    findAll(filters?: {
        status?: string;
        location?: string;
        minCapacity?: number;
        maxCapacity?: number;
    }, pagination?: {
        page?: number;
        limit?: number;
    }): Promise<TableModel[]>;
    update(id: string, updates: Partial<TableModel>): Promise<TableModel>;
    delete(id: string): Promise<void>;
    findByLocation(location: string): Promise<TableModel[]>;
    findByCapacity(minCapacity: number, maxCapacity?: number): Promise<TableModel[]>;
    findByStatus(status: string): Promise<TableModel[]>;
    count(filters?: {
        status?: string;
        location?: string;
    }): Promise<number>;
    getAvailableTables(): Promise<TableModel[]>;
    getTablesByLocationAndCapacity(location: string, minCapacity: number): Promise<TableModel[]>;
    updateTableStatus(id: string, status: string): Promise<TableModel>;
    isTableAvailable(id: string): Promise<boolean>;
    getTableUtilization(date: string): Promise<any[]>;
}
//# sourceMappingURL=table-repository.d.ts.map