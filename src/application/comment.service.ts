import { HttpException, HttpStatus, Inject, Injectable, Logger } from "@nestjs/common";
import { Comment } from "src/domain/model/comment";
import { CommentServiceInterface } from "src/domain/ports/inbound/comment.service";
import { CommentRepositoryInterface } from "src/domain/ports/outbound/comment.repository";
import { PostRepositoryInterface } from "src/domain/ports/outbound/post.repository";

@Injectable()
export class CommentService implements CommentServiceInterface {
    private readonly logger = new Logger(CommentService.name);

    constructor(
        @Inject(CommentRepositoryInterface)
        private readonly commentRepository: CommentRepositoryInterface,
        @Inject(PostRepositoryInterface)
        private readonly postRepository: PostRepositoryInterface
    ) { }

    async create(data: Comment): Promise<void> {
        const post = await this.postRepository.get(data.post_id);
        if (!post) {
            this.logger.warn(`post ${data.post_id} not found`);
            throw new HttpException('post not found', HttpStatus.NOT_FOUND);
        }

        await this.commentRepository.create(data);
    }

    async update(id: string, data: Comment): Promise<void> {
        const comment = await this.commentRepository.get(id);
        if (!comment) {
            this.logger.warn(`comment ${id} not found`);
            throw new HttpException('comment not found', HttpStatus.NOT_FOUND);
        }

        if (comment.user_id !== data.user_id) {
            this.logger.warn(`user ${data.user_id} cannot update comment ${id}`);
            throw new HttpException('comment not found', HttpStatus.NOT_FOUND);
        }

        await this.commentRepository.update(id, {
            message: data.message,
            post_id: comment.post_id,
            user_id: comment.user_id
        });
    }

    async delete(id: string, userId: string): Promise<void> {
        const comment = await this.commentRepository.get(id);
        if (!comment) {
            this.logger.warn(`comment ${id} not found`);
            throw new HttpException('comment not found', HttpStatus.NOT_FOUND);
        }

        if (comment.user_id !== userId) {
            this.logger.warn(`user ${userId} cannot delete comment ${id}`);
            throw new HttpException('comment not found', HttpStatus.NOT_FOUND);
        }

        await this.commentRepository.delete(id);
    }
}