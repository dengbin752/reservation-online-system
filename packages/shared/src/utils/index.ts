import bcryptjs from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { z } from "zod";
import { ReservationStatus, TableStatus, UserRole } from "../types/index.js";

export const emailSchema = z.string().email("Invalid email address");
export const passwordSchema = z
	.string()
	.min(6, "Password must be at least 6 characters");
export const phoneSchema = z
	.string()
	.regex(/^\+?[\d\s\-()]+$/, "Invalid phone number");
export const nameSchema = z
	.string()
	.min(2, "Name must be at least 2 characters");
export const dateSchema = z
	.string()
	.regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)");
export const timeSchema = z
	.string()
	.regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)");
export const numberSchema = z.number().positive("Number must be positive");
export const enumSchema = z.nativeEnum(UserRole);
export const reservationStatusSchema = z.nativeEnum(ReservationStatus);
export const tableStatusSchema = z.nativeEnum(TableStatus);

export const loginSchema = z.object({
	email: emailSchema,
	password: passwordSchema,
});

export const registerSchema = z.object({
	email: emailSchema,
	password: passwordSchema,
	firstName: nameSchema,
	lastName: nameSchema,
	phone: phoneSchema.optional(),
	role: enumSchema,
});

export const createReservationSchema = z.object({
	title: z.string().optional(),
	customerId: z.string().uuid("Invalid customer ID"),
	tableId: z.string().uuid("Invalid table ID"),
	date: dateSchema,
	time: timeSchema,
	partySize: numberSchema,
	contactInfo: z.string().optional(),
	specialRequests: z.string().optional(),
});

export const updateReservationSchema = z.object({
	tableId: z.string().uuid().optional(),
	date: dateSchema.optional(),
	time: timeSchema.optional(),
	partySize: numberSchema.optional(),
	specialRequests: z.string().optional(),
	status: reservationStatusSchema.optional(),
});

export const createTableSchema = z.object({
	number: numberSchema,
	capacity: numberSchema,
	location: z.string().min(1, "Location is required"),
});

export const updateTableSchema = z.object({
	number: numberSchema.optional(),
	capacity: numberSchema.optional(),
	location: z.string().min(1).optional(),
	status: tableStatusSchema.optional(),
});

export function validateSchema<T>(schema: z.ZodSchema<T>, data: any): T {
	return schema.parse(data);
}

export function validatePartialSchema<T>(
	schema: z.ZodSchema<T>,
	data: any,
): Partial<T> {
	if (schema instanceof z.ZodObject) {
		return schema.partial().parse(data) as Partial<T>;
	} else {
		return schema.parse(data) as T;
	}
}

export function generateId(): string {
	return Math.random().toString(36).substr(2, 9);
}

export function formatDate(date: Date): string {
	return date.toISOString().split("T")[0];
}

export function formatTime(date: Date): string {
	return date.toTimeString().slice(0, 5);
}

export function parseDateTime(dateString: string, timeString: string): Date {
	const [year, month, day] = dateString.split("-").map(Number);
	const [hours, minutes] = timeString.split(":").map(Number);
	return new Date(year, month - 1, day, hours, minutes);
}

export function isValidDate(dateString: string): boolean {
	const date = new Date(dateString);
	return date instanceof Date && !isNaN(date.getTime());
}

export function isValidTime(timeString: string): boolean {
	const [hours, minutes] = timeString.split(":").map(Number);
	return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

export function calculateDuration(startTime: string, endTime: string): number {
	const [startHours, startMinutes] = startTime.split(":").map(Number);
	const [endHours, endMinutes] = endTime.split(":").map(Number);

	const startTotalMinutes = startHours * 60 + startMinutes;
	const endTotalMinutes = endHours * 60 + endMinutes;

	return endTotalMinutes - startTotalMinutes;
}

export function isTimeSlotAvailable(
	existingReservations: Array<{ date: string; time: string; duration: number }>,
	newDate: string,
	newTime: string,
	duration: number = 120,
): boolean {
	const newStart = parseDateTime(newDate, newTime);
	const newEnd = new Date(newStart.getTime() + duration * 60000);

	for (const reservation of existingReservations) {
		const existingStart = parseDateTime(reservation.date, reservation.time);
		const existingEnd = new Date(
			existingStart.getTime() + reservation.duration * 60000,
		);

		if (
			(newStart >= existingStart && newStart < existingEnd) ||
			(newEnd > existingStart && newEnd <= existingEnd) ||
			(newStart <= existingStart && newEnd >= existingEnd)
		) {
			return false;
		}
	}

	return true;
}

export function paginate<T>(data: T[], page: number, limit: number) {
	const startIndex = (page - 1) * limit;
	const endIndex = startIndex + limit;
	const paginatedData = data.slice(startIndex, endIndex);

	return {
		data: paginatedData,
		total: data.length,
		page,
		limit,
		totalPages: Math.ceil(data.length / limit),
	};
}

export function sanitizeInput(input: string): string {
	return input.trim().replace(/[<>]/g, "");
}

export async function hashPassword(password: string): Promise<string> {
	const saltRounds = 10;
	const salt = await bcryptjs.genSalt(saltRounds);
	const hashedPassword = await bcryptjs.hash(password, salt);
	return hashedPassword;
}

export async function comparePassword(
	password: string,
	hashedPassword: string,
): Promise<boolean> {
	const isMatch = await bcryptjs.compare(password, hashedPassword);
	return isMatch;
}

export function generateJWTToken(
	payload: any,
	secret: string,
	expiresIn: string = "1h",
): string {
	const options: SignOptions = {
		expiresIn: expiresIn as SignOptions["expiresIn"],
	};
	return jwt.sign(payload, secret, options);
}

export function verifyJWTToken(token: string, secret: string): any {
	try {
		return jwt.verify(token, secret);
	} catch (error) {
		throw new Error("Invalid token");
	}
}

export function formatCurrency(amount: number): string {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
	}).format(amount);
}

export function formatDateWithTime(date: Date): string {
	return date.toLocaleString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

export function getErrorMessage(error: unknown): string {
	if (error instanceof Error) return error.message;
	return String(error);
}

export function createError(message: string, statusCode: number = 500): Error {
	const error = new Error(message);
	(error as any).statusCode = statusCode;
	return error;
}

export function isDevelopment(): boolean {
	return process.env.NODE_ENV === "development";
}

export function isProduction(): boolean {
	return process.env.NODE_ENV === "production";
}

export function isTest(): boolean {
	return process.env.NODE_ENV === "test";
}
