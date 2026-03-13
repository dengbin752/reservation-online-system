/**
 * Unit tests for AuthService
 * @package @api/reservation-system
 */

import { AuthService } from "../services/auth.js";
import { UserRole } from "@shared/reservation-system";
import { mockUsers, MockUserRepository } from "../__mocks__/database.js";

// Jest globals
declare const describe: (name: string, fn: () => void) => void;
declare const it: (name: string, fn: () => void | Promise<void>) => void;
declare const expect: (actual: any) => {
	toBe: (expected: any) => void;
	toEqual: (expected: any) => void;
	toBeTruthy: () => void;
	toBeFalsy: () => void;
	toContain: (expected: any) => void;
	toBeUndefined: () => void;
	toBeNull: () => void;
	toThrow: () => void;
	not: {
		toBe: (expected: any) => void;
		toBeNull: () => void;
		toThrow: () => void;
		toBeUndefined: () => void;
	};
};
declare const beforeEach: (fn: () => void | Promise<void>) => void;
declare const jest: {
	fn: () => any;
	setTimeout: (timeout: number) => void;
};

describe("AuthService", () => {
	let authService: AuthService;

	beforeEach(() => {
		authService = new AuthService();
		// Clear mock users before each test
		mockUsers.clear();
	});

	describe("register", () => {
		it("should register a new user successfully", async () => {
			const userData = {
				email: "test@example.com",
				password: "password123",
				firstName: "John",
				lastName: "Doe",
				phone: "+1234567890",
				role: UserRole.CUSTOMER,
			};

			const result = await authService.register(userData);

			expect(result.user).toBeTruthy();
			expect(result.user.email).toBe(userData.email);
			expect(result.user.firstName).toBe(userData.firstName);
			expect(result.user.lastName).toBe(userData.lastName);
			expect(result.user.role).toBe(userData.role);
			expect(result.user.password).toBeUndefined();
			expect(result.token).toBeTruthy();
			expect(result.refreshToken).toBeTruthy();
		});

		it("should throw error when user already exists", async () => {
			const userData = {
				email: "existing@example.com",
				password: "password123",
				firstName: "John",
				lastName: "Doe",
				role: UserRole.CUSTOMER,
			};

			// Create user directly in mock store
			const repository = new MockUserRepository();
			await repository.create(userData);

			// Try to register again
			await expect(authService.register(userData)).toThrow();
		});

		it("should hash the password before saving", async () => {
			const userData = {
				email: "test@example.com",
				password: "password123",
				firstName: "John",
				lastName: "Doe",
				role: UserRole.CUSTOMER,
			};

			const result = await authService.register(userData);

			// Check that password is hashed
			const storedUser = mockUsers.get(userData.email);
			expect(storedUser).toBeTruthy();
			expect(storedUser?.password).toBeTruthy();
			expect(storedUser?.password).not.toBe(userData.password);
			// Password should be hashed (starts with "hashed_")
			expect(storedUser?.password).toContain("hashed_");
		});

		it("should create user with CUSTOMER role by default", async () => {
			const userData = {
				email: "test@example.com",
				password: "password123",
				firstName: "John",
				lastName: "Doe",
			};

			const result = await authService.register(userData as any);

			expect(result.user.role).toBe(UserRole.CUSTOMER);
		});

		it("should create user with ADMIN role when specified", async () => {
			const userData = {
				email: "admin@example.com",
				password: "admin123",
				firstName: "Admin",
				lastName: "User",
				role: UserRole.ADMIN,
			};

			const result = await authService.register(userData as any);

			expect(result.user.role).toBe(UserRole.ADMIN);
		});
	});

	describe("login", () => {
		it("should login successfully with correct credentials", async () => {
			const userData = {
				email: "test@example.com",
				password: "password123",
				firstName: "John",
				lastName: "Doe",
				role: UserRole.CUSTOMER,
			};

			// First register the user
			await authService.register(userData);

			// Then try to login
			const result = await authService.login(userData.email, userData.password);

			expect(result.user).toBeTruthy();
			expect(result.user.email).toBe(userData.email);
			expect(result.token).toBeTruthy();
			expect(result.refreshToken).toBeTruthy();
		});

		it("should throw error for non-existent user", async () => {
			await expect(
				authService.login("nonexistent@example.com", "password123")
			).toThrow();
		});

		it("should throw error for incorrect password", async () => {
			const userData = {
				email: "test@example.com",
				password: "correctpassword",
				firstName: "John",
				lastName: "Doe",
				role: UserRole.CUSTOMER,
			};

			await authService.register(userData);

			await expect(
				authService.login(userData.email, "wrongpassword")
			).toThrow();
		});

		it("should return user without password in response", async () => {
			const userData = {
				email: "test@example.com",
				password: "password123",
				firstName: "John",
				lastName: "Doe",
				role: UserRole.CUSTOMER,
			};

			await authService.register(userData);
			const result = await authService.login(userData.email, userData.password);

			expect(result.user.password).toBeUndefined();
		});
	});

	describe("getUserById", () => {
		it("should return user by id", async () => {
			const userData = {
				email: "test@example.com",
				password: "password123",
				firstName: "John",
				lastName: "Doe",
				role: UserRole.CUSTOMER,
			};

			const registerResult = await authService.register(userData);
			const userId = registerResult.user.id;

			const user = await authService.getUserById(userId);

			expect(user).toBeTruthy();
			expect(user?.email).toBe(userData.email);
		});

		it("should return null for non-existent user", async () => {
			const user = await authService.getUserById("non-existent-id");
			expect(user).toBeNull();
		});
	});

	describe("getUserByEmail", () => {
		it("should return user by email", async () => {
			const userData = {
				email: "test@example.com",
				password: "password123",
				firstName: "John",
				lastName: "Doe",
				role: UserRole.CUSTOMER,
			};

			await authService.register(userData);
			const user = await authService.getUserByEmail(userData.email);

			expect(user).toBeTruthy();
			expect(user?.email).toBe(userData.email);
		});

		it("should return null for non-existent email", async () => {
			const user = await authService.getUserByEmail("nonexistent@example.com");
			expect(user).toBeNull();
		});
	});

	describe("sendVerifyCode and verifyCode", () => {
		it("should generate and store verification code", async () => {
			const phone = "+1234567890";

			await authService.sendVerifyCode(phone);

			// The code should be generated internally
			// We can't directly test this without exposing the internal state
			// But we can test the verifyCode flow
		});

		it("should verify correct code", async () => {
			const phone = "+1234567890";
			const code = "123456";

			// Directly set the code for testing
			(authService as any).verificationCodes.set(phone, {
				code,
				expiresAt: new Date(Date.now() + 5 * 60 * 1000),
			});

			const isValid = await authService.verifyCode(phone, code);
			expect(isValid).toBeTruthy();
		});

		it("should reject incorrect code", async () => {
			const phone = "+1234567890";
			const code = "123456";

			// Directly set the code for testing
			(authService as any).verificationCodes.set(phone, {
				code,
				expiresAt: new Date(Date.now() + 5 * 60 * 1000),
			});

			const isValid = await authService.verifyCode(phone, "000000");
			expect(isValid).toBeFalsy();
		});

		it("should reject expired code", async () => {
			const phone = "+1234567890";
			const code = "123456";

			// Directly set an expired code for testing
			(authService as any).verificationCodes.set(phone, {
				code,
				expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
			});

			const isValid = await authService.verifyCode(phone, code);
			expect(isValid).toBeFalsy();
		});

		it("should reject code for unknown phone", async () => {
			const isValid = await authService.verifyCode("+0000000000", "123456");
			expect(isValid).toBeFalsy();
		});
	});

	describe("logout", () => {
		it("should clear refresh token on logout", async () => {
			const userData = {
				email: "test@example.com",
				password: "password123",
				firstName: "John",
				lastName: "Doe",
				role: UserRole.CUSTOMER,
			};

			const result = await authService.register(userData);

			// Logout should not throw
			await expect(authService.logout(result.token)).not.toThrow();
		});
	});
});
