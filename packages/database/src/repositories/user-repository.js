import { UserDocument } from "../models/user";
export class UserRepository {
    couchbaseService;
    constructor(couchbaseService) {
        this.couchbaseService = couchbaseService;
    }
    async create(userData) {
        const user = UserDocument.create(userData);
        const document = UserDocument.toDocument(user);
        const result = await this.couchbaseService.upsert(document);
        return UserDocument.fromDocument(result);
    }
    async findById(id) {
        const document = await this.couchbaseService.get(id);
        return document ? UserDocument.fromDocument(document) : null;
    }
    async findByEmail(email) {
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
    async findAll(filters) {
        let query = 'SELECT META().id, * FROM `reservations` WHERE type = "user"';
        const params = {};
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
    async update(id, updates) {
        const existingUser = await this.findById(id);
        if (!existingUser) {
            throw new Error("User not found");
        }
        const updatedUser = UserDocument.update(existingUser, updates);
        const document = UserDocument.toDocument(updatedUser);
        const result = await this.couchbaseService.upsert(document, id);
        return UserDocument.fromDocument(result);
    }
    async updateByDocId(id, updates) {
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
        return result;
    }
    async delete(id) {
        await this.couchbaseService.delete(id);
    }
    async existsByEmail(email) {
        const user = await this.findByEmail(email);
        return user !== null;
    }
    async count(filters) {
        let query = 'SELECT COUNT(*) as count FROM `reservations` WHERE type = "user"';
        const params = {};
        if (filters?.role) {
            query += " AND role = $role";
            params.role = filters.role;
        }
        const results = await this.couchbaseService.query(query, params);
        return results[0].count;
    }
}
//# sourceMappingURL=user-repository.js.map