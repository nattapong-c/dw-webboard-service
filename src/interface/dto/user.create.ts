import { IsOptional, IsString } from "class-validator";

export class UserCreateDto {
    @IsString()
    username: string;

    @IsString()
    @IsOptional()
    picture?: string;
}