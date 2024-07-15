import { HttpException, HttpStatus, Inject, Injectable, Logger } from "@nestjs/common";

import { User, UserModel } from "../domain/model/user";
import { UserServiceInterface } from "../domain/ports/inbound/user.service";
import { UserRepositoryInterface } from "../domain/ports/outbound/user.repository";

@Injectable()
export class UserService implements UserServiceInterface {
    private logger = new Logger(UserService.name);
    constructor(
        @Inject(UserRepositoryInterface)
        private readonly userRepository: UserRepositoryInterface
    ) { }

    async create(data: User): Promise<void> {
        const user = await this.get(data.username)
        if (user) {
            this.logger.warn(`username ${data.username} duplicated`)
            throw new HttpException('username already used', HttpStatus.BAD_REQUEST);
        }

        await this.userRepository.create({
            username: data.username,
            picture: data.picture
        });
        this.logger.log('create user done');
    }

    async get(username: string): Promise<UserModel> {
        this.logger.log(`get user ${username}`);
        return await this.userRepository.get(username);
    }

}