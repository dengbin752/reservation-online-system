/**
 * Custom API Error Classes
 * Provides structured error handling with HTTP status codes and user-friendly messages
 */

export class ApiError extends Error {
	public readonly statusCode: number;
	public readonly code: string;
	public readonly isOperational: boolean;
	public readonly timestamp: string;

	constructor(
		message: string,
		statusCode: number,
		code: string,
		isOperational: boolean = true
	) {
		super(message);
		this.name = this.constructor.name;
		this.statusCode = statusCode;
		this.code = code;
		this.isOperational = isOperational;
		this.timestamp = new Date().toISOString();

		// Maintains proper stack trace for where our error was thrown
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, this.constructor);
		}
	}
}

// 400 - Bad Request
export class BadRequestError extends ApiError {
	constructor(message: string = "Invalid request data") {
		super(message, 400, "BAD_REQUEST");
	}
}

// 401 - Unauthorized
export class UnauthorizedError extends ApiError {
	constructor(message: string = "Authentication required") {
		super(message, 401, "UNAUTHORIZED");
	}
}

// 403 - Forbidden
export class ForbiddenError extends ApiError {
	constructor(message: string = "Access denied") {
		super(message, 403, "FORBIDDEN");
	}
}

// 404 - Not Found
export class NotFoundError extends ApiError {
	constructor(message: string = "Resource not found") {
		super(message, 404, "NOT_FOUND");
	}
}

// 409 - Conflict
export class ConflictError extends ApiError {
	constructor(message: string = "Resource conflict") {
		super(message, 409, "CONFLICT");
	}
}

// 422 - Unprocessable Entity
export class UnprocessableEntityError extends ApiError {
	constructor(message: string = "Validation failed") {
		super(message, 422, "UNPROCESSABLE_ENTITY");
	}
}

// 500 - Internal Server Error
export class InternalServerError extends ApiError {
	constructor(message: string = "Internal server error") {
		super(message, 500, "INTERNAL_SERVER_ERROR", false);
	}
}

// 503 - Service Unavailable
export class ServiceUnavailableError extends ApiError {
	constructor(message: string = "Service temporarily unavailable") {
		super(message, 503, "SERVICE_UNAVAILABLE");
	}
}

// Error code mapping for client-side handling
export const ErrorCodes = {
	BAD_REQUEST: "BAD_REQUEST",
	UNAUTHORIZED: "UNAUTHORIZED",
	FORBIDDEN: "FORBIDDEN",
	NOT_FOUND: "NOT_FOUND",
	CONFLICT: "CONFLICT",
	UNPROCESSABLE_ENTITY: "UNPROCESSABLE_ENTITY",
	INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
	SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
	// Business logic errors
	USER_NOT_FOUND: "USER_NOT_FOUND",
	USER_ALREADY_EXISTS: "USER_ALREADY_EXISTS",
	INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
	INVALID_PASSWORD: "INVALID_PASSWORD",
	RESERVATION_NOT_FOUND: "RESERVATION_NOT_FOUND",
	TABLE_NOT_FOUND: "TABLE_NOT_FOUND",
	TABLE_NOT_AVAILABLE: "TABLE_NOT_AVAILABLE",
	INVALID_RESERVATION_TIME: "INVALID_RESERVATION_TIME",
	VERIFICATION_CODE_INVALID: "VERIFICATION_CODE_INVALID",
	VERIFICATION_CODE_EXPIRED: "VERIFICATION_CODE_EXPIRED",
} as const;

// Helper function to convert unknown error to ApiError
export function handleError(error: unknown): ApiError {
	if (error instanceof ApiError) {
		return error;
	}

	// Handle known error types
	if (error instanceof Error) {
		const message = error.message;

		// Database errors
		if (message.includes("document_not_found")) {
			return new NotFoundError("Resource not found");
		}

		// Authentication errors
		if (message.includes("Invalid password") || message.includes("Invalid credentials")) {
			return new UnauthorizedError("Invalid email or password");
		}

		if (message.includes("User not found")) {
			return new NotFoundError("User not found");
		}

		if (message.includes("User already exists")) {
			return new ConflictError("User with this email already exists");
		}

		// Validation errors
		if (message.includes("validation failed") || message.includes("Invalid")) {
			return new BadRequestError(message);
		}

		// Default to internal server error for unknown errors
		console.error("Unhandled error:", error);
		return new InternalServerError("An unexpected error occurred");
	}

	// Handle non-error types
	return new InternalServerError("An unexpected error occurred");
}
