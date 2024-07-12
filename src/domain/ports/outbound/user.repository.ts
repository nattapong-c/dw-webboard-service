import { User, UserModel } from "src/domain/model/user";

export interface UserRepositoryInterface {
    create(data: User): Promise<void>;
    get(username: string): Promise<UserModel>;
}

export const UserRepositoryInterface = Symbol('UserRepositoryInterface');