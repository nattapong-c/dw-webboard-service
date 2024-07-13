import { Comment } from "src/domain/model/comment";

export interface CommentServiceInterface {
    create(data: Comment): Promise<void>;
    update(id: string, data: Comment): Promise<void>;
    delete(id: string, userId: string): Promise<void>;
}