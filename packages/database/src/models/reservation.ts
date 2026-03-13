import {
	type Reservation,
	ReservationStatus,
} from "@shared/reservation-system";

export interface ReservationModel extends Reservation {
	version?: number;
}

export class ReservationDocument {
	static create(reservationData: Partial<ReservationModel>): ReservationModel {
		return {
			id: reservationData.id || ReservationDocument.generateId(),
			customerId: reservationData.customerId || "",
			tableId: reservationData.tableId || "",
			date: reservationData.date || new Date(),
			time: reservationData.time || "",
			partySize: reservationData.partySize || 1,
			status: reservationData.status || ReservationStatus.PENDING,
			contactInfo: reservationData.contactInfo,
			specialRequests: reservationData.specialRequests,
			createdAt: reservationData.createdAt || new Date(),
			updatedAt: reservationData.updatedAt || new Date(),
			version: reservationData.version || 1,
		};
	}

	static toDocument(reservation: ReservationModel): any {
		return {
			id: reservation.id,
			title: reservation.title,
			customerId: reservation.customerId,
			tableId: reservation.tableId,
			date: reservation.date.toISOString().split("T")[0],
			time: reservation.time,
			partySize: reservation.partySize,
			status: reservation.status,
			contactInfo: reservation.contactInfo,
			specialRequests: reservation.specialRequests,
			createdAt: reservation.createdAt.toISOString(),
			updatedAt: reservation.updatedAt.toISOString(),
			version: reservation.version,
			type: "reservation",
		};
	}

	static fromDocument(document: any): ReservationModel {
		return {
			id: document.id,
			customerId: document.customerId,
			tableId: document.tableId,
			date: new Date(document.date),
			time: document.time,
			partySize: document.partySize,
			status: document.status,
			contactInfo: document.contactInfo,
			specialRequests: document.specialRequests,
			createdAt: new Date(document.createdAt),
			updatedAt: new Date(document.updatedAt),
			version: document.version,
		};
	}

	static update(
		reservation: ReservationModel,
		updates: Partial<ReservationModel>,
	): ReservationModel {
		return {
			...reservation,
			...updates,
			updatedAt: new Date(),
			version: (reservation.version || 1) + 1,
		};
	}

	static toQuery(reservation: ReservationModel): any {
		return {
			id: reservation.id,
			customerId: reservation.customerId,
			tableId: reservation.tableId,
			date: reservation.date.toISOString().split("T")[0],
			time: reservation.time,
			partySize: reservation.partySize,
			status: reservation.status,
			specialRequests: reservation.specialRequests,
			createdAt: reservation.createdAt.toISOString(),
			updatedAt: reservation.updatedAt.toISOString(),
			version: reservation.version,
		};
	}

	private static generateId(): string {
		return Math.random().toString(36).substr(2, 9);
	}
}
