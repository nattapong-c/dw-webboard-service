import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';

import { UserController } from '../interface/user.controller';
import { UserService } from '../application/user.service';
import { UserRepositoryInterface } from '../domain/ports/outbound/user.repository';
import { UserMockRepository } from '../infrastructure/user.repository.mock';
import { MongoDB } from '../utils';


describe('UserController', () => {
    const USER_DB = 'mock_user'
    let appController: UserController;

    beforeEach(async () => {
        const app: TestingModule = await Test.createTestingModule({
            imports: [ConfigModule.forRoot({
                envFilePath: '.env.test.local'
            })],
            controllers: [UserController],
            providers: [UserService,
                {
                    provide: UserRepositoryInterface,
                    useClass: UserMockRepository
                }
            ],
        }).compile();

        appController = app.get<UserController>(UserController);
    });

    describe('create user', () => {
        it('should return "create user success"', async () => {
            expect(await appController.create({
                username: 'user1',
                picture: 'picture url'
            })).toEqual({
                message: 'create user success'
            });
        });

        afterEach(async () => {
            (await MongoDB.connection(USER_DB)).deleteMany()
        });

        it('should return "username already used"', async () => {
            await appController.create({
                username: 'user1'
            });
            try {
                await appController.create({
                    username: 'user1'
                });
            } catch (error) {
                expect(error.message).toBe('username already used')
            }
        });

        afterEach(async () => {
            (await MongoDB.connection(USER_DB)).deleteMany()
        });
    });
});
