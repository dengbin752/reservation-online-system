import { z } from "zod";
import { ReservationStatus, TableStatus, UserRole } from "../types";
export declare const emailSchema: z.ZodString;
export declare const passwordSchema: z.ZodString;
export declare const phoneSchema: z.ZodString;
export declare const nameSchema: z.ZodString;
export declare const dateSchema: z.ZodString;
export declare const timeSchema: z.ZodString;
export declare const numberSchema: z.ZodNumber;
export declare const enumSchema: z.ZodNativeEnum<typeof UserRole>;
export declare const reservationStatusSchema: z.ZodNativeEnum<typeof ReservationStatus>;
export declare const tableStatusSchema: z.ZodNativeEnum<typeof TableStatus>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const registerSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    role: z.ZodNativeEnum<typeof UserRole>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    phone?: string | undefined;
}, {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    phone?: string | undefined;
}>;
export declare const createReservationSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    customerId: z.ZodString;
    tableId: z.ZodString;
    date: z.ZodString;
    time: z.ZodString;
    partySize: z.ZodNumber;
    contactInfo: z.ZodOptional<z.ZodString>;
    specialRequests: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    customerId: string;
    tableId: string;
    date: string;
    time: string;
    partySize: number;
    title?: string | undefined;
    contactInfo?: string | undefined;
    specialRequests?: string | undefined;
}, {
    customerId: string;
    tableId: string;
    date: string;
    time: string;
    partySize: number;
    title?: string | undefined;
    contactInfo?: string | undefined;
    specialRequests?: string | undefined;
}>;
export declare const updateReservationSchema: z.ZodObject<{
    tableId: z.ZodOptional<z.ZodString>;
    date: z.ZodOptional<z.ZodString>;
    time: z.ZodOptional<z.ZodString>;
    partySize: z.ZodOptional<z.ZodNumber>;
    specialRequests: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodNativeEnum<typeof ReservationStatus>>;
}, "strip", z.ZodTypeAny, {
    status?: ReservationStatus | undefined;
    tableId?: string | undefined;
    date?: string | undefined;
    time?: string | undefined;
    partySize?: number | undefined;
    specialRequests?: string | undefined;
}, {
    status?: ReservationStatus | undefined;
    tableId?: string | undefined;
    date?: string | undefined;
    time?: string | undefined;
    partySize?: number | undefined;
    specialRequests?: string | undefined;
}>;
export declare const createTableSchema: z.ZodObject<{
    number: z.ZodNumber;
    capacity: z.ZodNumber;
    location: z.ZodString;
}, "strip", z.ZodTypeAny, {
    number: number;
    capacity: number;
    location: string;
}, {
    number: number;
    capacity: number;
    location: string;
}>;
export declare const updateTableSchema: z.ZodObject<{
    number: z.ZodOptional<z.ZodNumber>;
    capacity: z.ZodOptional<z.ZodNumber>;
    location: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodNativeEnum<typeof TableStatus>>;
}, "strip", z.ZodTypeAny, {
    number?: number | undefined;
    status?: TableStatus | undefined;
    capacity?: number | undefined;
    location?: string | undefined;
}, {
    number?: number | undefined;
    status?: TableStatus | undefined;
    capacity?: number | undefined;
    location?: string | undefined;
}>;
export declare function validateSchema<T>(schema: z.ZodSchema<T>, data: any): T;
export declare function validatePartialSchema<T>(schema: z.ZodSchema<T>, data: any): Partial<T>;
export declare function generateId(): string;
export declare function formatDate(date: Date): string;
export declare function formatTime(date: Date): string;
export declare function parseDateTime(dateString: string, timeString: string): Date;
export declare function isValidDate(dateString: string): boolean;
export declare function isValidTime(timeString: string): boolean;
export declare function calculateDuration(startTime: string, endTime: string): number;
export declare function isTimeSlotAvailable(existingReservations: Array<{
    date: string;
    time: string;
    duration: number;
}>, newDate: string, newTime: string, duration?: number): boolean;
export declare function paginate<T>(data: T[], page: number, limit: number): {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
};
export declare function sanitizeInput(input: string): string;
export declare function hashPassword(password: string): Promise<string>;
export declare function comparePassword(password: string, hashedPassword: string): Promise<boolean>;
export declare function generateJWTToken(payload: any, secret: string, expiresIn?: string): string;
export declare function verifyJWTToken(token: string, secret: string): any;
export declare function formatCurrency(amount: number): string;
export declare function formatDateWithTime(date: Date): string;
export declare function getErrorMessage(error: unknown): string;
export declare function createError(message: string, statusCode?: number): Error;
export declare function isDevelopment(): boolean;
export declare function isProduction(): boolean;
export declare function isTest(): boolean;
//# sourceMappingURL=index.d.ts.map