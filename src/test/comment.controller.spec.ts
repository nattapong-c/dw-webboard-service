import { INestApplication } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { Test, TestingModule } from "@nestjs/testing";
import * as request from 'supertest';

import { AuthController } from "../interface/auth.controller";
import { UserController } from "../interface/user.controller";
import { PostController } from "../interface/post.controller";
import { JWT, MongoDB } from "../utils";
import { CommentController } from "../interface/comment.controller";
import { UserService } from "../application/user.service";
import { AuthService } from "../application/auth.service";
import { PostService } from "../application/post.service";
import { CommentService } from "../application/comment.service";
import { UserRepositoryInterface } from "../domain/ports/outbound/user.repository";
import { UserMockRepository } from "../infrastructure/user.repository.mock";
import { PostRepositoryInterface } from "../domain/ports/outbound/post.repository";
import { PostMockRepository } from "../infrastructure/post.repository.mock";
import { CommentRepositoryInterface } from "../domain/ports/outbound/comment.repository";
import { CommentMockRepository } from "../infrastructure/comment.repository.mock";
import { PostCreateDto } from "../interface/dto/post.create";

describe('CommentController', () => {
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

    describe('create comment', () => {
        let postId = '';
        let accessToken = ''

        beforeEach(async () => {
            const server = testapp.getHttpServer();
            await userController.create({
                username: 'testuser1'
            });

            const authuser1 = await authController.login({
                username: 'testuser1'
            });

            await request(server)
                .post('/v1/post')
                .set({
                    'authorization': authuser1['data'].access_token
                })
                .send(payload);

            const posts = await request(server)
                .get('/v1/post')
                .query({
                    page: 1,
                    size: 1,
                });

            postId = posts.body['data'].posts[0]._id;
            accessToken = authuser1['data'].access_token;
        });

        it('should return "invalid token"', async () => {
            try {
                const server = testapp.getHttpServer();
                await request(server)
                    .post('/v1/comment')
                    .send({
                        message: 'comment test 1',
                        post_id: postId
                    })
            } catch (error) {
                expect(error.message).toBe('invalid token');
                expect(error.status).toBe(401);
            }
        });

        it('should return "post not found"', async () => {
            try {
                const server = testapp.getHttpServer();
                await request(server)
                    .post('/v1/comment')
                    .set({
                        'authorization': accessToken
                    })
                    .send({
                        message: 'comment test 1',
                        post_id: '66926bf75c6fd6a97dc0fc5c'
                    })
            } catch (error) {
                expect(error.message).toBe('post not found');
                expect(error.status).toBe(404);
            }
        });

        it('should return "create comment success"', async () => {
            const server = testapp.getHttpServer();
            const result = await request(server)
                .post('/v1/comment')
                .set({
                    'authorization': accessToken
                })
                .send({
                    message: 'comment test 1',
                    post_id: postId
                });
            expect(result.body).toEqual({
                message: 'create comment success'
            });
        });

        afterEach(async () => {
            await Promise.all([
                testapp.close(),
                (await MongoDB.connection(USER_DB)).deleteMany(),
                (await MongoDB.connection(POST_DB)).deleteMany(),
                (await MongoDB.connection(COMMENT_DB)).deleteMany(),
            ]);
        });
    });

    describe('update comment', () => {
        let accessTokenUser1 = '';
        let accessTokenUser2 = '';
        let postId = '';
        let commentId = '';

        beforeEach(async () => {
            const server = testapp.getHttpServer();
            await Promise.all([
                userController.create({
                    username: 'testuser1'
                }),
                userController.create({
                    username: 'testuser2'
                }),
            ])

            const [authuser1, authuser2] = await Promise.all([
                authController.login({
                    username: 'testuser1'
                }),
                authController.login({
                    username: 'testuser2'
                }),
            ]);

            await request(server)
                .post('/v1/post')
                .set({
                    'authorization': authuser1['data'].access_token
                })
                .send(payload);

            const posts = await request(server)
                .get('/v1/post')
                .query({
                    page: 1,
                    size: 1,
                });

            postId = posts.body['data'].posts[0]._id;
            accessTokenUser1 = authuser1['data'].access_token;
            accessTokenUser2 = authuser2['data'].access_token;

            await request(server)
                .post('/v1/comment')
                .set({
                    'authorization': accessTokenUser1
                })
                .send({
                    message: 'comment test 1',
                    post_id: postId
                });

            const comments = await new CommentMockRepository().list(postId);
            commentId = comments[0]._id;
        });

        it('should return "invalid token"', async () => {
            try {
                const server = testapp.getHttpServer();
                await request(server)
                    .put(`/v1/comment/66926bf75c6fd6a97dc0fc5c`)
                    .send({
                        message: 'comment test 1',
                        post_id: postId
                    })
            } catch (error) {
                expect(error.message).toBe('invalid token');
                expect(error.status).toBe(401);
            }
        });

        it('should return "post not found"', async () => {
            try {
                const server = testapp.getHttpServer();
                await request(server)
                    .post(`/v1/comment/66926bf75c6fd6a97dc0fc5c`)
                    .set({
                        'authorization': accessTokenUser1
                    })
                    .send({
                        message: 'comment test 1',
                        post_id: '66926bf75c6fd6a97dc0fc5c'
                    })
            } catch (error) {
                expect(error.message).toBe('post not found');
                expect(error.status).toBe(404);
            }
        });

        it('user cannot update other comment', async () => {
            try {
                const server = testapp.getHttpServer();
                await request(server)
                    .post(`/v1/comment/${commentId}`)
                    .set({
                        'authorization': accessTokenUser2
                    })
                    .send({
                        message: 'comment test update',
                        post_id: postId
                    })
            } catch (error) {
                expect(error.message).toBe('post not found');
                expect(error.status).toBe(404);
            }
        });

        it('should return "update comment success"', async () => {
            const server = testapp.getHttpServer();
            const result = await request(server)
                .put(`/v1/comment/${commentId}`)
                .set({
                    'authorization': accessTokenUser1
                })
                .send({
                    message: 'comment test update',
                    post_id: postId
                });
            expect(result.body).toEqual({
                message: 'update comment success'
            });
        });

        afterEach(async () => {
            await Promise.all([
                testapp.close(),
                (await MongoDB.connection(USER_DB)).deleteMany(),
                (await MongoDB.connection(POST_DB)).deleteMany(),
                (await MongoDB.connection(COMMENT_DB)).deleteMany(),
            ]);
        });
    });

    describe('delete comment', () => {
        let accessTokenUser1 = '';
        let accessTokenUser2 = '';
        let postId = '';
        let commentId = '';

        beforeEach(async () => {
            const server = testapp.getHttpServer();
            await Promise.all([
                userController.create({
                    username: 'testuser1'
                }),
                userController.create({
                    username: 'testuser2'
                }),
            ])

            const [authuser1, authuser2] = await Promise.all([
                authController.login({
                    username: 'testuser1'
                }),
                authController.login({
                    username: 'testuser2'
                }),
            ]);

            await request(server)
                .post('/v1/post')
                .set({
                    'authorization': authuser1['data'].access_token
                })
                .send(payload);

            const posts = await request(server)
                .get('/v1/post')
                .query({
                    page: 1,
                    size: 1,
                });

            postId = posts.body['data'].posts[0]._id;
            accessTokenUser1 = authuser1['data'].access_token;
            accessTokenUser2 = authuser2['data'].access_token;

            await request(server)
                .post('/v1/comment')
                .set({
                    'authorization': accessTokenUser1
                })
                .send({
                    message: 'comment test 1',
                    post_id: postId
                });

            const comments = await new CommentMockRepository().list(postId);
            commentId = comments[0]._id;
        });

        it('should return "invalid token"', async () => {
            try {
                const server = testapp.getHttpServer();
                await request(server)
                    .delete(`/v1/comment/66926bf75c6fd6a97dc0fc5c`)
            } catch (error) {
                expect(error.message).toBe('invalid token');
                expect(error.status).toBe(401);
            }
        });

        it('should return "post not found"', async () => {
            try {
                const server = testapp.getHttpServer();
                await request(server)
                    .delete(`/v1/comment/66926bf75c6fd6a97dc0fc5c`)
                    .set({
                        'authorization': accessTokenUser1
                    })
            } catch (error) {
                expect(error.message).toBe('post not found');
                expect(error.status).toBe(404);
            }
        });

        it('user cannot delete other comment', async () => {
            try {
                const server = testapp.getHttpServer();
                await request(server)
                    .delete(`/v1/comment/${commentId}`)
                    .set({
                        'authorization': accessTokenUser2
                    })
            } catch (error) {
                expect(error.message).toBe('post not found');
                expect(error.status).toBe(404);
            }
        });

        it('should return "delete comment success"', async () => {
            const server = testapp.getHttpServer();
            const result = await request(server)
                .delete(`/v1/comment/${commentId}`)
                .set({
                    'authorization': accessTokenUser1
                });
            expect(result.body).toEqual({
                message: 'delete comment success'
            });
        });

        afterEach(async () => {
            await Promise.all([
                testapp.close(),
                (await MongoDB.connection(USER_DB)).deleteMany(),
                (await MongoDB.connection(POST_DB)).deleteMany(),
                (await MongoDB.connection(COMMENT_DB)).deleteMany(),
            ]);
        });
    });
});