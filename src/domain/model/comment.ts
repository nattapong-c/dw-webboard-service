import { User } from "./user";

export interface Comment {
    message: string;
    user_id: string;
    post_id: string;
}

export interface CommentModel extends Comment {
    _id: string;
    created_at: Date;
    updated_at: Date;
}

export interface CommentDetail extends CommentModel {
    user?: User;
}