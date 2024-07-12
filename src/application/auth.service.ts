import { HttpException, HttpStatus, Inject, Injectable, Logger } from "@nestjs/common";
import { JwtService } from '@nestjs/jwt';

import { AuthServiceInterface } from "../domain/ports/inbound/auth.service";
import { UserRepositoryInterface } from "../domain/ports/outbound/user.repository";
import { TokenResponse } from "../domain/model/auth";

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
}