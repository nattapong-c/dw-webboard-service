import { HttpException, HttpStatus, Logger } from "@nestjs/common";
import { Collection, ObjectId } from "mongodb";

import { CommentRepositoryInterface } from "../domain/ports/outbound/comment.repository";
import { MongoDB } from "../utils";
import { Comment, CommentDetail, CommentModel } from "src/domain/model/comment";

export class CommentRepository implements CommentRepositoryInterface {
    private readonly logger = new Logger(CommentRepository.name);
    private db: Collection;

    constructor() {
        this.connectDb()
    }

    async connectDb() {
        this.db = await MongoDB.connection('comment')
        await this.db.createIndex({
            post_id: 1
        });
    }

    async create(data: Comment): Promise<void> {
        try {
            const date = new Date();
            await this.db.insertOne({
                message: data.message,
                user_id: data.user_id,
                post_id: data.post_id,
                created_at: date,
                updated_at: date
            });

        } catch (error) {
            this.logger.error(error)
            throw new HttpException('insert comment error', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async update(id: string, data: Comment): Promise<void> {
        try {
            const query = { _id: new ObjectId(id) };
            await this.db.findOneAndUpdate(query, {
                $set: {
                    message: data.message,
                    updated_at: new Date()
                }
            });
        } catch (error) {
            this.logger.error(error)
            throw new HttpException('upate comment error', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async delete(id: string): Promise<void> {
        try {
            await this.db.deleteOne({ _id: new ObjectId(id) });
        } catch (error) {
            this.logger.error(error);
            throw new HttpException('delete comment error', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async list(postId: string): Promise<CommentDetail[]> {
        try {
            const aggregates = [
                {
                    $match: {
                        post_id: postId
                    },
                },
                {
                    $sort: {
                        created_at: -1
                    }
                },
                {
                    $lookup: {
                        from: 'user',
                        let: { user_id: '$user_id' },
                        pipeline: [
                            {
                                $addFields: {
                                    id_string: { $convert: { input: "$_id", to: "string" } }
                                }
                            },
                            {
                                $match: {
                                    $expr: { $eq: ['$id_string', '$$user_id'] }
                                }
                            },
                            {
                                $unset: 'id_string'
                            }
                        ],
                        as: 'user'
                    }
                },
                {
                    $unwind: '$user'
                },
                {
                    $project: {
                        message: 1,
                        created_at: 1,
                        post_id: 1,
                        user: '$user',
                    }
                },
            ];

            const cursor = this.db.aggregate<CommentDetail>(aggregates);
            const result = await cursor.toArray();

            return result;
        } catch (error) {
            this.logger.error(error);
            throw new HttpException('list comment error', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async get(id: string): Promise<CommentModel> {
        try {
            const result = await this.db.findOne<CommentModel>({ _id: new ObjectId(id) });
            return result;
        } catch (error) {
            this.logger.error(error);
            throw new HttpException('get comment error', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}