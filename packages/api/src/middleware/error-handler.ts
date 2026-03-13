import type { NextFunction, Request, Response } from "express";
import { ApiError, handleError } from "../errors/api-errors.js";

/**
 * Enhanced Error Handler Middleware
 * Provides structured error responses with proper HTTP status codes
 * and user-friendly messages for better user experience
 */
export const errorHandler = (
	error: Error,
	req: Request,
	res: Response,
	next: NextFunction
) => {
	// Log error for debugging
	if (process.env.NODE_ENV === "development") {
		console.error("Error Details:", {
			name: error.name,
			message: error.message,
			stack: error.stack,
			path: req.path,
			method: req.method,
		});
	} else {
		console.error(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${error.message}`);
	}

	// Convert unknown errors to ApiError
	const apiError = error instanceof ApiError ? error : handleError(error);

	// Build standardized error response
	const errorResponse: Record<string, any> = {
		success: false,
		error: {
			code: apiError.code,
			message: apiError.message,
			timestamp: apiError.timestamp,
		},
	};

	// Add request ID for tracking
	errorResponse.requestId = req.headers["x-request-id"] || crypto.randomUUID();

	// Include additional details in development mode
	if (process.env.NODE_ENV === "development") {
		errorResponse.error.details = {
			name: error.name,
			stack: error.stack,
		};
	}

	// Send appropriate HTTP status code
	res.status(apiError.statusCode).json(errorResponse);
};

/**
 * Async Error Handler Wrapper
 * Wraps async route handlers to catch and forward errors to the error handler
 */
export const asyncHandler = (
	fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
	return (req: Request, res: Response, next: NextFunction) => {
		Promise.resolve(fn(req, res, next)).catch(next);
	};
};

/**
 * Not Found Handler
 * Handles 404 errors for undefined routes
 */
export const notFoundHandler = (req: Request, res: Response) => {
	res.status(404).json({
		success: false,
		error: {
			code: "NOT_FOUND",
			message: `Cannot ${req.method} ${req.path}`,
			timestamp: new Date().toISOString(),
		},
		requestId: req.headers["x-request-id"] || crypto.randomUUID(),
	});
};

/**
 * Validation Error Handler
 * Handles express-validator validation errors
 */
export const validationErrorHandler = (errors: any[], res: Response) => {
	const formattedErrors = errors.map((err) => ({
		field: err.path,
		message: err.msg,
	}));

	res.status(400).json({
		success: false,
		error: {
			code: "BAD_REQUEST",
			message: "Validation failed",
			details: formattedErrors,
			timestamp: new Date().toISOString(),
		},
	});
};
