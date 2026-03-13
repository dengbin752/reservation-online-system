import type { ICouchbaseService } from "@shared/reservation-system";
import { UserDocument, type UserModel } from "../models/user.js";

export class UserRepository {
	constructor(private couchbaseService: ICouchbaseService) {}

	async create(userData: Partial<UserModel>): Promise<UserModel> {
		const user = UserDocument.create(userData);
		const document = UserDocument.toDocument(user);
		const result = await this.couchbaseService.upsert(document);
		return UserDocument.fromDocument(result);
	}

	async findById(id: string): Promise<UserModel | null> {
		const document = await this.couchbaseService.get(id);
		return document ? UserDocument.fromDocument(document) : null;
	}

	async findByEmail(email: string): Promise<UserModel | null> {
		const query = `
      SELECT META().id, r.*
      FROM \`reservations\` r
      WHERE r.type = 'user' AND r.email = $email
      LIMIT 1
    `;

		const params = { email };
		const results = await this.couchbaseService.query(query, params);

		if (results.length === 0) {
			return null;
		}

		return UserDocument.fromDocument(results[0]);
	}

	async findAll(filters?: {
		role?: string;
		email?: string;
	}): Promise<UserModel[]> {
		let query = 'SELECT META().id, * FROM `reservations` WHERE type = "user"';
		const params: any = {};

		if (filters?.role) {
			query += " AND role = $role";
			params.role = filters.role;
		}

		if (filters?.email) {
			query += " AND email LIKE $email";
			params.email = `%${filters.email}%`;
		}

		const results = await this.couchbaseService.query(query, params);
		return results.map(UserDocument.fromDocument);
	}

	async update(id: string, updates: Partial<UserModel>): Promise<UserModel> {
		const existingUser = await this.findById(id);
		if (!existingUser) {
			throw new Error("User not found");
		}

		const updatedUser = UserDocument.update(existingUser, updates);
		const document = UserDocument.toDocument(updatedUser);
		const result = await this.couchbaseService.upsert(document, id);
		return UserDocument.fromDocument(result);
	}

	async updateByDocId(id: string, updates: Partial<UserModel>): Promise<UserModel | null> {
			const query = `
      SELECT META().id, r.*
      FROM \`reservations\` r
      WHERE r.type = 'user' AND r.id= $id
      LIMIT 1
    `;

		const params = { id };
		const results = await this.couchbaseService.query(query, params);
		if (results.length === 0) {
			throw new Error("User not found");
		}
		const existingUser = UserDocument.fromDocument(results[0]);
		const updatedUser = UserDocument.update(existingUser, updates);
		const document = UserDocument.toDocument(updatedUser);
		const result = await this.couchbaseService.upsert(document);	
		return result
	}

	async delete(id: string): Promise<void> {
		await this.couchbaseService.delete(id);
	}

	async existsByEmail(email: string): Promise<boolean> {
		const user = await this.findByEmail(email);
		return user !== null;
	}

	async count(filters?: { role?: string }): Promise<number> {
		let query =
			'SELECT COUNT(*) as count FROM `reservations` WHERE type = "user"';
		const params: any = {};

		if (filters?.role) {
			query += " AND role = $role";
			params.role = filters.role;
		}

		const results = await this.couchbaseService.query(query, params);
		return results[0].count;
	}
}
