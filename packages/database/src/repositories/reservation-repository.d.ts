import type { ICouchbaseService, PaginatedResponse, Reservation, ReservationStatus, User } from "@shared/reservation-system";
import { type ReservationModel } from "../models/reservation";
type ReservationWithCustomer = Reservation & {
    customer: Pick<User, "email" | "firstName" | "lastName" | "phone">;
};
export declare class ReservationRepository {
    private couchbaseService;
    constructor(couchbaseService: ICouchbaseService);
    create(reservationData: Partial<ReservationModel>): Promise<ReservationModel>;
    findById(id: string): Promise<ReservationModel | null>;
    findByDocId(id: string): Promise<ReservationModel | null>;
    deleteByDocId(id: string): Promise<void>;
    findAll(filters?: {
        status?: string;
        date?: Date | string;
        customerId?: string;
        tableId?: string;
    }, pagination?: {
        page?: number;
        limit?: number;
    }): Promise<PaginatedResponse<ReservationWithCustomer>>;
    update(id: string, updates: Partial<ReservationModel>): Promise<ReservationModel>;
    delete(id: string): Promise<void>;
    updateStatusById(id: string, status: ReservationStatus): Promise<{
        id: string;
        status: ReservationStatus;
    }>;
    findByCustomerId(customerId: string): Promise<ReservationModel[]>;
    findByTableId(tableId: string): Promise<ReservationModel[]>;
    findByDateAndTime(date: string, time: string): Promise<ReservationModel[]>;
    findAvailableTables(date: string, time: string, partySize: number): Promise<any[]>;
    count(filters?: {
        status?: string;
        date?: string;
    }): Promise<number>;
    getReservationsByDateRange(startDate: string, endDate: string): Promise<ReservationModel[]>;
    getReservationsByTimeSlot(date: string, startTime: string, endTime: string): Promise<ReservationModel[]>;
}
export {};
//# sourceMappingURL=reservation-repository.d.ts.map