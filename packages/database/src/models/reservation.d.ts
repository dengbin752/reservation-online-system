import { type Reservation } from "@shared/reservation-system";
export interface ReservationModel extends Reservation {
    version?: number;
}
export declare class ReservationDocument {
    static create(reservationData: Partial<ReservationModel>): ReservationModel;
    static toDocument(reservation: ReservationModel): any;
    static fromDocument(document: any): ReservationModel;
    static update(reservation: ReservationModel, updates: Partial<ReservationModel>): ReservationModel;
    static toQuery(reservation: ReservationModel): any;
    private static generateId;
}
//# sourceMappingURL=reservation.d.ts.map