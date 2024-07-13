import { CommentModel } from "./comment";
import { CommunityType } from "./community";
import { User } from "./user";

export interface Post {
    topic: string;
    content: string;
    user_id: string;
    community: CommunityType;
}

export interface PostModel extends Post {
    _id: string;
    created_at: Date;
    updated_at: Date;
}

export interface PostDetail extends PostModel {
    comments?: CommentModel[];
    comment_count?: number;
    user?: User;
}

export interface PostPagination {
    posts: PostDetail[];
    total_page: number;
    total_item: number;
}