import { IsString } from "class-validator";

export class CommentCreateDto {
    @IsString()
    message: string;

    @IsString()
    post_id: string;
}