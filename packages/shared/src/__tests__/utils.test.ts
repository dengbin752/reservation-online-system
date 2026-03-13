/**
 * Unit tests for utility functions
 * @package @shared/reservation-system
 */

import {
	emailSchema,
	passwordSchema,
	phoneSchema,
	nameSchema,
	dateSchema,
	timeSchema,
	loginSchema,
	registerSchema,
	createReservationSchema,
	validateSchema,
	validatePartialSchema,
	generateId,
	formatDate,
	formatTime,
	parseDateTime,
	isValidDate,
	isValidTime,
	calculateDuration,
	isTimeSlotAvailable,
	paginate,
	sanitizeInput,
	hashPassword,
	comparePassword,
	generateJWTToken,
	verifyJWTToken,
	formatCurrency,
	formatDateWithTime,
	getErrorMessage,
	createError,
	isDevelopment,
	isProduction,
	isTest,
} from "../utils/index.js";

import { UserRole, ReservationStatus } from "../types/index.js";

// Jest globals
declare const describe: (name: string, fn: () => void) => void;
declare const it: (name: string, fn: () => void | Promise<void>) => void;
declare const expect: (actual: any) => {
	toBe: (expected: any) => void;
	toEqual: (expected: any) => void;
	toBeGreaterThan: (expected: number) => void;
	toBeLessThan: (expected: number) => void;
	toBeTruthy: () => void;
	toBeFalsy: () => void;
	toContain: (expected: any) => void;
	toBeUndefined: () => void;
	toThrow: () => void;
	not: {
		toThrow: () => void;
		toBe: (expected: any) => void;
		toBeUndefined: () => void;
	};
};
declare const beforeAll: (fn: () => void | Promise<void>) => void;
declare const afterAll: (fn: () => void | Promise<void>) => void;
declare const beforeEach: (fn: () => void | Promise<void>) => void;
declare const afterEach: (fn: () => void | Promise<void>) => void;
declare const jest: {
	fn: () => any;
	setTimeout: (timeout: number) => void;
};

