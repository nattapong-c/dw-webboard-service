import { HttpException, HttpStatus, Logger } from "@nestjs/common";
import { Collection } from "mongodb";

import { User, UserModel } from "src/domain/model/user";
import { UserRepositoryInterface } from "src/domain/ports/outbound/user.repository";
import { MongoDB } from "../utils";

export class UserMockRepository implements UserRepositoryInterface {
    private USER_DB = 'mock_user';
    private db: Collection;
    private logger = new Logger(UserMockRepository.name);

    async create(data: User): Promise<void> {
        try {
            this.db = await MongoDB.connection(this.USER_DB)
            const date = new Date();
            await this.db.insertOne({
                username: data.username,
                picture: data.picture,
                created_at: date,
                updated_at: date
            })
        } catch (error) {
            this.logger.error(error);
            throw new HttpException('insert user error', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async get(username: string): Promise<UserModel> {
        try {
            this.db = await MongoDB.connection(this.USER_DB)
            const result = await this.db.findOne<UserModel>({ username });
            return result;
        } catch (error) {
            this.logger.error(error);
            throw new HttpException('get user error', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

}