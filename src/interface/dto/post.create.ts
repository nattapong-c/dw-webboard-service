import { IsEnum, IsString } from "class-validator";
import { CommunityEnum, CommunityType } from "src/domain/model/community";

export class PostCreateDto {
    @IsString()
    topic: string;

    @IsString()
    content: string;

    @IsEnum(CommunityEnum)
    community: CommunityType;
}