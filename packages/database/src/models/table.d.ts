import { type Table } from "@shared/reservation-system";
export interface TableModel extends Table {
    version?: number;
}
export declare class TableDocument {
    static create(tableData: Partial<TableModel>): TableModel;
    static toDocument(table: TableModel): any;
    static fromDocument(document: any): TableModel;
    static update(table: TableModel, updates: Partial<TableModel>): TableModel;
    static toQuery(table: TableModel): any;
    private static generateId;
}
//# sourceMappingURL=table.d.ts.map