import { TokenResponse } from "src/domain/model/auth";

export interface AuthServiceInterface {
    login(username: string): Promise<TokenResponse>;
}