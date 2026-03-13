import type { ICouchbaseService, TableStatus } from "@shared/reservation-system";
import { TableDocument, type TableModel } from "../models/table.js";

export class TableRepository {
	constructor(private couchbaseService: ICouchbaseService) {}

	async create(tableData: Partial<TableModel>): Promise<TableModel> {
		const table = TableDocument.create(tableData);
		const document = TableDocument.toDocument(table);
		const result = await this.couchbaseService.upsert(document);
		return TableDocument.fromDocument(result);
	}

	async findById(id: string): Promise<TableModel | null> {
		const document = await this.couchbaseService.get(id);
		return document ? TableDocument.fromDocument(document) : null;
	}

	async findAll(
		filters?: {
			status?: string;
			location?: string;
			minCapacity?: number;
			maxCapacity?: number;
		},
		pagination?: { page?: number; limit?: number },
	): Promise<TableModel[]> {
		let query = 'SELECT META().id, * FROM `reservations` WHERE type = "table"';
		const params: any = {};

		if (filters?.status) {
			query += " AND status = $status";
			params.status = filters.status;
		}

		if (filters?.location) {
			query += " AND location LIKE $location";
			params.location = `%${filters.location}%`;
		}

		if (filters?.minCapacity) {
			query += " AND capacity >= $minCapacity";
			params.minCapacity = filters.minCapacity;
		}

		if (filters?.maxCapacity) {
			query += " AND capacity <= $maxCapacity";
			params.maxCapacity = filters.maxCapacity;
		}

		query += " ORDER BY number ASC";

		if (pagination?.limit) {
			query += ` LIMIT ${pagination.limit}`;
		}

		if (pagination?.page && pagination.limit) {
			const offset = (pagination.page - 1) * pagination.limit;
			query += ` OFFSET ${offset}`;
		}

		const results = await this.couchbaseService.query(query, params);
		return results.map(TableDocument.fromDocument);
	}

	async update(id: string, updates: Partial<TableModel>): Promise<TableModel> {
		const existingTable = await this.findById(id);
		if (!existingTable) {
			throw new Error("Table not found");
		}

		const updatedTable = TableDocument.update(existingTable, updates);
		const document = TableDocument.toDocument(updatedTable);
		const result = await this.couchbaseService.upsert(document, id);
		return TableDocument.fromDocument(result);
	}

	async delete(id: string): Promise<void> {
		await this.couchbaseService.delete(id);
	}

	async findByLocation(location: string): Promise<TableModel[]> {
		const query = `
      SELECT META().id, *
      FROM \`reservations\`
      WHERE type = 'table' AND location = $location
      ORDER BY number ASC
    `;

		const params = { location };
		const results = await this.couchbaseService.query(query, params);
		return results.map(TableDocument.fromDocument);
	}

	async findByCapacity(
		minCapacity: number,
		maxCapacity?: number,
	): Promise<TableModel[]> {
		let query = `
      SELECT META().id, *
      FROM \`reservations\`
      WHERE type = 'table' AND capacity >= $minCapacity
    `;
		const params: any = { minCapacity };

		if (maxCapacity) {
			query += " AND capacity <= $maxCapacity";
			params.maxCapacity = maxCapacity;
		}

		query += " ORDER BY capacity ASC, number ASC";

		const results = await this.couchbaseService.query(query, params);
		return results.map(TableDocument.fromDocument);
	}

	async findByStatus(status: string): Promise<TableModel[]> {
		const query = `
      SELECT META().id, *
      FROM \`reservations\`
      WHERE type = 'table' AND status = $status
      ORDER BY number ASC
    `;

		const params = { status };
		const results = await this.couchbaseService.query(query, params);
		return results.map(TableDocument.fromDocument);
	}

	async count(filters?: {
		status?: string;
		location?: string;
	}): Promise<number> {
		let query =
			'SELECT COUNT(*) as count FROM `reservations` WHERE type = "table"';
		const params: any = {};

		if (filters?.status) {
			query += " AND status = $status";
			params.status = filters.status;
		}

		if (filters?.location) {
			query += " AND location = $location";
			params.location = filters.location;
		}

		const results = await this.couchbaseService.query(query, params);
		return results[0].count;
	}

	async getAvailableTables(): Promise<TableModel[]> {
		const query = `
      SELECT META().id, *
      FROM \`reservations\`
      WHERE type = 'table' AND status = 'available'
      ORDER BY number ASC
    `;

		const results = await this.couchbaseService.query(query);
		return results.map(TableDocument.fromDocument);
	}

	async getTablesByLocationAndCapacity(
		location: string,
		minCapacity: number,
	): Promise<TableModel[]> {
		const query = `
      SELECT META().id, *
      FROM \`reservations\`
      WHERE type = 'table' 
        AND location = $location 
        AND capacity >= $minCapacity
        AND status = 'available'
      ORDER BY capacity ASC, number ASC
    `;

		const params = { location, minCapacity };
		const results = await this.couchbaseService.query(query, params);
		return results.map(TableDocument.fromDocument);
	}

	async updateTableStatus(id: string, status: string): Promise<TableModel> {
		const existingTable = await this.findById(id);
		if (!existingTable) {
			throw new Error("Table not found");
		}

		const updatedTable = TableDocument.update(existingTable, { status: status as TableStatus });
		const document = TableDocument.toDocument(updatedTable);
		const result = await this.couchbaseService.upsert(document, id);
		return TableDocument.fromDocument(result);
	}

	async isTableAvailable(id: string): Promise<boolean> {
		const table = await this.findById(id);
		return table !== null && table.status === ('AVAILABLE' as TableStatus);
	}

	async getTableUtilization(date: string): Promise<any[]> {
		const query = `
      SELECT 
        t.id,
        t.number,
        t.capacity,
        t.location,
        COUNT(r.id) as reservationCount,
        SUM(CASE WHEN r.status = 'confirmed' THEN 1 ELSE 0 END) as confirmedCount
      FROM \`reservations\` t
      USE KEYS t.id
      LEFT JOIN \`reservations\` r ON META(r).id = t.id AND r.type = 'reservation' AND r.date = $date
      WHERE t.type = 'table'
      GROUP BY t.id, t.number, t.capacity, t.location
      ORDER BY t.number
    `;

		const params = { date };
		const results = await this.couchbaseService.query(query, params);
		return results;
	}
}
