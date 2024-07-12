import { Body, Controller, Post } from "@nestjs/common";

import { UserService } from "../application/user.service";
import { UserCreateDto } from "./dto/user.create";
import { Response } from "../utils/response";

@Controller('v1/user')
export class UserController {
    constructor(
        private readonly userService: UserService
    ) { }

    @Post()
    async create(@Body() body: UserCreateDto) {
        await this.userService.create({
            username: body.username,
            picture: body.picture
        });

        return new Response().setMessage('create user success');
    }
}