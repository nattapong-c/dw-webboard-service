import { JwtService } from '@nestjs/jwt';

import { TokenInfo } from "src/domain/model/auth"

export const secret = process.env.JWT_SECRET || 'secretforjwt'

export const getTokenInfo = (token: string): TokenInfo => {
    const tokenData = new JwtService().decode(token);
    return {
        id: tokenData['sub'],
        username: tokenData['username']
    }
}