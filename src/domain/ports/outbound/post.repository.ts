import { CommunityType } from "src/domain/model/community";
import { Post, PostDetail, PostModel, PostPagination } from "src/domain/model/post"

export interface PostRepositoryInterface {
    create(data: Post): Promise<void>;
    update(id: string, data: Post): Promise<void>;
    delete(id: string): Promise<void>;
    list(page: number, size: number, community?: CommunityType, userId?: string, topic?: string): Promise<PostPagination>;
    get(id: string): Promise<PostModel>;
    getDetail(id: string): Promise<PostDetail>;
}

export const PostRepositoryInterface = Symbol('PostRepositoryInterface')