import type {
	ICouchbaseService,
	PaginatedResponse,
	Reservation,
	ReservationStatus,
	User,
} from "@shared/reservation-system";
import {
	ReservationDocument,
	type ReservationModel,
} from "../models/reservation.js";

type ReservationWithCustomer = Reservation & {
	customer: Pick<User, "email" | "firstName" | "lastName" | "phone">;
};

export class ReservationRepository {
	constructor(private couchbaseService: ICouchbaseService) {}

	async create(
		reservationData: Partial<ReservationModel>,
	): Promise<ReservationModel> {
		const reservation = ReservationDocument.create(reservationData);
		const document = ReservationDocument.toDocument(reservation);
		const result = await this.couchbaseService.upsert(document);
		return ReservationDocument.fromDocument(result);
	}

	async findById(id: string): Promise<ReservationModel | null> {
		const document = await this.couchbaseService.get(id);
		return document ? ReservationDocument.fromDocument(document) : null;
	}

	async findByDocId(id: string): Promise<ReservationModel | null> {
		const query = `
      SELECT META().id, r.*
      FROM \`reservations\` r
      WHERE r.type = 'reservation' AND r.id = $id
      ORDER BY r.createdAt DESC
    `;
		const results = await this.couchbaseService.query(query, { id });
		return results.map(ReservationDocument.fromDocument)[0];
	}

	async deleteByDocId(id: string): Promise<void> {
		const query = `
      DELETE 
      FROM \`reservations\` r
      WHERE r.type = 'reservation' AND r.id = $id
    `;
		await this.couchbaseService.query(query, { id });
	}

	async findAll(
		filters?: {
			status?: string;
			date?: Date | string;
			customerId?: string;
			tableId?: string;
		},
		pagination?: { page?: number; limit?: number },
	): Promise<PaginatedResponse<ReservationWithCustomer>> {
		const page = pagination?.page || 1;
		const limit = pagination?.limit || 10;
		const offset = (page - 1) * limit;

		const conditions: string[] = ['type = "reservation"'];

		if (filters?.status) {
			conditions.push(`status = "${filters.status}"`);
		}
		if (filters?.date) {
			const dateStr =
				filters.date instanceof Date
					? filters.date.toISOString().split("T")[0]
					: filters.date;
			conditions.push(`date = "${dateStr}"`);
		}
		if (filters?.customerId) {
			conditions.push(`customerId = "${filters.customerId}"`);
		}
		if (filters?.tableId) {
			conditions.push(`tableId = "${filters.tableId}"`);
		}

		const whereClause = conditions.join(" AND ");
		const countQuery = `
          SELECT COUNT(*) as total 
          FROM \`reservations\` 
          WHERE ${whereClause}
        `;

		const countResult = await this.couchbaseService.query(countQuery);
		const total = countResult[0].total;
		const totalPages = Math.ceil(total / limit);

		const dataQuery = `
          SELECT r.*, META(r).id as id
          FROM \`reservations\` AS r 
          WHERE ${whereClause}
          ORDER BY r.createdAt DESC
          LIMIT ${limit} OFFSET ${offset}
        `;

		const dataResult = await this.couchbaseService.query(dataQuery);
		const reservations = dataResult;

		const customerIds = [
			...new Set(reservations.map((r: any) => r.customerId)),
		];
		if (customerIds.length > 0) {
			const customerQuery = `
            SELECT u.*, META(u).id as metaid
            FROM \`reservations\` AS u
            WHERE u.type = "user" AND u.id IN ["${customerIds.join('","')}"]
          `;

			const customerResult = await this.couchbaseService.query(customerQuery);
			const customers = customerResult;

			const customerMap: Record<
				string,
				Pick<User, "email" | "firstName" | "lastName" | "phone">
			> = {};
			customers.forEach((customer: any) => {
				customerMap[customer.id] = {
					email: customer.email,
					firstName: customer.firstName,
					lastName: customer.lastName,
					phone: customer.phone,
				};
			});

			const reservationsWithCustomers = reservations.map((reservation: any) => {
				return {
					id: reservation.id,
					title: reservation.title,
					customerId: reservation.customerId,
					tableId: reservation.tableId,
					date: new Date(reservation.date),
					time: reservation.time,
					partySize: reservation.partySize,
					status: reservation.status,
					contactInfo: reservation.contactInfo,
					specialRequests: reservation.specialRequests,
					createdAt: new Date(reservation.createdAt),
					updatedAt: new Date(reservation.updatedAt),
					customer: customerMap[reservation.customerId] || null,
				};
			});

			return {
				data: reservationsWithCustomers,
				total,
				page: Math.floor(total / limit) + 1,
				limit,
				totalPages,
			};
		}

		return {
			data: reservations.map((reservation: any) => ({
				id: reservation.id,
				title: reservation.title,
				customerId: reservation.customerId,
				tableId: reservation.tableId,
				date: reservation.date,
				time: reservation.time,
				partySize: reservation.partySize,
				status: reservation.status,
				contactInfo: reservation.contactInfo,
				specialRequests: reservation.specialRequests,
				createdAt: reservation.createdAt,
				updatedAt: reservation.updatedAt,
				customer: null,
			})),
			total,
			page: Math.floor(total / limit) + 1,
			limit,
			totalPages,
		};
	}