describe("Schema Validation Tests", () => {
	describe("emailSchema", () => {
		it("should validate correct email addresses", () => {
			expect(() => emailSchema.parse("test@example.com")).not.toThrow();
			expect(() => emailSchema.parse("user.name@domain.co.uk")).not.toThrow();
		});

		it("should reject invalid email addresses", () => {
			expect(() => emailSchema.parse("invalid")).toThrow();
			expect(() => emailSchema.parse("@example.com")).toThrow();
			expect(() => emailSchema.parse("test@")).toThrow();
		});
	});

	describe("passwordSchema", () => {
		it("should validate passwords with minimum 6 characters", () => {
			expect(() => passwordSchema.parse("123456")).not.toThrow();
			expect(() => passwordSchema.parse("password123")).not.toThrow();
		});

		it("should reject passwords shorter than 6 characters", () => {
			expect(() => passwordSchema.parse("12345")).toThrow();
			expect(() => passwordSchema.parse("")).toThrow();
		});
	});

	describe("phoneSchema", () => {
		it("should validate correct phone numbers", () => {
			expect(() => phoneSchema.parse("+1234567890")).not.toThrow();
			expect(() => phoneSchema.parse("123-456-7890")).not.toThrow();
			expect(() => phoneSchema.parse("(123) 456-7890")).not.toThrow();
		});

		it("should reject invalid phone numbers", () => {
			expect(() => phoneSchema.parse("abc")).toThrow();
		});
	});

	describe("nameSchema", () => {
		it("should validate names with at least 2 characters", () => {
			expect(() => nameSchema.parse("John")).not.toThrow();
			expect(() => nameSchema.parse("Jo")).not.toThrow();
		});

		it("should reject names shorter than 2 characters", () => {
			expect(() => nameSchema.parse("J")).toThrow();
			expect(() => nameSchema.parse("")).toThrow();
		});
	});

	describe("dateSchema", () => {
		it("should validate correct date format (YYYY-MM-DD)", () => {
			expect(() => dateSchema.parse("2024-01-01")).not.toThrow();
			expect(() => dateSchema.parse("2024-12-31")).not.toThrow();
		});

		it("should reject invalid date formats", () => {
			expect(() => dateSchema.parse("01-01-2024")).toThrow();
			expect(() => dateSchema.parse("2024/01/01")).toThrow();
			expect(() => dateSchema.parse("invalid")).toThrow();
		});
	});

	describe("timeSchema", () => {
		it("should validate correct time format (HH:MM)", () => {
			expect(() => timeSchema.parse("00:00")).not.toThrow();
			expect(() => timeSchema.parse("23:59")).not.toThrow();
			expect(() => timeSchema.parse("12:30")).not.toThrow();
		});

		it("should reject invalid time formats", () => {
			expect(() => timeSchema.parse("25:00")).toThrow();
			expect(() => timeSchema.parse("12:60")).toThrow();
			expect(() => timeSchema.parse("invalid")).toThrow();
		});
	});

	describe("loginSchema", () => {
		it("should validate correct login data", () => {
			const validData = {
				email: "test@example.com",
				password: "password123",
			};
			expect(() => loginSchema.parse(validData)).not.toThrow();
		});

		it("should reject invalid login data", () => {
			expect(() => loginSchema.parse({ email: "invalid", password: "123" })).toThrow();
			expect(() => loginSchema.parse({ email: "test@example.com", password: "123" })).toThrow();
		});
	});

	describe("registerSchema", () => {
		it("should validate correct registration data", () => {
			const validData = {
				email: "test@example.com",
				password: "password123",
				firstName: "John",
				lastName: "Doe",
				phone: "+1234567890",
				role: UserRole.CUSTOMER,
			};
			expect(() => registerSchema.parse(validData)).not.toThrow();
		});

		it("should reject invalid registration data", () => {
			const invalidData = {
				email: "invalid",
				password: "123",
				firstName: "J",
				lastName: "D",
			};
			expect(() => registerSchema.parse(invalidData)).toThrow();
		});
	});

	describe("createReservationSchema", () => {
		it("should validate correct reservation data", () => {
			const validData = {
				customerId: "123e4567-e89b-12d3-a456-426614174000",
				tableId: "123e4567-e89b-12d3-a456-426614174001",
				date: "2024-01-01",
				time: "12:00",
				partySize: 4,
			};
			expect(() => createReservationSchema.parse(validData)).not.toThrow();
		});

		it("should reject invalid reservation data", () => {
			const invalidData = {
				customerId: "invalid-uuid",
				tableId: "invalid-uuid",
				date: "01-01-2024",
				time: "25:00",
				partySize: -1,
			};
			expect(() => createReservationSchema.parse(invalidData)).toThrow();
		});
	});
});

describe("Validation Functions", () => {
	describe("validateSchema", () => {
		it("should return typed data when validation passes", () => {
			const result = validateSchema(loginSchema, {
				email: "test@example.com",
				password: "password123",
			});
			expect(result.email).toBe("test@example.com");
		});

		it("should throw error when validation fails", () => {
			expect(() => validateSchema(loginSchema, { email: "invalid" })).toThrow();
		});
	});

	describe("validatePartialSchema", () => {
		it("should return partial data when validation passes", () => {
			const result = validatePartialSchema(loginSchema, {
				email: "test@example.com",
			});
			expect(result.email).toBe("test@example.com");
			expect(result.password).toBeUndefined();
		});
	});
});

