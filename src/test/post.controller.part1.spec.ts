import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { Test, TestingModule } from "@nestjs/testing";
import * as request from 'supertest';
import { INestApplication } from "@nestjs/common";

import { JWT, MongoDB } from "../utils";
import { UserController } from "../interface/user.controller";
import { AuthController } from "../interface/auth.controller";
import { AuthService } from "../application/auth.service";
import { UserService } from "../application/user.service";
import { UserRepositoryInterface } from "../domain/ports/outbound/user.repository";
import { UserMockRepository } from "../infrastructure/user.repository.mock";
import { PostRepositoryInterface } from "../domain/ports/outbound/post.repository";
import { PostMockRepository } from "../infrastructure/post.repository.mock";
import { CommentRepositoryInterface } from "../domain/ports/outbound/comment.repository";
import { CommentMockRepository } from "../infrastructure/comment.repository.mock";
import { PostService } from "../application/post.service";
import { PostController } from "../interface/post.controller";
import { PostCreateDto } from "../interface/dto/post.create";
import { CommentController } from "../interface/comment.controller";
import { CommentService } from "../application/comment.service";

jest.setTimeout(30000);

describe('PostController', () => {
    const USER_DB = 'mock_user';
    const POST_DB = 'mock_post';
    const COMMENT_DB = 'mock_comment';
    let authController: AuthController;
    let userController: UserController;
    let testapp: INestApplication;

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
            controllers: [UserController, AuthController, PostController, CommentController],
            providers: [UserService, AuthService, PostService, CommentService,
                {
                    provide: UserRepositoryInterface,
                    useClass: UserMockRepository
                },
                {
                    provide: PostRepositoryInterface,
                    useClass: PostMockRepository
                },
                {
                    provide: CommentRepositoryInterface,
                    useClass: CommentMockRepository
                }
            ],
        }).compile();

        userController = app.get<UserController>(UserController);
        authController = app.get<AuthController>(AuthController);

        testapp = app.createNestApplication();
        await testapp.init();
    });

    const payload: PostCreateDto = {
        topic: 'test post1',
        content: 'content post',
        community: 'Exercise',
    }

    describe('create post', () => {
        let accessTokenUser1 = '';

        beforeEach(async () => {
            await userController.create({
                username: 'testuser1'
            });

            const authuser1 = await authController.login({
                username: 'testuser1'
            });

            accessTokenUser1 = authuser1['data'].access_token;
        });

        it('should return "invalid token"', async () => {
            try {
                request(testapp.getHttpServer())
                    .post('/v1/post')
                    .send(payload)
            } catch (error) {
                expect(error.message).toBe('invalid token');
                expect(error.status).toBe(401);
            }
        });

        it('should return "create post success"', async () => {
            const result = await request(testapp.getHttpServer())
                .post('/v1/post')
                .set({
                    'authorization': accessTokenUser1
                })
                .send(payload)
                .expect(201)

            expect(result.body).toEqual({
                message: 'create post success'
            });
        });

        afterEach(async () => {
            await Promise.all([
                testapp.close(),
                (await MongoDB.connection(USER_DB)).deleteMany(),
                (await MongoDB.connection(POST_DB)).deleteMany()
            ]);

        });
    });

    describe('update post', () => {
        let accessTokenUser1 = '';
        let accessTokenUser2 = '';
        let postId = '';

        beforeEach(async () => {
            const server = testapp.getHttpServer()
            await Promise.all([
                userController.create({
                    username: 'testuser1'
                }),
                userController.create({
                    username: 'testuser2'
                }),
            ]);

            const [authuser1, authuser2] = await Promise.all([
                authController.login({
                    username: 'testuser1'
                }),
                authController.login({
                    username: 'testuser2'
                })
            ]);

            accessTokenUser1 = authuser1['data'].access_token;
            accessTokenUser2 = authuser2['data'].access_token;

            await request(server)
                .post('/v1/post')
                .set({
                    'authorization': accessTokenUser1
                })
                .send(payload)

            const posts = await request(server)
                .get('/v1/post')
                .query({
                    page: 1,
                    size: 1,
                });

            postId = posts.body['data'].posts[0]._id
        });

        it('should return "invalid token"', async () => {
            try {
                request(testapp.getHttpServer())
                    .put('/v1/post/66926bf75c6fd6a97dc0fc5c')
                    .send(payload)
            } catch (error) {
                expect(error.message).toBe('invalid token');
                expect(error.status).toBe(401);
            }
        });

        it('should return "post not found"', async () => {
            try {
                request(testapp.getHttpServer())
                    .put('/v1/post/66926bf75c6fd6a97dc0fc5c')
                    .set({
                        'authorization': accessTokenUser1
                    })
                    .send(payload)
            } catch (error) {
                expect(error.message).toBe('post not found');
                expect(error.status).toBe(404);
            }
        });

        it('user cannot update other post', async () => {
            try {
                await request(testapp.getHttpServer())
                    .put(`/v1/post/${postId}`)
                    .set({
                        'authorization': accessTokenUser2
                    })
                    .send(payload)
            } catch (error) {
                expect(error.message).toBe('post not found');
                expect(error.status).toBe(404);
            }
        });

        it('should return "update post success"', async () => {
            const result = await request(testapp.getHttpServer())
                .put(`/v1/post/${postId}`)
                .set({
                    'authorization': accessTokenUser1
                })
                .send(payload)
                .expect(200);
            expect(result.body).toEqual({
                message: 'update post success'
            });
        });

        afterEach(async () => {
            await Promise.all([
                testapp.close(),
                (await MongoDB.connection(USER_DB)).deleteMany(),
                (await MongoDB.connection(POST_DB)).deleteMany()
            ]);
        });
    });

    describe('delete post', () => {
        let accessTokenUser1 = '';
        let accessTokenUser2 = '';
        let postId = '';

        beforeEach(async () => {
            const server = testapp.getHttpServer()
            await Promise.all([
                userController.create({
                    username: 'testuser1'
                }),
                userController.create({
                    username: 'testuser2'
                }),
            ]);

            const [authuser1, authuser2] = await Promise.all([
                authController.login({
                    username: 'testuser1'
                }),
                authController.login({
                    username: 'testuser2'
                })
            ]);

            accessTokenUser1 = authuser1['data'].access_token;
            accessTokenUser2 = authuser2['data'].access_token;

            await request(server)
                .post('/v1/post')
                .set({
                    'authorization': accessTokenUser1
                })
                .send(payload)

            const posts = await request(server)
                .get('/v1/post')
                .query({
                    page: 1,
                    size: 1,
                });

            postId = posts.body['data'].posts[0]._id
        });

        it('should return "invalid token"', async () => {
            try {
                const server = testapp.getHttpServer()
                await request(server)
                    .delete(`/v1/post/${postId}`)
            } catch (error) {
                expect(error.message).toBe('invalid token');
                expect(error.status).toBe(401);
            }
        });

        it('should return "post not found"', async () => {
            try {
                const server = testapp.getHttpServer()
                await request(server)
                    .delete(`/v1/post/66926bf75c6fd6a97dc0fc5c`)
                    .set({
                        'authorization': accessTokenUser1
                    })
            } catch (error) {
                expect(error.message).toBe('post not found');
                expect(error.status).toBe(404);
            }
        });

        it('user cannot update other post', async () => {
            try {
                await request(testapp.getHttpServer())
                    .delete(`/v1/post/${postId}`)
                    .set({
                        'authorization': accessTokenUser2
                    });
            } catch (error) {
                expect(error.message).toBe('post not found');
                expect(error.status).toBe(404);
            }
        });

        it('should return "delete post success"', async () => {
            const result = await request(testapp.getHttpServer())
                .delete(`/v1/post/${postId}`)
                .set({
                    'authorization': accessTokenUser1
                })
                .expect(200);
            expect(result.body).toEqual({
                message: 'delete post success'
            });
        });

        afterEach(async () => {
            await Promise.all([
                testapp.close(),
                (await MongoDB.connection(USER_DB)).deleteMany(),
                (await MongoDB.connection(POST_DB)).deleteMany()
            ]);
        });
    });
})