import { Router, type Request, type Response } from "express";
import {
	createCouchbaseConnection,
	ReservationRepository,
	AdminOperationLogRepository,
	OperationAction,
	mapStatusToAction,
	getActionDescription,
} from "@database/reservation-system";
import { authenticate } from "../middleware/auth.js";
import { ReservationStatus } from "@shared/reservation-system";
import { reservationLogger } from "../logger.js";

const router: Router = Router();

/**
 * GET /api/reservations
 * Get all reservations with pagination
 */
router.get("/", authenticate, async (req, res) => {
	try {
		const userId = (req as any).user?.id;
		reservationLogger.info({ msg: "Fetching reservations", userId });
		
		const page = Math.max(1, parseInt(req.query.page as string) || 1);
		const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
		const offset = (page - 1) * limit;

		const connection = createCouchbaseConnection();
		const reservationRepos = new ReservationRepository(connection);
		const results = await reservationRepos.findAll({}, { limit, offset });

		const reservations = results.data.map((r: any) => ({
			id: r.id,
			date: r.date instanceof Date ? r.date.toISOString().split("T")[0] : r.date,
			time: r.time,
			guests: r.partySize,
			tableNumber: r.tableId,
			location: r.location || "Main Hall",
			status: r.status,
			firstName: r.customer?.firstName || "",
			lastName: r.customer?.lastName || "",
			contactInfo: r.contactInfo || "",
		}));

		reservationLogger.info({ 
			msg: "Reservations fetched successfully", 
			count: reservations.length,
			page,
			limit 
		});

		res.json({
			success: true,
			data: reservations,
			pagination: {
				total: results.total,
				page,
				limit,
				totalPages: Math.ceil(results.total / limit),
			},
		});
	} catch (error) {
		reservationLogger.error({ msg: "Error fetching reservations", error });
		res.status(500).json({
			success: false,
			error: {
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to fetch reservations. Please try again later.",
			},
		});
	}
});

/**
 * PUT /api/reservations/:id
 * Update reservation status
 */
router.put("/:id", authenticate, async (req: any, res: any) => {
	try {
		const { id } = req.params;
		const { status } = req.body;
		const adminId = req.user?.id;

		reservationLogger.info({ 
			msg: "Updating reservation status", 
			reservationId: id, 
			newStatus: status,
			adminId 
		});

		if (!status) {
			reservationLogger.warn({ msg: "Update failed - status required", reservationId: id });
			res.status(400).json({
				success: false,
				error: {
					code: "BAD_REQUEST",
					message: "Status is required",
					field: "status",
				},
			});
			return;
		}

		if (!Object.values(ReservationStatus).includes(status)) {
			reservationLogger.warn({ 
				msg: "Update failed - invalid status", 
				reservationId: id, 
				status 
			});
			res.status(400).json({
				success: false,
				error: {
					code: "BAD_REQUEST",
					message: `Invalid status. Must be one of: ${Object.values(ReservationStatus).join(", ")}`,
					field: "status",
					validValues: Object.values(ReservationStatus),
				},
			});
			return;
		}

		const connection = createCouchbaseConnection();
		const reservationRepos = new ReservationRepository(connection);

		const existingReservation = await reservationRepos.findById(id);
		if (!existingReservation) {
			reservationLogger.warn({ msg: "Reservation not found", reservationId: id });
			res.status(404).json({
				success: false,
				error: {
					code: "NOT_FOUND",
					message: "Reservation not found",
				},
			});
			return;
		}

		if (existingReservation.status === status) {
			reservationLogger.warn({ 
				msg: "Reservation already in this status", 
				reservationId: id, 
				status 
			});
			res.status(400).json({
				success: false,
				error: {
					code: "BAD_REQUEST",
					message: `Reservation is already ${status}`,
				},
			});
			return;
		}

		const previousStatus = existingReservation.status;
		const updated = await reservationRepos.updateStatusById(id, status);

		const adminName = req.user ? `${req.user.firstName} ${req.user.lastName}` : "Unknown Admin";
		const action = mapStatusToAction(status);

		const logRepository = new AdminOperationLogRepository(connection);
		await logRepository.create({
			adminId: adminId || "unknown",
			adminName,
			action,
			reservationId: id,
			previousStatus,
			newStatus: status,
			details: getActionDescription(action, previousStatus, status),
		});

		reservationLogger.info({ 
			msg: "Reservation updated successfully", 
			reservationId: id,
			previousStatus,
			newStatus: status,
			adminId 
		});

		res.json({
			success: true,
			data: updated,
			message: `Reservation ${status.toLowerCase()} successfully`,
		});
	} catch (error) {
		reservationLogger.error({ msg: "Error updating reservation", error, reservationId: req.params.id });
		res.status(500).json({
			success: false,
			error: {
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to update reservation. Please try again later.",
			},
		});
	}
});

/**
 * GET /api/reservations/logs
 * Get operation logs
 */
router.get("/logs", authenticate, async (req: any, res: any) => {
	try {
		reservationLogger.info({ msg: "Fetching operation logs", userId: req.user?.id });
		
		const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
		const reservationId = req.query.reservationId as string;

		const connection = createCouchbaseConnection();
		const logRepository = new AdminOperationLogRepository(connection);

		let logs;
		if (reservationId) {
			logs = await logRepository.findByReservationId(reservationId);
		} else {
			const result = await logRepository.findAll({}, { limit });
			logs = result.data;
		}

		const formattedLogs = logs.map((log: any) => ({
			id: log.id,
			adminId: log.adminId,
			adminName: log.adminName,
			action: log.action,
			reservationId: log.reservationId,
			previousStatus: log.previousStatus,
			newStatus: log.newStatus,
			details: log.details,
			timestamp: log.timestamp instanceof Date ? log.timestamp.toISOString() : log.timestamp,
		}));

		reservationLogger.info({ 
			msg: "Operation logs fetched successfully", 
			count: formattedLogs.length 
		});

		res.json({
			success: true,
			data: formattedLogs,
			count: formattedLogs.length,
		});
	} catch (error) {
		reservationLogger.error({ msg: "Error fetching operation logs", error });
		res.status(500).json({
			success: false,
			error: {
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to fetch operation logs. Please try again later.",
			},
		});
	}
});

export default router;
