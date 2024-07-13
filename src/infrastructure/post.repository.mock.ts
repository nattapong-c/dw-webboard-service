import { Collection, ObjectId } from "mongodb";
import { HttpException, HttpStatus, Logger } from "@nestjs/common";

import { Post, PostDetail, PostModel, PostPagination } from "../domain/model/post";
import { PostRepositoryInterface } from "../domain/ports/outbound/post.repository";
import { MongoDB, Utils } from "../utils";
import { CommunityType } from "src/domain/model/community";

export class PostMockRepository implements PostRepositoryInterface {
    private db: Collection;
    private logger = new Logger(PostMockRepository.name);
    private POST_DB = 'mock_post';

    async create(data: Post): Promise<void> {
        try {
            this.db = await MongoDB.connection(this.POST_DB)
            const date = new Date();
            await this.db.insertOne({
                topic: data.topic,
                content: data.content,
                user_id: data.user_id,
                community: data.community,
                created_at: date,
                updated_at: date
            });
        } catch (error) {
            this.logger.error(error);
            throw new HttpException('insert post error', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async update(id: string, data: Post): Promise<void> {
        try {
            this.db = await MongoDB.connection(this.POST_DB)
            const query = { _id: new ObjectId(id) };
            await this.db.findOneAndUpdate(query, {
                $set: {
                    topic: data.topic,
                    content: data.content,
                    community: data.community,
                    updated_at: new Date()
                }
            });
        } catch (error) {
            this.logger.error(error);
            throw new HttpException('update post error', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async delete(id: string): Promise<void> {
        try {
            this.db = await MongoDB.connection(this.POST_DB)
            await this.db.deleteOne({ _id: new ObjectId(id) });
        } catch (error) {
            this.logger.error(error);
            throw new HttpException('delete post error', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async get(id: string): Promise<PostModel> {
        try {
            this.db = await MongoDB.connection(this.POST_DB)
            const result = await this.db.findOne<PostModel>({ _id: new ObjectId(id) });
            return result;
        } catch (error) {
            this.logger.error(error);
            throw new HttpException('get post error', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async list(page: number, size: number, community?: CommunityType, userId?: string, topic?: string): Promise<PostPagination> {
        try {
            this.db = await MongoDB.connection(this.POST_DB)
            const query = {};
            if (community) {
                query['community'] = community;
            }

            if (userId) {
                query['user_id'] = userId;
            }

            if (topic) {
                query['topic'] = { $regex: new RegExp(topic) };
            }

            const aggregates = [
                {
                    $match: query,
                },
                {
                    $sort: {
                        created_at: -1
                    }
                },
                {
                    $addFields: {
                        id_string: { $convert: { input: "$_id", to: "string" } }
                    }
                },
                {
                    $lookup: {
                        from: 'mock_user',
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
                    $lookup: {
                        from: 'mock_comment',
                        localField: 'id_string',
                        foreignField: 'post_id',
                        as: 'comment_count',
                    }
                },
                {
                    $unwind: '$user'
                },
                {
                    $project: {
                        topic: 1,
                        content: 1,
                        community: 1,
                        created_at: 1,
                        user: '$user',
                        comment_count: { $size: '$comment_count' },
                    }
                },
                {
                    $facet: {
                        items: [{ $skip: (page - 1) * size }, { $limit: size }],
                        total_item: [
                            {
                                $group: {
                                    _id: null,
                                    count: { $sum: 1 },
                                },
                            },
                        ],
                    },
                },
            ];

            const cursor = this.db.aggregate<{ items: PostDetail[]; total_item: { count?: number }[] }>(aggregates);
            const result = await cursor.toArray();
            const totalItem = result[0].total_item.length > 0 ? result[0].total_item[0].count : 0;
            return {
                posts: result[0].items,
                total_item: totalItem,
                total_page: Utils.getTotalPage(page, size, totalItem),
            };

        } catch (error) {
            this.logger.error(error);
            throw new HttpException('list post error', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getDetail(id: string): Promise<PostDetail> {
        try {
            this.db = await MongoDB.connection(this.POST_DB)
            const query = { _id: new ObjectId(id) };

            const aggregates = [
                {
                    $match: query,
                },
                {
                    $sort: {
                        created_at: -1
                    }
                },
                {
                    $addFields: {
                        id_string: { $convert: { input: "$_id", to: "string" } }
                    }
                },
                {
                    $lookup: {
                        from: 'mock_user',
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
                        topic: 1,
                        content: 1,
                        community: 1,
                        created_at: 1,
                        user: '$user',
                    }
                },
            ];

            const cursor = this.db.aggregate<PostDetail>(aggregates);
            const result = await cursor.toArray();

            if (!result.length) {
                return undefined
            }

            return result[0];
        } catch (error) {
            this.logger.error(error);
            throw new HttpException('get post error', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}