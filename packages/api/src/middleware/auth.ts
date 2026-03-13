import type { AuthenticatedRequest, User } from "@shared/reservation-system";
import type { NextFunction, Response, Request } from "express";
import jwt from "jsonwebtoken";

// Helper function to verify JWT token
export function verifyToken(token: string): User | null {
	const jwtSecret = process.env.JWT_SECRET;
	if (!jwtSecret) {
		return null;
	}
	try {
		return jwt.verify(token, jwtSecret) as User;
	} catch {
		return null;
	}
}

// Express middleware for REST API
export const authenticate = (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction,
): void => {
	const token = req.headers.authorization?.replace("Bearer ", "") ?? '';

	if (!token) {
		res.status(401).json({ error: "Authentication token required" });
		return;
	}

	const user = verifyToken(token);
	if (!user) {
		res.status(403).json({ error: "Invalid or expired token" });
		return;
	}

	req.user = user;
	next();
};

// GraphQL middleware for Apollo Server
export const graphqlAuthenticate = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	const token = req.headers.authorization?.replace("Bearer ", "") ?? '';

	if (!token) {
		res.status(401).json({ error: "Authentication token required" });
		return;
	}

	const user = verifyToken(token);
	if (!user) {
		res.status(403).json({ error: "Invalid or expired token" });
		return;
	}

	(req as any).user = user;
	next();
};

export const authorize = (roles: string[]) => {
	return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
		if (!req.user) {
			res.status(401).json({ error: "User not authenticated" });
			return;
		}

		if (!roles.includes(req.user.role)) {
			res.status(403).json({ error: "Insufficient permissions" });
			return;
		}

		next();
	};
};
