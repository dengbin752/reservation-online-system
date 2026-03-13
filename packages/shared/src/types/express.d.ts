// packages/shared/src/types/express.d.ts
import "express";
import type {
	User,
} from "./index";

declare global {
	namespace Express {
		interface Request {
			user?: User;
		}
	}
}
