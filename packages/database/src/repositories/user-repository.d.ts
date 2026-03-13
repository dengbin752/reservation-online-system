import type { ICouchbaseService } from "@shared/reservation-system";
import { type UserModel } from "../models/user";
export declare class UserRepository {
    private couchbaseService;
    constructor(couchbaseService: ICouchbaseService);
    create(userData: Partial<UserModel>): Promise<UserModel>;
    findById(id: string): Promise<UserModel | null>;
    findByEmail(email: string): Promise<UserModel | null>;
    findAll(filters?: {
        role?: string;
        email?: string;
    }): Promise<UserModel[]>;
    update(id: string, updates: Partial<UserModel>): Promise<UserModel>;
    updateByDocId(id: string, updates: Partial<UserModel>): Promise<UserModel | null>;
    delete(id: string): Promise<void>;
    existsByEmail(email: string): Promise<boolean>;
    count(filters?: {
        role?: string;
    }): Promise<number>;
}
//# sourceMappingURL=user-repository.d.ts.map