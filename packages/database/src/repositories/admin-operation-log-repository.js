import { AdminOperationLogDocument, } from "../models/admin-operation-log";
export class AdminOperationLogRepository {
    couchbaseService;
    constructor(couchbaseService) {
        this.couchbaseService = couchbaseService;
    }
    async create(logData) {
        const log = AdminOperationLogDocument.create(logData);
        const document = AdminOperationLogDocument.toDocument(log);
        const result = await this.couchbaseService.upsert(document, log.id);
        return AdminOperationLogDocument.fromDocument(result);
    }
    async findById(id) {
        const document = await this.couchbaseService.get(id);
        return document ? AdminOperationLogDocument.fromDocument(document) : null;
    }
    async findByReservationId(reservationId) {
        const query = `
			SELECT l.*, META(l).id as id
			FROM \`reservations\` l
			WHERE l.type = 'admin_operation_log' AND l.reservationId = $reservationId
			ORDER BY l.timestamp DESC
		`;
        const results = await this.couchbaseService.query(query, { reservationId });
        return results.map(AdminOperationLogDocument.fromDocument);
    }
    async findAll(filters, pagination) {
        const page = pagination?.page || 1;
        const limit = pagination?.limit || 50;
        const offset = (page - 1) * limit;
        const conditions = ['type = "admin_operation_log"'];
        if (filters?.adminId) {
            conditions.push(`adminId = "${filters.adminId}"`);
        }
        if (filters?.action) {
            conditions.push(`action = "${filters.action}"`);
        }
        if (filters?.startDate) {
            const dateStr = filters.startDate instanceof Date
                ? filters.startDate.toISOString()
                : filters.startDate;
            conditions.push(`timestamp >= "${dateStr}"`);
        }
        if (filters?.endDate) {
            const dateStr = filters.endDate instanceof Date
                ? filters.endDate.toISOString()
                : filters.endDate;
            conditions.push(`timestamp <= "${dateStr}"`);
        }
        const whereClause = conditions.join(" AND ");
        const countQuery = `
			SELECT COUNT(*) as total
			FROM \`reservations\`
			WHERE ${whereClause}
		`;
        const countResult = await this.couchbaseService.query(countQuery);
        const total = countResult[0]?.total || 0;
        const dataQuery = `
			SELECT l.*, META(l).id as id
			FROM \`reservations\` AS l
			WHERE ${whereClause}
			ORDER BY l.timestamp DESC
			LIMIT ${limit} OFFSET ${offset}
		`;
        const dataResult = await this.couchbaseService.query(dataQuery);
        const logs = dataResult.map(AdminOperationLogDocument.fromDocument);
        return {
            data: logs,
            total,
        };
    }
    async findRecent(limit = 20) {
        const query = `
			SELECT l.*, META(l).id as id
			FROM \`reservations\` AS l
			WHERE l.type = 'admin_operation_log'
			ORDER BY l.timestamp DESC
			LIMIT ${limit}
		`;
        const results = await this.couchbaseService.query(query);
        return results.map(AdminOperationLogDocument.fromDocument);
    }
}
//# sourceMappingURL=admin-operation-log-repository.js.map