import { Test, TestingModule } from "@nestjs/testing";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";

import { AuthController } from "../interface/auth.controller";
import { UserController } from "../interface/user.controller";
import { UserService } from "../application/user.service";
import { UserRepositoryInterface } from "../domain/ports/outbound/user.repository";
import { UserMockRepository } from "../infrastructure/user.repository.mock";
import { AuthService } from "../application/auth.service";
import { JWT, MongoDB } from "../utils";

describe('AuthController', () => {
    const USER_DB = 'mock_user';
    let authController: AuthController;
    let userController: UserController;

    beforeEach(async () => {
        const app: TestingModule = await Test.createTestingModule({
            imports: [
                ConfigModule.forRoot({
                    envFilePath: '.env.test.local'
                }),
                JwtModule.register({
                    global: true,
                    secret: JWT.secret,
                    signOptions: { expiresIn: '1d' },
                })
            ],
            controllers: [UserController, AuthController],
            providers: [UserService, AuthService,
                {
                    provide: UserRepositoryInterface,
                    useClass: UserMockRepository
                }
            ],
        }).compile();

        userController = app.get<UserController>(UserController);
        authController = app.get<AuthController>(AuthController);
    });

    describe('login', () => {
        beforeEach(async () => {
            await userController.create({
                username: 'testuser1'
            });
        });

        it('should return "invalid username"', async () => {
            try {
                await authController.login({
                    username: 'testuser2'
                });
            } catch (error) {
                expect(error.message).toBe('invalid username');
                expect(error.status).toBe(401);
            }
        });

        it('should return access_token in response', async () => {
            const result = await authController.login({
                username: 'testuser1'
            });
            expect(result['data'].access_token).not.toBeUndefined()
        });

        afterEach(async () => {
            (await MongoDB.connection(USER_DB)).deleteMany()
        });
    })
})