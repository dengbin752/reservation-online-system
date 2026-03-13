import type {
	AuthResponse,
	LoginInput,
	RegisterInput
} from "@shared/reservation-system";
import type { Request, Response } from "express";
import { validationResult } from "express-validator";
import { AuthService } from "../services/auth.js";
import {
	BadRequestError,
	UnauthorizedError,
	ConflictError,
	NotFoundError,
	ForbiddenError,
} from "../errors/api-errors.js";

export class AuthController {
	private authService: AuthService;

	constructor() {
		this.authService = new AuthService();
	}

	login = async (req: Request, res: Response): Promise<void> => {
		try {
			// Validate request
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				const formattedErrors = errors.array().map((err: any) => ({
					field: err.path || err.param,
					message: err.msg,
				}));
				res.status(400).json({
					success: false,
					error: {
						code: "BAD_REQUEST",
						message: "Validation failed",
						details: formattedErrors,
					},
				});
				return;
			}

			const loginInput: LoginInput = req.body;
			
			// Attempt login
			const result: AuthResponse = await this.authService.login(
				loginInput.email,
				loginInput.password,
			);

			// Success response
			res.json({
				success: true,
				data: result,
				message: "Login successful",
			});
		} catch (error: any) {
			// Handle specific error cases with user-friendly messages
			if (error.message === "User not found") {
				res.status(401).json({
					success: false,
					error: {
						code: "UNAUTHORIZED",
						message: "Invalid email or password",
					},
				});
				return;
			}
			
			if (error.message === "Invalid password") {
				res.status(401).json({
					success: false,
					error: {
						code: "UNAUTHORIZED",
						message: "Invalid email or password",
					},
				});
				return;
			}

			// Generic error response
			console.error("Login error:", error);
			res.status(500).json({
				success: false,
				error: {
					code: "INTERNAL_SERVER_ERROR",
					message: "An error occurred during login. Please try again later.",
				},
			});
		}
	};

	register = async (req: Request, res: Response): Promise<void> => {
		try {
			// Validate request
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				const formattedErrors = errors.array().map((err: any) => ({
					field: err.path || err.param,
					message: err.msg,
				}));
				res.status(400).json({
					success: false,
					error: {
						code: "BAD_REQUEST",
						message: "Validation failed",
						details: formattedErrors,
					},
				});
				return;
			}

			const registerInput: RegisterInput = req.body;
			const result: AuthResponse = await this.authService.register(registerInput);

			// Success response with 201 Created
			res.status(201).json({
				success: true,
				data: result,
				message: "Registration successful. Welcome!",
			});
		} catch (error: any) {
			// Handle specific error cases
			if (error.message === "User already exists") {
				res.status(409).json({
					success: false,
					error: {
						code: "CONFLICT",
						message: "An account with this email already exists",
						field: "email",
					},
				});
				return;
			}

			// Check for validation errors from Zod
			if (error.message.includes("Validation error")) {
				res.status(400).json({
					success: false,
					error: {
						code: "BAD_REQUEST",
						message: error.message,
					},
				});
				return;
			}

			// Generic error response
			console.error("Registration error:", error);
			res.status(500).json({
				success: false,
				error: {
					code: "INTERNAL_SERVER_ERROR",
					message: "An error occurred during registration. Please try again later.",
				},
			});
		}
	};

	logout = async (req: Request, res: Response): Promise<void> => {
		try {
			const { token } = req.body;
			
			if (!token) {
				res.status(400).json({
					success: false,
					error: {
						code: "BAD_REQUEST",
						message: "Token is required for logout",
					},
				});
				return;
			}

			await this.authService.logout(token);

			res.json({
				success: true,
				message: "Logout successful",
			});
		} catch (error) {
			console.error("Logout error:", error);
			res.status(500).json({
				success: false,
				error: {
					code: "INTERNAL_SERVER_ERROR",
					message: "An error occurred during logout",
				},
			});
		}
	};

	// Send phone verification code
	sendVerifyCode = async (req: Request, res: Response): Promise<void> => {
		try {
			const { phone } = req.body;
			
			if (!phone) {
				res.status(400).json({
					success: false,
					error: {
						code: "BAD_REQUEST",
						message: "Phone number is required",
						field: "phone",
					},
				});
				return;
			}

			// Validate phone format
			const phoneRegex = /^\+?[\d\s\-()]+$/;
			if (!phoneRegex.test(phone)) {
				res.status(400).json({
					success: false,
					error: {
						code: "BAD_REQUEST",
						message: "Invalid phone number format",
						field: "phone",
					},
				});
				return;
			}

			await this.authService.sendVerifyCode(phone);
			
			res.json({
				success: true,
				message: "Verification code sent successfully",
			});
		} catch (error) {
			console.error("Send verification code error:", error);
			res.status(500).json({
				success: false,
				error: {
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to send verification code. Please try again later.",
				},
			});
		}
	};

	// Verify phone code
	verifyCode = async (req: Request, res: Response): Promise<void> => {
		try {
			const { phone, code } = req.body;
			
			if (!phone || !code) {
				res.status(400).json({
					success: false,
					error: {
						code: "BAD_REQUEST",
						message: "Phone number and verification code are both required",
						details: {
							phone: !phone ? "Phone number is required" : undefined,
							code: !code ? "Verification code is required" : undefined,
						},
					},
				});
				return;
			}

			const isValid = await this.authService.verifyCode(phone, code);
			
			if (isValid) {
				res.json({
					success: true,
					message: "Phone verified successfully",
				});
			} else {
				res.status(400).json({
					success: false,
					error: {
						code: "BAD_REQUEST",
						message: "Invalid or expired verification code",
						field: "code",
					},
				});
			}
		} catch (error) {
			console.error("Verify code error:", error);
			res.status(500).json({
				success: false,
				error: {
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to verify code",
				},
			});
		}
	};

	// Admin login with server-side role verification
	adminLogin = async (req: Request, res: Response): Promise<void> => {
		try {
			// Validate request
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				const formattedErrors = errors.array().map((err: any) => ({
					field: err.path || err.param,
					message: err.msg,
				}));
				res.status(400).json({
					success: false,
					error: {
						code: "BAD_REQUEST",
						message: "Validation failed",
						details: formattedErrors,
					},
				});
				return;
			}

			const loginInput: LoginInput = req.body;
			
			// Check if JWT_SECRET is configured
			if (!process.env.JWT_SECRET) {
				res.status(500).json({
					success: false,
					error: {
						code: "INTERNAL_SERVER_ERROR",
						message: "Server configuration error. Please contact support.",
					},
				});
				return;
			}
			
			const result: AuthResponse = await this.authService.login(
				loginInput.email,
				loginInput.password,
			);

			// Server-side role verification
			if (result.user.role !== "ADMIN") {
				res.status(403).json({
					success: false,
					error: {
						code: "FORBIDDEN",
						message: "You do not have admin access",
					},
				});
				return;
			}

			res.json({
				success: true,
				data: result,
				message: "Admin login successful",
			});
		} catch (error: any) {
			// Handle specific error cases with user-friendly messages
			if (error.message === "User not found" || error.message === "Invalid password") {
				res.status(401).json({
					success: false,
					error: {
						code: "UNAUTHORIZED",
						message: "Invalid admin email or password",
					},
				});
				return;
			}

			if (error.message === "JWT_SECRET environment variable is required") {
				res.status(500).json({
					success: false,
					error: {
						code: "INTERNAL_SERVER_ERROR",
						message: "Server configuration error. Please contact support.",
					},
				});
				return;
			}

			console.error("Admin login error:", error);
			res.status(500).json({
				success: false,
				error: {
					code: "INTERNAL_SERVER_ERROR",
					message: "An error occurred during admin login",
				},
			});
		}
	};

	// Get current authenticated user
	getCurrentUser = async (req: Request, res: Response): Promise<void> => {
		try {
			const user = (req as any).user;
			
			if (!user) {
				res.status(401).json({
					success: false,
					error: {
						code: "UNAUTHORIZED",
						message: "Authentication required. Please log in.",
					},
				});
				return;
			}

			const userData = await this.authService.getUserById(user.id);
			
			if (!userData) {
				res.status(404).json({
					success: false,
					error: {
						code: "NOT_FOUND",
						message: "User account not found",
					},
				});
				return;
			}

			res.json({
				success: true,
				data: { user: userData },
			});
		} catch (error) {
			console.error("Get current user error:", error);
			res.status(500).json({
				success: false,
				error: {
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to retrieve user information",
				},
			});
		}
	};
}