describe("Utility Functions", () => {
	describe("generateId", () => {
		it("should generate a random ID", () => {
			const id = generateId();
			expect(typeof id).toBe("string");
			expect(id.length).toBeGreaterThan(0);
		});

		it("should generate unique IDs", () => {
			const ids = new Set();
			for (let i = 0; i < 100; i++) {
				ids.add(generateId());
			}
			expect(ids.size).toBe(100);
		});
	});

	describe("formatDate", () => {
		it("should format date to YYYY-MM-DD", () => {
			const date = new Date("2024-01-15T12:00:00Z");
			expect(formatDate(date)).toBe("2024-01-15");
		});
	});

	describe("formatTime", () => {
		it("should format time to HH:MM", () => {
			const date = new Date("2024-01-01T14:30:00Z");
			expect(formatTime(date)).toBe("14:30");
		});
	});

	describe("parseDateTime", () => {
		it("should parse date and time strings to Date object", () => {
			const result = parseDateTime("2024-01-15", "14:30");
			expect(result.getFullYear()).toBe(2024);
			expect(result.getMonth()).toBe(0); // January is 0
			expect(result.getDate()).toBe(15);
			expect(result.getHours()).toBe(14);
			expect(result.getMinutes()).toBe(30);
		});
	});

	describe("isValidDate", () => {
		it("should return true for valid dates", () => {
			expect(isValidDate("2024-01-01")).toBe(true);
			expect(isValidDate("2024-12-31")).toBe(true);
		});

		it("should return false for invalid dates", () => {
			expect(isValidDate("invalid")).toBe(false);
			expect(isValidDate("2024-13-01")).toBe(false);
		});
	});

	describe("isValidTime", () => {
		it("should return true for valid times", () => {
			expect(isValidTime("00:00")).toBe(true);
			expect(isValidTime("12:30")).toBe(true);
			expect(isValidTime("23:59")).toBe(true);
		});

		it("should return false for invalid times", () => {
			expect(isValidTime("25:00")).toBe(false);
			expect(isValidTime("12:60")).toBe(false);
			expect(isValidTime("invalid")).toBe(false);
		});
	});

	describe("calculateDuration", () => {
		it("should calculate duration in minutes", () => {
			expect(calculateDuration("12:00", "14:30")).toBe(150);
			expect(calculateDuration("00:00", "23:59")).toBe(1439);
		});

		it("should handle same time", () => {
			expect(calculateDuration("12:00", "12:00")).toBe(0);
		});
	});

	describe("isTimeSlotAvailable", () => {
		it("should return true when no conflicts", () => {
			const existingReservations: Array<{ date: string; time: string; duration: number }> = [];
			expect(isTimeSlotAvailable(existingReservations, "2024-01-15", "14:00", 60)).toBe(true);
		});

		it("should return false when time slot conflicts", () => {
			const existingReservations = [
				{ date: "2024-01-15", time: "14:00", duration: 120 },
			];
			// New reservation starts during existing
			expect(isTimeSlotAvailable(existingReservations, "2024-01-15", "14:30", 60)).toBe(false);
		});

		it("should return true when time slot does not conflict", () => {
			const existingReservations = [
				{ date: "2024-01-15", time: "14:00", duration: 120 },
			];
			// New reservation is after existing
			expect(isTimeSlotAvailable(existingReservations, "2024-01-15", "16:30", 60)).toBe(true);
		});
	});

	describe("paginate", () => {
		const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

		it("should paginate data correctly", () => {
			const result = paginate(data, 1, 3);
			expect(result.data).toEqual([1, 2, 3]);
			expect(result.total).toBe(10);
			expect(result.page).toBe(1);
			expect(result.limit).toBe(3);
			expect(result.totalPages).toBe(4);
		});

		it("should handle last page with fewer items", () => {
			const result = paginate(data, 4, 3);
			expect(result.data).toEqual([10]);
			expect(result.totalPages).toBe(4);
		});

		it("should return empty array for out of bounds page", () => {
			const result = paginate(data, 5, 3);
			expect(result.data).toEqual([]);
		});
	});

	describe("sanitizeInput", () => {
		it("should trim whitespace", () => {
			expect(sanitizeInput("  test  ")).toBe("test");
		});

		it("should remove angle brackets", () => {
			expect(sanitizeInput("<script>alert('xss')</script>")).toBe("scriptalert(xss)/script");
		});
	});
});

