import { type User } from "@shared/reservation-system";
export interface UserModel extends User {
    password?: string;
    refreshToken?: string;
}
export declare class UserDocument {
    static create(userData: Partial<UserModel>): UserModel;
    static toDocument(user: UserModel): any;
    static fromDocument(document: any): UserModel;
    static update(user: UserModel, updates: Partial<UserModel>): UserModel;
    private static generateId;
}
//# sourceMappingURL=user.d.ts.map