import { Body, Controller, Delete, HttpException, HttpStatus, Param, Post, Put, Request } from "@nestjs/common";

import { CommentService } from "../application/comment.service";
import { JWT, Utils } from "src/utils";
import { CommentCreateDto } from "./dto/comment.create";
import { Response } from "src/utils/response";

@Controller('v1/comment')
export class CommentController {
    constructor(
        private readonly commentService: CommentService
    ) { }

    @Post()
    async create(@Request() request: Request, @Body() body: CommentCreateDto) {
        const token = Utils.getToken(request);
        if (!token) {
            throw new HttpException('invalid token', HttpStatus.UNAUTHORIZED);
        }

        const tokenData = JWT.getTokenInfo(token);
        await this.commentService.create({
            message: body.message,
            post_id: body.post_id,
            user_id: tokenData.id
        });

        return new Response().setMessage('create comment success');
    }

    @Put(':id')
    async update(@Request() request: Request, @Param('id') id: string, @Body() body: CommentCreateDto) {
        const token = Utils.getToken(request);
        if (!token) {
            throw new HttpException('invalid token', HttpStatus.UNAUTHORIZED);
        }

        const tokenData = JWT.getTokenInfo(token);
        await this.commentService.update(id, {
            message: body.message,
            post_id: body.post_id,
            user_id: tokenData.id
        });

        return new Response().setMessage('update comment success');
    }

    @Delete(':id')
    async delete(@Request() request: Request, @Param('id') id: string) {
        const token = Utils.getToken(request);
        if (!token) {
            throw new HttpException('invalid token', HttpStatus.UNAUTHORIZED);
        }

        const tokenData = JWT.getTokenInfo(token);
        await this.commentService.delete(id, tokenData.id);

        return new Response().setMessage('delete comment success');
    }
}