import {
	createCouchbaseConnection,
	type UserModel,
	UserRepository,
} from "@database/reservation-system";
import {
	type AuthResponse,
	comparePassword,
	generateJWTToken,
	hashPassword,
	type IAuthService,
	type RegisterInput,
	type User
} from "@shared/reservation-system";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { authLogger } from "../logger.js";

export class AuthService implements IAuthService {
	async login(email: string, password: string): Promise<AuthResponse> {
		authLogger.info({ msg: "Login attempt", email });

		const connection = createCouchbaseConnection()
		const userRepos = new UserRepository(connection);
		const user = await userRepos.findByEmail(email)
				
		if (!user) {
			authLogger.warn({ msg: "Login failed - user not found", email });
			throw new Error("User not found");
		}
		if (!(await comparePassword(password, user.password || ''))) {
			authLogger.warn({ msg: "Login failed - invalid password", email });
			throw new Error("Invalid password");
		}

		const jwtSecret = process.env.JWT_SECRET;
		if (!jwtSecret) {
			authLogger.error({ msg: "JWT_SECRET not configured" });
			throw new Error("JWT_SECRET environment variable is required");
		}
		const token = generateJWTToken({id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role}, jwtSecret, process.env.JWT_EXPIRES_IN || "1h");
		const refreshToken = generateJWTToken({id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role}, jwtSecret, process.env.JWT_REFRESH_EXPIRES_IN || "7d");
		
		const userUpdated = await userRepos.updateByDocId(user.id, {refreshToken})
		if (!userUpdated) {
			authLogger.error({ msg: "Login failed - user update failed", userId: user.id });
			throw new Error("User not found");
		}
		
		const {password: _, ...outWithoutPassword} = userUpdated
		
		authLogger.info({ msg: "Login successful", userId: user.id, role: user.role });
		return { user: outWithoutPassword, token, refreshToken };
	}

	async register(userData: RegisterInput): Promise<AuthResponse> {
		authLogger.info({ msg: "Registration attempt", email: userData.email, role: userData.role });

		const connection = createCouchbaseConnection()
		const userRepos = new UserRepository(connection);

		const existingUser = await userRepos.findByEmail(userData.email);
		if (existingUser) {
			authLogger.warn({ msg: "Registration failed - user already exists", email: userData.email });
			throw new Error("User already exists");
		}

		const jwtSecret = process.env.JWT_SECRET;
		if (!jwtSecret) {
			authLogger.error({ msg: "JWT_SECRET not configured" });
			throw new Error("JWT_SECRET environment variable is required");
		}
		const id = uuidv4();
		const token = generateJWTToken({id, email: userData.email, firstName: userData.firstName, lastName: userData.lastName, role: userData.role}, jwtSecret, process.env.JWT_EXPIRES_IN || "1h");
		const refreshToken = generateJWTToken({id, email: userData.email, firstName: userData.firstName, lastName: userData.lastName, role: userData.role}, jwtSecret, process.env.JWT_REFRESH_EXPIRES_IN || "7d");

		const user: UserModel = {
			...userData,
			id,
			password: await hashPassword(userData.password),
			role: userData.role,
			refreshToken,
			createdAt: new Date(),
			updatedAt: new Date(),
		};
		const out = await userRepos.create(user);
		
		const {password, ...outWithoutPassword} = out
		
		authLogger.info({ msg: "Registration successful", userId: id, role: userData.role });
		return { user: outWithoutPassword, token, refreshToken };
	}

	async refreshToken(email: string, refreshToken: string): Promise<AuthResponse> {
		authLogger.info({ msg: "Refresh token attempt", email });

		const connection = createCouchbaseConnection()
		await connection.connect()
		const userRepos = new UserRepository(connection)
		const user = await userRepos.findByEmail(email)
		if (!user || user.refreshToken !== refreshToken) {
			authLogger.warn({ msg: "Refresh token failed - invalid token", email });
			throw new Error("Invalid refresh token");
		}

		const jwtSecret = process.env.JWT_SECRET;
		if (!jwtSecret) {
			authLogger.error({ msg: "JWT_SECRET not configured" });
			throw new Error("JWT_SECRET environment variable is required");
		}
		const token = generateJWTToken({id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role}, jwtSecret, process.env.JWT_EXPIRES_IN || "1h");
		const newRefreshToken = generateJWTToken({id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role}, jwtSecret, process.env.JWT_REFRESH_EXPIRES_IN || "7d");
		
		const userUpdated = await userRepos.updateByDocId(user.id, { refreshToken: newRefreshToken })
		if (!userUpdated) {
			authLogger.error({ msg: "Refresh token failed - user update failed", userId: user.id });
			throw new Error("User not found");
		}
		const {password: _, ...outWithoutPassword} = userUpdated
		
		authLogger.info({ msg: "Refresh token successful", userId: user.id });
		return { user: outWithoutPassword, token, refreshToken: newRefreshToken };
	}

	async logout(token: string): Promise<void> {
		try {
			authLogger.info({ msg: "Logout attempt" });
			
			const jwtSecret = process.env.JWT_SECRET;
			if (!jwtSecret) {
				authLogger.error({ msg: "JWT_SECRET not configured" });
				throw new Error("JWT_SECRET environment variable is required");
			}
			
			const decoded = jwt.verify(token, jwtSecret) as { id: string; email: string };
			
			const connection = createCouchbaseConnection();
			const userRepos = new UserRepository(connection);
			
			await userRepos.updateByDocId(decoded.id, { refreshToken: '' });
			
			authLogger.info({ msg: "Logout successful", userId: decoded.id });
			
		} catch (error) {
			authLogger.error({ msg: "Logout failed", error });
			throw error;
		}
	}

	async getUserById(id: string): Promise<User | null> {
		authLogger.debug({ msg: "Get user by ID", userId: id });
		
		const connection = createCouchbaseConnection()
		const userRepos = new UserRepository(connection)
		const user = await userRepos.findById(id)
		
		if (!user) {
			authLogger.debug({ msg: "User not found", userId: id });
		}
		return user
	}

	async getUserByEmail(email: string): Promise<User | null> {
		authLogger.debug({ msg: "Get user by email", email });
		
		const userRepos = new UserRepository(createCouchbaseConnection());
		const user = await userRepos.findByEmail(email);
		return user
	}

	// In-memory store for verification codes (for production, use Redis or database)
	private verificationCodes: Map<string, { code: string; expiresAt: Date }> = new Map();

	async sendVerifyCode(phone: string): Promise<void> {
		authLogger.info({ msg: "Sending verification code", phone });
		
		const code = Math.floor(100000 + Math.random() * 900000).toString();
		const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
		this.verificationCodes.set(phone, { code, expiresAt });
		
		authLogger.debug({ msg: "Verification code sent", phone, expiresAt });
	}

	async verifyCode(phone: string, code: string): Promise<boolean> {
		authLogger.debug({ msg: "Verifying code", phone });
		
		const stored = this.verificationCodes.get(phone);
		if (!stored) {
			authLogger.warn({ msg: "Verification failed - no code found", phone });
			return false;
		}

		if (new Date() > stored.expiresAt) {
			this.verificationCodes.delete(phone);
			authLogger.warn({ msg: "Verification failed - code expired", phone });
			return false;
		}

		if (stored.code !== code) {
			authLogger.warn({ msg: "Verification failed - invalid code", phone });
			return false;
		}

		this.verificationCodes.delete(phone);
		authLogger.info({ msg: "Verification successful", phone });
		return true;
	}
}
