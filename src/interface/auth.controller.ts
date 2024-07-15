import { Body, Controller, Get, Post, Request } from "@nestjs/common";

import { AuthService } from "../application/auth.service";
import { LoginDto } from "./dto/auth.login";
import { Response } from "../utils/response";
import { Utils } from "../utils";

@Controller('v1/auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('login')
    async login(@Body() body: LoginDto) {
        const result = await this.authService.login(body.username);
        return new Response().setData(result);
    }

    @Get('me')
    async me(@Request() request: Request) {
        const token = Utils.getToken(request);

        const result = await this.authService.getMe(token);
        return new Response().setData(result);
    }
}