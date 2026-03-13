// Mock for shared module
// This provides mock implementations for testing

// Define UserRole enum locally for testing
export enum UserRole {
	CUSTOMER = "CUSTOMER",
	ADMIN = "ADMIN",
	STAFF = "STAFF",
}

export enum ReservationStatus {
	PENDING = "PENDING",
	CONFIRMED = "CONFIRMED",
	CANCELLED = "CANCELLED",
	COMPLETED = "COMPLETED",
}

export enum TableStatus {
	AVAILABLE = "AVAILABLE",
	OCCUPIED = "OCCUPIED",
	RESERVED = "RESERVED",
	MAINTENANCE = "MAINTENANCE",
}

// Mock implementations for utility functions
export const hashPassword = async (password: string): Promise<string> => {
	return `hashed_${password}`;
};

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
	return `hashed_${password}` === hashedPassword;
};

export const generateJWTToken = (payload: any, secret: string, expiresIn?: string): string => {
	// Simple base64 encoding for testing (not real JWT)
	const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
	const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
	const signature = "mock_signature";
	return `${header}.${body}.${signature}`;
};

export const verifyJWTToken = (token: string, secret: string): any => {
	try {
		const parts = token.split(".");
		if (parts.length !== 3) {
			throw new Error("Invalid token");
		}
		return JSON.parse(Buffer.from(parts[1], "base64url").toString());
	} catch (error) {
		throw new Error("Invalid token");
	}
};

// Mock schemas (simplified for testing)
export const emailSchema = {
	parse: (value: string) => {
		if (!value.includes("@")) throw new Error("Invalid email");
		return value;
	},
};

export const passwordSchema = {
	parse: (value: string) => {
		if (value.length < 6) throw new Error("Password too short");
		return value;
	},
};

// Re-export interfaces
export interface AuthResponse {
	user: User;
	token: string;
	refreshToken: string;
}

export interface RegisterInput {
	email: string;
	password: string;
	firstName: string;
	lastName: string;
	phone?: string;
	role: string;
}

export interface User {
	id: string;
	email: string;
	firstName: string;
	lastName: string;
	password?: string;
	phone?: string;
	role: string;
	refreshToken?: string;
	createdAt?: Date;
	updatedAt?: Date;
}

export interface IAuthService {
	login(email: string, password: string): Promise<AuthResponse>;
	register(userData: RegisterInput): Promise<AuthResponse>;
	refreshToken(email: string, refreshToken: string): Promise<AuthResponse>;
	logout(token: string): Promise<void>;
	getUserById(id: string): Promise<User | null>;
	getUserByEmail(email: string): Promise<User | null>;
	sendVerifyCode(phone: string): Promise<void>;
	verifyCode(phone: string, code: string): Promise<boolean>;
}
