import { randomUUID } from "crypto";
import { type User, UserRole } from "@shared/reservation-system";

export interface UserModel extends User {
	password?: string;
	refreshToken?: string;
}

export class UserDocument {
	static create(userData: Partial<UserModel>): UserModel {
		return {
			id: userData.id || UserDocument.generateId(),
			email: userData.email || "",
			firstName: userData.firstName || "",
			lastName: userData.lastName || "",
			phone: userData.phone,
			role: userData.role || UserRole.CUSTOMER,
			password: userData.password,
			refreshToken: userData.refreshToken,
			createdAt: userData.createdAt || new Date(),
			updatedAt: userData.updatedAt || new Date(),
		};
	}

	static toDocument(user: UserModel): any {
		return {
			id: user.id,
			email: user.email,
			firstName: user.firstName,
			lastName: user.lastName,
			phone: user.phone,
			role: user.role,
			password: user.password,
			refreshToken: user.refreshToken,
			createdAt: user.createdAt.toISOString(),
			updatedAt: user.updatedAt.toISOString(),
			type: "user",
		};
	}

	static fromDocument(document: any): UserModel {
		return {
			id: document.id,
			email: document.email,
			firstName: document.firstName,
			lastName: document.lastName,
			phone: document.phone,
			role: document.role,
			password: document.password,
			refreshToken: document.refreshToken,
			createdAt: new Date(document.createdAt),
			updatedAt: new Date(document.updatedAt),
		};
	}

	static update(user: UserModel, updates: Partial<UserModel>): UserModel {
		return {
			...user,
			...updates,
			updatedAt: new Date(),
		};
	}

	private static generateId(): string {
		return randomUUID();
	}
}
