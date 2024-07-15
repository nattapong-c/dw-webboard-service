import { HttpException, HttpStatus, Inject, Injectable, Logger } from "@nestjs/common";
import { JwtService } from '@nestjs/jwt';

import { AuthServiceInterface } from "../domain/ports/inbound/auth.service";
import { UserRepositoryInterface } from "../domain/ports/outbound/user.repository";
import { TokenResponse } from "../domain/model/auth";
import { UserModel } from "src/domain/model/user";
import { JWT } from "../utils";

@Injectable()
export class AuthService implements AuthServiceInterface {
    private logger = new Logger(AuthService.name);

    constructor(
        @Inject(UserRepositoryInterface)
        private readonly userRepository: UserRepositoryInterface,
        private jwtService: JwtService
    ) { }

    async login(username: string): Promise<TokenResponse> {
        const user = await this.userRepository.get(username);
        if (!user) {
            this.logger.warn('username not found');
            throw new HttpException('invalid username', HttpStatus.UNAUTHORIZED);
        }

        const payload = { sub: user._id, username: user.username };

        return {
            access_token: await this.jwtService.signAsync(payload),
        };

    }

    async getMe(token: string): Promise<UserModel> {
        const tokenData = JWT.getTokenInfo(token);
        const user = await this.userRepository.get(tokenData.username);
        if (!user) {
            this.logger.warn('username not found');
            throw new HttpException('invalid username', HttpStatus.UNAUTHORIZED);
        }

        return user;
    }
}