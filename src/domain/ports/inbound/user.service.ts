import { User, UserModel } from "src/domain/model/user";

export interface UserServiceInterface {
    create(data: User): Promise<void>;
    get(username: string): Promise<UserModel>;
}