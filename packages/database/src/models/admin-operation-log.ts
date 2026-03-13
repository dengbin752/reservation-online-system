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

export enum OperationAction {
	STATUS_CHANGE = "STATUS_CHANGE",
	CONFIRM = "CONFIRM",
	CANCEL = "CANCEL",
	COMPLETE = "COMPLETE",
	REOPEN = "REOPEN",
	UPDATE = "UPDATE",
	DELETE = "DELETE",
	CREATE = "CREATE",
}

export class AdminOperationLogDocument {
	static create(logData: Partial<AdminOperationLog>): AdminOperationLog {
		return {
			id: logData.id || AdminOperationLogDocument.generateId(),
			adminId: logData.adminId || "",
			adminName: logData.adminName || "",
			action: logData.action || OperationAction.STATUS_CHANGE,
			reservationId: logData.reservationId || "",
			previousStatus: logData.previousStatus,
			newStatus: logData.newStatus || "",
			details: logData.details,
			timestamp: logData.timestamp || new Date(),
		};
	}

	static toDocument(log: AdminOperationLog): any {
		return {
			id: log.id,
			adminId: log.adminId,
			adminName: log.adminName,
			action: log.action,
			reservationId: log.reservationId,
			previousStatus: log.previousStatus,
			newStatus: log.newStatus,
			details: log.details,
			timestamp: log.timestamp instanceof Date ? log.timestamp.toISOString() : log.timestamp,
			type: "admin_operation_log",
		};
	}

	static fromDocument(document: any): AdminOperationLog {
		return {
			id: document.id,
			adminId: document.adminId,
			adminName: document.adminName,
			action: document.action,
			reservationId: document.reservationId,
			previousStatus: document.previousStatus,
			newStatus: document.newStatus,
			details: document.details,
			timestamp: new Date(document.timestamp),
		};
	}

	private static generateId(): string {
		return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}
}

/**
 * Helper function to get action description
 */
export function getActionDescription(action: OperationAction, previousStatus?: string, newStatus?: string): string {
	switch (action) {
		case OperationAction.CONFIRM:
			return `Confirmed reservation (Changed status from ${previousStatus || 'N/A'} to ${newStatus})`;
		case OperationAction.CANCEL:
			return `Cancelled reservation (Changed status from ${previousStatus || 'N/A'} to ${newStatus})`;
		case OperationAction.COMPLETE:
			return `Marked reservation as completed (Changed status from ${previousStatus || 'N/A'} to ${newStatus})`;
		case OperationAction.REOPEN:
			return `Reopened reservation (Changed status from ${previousStatus || 'N/A'} to ${newStatus})`;
		case OperationAction.STATUS_CHANGE:
			return `Changed status from ${previousStatus || 'N/A'} to ${newStatus}`;
		case OperationAction.UPDATE:
			return `Updated reservation details`;
		case OperationAction.DELETE:
			return `Deleted reservation`;
		case OperationAction.CREATE:
			return `Created new reservation`;
		default:
			return `Performed action: ${action}`;
	}
}

/**
 * Map status to action
 */
export function mapStatusToAction(newStatus: string): OperationAction {
	switch (newStatus) {
		case "CONFIRMED":
			return OperationAction.CONFIRM;
		case "CANCELLED":
			return OperationAction.CANCEL;
		case "COMPLETED":
			return OperationAction.COMPLETE;
		default:
			return OperationAction.STATUS_CHANGE;
	}
}
