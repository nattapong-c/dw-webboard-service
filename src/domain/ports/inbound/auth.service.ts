import { TokenResponse } from "src/domain/model/auth";
import { UserModel } from "src/domain/model/user";

export interface AuthServiceInterface {
    login(username: string): Promise<TokenResponse>;
    getMe(token: string): Promise<UserModel>;
}