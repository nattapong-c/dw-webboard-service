import { Body, Controller, Delete, Get, HttpException, HttpStatus, Logger, Param, Post, Put, Query, Request } from "@nestjs/common";

import { PostService } from "../application/post.service";
import { PostCreateDto } from "./dto/post.create";
import { JWT, Utils } from "../utils";
import { Response } from "../utils/response";
import { CommunityType } from "src/domain/model/community";

@Controller('v1/post')
export class PostController {
    private readonly logger = new Logger(PostController.name);
    constructor(
        private readonly postService: PostService,
    ) { }

    @Post()
    async create(@Request() request: Request, @Body() body: PostCreateDto) {
        const token = Utils.getToken(request);
        if (!token) {
            throw new HttpException('invalid token', HttpStatus.UNAUTHORIZED);
        }

        const tokenData = JWT.getTokenInfo(token);

        await this.postService.create({
            topic: body.topic,
            content: body.content,
            community: body.community,
            user_id: tokenData.id
        });

        return new Response().setMessage('create post success');
    }

    @Put(':id')
    async update(@Request() request: Request, @Param('id') id: string, @Body() body: PostCreateDto) {
        const token = Utils.getToken(request);
        if (!token) {
            throw new HttpException('invalid token', HttpStatus.UNAUTHORIZED);
        }

        const tokenData = JWT.getTokenInfo(token);

        await this.postService.update(id, {
            topic: body.topic,
            content: body.content,
            community: body.community,
            user_id: tokenData.id
        });

        return new Response().setMessage('update post success');
    }

    @Delete(':id')
    async delete(@Request() request: Request, @Param('id') id: string) {
        const token = Utils.getToken(request);
        if (!token) {
            throw new HttpException('invalid token', HttpStatus.UNAUTHORIZED);
        }

        const tokenData = JWT.getTokenInfo(token);

        await this.postService.delete(id, tokenData.id);
        return new Response().setMessage('delete post success');
    }

    @Get()
    async list(
        @Query('page') page: string,
        @Query('size') size: string,
        @Query('community') community: string,
        @Query('topic') topic: string,
        @Request() request: Request,
    ) {
        const token = Utils.getToken(request);
        let userId = undefined;
        if (token) {
            userId = JWT.getTokenInfo(token)
        }

        const pageNum = Number.parseInt(page);
        const sizeNum = Number.parseInt(size);
        if (Number.isNaN(pageNum)) {
            this.logger.warn('page must be integer');
            throw new HttpException('page must be integer', HttpStatus.BAD_REQUEST);
        }
        if (Number.isNaN(sizeNum)) {
            this.logger.warn('size must be integer');
            throw new HttpException('size must be integer', HttpStatus.BAD_REQUEST);
        }
        if (pageNum <= 0) {
            this.logger.warn('page must be greater than 0');
            throw new HttpException('page must be greater than 0', HttpStatus.BAD_REQUEST);
        }
        if (sizeNum < 0 || sizeNum > 1000) {
            this.logger.warn('size must be greater than 0 or less than 1001');
            throw new HttpException('size must be greater than 0 or less than 1001', HttpStatus.BAD_REQUEST);
        }

        const result = await this.postService.list(pageNum, sizeNum, community as CommunityType, userId, topic);

        return new Response().setData(result);
    }

    @Get(':id')
    async get(@Param('id') id: string) {
        const result = await this.postService.getDetail(id);
        return new Response().setData(result)
    }
}