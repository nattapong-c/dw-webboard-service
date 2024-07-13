import { Comment, CommentDetail, CommentModel } from "src/domain/model/comment"

export interface CommentRepositoryInterface {
    create(data: Comment): Promise<void>;
    update(id: string, data: Comment): Promise<void>;
    delete(id: string): Promise<void>;
    list(postId: string): Promise<CommentDetail[]>;
    get(id: string): Promise<CommentModel>;
    deleteByPostId(postId: string): Promise<void>;
}

export const CommentRepositoryInterface = Symbol('CommentRepositoryInterface')