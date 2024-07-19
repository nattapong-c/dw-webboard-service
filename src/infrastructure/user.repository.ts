import { HttpException, HttpStatus, Logger } from "@nestjs/common";
import { Collection } from "mongodb";

import { User, UserModel } from "src/domain/model/user";
import { UserRepositoryInterface } from "src/domain/ports/outbound/user.repository";
import { MongoDB } from "../utils";

export class UserRepository implements UserRepositoryInterface {
    private db: Collection;
    private logger = new Logger(UserRepository.name);
    private mockDb = 'mock_user';

    constructor() {
        this.connectDb('user')
    }

    async connectDb(dbName: string) {
        this.db = await MongoDB.connection(dbName)
    }

    async create(data: User): Promise<void> {
        if (global.describe) {
            await this.connectDb(this.mockDb);
        }
        try {
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
        if (global.describe) {
            await this.connectDb(this.mockDb);
        }
        try {
            const result = await this.db.findOne<UserModel>({ username });
            return result;
        } catch (error) {
            this.logger.error(error);
            throw new HttpException('get user error', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

}