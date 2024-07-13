import { CommunityType } from "src/domain/model/community";
import { Post, PostDetail, PostPagination } from "src/domain/model/post";

export interface PostServiceInterface {
    create(data: Post): Promise<void>;
    update(id: string, data: Post): Promise<void>;
    delete(id: string, userId: string): Promise<void>;
    list(page: number, size: number, community?: CommunityType, userId?: string, topic?: string): Promise<PostPagination>;
    getDetail(id: string): Promise<PostDetail>;
}