import { type Table, TableStatus } from "@shared/reservation-system";

export interface TableModel extends Table {
	version?: number;
}

export class TableDocument {
	static create(tableData: Partial<TableModel>): TableModel {
		return {
			id: tableData.id || TableDocument.generateId(),
			number: tableData.number || 1,
			capacity: tableData.capacity || 1,
			location: tableData.location || "",
			status: tableData.status || TableStatus.AVAILABLE,
			createdAt: tableData.createdAt || new Date(),
			updatedAt: tableData.updatedAt || new Date(),
			version: tableData.version || 1,
		};
	}

	static toDocument(table: TableModel): any {
		return {
			id: table.id,
			number: table.number,
			capacity: table.capacity,
			location: table.location,
			status: table.status,
			createdAt: table.createdAt.toISOString(),
			updatedAt: table.updatedAt.toISOString(),
			version: table.version,
			type: "table",
		};
	}

	static fromDocument(document: any): TableModel {
		return {
			id: document.id,
			number: document.number,
			capacity: document.capacity,
			location: document.location,
			status: document.status,
			createdAt: new Date(document.createdAt),
			updatedAt: new Date(document.updatedAt),
			version: document.version,
		};
	}

	static update(table: TableModel, updates: Partial<TableModel>): TableModel {
		return {
			...table,
			...updates,
			updatedAt: new Date(),
			version: (table.version || 1) + 1,
		};
	}

	static toQuery(table: TableModel): any {
		return {
			id: table.id,
			number: table.number,
			capacity: table.capacity,
			location: table.location,
			status: table.status,
			createdAt: table.createdAt.toISOString(),
			updatedAt: table.updatedAt.toISOString(),
			version: table.version,
		};
	}

	private static generateId(): string {
		return Math.random().toString(36).substr(2, 9);
	}
}
