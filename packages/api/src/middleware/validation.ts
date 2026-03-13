import type { NextFunction, Request, Response } from "express";

export const validateRequest = (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	// In a real implementation, this would validate the request body using express-validator
	// For now, we'll just pass through
	next();
};
