import { HttpException, HttpStatus, Inject, Injectable, Logger } from "@nestjs/common";
import { CommunityType } from "src/domain/model/community";
import { Post, PostDetail, PostPagination } from "src/domain/model/post";

import { PostServiceInterface } from "src/domain/ports/inbound/post.service";
import { CommentRepositoryInterface } from "src/domain/ports/outbound/comment.repository";
import { PostRepositoryInterface } from "src/domain/ports/outbound/post.repository";

@Injectable()
export class PostService implements PostServiceInterface {
    private logger = new Logger(PostService.name);

    constructor(
        @Inject(PostRepositoryInterface)
        private readonly postRepository: PostRepositoryInterface,
        @Inject(CommentRepositoryInterface)
        private readonly commentRepository: CommentRepositoryInterface
    ) { }

    async create(data: Post): Promise<void> {
        await this.postRepository.create(data);
    }

    async update(id: string, data: Post): Promise<void> {
        const post = await this.postRepository.get(id);
        if (!post) {
            this.logger.warn(`post ${id} not found`);
            throw new HttpException('post not found', HttpStatus.NOT_FOUND);
        }

        if (post.user_id !== data.user_id) {
            this.logger.warn(`user ${data.user_id} cannot update post ${id}`);
            throw new HttpException('post not found', HttpStatus.NOT_FOUND);
        }

        await this.postRepository.update(id, data);
    }

    async delete(id: string, userId: string): Promise<void> {
        const post = await this.postRepository.get(id);
        if (!post) {
            this.logger.warn(`post ${id} not found`);
            throw new HttpException('post not found', HttpStatus.NOT_FOUND);
        }

        if (post.user_id !== userId) {
            this.logger.warn(`user ${userId} cannot delete post ${id}`);
            throw new HttpException('post not found', HttpStatus.NOT_FOUND);
        }

        await this.postRepository.delete(id);
    }

    async list(page: number, size: number, community?: CommunityType, userId?: string, topic?: string): Promise<PostPagination> {
        const result = await this.postRepository.list(page, size, community, userId, topic);
        return result;
    }

    async getDetail(id: string): Promise<PostDetail> {
        const post = await this.postRepository.getDetail(id);
        if (!post) {
            this.logger.warn(`post ${id} not found`);
            throw new HttpException('post not found', HttpStatus.NOT_FOUND);
        }

        const comments = await this.commentRepository.list(id);
        return {
            ...post,
            comments
        };
    }
}