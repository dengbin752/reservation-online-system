import { ReservationDocument, } from "../models/reservation";
export class ReservationRepository {
    couchbaseService;
    constructor(couchbaseService) {
        this.couchbaseService = couchbaseService;
    }
    async create(reservationData) {
        const reservation = ReservationDocument.create(reservationData);
        const document = ReservationDocument.toDocument(reservation);
        const result = await this.couchbaseService.upsert(document);
        return ReservationDocument.fromDocument(result);
    }
    async findById(id) {
        const document = await this.couchbaseService.get(id);
        return document ? ReservationDocument.fromDocument(document) : null;
    }
    async findByDocId(id) {
        const query = `
      SELECT META().id, r.*
      FROM \`reservations\` r
      WHERE r.type = 'reservation' AND r.id = $id
      ORDER BY r.createdAt DESC
    `;
        const results = await this.couchbaseService.query(query, { id });
        return results.map(ReservationDocument.fromDocument)[0];
    }
    async deleteByDocId(id) {
        const query = `
      DELETE 
      FROM \`reservations\` r
      WHERE r.type = 'reservation' AND r.id = $id
    `;
        await this.couchbaseService.query(query, { id });
    }
    async findAll(filters, pagination) {
        const page = pagination?.page || 1;
        const limit = pagination?.limit || 10;
        const offset = (page - 1) * limit;
        const conditions = ['type = "reservation"'];
        if (filters?.status) {
            conditions.push(`status = "${filters.status}"`);
        }
        if (filters?.date) {
            const dateStr = filters.date instanceof Date
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
            ...new Set(reservations.map((r) => r.customerId)),
        ];
        if (customerIds.length > 0) {
            const customerQuery = `
            SELECT u.*, META(u).id as metaid
            FROM \`reservations\` AS u
            WHERE u.type = "user" AND u.id IN ["${customerIds.join('","')}"]
          `;
            const customerResult = await this.couchbaseService.query(customerQuery);
            const customers = customerResult;
            const customerMap = {};
            customers.forEach((customer) => {
                customerMap[customer.id] = {
                    email: customer.email,
                    firstName: customer.firstName,
                    lastName: customer.lastName,
                    phone: customer.phone,
                };
            });
            const reservationsWithCustomers = reservations.map((reservation) => {
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
            data: reservations.map((reservation) => ({
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
    async update(id, updates) {
        const existingReservation = await this.findById(id);
        if (!existingReservation) {
            throw new Error("Reservation not found");
        }
        const updatedReservation = ReservationDocument.update(existingReservation, updates);
        const document = ReservationDocument.toDocument(updatedReservation);
        const result = await this.couchbaseService.upsert(document, id);
        return ReservationDocument.fromDocument(result);
    }
    async delete(id) {
        await this.couchbaseService.delete(id);
    }
    async updateStatusById(id, status) {
        const existingReservation = await this.findById(id);
        if (!existingReservation) {
            throw new Error("Reservation not found");
        }
        const now = new Date().toISOString();
        const query = `
      UPDATE \`reservations\` AS r
      SET r.status = $status, r.updatedAt = $now
	  WHERE META(r).id=$id
	  RETURNING r.status, META(r).id as id
    `;
        const params = { id, status, now };
        const result = await this.couchbaseService.query(query, params);
        return result[0];
    }
    async findByCustomerId(customerId) {
        const query = `
      SELECT META().id, r.*
      FROM \`reservations\` r
      WHERE r.type = 'reservation' AND r.customerId = $customerId
      ORDER BY r.createdAt DESC
    `;
        const results = await this.couchbaseService.query(query, { customerId });
        return results.map(ReservationDocument.fromDocument);
    }
    async findByTableId(tableId) {
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
    async findByDateAndTime(date, time) {
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
    async findAvailableTables(date, time, partySize) {
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
    async count(filters) {
        let query = 'SELECT COUNT(*) as count FROM `reservations` WHERE type = "reservation"';
        const params = {};
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
    async getReservationsByDateRange(startDate, endDate) {
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
    async getReservationsByTimeSlot(date, startTime, endTime) {
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
//# sourceMappingURL=reservation-repository.js.map