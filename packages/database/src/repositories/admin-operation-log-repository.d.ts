import type { ICouchbaseService } from "@shared/reservation-system";
import { type AdminOperationLog } from "../models/admin-operation-log";
export declare class AdminOperationLogRepository {
    private couchbaseService;
    constructor(couchbaseService: ICouchbaseService);
    create(logData: Partial<AdminOperationLog>): Promise<AdminOperationLog>;
    findById(id: string): Promise<AdminOperationLog | null>;
    findByReservationId(reservationId: string): Promise<AdminOperationLog[]>;
    findAll(filters?: {
        adminId?: string;
        action?: string;
        startDate?: Date;
        endDate?: Date;
    }, pagination?: {
        page?: number;
        limit?: number;
    }): Promise<{
        data: AdminOperationLog[];
        total: number;
    }>;
    findRecent(limit?: number): Promise<AdminOperationLog[]>;
}
//# sourceMappingURL=admin-operation-log-repository.d.ts.map