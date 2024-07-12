import { Body, Controller, Post } from "@nestjs/common";

import { AuthService } from "../application/auth.service";
import { LoginDto } from "./dto/auth.login";
import { Response } from "src/utils/response";

@Controller('v1/auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('login')
    async login(@Body() body: LoginDto) {
        const result = await this.authService.login(body.username);
        return new Response().setData(result);
    }
}