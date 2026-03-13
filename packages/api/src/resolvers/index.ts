import {
	createCouchbaseConnection,
	ReservationRepository,
	TableRepository,
} from "@database/reservation-system";
import {
	type createReservationSchema,
	type createTableSchema,
	type PaginatedResponse,
	type PaginationParams,
	type Reservation,
	type ReservationFilters,
	ReservationStatus,
	type Table,
	TableStatus,
	type User,
} from "@shared/reservation-system";
import { v4 as uuidv4 } from "uuid";
import type { z } from "zod";

type CreateTableInput = z.infer<typeof createTableSchema>;
type CreateReservationInput = z.infer<typeof createReservationSchema>;
type ReservationWithCustomer = Reservation & {
	customer: Pick<User, "email" | "firstName" | "lastName" | "phone">;
};

const resolvers = {
	Query: {
		me: () => {
			return null;
		},
		users: () => {
			return [];
		},
		tables: () => {
			return [];
		},
		table: () => {
			return null;
		},
		reservations: async (
			_: any,
			{
				filters,
				pagination,
			}: { filters?: ReservationFilters; pagination?: PaginationParams },
		): Promise<PaginatedResponse<ReservationWithCustomer>> => {
			try {
				const connection = createCouchbaseConnection();
				const reservationRepos = new ReservationRepository(connection);
				const results = await reservationRepos.findAll(filters, pagination);
				return results;
			} catch (error) {
				throw new Error("Failed to fetch reservations");
			}
		},
		reservation: () => {
			return null;
		},
		customerReservations: async (
			_: any,
			{ customerId }: { customerId: string },
		) => {
			try {
				const connection = createCouchbaseConnection();
				const reservationRepos = new ReservationRepository(connection);
				const reservations =
					await reservationRepos.findByCustomerId(customerId);
				return reservations;
			} catch (error) {
				throw error;
			}
		},
		availableTables: () => {
			return { tables: [], date: new Date(), time: "19:00", partySize: 2 };
		},
	},
	Mutation: {
		createTable: async (_: any, { input }: { input: CreateTableInput }) => {
			try {
				if (!input.number || !input.capacity || !input.location) {
					throw new Error(
						"Missing required fields: number, capacity, and location are required",
					);
				}

				const newTable: Table = {
					id: uuidv4(),
					number: input.number,
					capacity: input.capacity,
					location: input.location,
					status: TableStatus.AVAILABLE,
					createdAt: new Date(),
					updatedAt: new Date(),
				};

				const connection = createCouchbaseConnection();
				const tableRepos = new TableRepository(connection);
				const table = tableRepos.create(newTable);
				return table;
			} catch (error) {
				throw new Error(`Failed to create table: ${(error as Error).message}`);
			}
		},
		updateTable: () => {
			return null;
		},
		deleteTable: () => {
			return true;
		},
		updateTableStatus: () => {
			return null;
		},
		createReservation: async (
			_: any,
			{ input }: { input: CreateReservationInput },
		) => {
			try {
				if (
					!input.customerId ||
					!input.tableId ||
					!input.date ||
					!input.time ||
					!input.partySize
				) {
					throw new Error(
						"Missing required fields: customId, tableId, date, time, partySize are required",
					);
				}

				const newReservation: Reservation = {
					id: uuidv4(),
					title: input.title,
					customerId: input.customerId,
					tableId: input.tableId,
					date: new Date(input.date),
					time: input.time,
					partySize: input.partySize,
					status: ReservationStatus.PENDING,
					contactInfo: input.contactInfo,
					specialRequests: input.specialRequests,
					createdAt: new Date(),
					updatedAt: new Date(),
				};

				const connection = createCouchbaseConnection();
				const reservationRepos = new ReservationRepository(connection);
				const table = reservationRepos.create(newReservation);
				return table;
			} catch (error) {
				throw new Error(`Failed to create table: ${(error as Error).message}`);
			}
		},
		updateReservation: () => {
			return null;
		},
		cancelReservation: async (_: any, { id }: { id: string }) => {
			try {
				const connection = createCouchbaseConnection();
				const reservationRepos = new ReservationRepository(connection);
				
				// 先尝试通过document key获取，如果找不到再通过业务字段id获取
				let existingReservation = await reservationRepos.findById(id);
				let documentKey = id;
				
				// 如果通过document key找不到，尝试通过业务字段id查找
				if (!existingReservation) {
					const query = `
						SELECT META(r).id as docKey
						FROM \`reservations\` r
						WHERE r.type = 'reservation' AND r.id = $id
						LIMIT 1
					`;
					const results = await connection.query(query, { id });
					if (results && results.length > 0) {
						documentKey = results[0].docKey;
						existingReservation = await reservationRepos.findById(documentKey);
					}
				}
				
				if (!existingReservation) {
					throw new Error("Reservation not found");
				}
				
				// 更新状态
				await reservationRepos.updateStatusById(documentKey, ReservationStatus.CANCELLED);
				
				// 获取更新后的完整对象
				const updatedReservation = await reservationRepos.findById(documentKey);
				return updatedReservation;
			} catch (error) {
				throw new Error(
					`Failed to cancel reservation: ${(error as Error).message}`,
				);
			}
		},
		updateReservationStatus: async (_: any, {id, status}: {id: string, status: ReservationStatus}): Promise<{id: string, status: ReservationStatus}> => {
			try {
				const connection = createCouchbaseConnection();
				const reservationRepos = new ReservationRepository(connection);
				const updatedReservation = await reservationRepos.updateStatusById(id, status);
				return updatedReservation;
			} catch (error) {
				throw new Error("Failed to update reservation status");
			}
		},
	},
	Date: {
		serialize: (value: Date) => value.toISOString(),
		parseValue: (value: string) => new Date(value),
		parseLiteral: (value: any) => new Date(value.value),
	},
};

export { resolvers };
