/**
 * Admin Operation Log Model
 *
 * Records all admin operations on reservations, especially status changes.
 */
export interface AdminOperationLog {
    id: string;
    adminId: string;
    adminName: string;
    action: OperationAction;
    reservationId: string;
    previousStatus?: string;
    newStatus: string;
    details?: string;
    timestamp: Date;
}
export declare enum OperationAction {
    STATUS_CHANGE = "STATUS_CHANGE",
    CONFIRM = "CONFIRM",
    CANCEL = "CANCEL",
    COMPLETE = "COMPLETE",
    REOPEN = "REOPEN",
    UPDATE = "UPDATE",
    DELETE = "DELETE",
    CREATE = "CREATE"
}
export declare class AdminOperationLogDocument {
    static create(logData: Partial<AdminOperationLog>): AdminOperationLog;
    static toDocument(log: AdminOperationLog): any;
    static fromDocument(document: any): AdminOperationLog;
    private static generateId;
}
/**
 * Helper function to get action description
 */
export declare function getActionDescription(action: OperationAction, previousStatus?: string, newStatus?: string): string;
/**
 * Map status to action
 */
export declare function mapStatusToAction(newStatus: string): OperationAction;
//# sourceMappingURL=admin-operation-log.d.ts.map