	async update(
		id: string,
		updates: Partial<ReservationModel>,
	): Promise<ReservationModel> {
		const existingReservation = await this.findById(id);
		if (!existingReservation) {
			throw new Error("Reservation not found");
		}

		const updatedReservation = ReservationDocument.update(
			existingReservation,
			updates,
		);
		const document = ReservationDocument.toDocument(updatedReservation);
		const result = await this.couchbaseService.upsert(document, id);
		return ReservationDocument.fromDocument(result);
	}

	async delete(id: string): Promise<void> {
		await this.couchbaseService.delete(id);
	}

	async updateStatusById(
		id: string,
		status: ReservationStatus,
	): Promise<{ id: string; status: ReservationStatus }> {
		// 先尝试通过 document key (META().id) 查找
		let existingReservation = await this.findById(id);
		let documentKey = id;
		
		// 如果找不到，尝试通过业务字段 r.id 查找
		if (!existingReservation) {
			// 查询业务字段id对应的document key
			const query = `
				SELECT META(r).id as docKey
				FROM \`reservations\` r
				WHERE r.type = 'reservation' AND r.id = $id
				LIMIT 1
			`;
			const results = await this.couchbaseService.query(query, { id });
			if (!results || results.length === 0) {
				throw new Error("Reservation not found");
			}
			documentKey = results[0].docKey;
		}

		const now = new Date().toISOString();
		// 使用 USE KEYS 直接通过 document key 更新
		// RETURNING 中使用 META(r).id 来返回 document key
		const updateQuery = `
			UPDATE \`reservations\` AS r
			USE KEYS $documentKey
			SET r.status = $status, r.updatedAt = $now
			RETURNING r.status, META(r).id as id
		`;
		const params = { documentKey, status, now };
		const result = await this.couchbaseService.query(updateQuery, params);
		return result[0];
	}

	async findByCustomerId(customerId: string): Promise<ReservationModel[]> {
		const query = `
      SELECT META().id, r.*
      FROM \`reservations\` r
      WHERE r.type = 'reservation' AND r.customerId = $customerId
      ORDER BY r.createdAt DESC
    `;

		const results = await this.couchbaseService.query(query, { customerId });
		// META().id 已在查询中作为 id 字段返回
		return results.map((doc: any) => {
			return ReservationDocument.fromDocument(doc);
		});
	}

	async findByTableId(tableId: string): Promise<ReservationModel[]> {
		const query = `
      SELECT META().id, *
      FROM \`reservations\`
      WHERE type = 'reservation' AND tableId = $tableId
      ORDER BY createdAt DESC
    `;

		const params = { tableId };
		const results = await this.couchbaseService.query(query, params);
		return results.map(ReservationDocument.fromDocument);
	}

	async findByDateAndTime(
		date: string,
		time: string,
	): Promise<ReservationModel[]> {
		const query = `
      SELECT META().id, *
      FROM \`reservations\`
      WHERE type = 'reservation' AND date = $date AND time = $time
      ORDER BY createdAt DESC
    `;

		const params = { date, time };
		const results = await this.couchbaseService.query(query, params);
		return results.map(ReservationDocument.fromDocument);
	}

	async findAvailableTables(
		date: string,
		time: string,
		partySize: number,
	): Promise<any[]> {
		const query = `
      SELECT META().id, t.*
      FROM \`reservations\` r
      USE KEYS r.tableId
      JOIN \`reservations\` t ON META(t).id = r.tableId
      WHERE r.type = 'reservation' 
        AND r.date = $date 
        AND r.time = $time
        AND t.type = 'table'
        AND t.capacity >= $partySize
        AND t.status = 'available'
      GROUP BY META(t).id, t.number, t.capacity, t.location, t.status, t.createdAt, t.updatedAt
    `;

		const params = { date, time, partySize };
		const results = await this.couchbaseService.query(query, params);
		return results;
	}

	async count(filters?: { status?: string; date?: string }): Promise<number> {
		let query =
			'SELECT COUNT(*) as count FROM `reservations` WHERE type = "reservation"';
		const params: any = {};

		if (filters?.status) {
			query += " AND status = $status";
			params.status = filters.status;
		}

		if (filters?.date) {
			query += " AND date = $date";
			params.date = filters.date;
		}

		const results = await this.couchbaseService.query(query, params);
		return results[0].count;
	}

	async getReservationsByDateRange(
		startDate: string,
		endDate: string,
	): Promise<ReservationModel[]> {
		const query = `
      SELECT META().id, *
      FROM \`reservations\`
      WHERE type = 'reservation' AND date BETWEEN $startDate AND $endDate
      ORDER BY date, time
    `;

		const params = { startDate, endDate };
		const results = await this.couchbaseService.query(query, params);
		return results.map(ReservationDocument.fromDocument);
	}

	async getReservationsByTimeSlot(
		date: string,
		startTime: string,
		endTime: string,
	): Promise<ReservationModel[]> {
		const query = `
      SELECT META().id, *
      FROM \`reservations\`
      WHERE type = 'reservation' 
        AND date = $date 
        AND time >= $startTime 
        AND time <= $endTime
      ORDER BY time
    `;

		const params = { date, startTime, endTime };
		const results = await this.couchbaseService.query(query, params);
		return results.map(ReservationDocument.fromDocument);
	}
}