describe("Password Functions", () => {
	describe("hashPassword", () => {
		it("should hash password successfully", async () => {
			const hashed = await hashPassword("password123");
			expect(typeof hashed).toBe("string");
			expect(hashed.length).toBeGreaterThan(0);
		});

		it("should generate different hashes for same password", async () => {
			const hash1 = await hashPassword("password123");
			const hash2 = await hashPassword("password123");
			expect(hash1).not.toBe(hash2);
		});
	});

	describe("comparePassword", () => {
		it("should return true for correct password", async () => {
			const hashed = await hashPassword("password123");
			const isMatch = await comparePassword("password123", hashed);
			expect(isMatch).toBe(true);
		});

		it("should return false for incorrect password", async () => {
			const hashed = await hashPassword("password123");
			const isMatch = await comparePassword("wrongpassword", hashed);
			expect(isMatch).toBe(false);
		});
	});
});

describe("JWT Functions", () => {
	const testSecret = "test-secret-key";

	describe("generateJWTToken", () => {
		it("should generate a valid JWT token", () => {
			const token = generateJWTToken({ userId: "123" }, testSecret);
			expect(typeof token).toBe("string");
			expect(token.split(".").length).toBe(3);
		});

		it("should use custom expiration time", () => {
			const token = generateJWTToken({ userId: "123" }, testSecret, "1h");
			expect(token.split(".").length).toBe(3);
		});
	});

	describe("verifyJWTToken", () => {
		it("should verify valid token", () => {
			const payload = { userId: "123" };
			const token = generateJWTToken(payload, testSecret);
			const decoded = verifyJWTToken(token, testSecret);
			expect(decoded.userId).toBe("123");
		});

		it("should throw error for invalid token", () => {
			expect(() => verifyJWTToken("invalid-token", testSecret)).toThrow();
		});

		it("should throw error for wrong secret", () => {
			const token = generateJWTToken({ userId: "123" }, testSecret);
			expect(() => verifyJWTToken(token, "wrong-secret")).toThrow();
		});
	});
});

describe("Formatting Functions", () => {
	describe("formatCurrency", () => {
		it("should format amount as USD currency", () => {
			expect(formatCurrency(100)).toBe("$100.00");
			expect(formatCurrency(1234.56)).toBe("$1,234.56");
		});
	});

	describe("formatDateWithTime", () => {
		it("should format date with time", () => {
			const date = new Date("2024-01-15T14:30:00");
			const formatted = formatDateWithTime(date);
			expect(formatted).toContain("Jan");
			expect(formatted).toContain("15");
			expect(formatted).toContain("2024");
		});
	});
});

describe("Error Handling Functions", () => {
	describe("getErrorMessage", () => {
		it("should extract message from Error object", () => {
			const error = new Error("Test error");
			expect(getErrorMessage(error)).toBe("Test error");
		});

		it("should convert non-Error to string", () => {
			expect(getErrorMessage("String error")).toBe("String error");
			expect(getErrorMessage(123)).toBe("123");
		});
	});

	describe("createError", () => {
		it("should create error with custom message", () => {
			const error = createError("Custom error");
			expect(error.message).toBe("Custom error");
		});

		it("should create error with custom status code", () => {
			const error = createError("Not found", 404);
			expect(error.message).toBe("Not found");
			expect((error as any).statusCode).toBe(404);
		});
	});
});

describe("Environment Functions", () => {
	describe("isDevelopment", () => {
		it("should return true when NODE_ENV is development", () => {
			process.env.NODE_ENV = "development";
			expect(isDevelopment()).toBe(true);
		});

		it("should return false when NODE_ENV is not development", () => {
			process.env.NODE_ENV = "production";
			expect(isDevelopment()).toBe(false);
		});
	});

	describe("isProduction", () => {
		it("should return true when NODE_ENV is production", () => {
			process.env.NODE_ENV = "production";
			expect(isProduction()).toBe(true);
		});

		it("should return false when NODE_ENV is not production", () => {
			process.env.NODE_ENV = "development";
			expect(isProduction()).toBe(false);
		});
	});

	describe("isTest", () => {
		it("should return true when NODE_ENV is test", () => {
			process.env.NODE_ENV = "test";
			expect(isTest()).toBe(true);
		});

		it("should return false when NODE_ENV is not test", () => {
			process.env.NODE_ENV = "development";
			expect(isTest()).toBe(false);
		});
	});
});
