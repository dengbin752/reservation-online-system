/**
 * Request Logger Middleware
 * Logs HTTP requests using Pino
 */

import type { Request, Response, NextFunction } from "express";
import { logger } from "../logger.js";

/**
 * Creates a request logger middleware
 * @param options - Configuration options
 */
export const requestLogger = (options?: {
	ignoreRoutes?: string[];
	skip?: (req: Request) => boolean;
}) => {
	const ignoreRoutes = options?.ignoreRoutes || ["/health", "/metrics"];
	const skip = options?.skip;

	return (req: Request, res: Response, next: NextFunction) => {
		// Skip logging for certain routes
		if (ignoreRoutes.includes(req.path)) {
			return next();
		}

		// Skip if custom skip function returns true
		if (skip && skip(req)) {
			return next();
		}

		const startTime = Date.now();

		// Log request
		logger.debug({
			req,
			msg: `Incoming request: ${req.method} ${req.path}`,
		});

		// Capture response
		const originalSend = res.send;
		res.send = function (data: any) {
			const duration = Date.now() - startTime;
			
			// Determine log level based on status code
			const level = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";

			logger[level]({
				req,
				res,
				responseTime: duration,
				msg: `${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`,
			});

			return originalSend.call(this, data);
		};

		next();
	};
};

/**
 * Creates a middleware that adds request timing
 */
export const timingMiddleware = () => {
	return (req: Request, res: Response, next: NextFunction) => {
		const startTime = Date.now();
		
		res.on("finish", () => {
			const duration = Date.now() - startTime;
			(res as any).responseTime = duration;
		});
		
		next();
	};
};

export default requestLogger;
