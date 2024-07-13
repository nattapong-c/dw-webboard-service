import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { Test, TestingModule } from "@nestjs/testing";
import * as request from 'supertest';
import { INestApplication } from "@nestjs/common";

import { JWT, MongoDB } from "../utils";
import { UserController } from "./user.controller";
import { AuthController } from "./auth.controller";
import { AuthService } from "../application/auth.service";
import { UserService } from "../application/user.service";
import { UserRepositoryInterface } from "../domain/ports/outbound/user.repository";
import { UserMockRepository } from "../infrastructure/user.repository.mock";
import { PostRepositoryInterface } from "../domain/ports/outbound/post.repository";
import { PostMockRepository } from "../infrastructure/post.repository.mock";
import { CommentRepositoryInterface } from "../domain/ports/outbound/comment.repository";
import { CommentMockRepository } from "../infrastructure/comment.repository.mock";
import { PostService } from "../application/post.service";
import { PostController } from "./post.controller";
import { PostCreateDto } from "./dto/post.create";
import { CommentController } from "./comment.controller";
import { CommentService } from "../application/comment.service";


describe('PostController', () => {
    const USER_DB = 'mock_user';
    const POST_DB = 'mock_post';
    const COMMENT_DB = 'mock_comment';
    let authController: AuthController;
    let userController: UserController;
    let postController: PostController;
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
        postController = app.get<PostController>(PostController);

        testapp = app.createNestApplication();
        await testapp.init();
    });

    const payload: PostCreateDto = {
        topic: 'test post1',
        content: 'content post',
        community: 'Exercise',
    }

    describe('create post', () => {
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
            await userController.create({
                username: 'testuser1'
            });

            const auth = await authController.login({
                username: 'testuser1'
            })

            const result = await request(testapp.getHttpServer())
                .post('/v1/post')
                .set({
                    'authorization': auth['data'].access_token
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
        beforeEach(async () => {
            await userController.create({
                username: 'testuser1'
            });
        })

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
                const auth = await authController.login({
                    username: 'testuser1'
                })
                request(testapp.getHttpServer())
                    .put('/v1/post/66926bf75c6fd6a97dc0fc5c')
                    .set({
                        'authorization': auth['data'].access_token
                    })
                    .send(payload)
            } catch (error) {
                expect(error.message).toBe('post not found');
                expect(error.status).toBe(404);
            }
        });

        it('user cannot update other post', async () => {
            try {
                const server = testapp.getHttpServer()
                await userController.create({
                    username: 'testuser2'
                });

                const authuser1 = await authController.login({
                    username: 'testuser1'
                });

                const authuser2 = await authController.login({
                    username: 'testuser2'
                });

                await request(server)
                    .post('/v1/post')
                    .set({
                        'authorization': authuser1['data'].access_token
                    })
                    .send(payload)

                const posts = await request(server)
                    .get('/v1/post')
                    .query({
                        page: 1,
                        size: 1,
                    });

                await request(testapp.getHttpServer())
                    .put(`/v1/post/${posts.body['data'].posts[0]._id}`)
                    .set({
                        'authorization': authuser2['data'].access_token
                    })
                    .send(payload)
            } catch (error) {
                expect(error.message).toBe('post not found');
                expect(error.status).toBe(404);
            }
        });

        it('should return "update post success"', async () => {
            const server = testapp.getHttpServer()
            const authuser1 = await authController.login({
                username: 'testuser1'
            });

            await request(server)
                .post('/v1/post')
                .set({
                    'authorization': authuser1['data'].access_token
                })
                .send(payload)

            const posts = await request(server)
                .get('/v1/post')
                .query({
                    page: 1,
                    size: 1,
                });

            const result = await request(testapp.getHttpServer())
                .put(`/v1/post/${posts.body['data'].posts[0]._id}`)
                .set({
                    'authorization': authuser1['data'].access_token
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
        beforeEach(async () => {
            await userController.create({
                username: 'testuser1'
            });
        })

        it('should return "invalid token"', async () => {
            try {
                const server = testapp.getHttpServer()
                const auth = await authController.login({
                    username: 'testuser1'
                });

                await request(server)
                    .post('/v1/post')
                    .set({
                        'authorization': auth['data'].access_token
                    })
                    .send(payload)
                    .expect(201);
                const posts = await request(server)
                    .get('/v1/post')
                    .query({
                        page: 1,
                        size: 1,
                    });

                await request(server)
                    .delete(`/v1/post/${posts.body['data'].posts[0]._id}`)
            } catch (error) {
                expect(error.message).toBe('invalid token');
                expect(error.status).toBe(401);
            }
        });

        it('should return "post not found"', async () => {
            try {
                const server = testapp.getHttpServer()
                const auth = await authController.login({
                    username: 'testuser1'
                });

                await request(server)
                    .delete(`/v1/post/66926bf75c6fd6a97dc0fc5c`)
                    .set({
                        'authorization': auth['data'].access_token
                    })
            } catch (error) {
                expect(error.message).toBe('post not found');
                expect(error.status).toBe(404);
            }
        });

        it('user cannot update other post', async () => {
            try {
                const server = testapp.getHttpServer()
                await userController.create({
                    username: 'testuser2'
                });

                const authuser1 = await authController.login({
                    username: 'testuser1'
                });

                const authuser2 = await authController.login({
                    username: 'testuser2'
                });

                await request(server)
                    .post('/v1/post')
                    .set({
                        'authorization': authuser1['data'].access_token
                    })
                    .send(payload)

                const posts = await request(server)
                    .get('/v1/post')
                    .query({
                        page: 1,
                        size: 1,
                    });

                await request(testapp.getHttpServer())
                    .delete(`/v1/post/${posts.body['data'].posts[0]._id}`)
                    .set({
                        'authorization': authuser2['data'].access_token
                    });
            } catch (error) {
                expect(error.message).toBe('post not found');
                expect(error.status).toBe(404);
            }
        });

        it('should return "delete post success"', async () => {
            const server = testapp.getHttpServer()
            const authuser1 = await authController.login({
                username: 'testuser1'
            });

            await request(server)
                .post('/v1/post')
                .set({
                    'authorization': authuser1['data'].access_token
                })
                .send(payload)

            const posts = await request(server)
                .get('/v1/post')
                .query({
                    page: 1,
                    size: 1,
                });

            const result = await request(testapp.getHttpServer())
                .delete(`/v1/post/${posts.body['data'].posts[0]._id}`)
                .set({
                    'authorization': authuser1['data'].access_token
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

    describe('get post detail', () => {
        beforeEach(async () => {
            await userController.create({
                username: 'testuser1'
            });
        });

        it('post not found', async () => {
            try {
                const server = testapp.getHttpServer();
                await request(server)
                    .get(`/v1/post/66926bf75c6fd6a97dc0fc5c`)
            } catch (error) {
                expect(error.message).toBe('post not found');
                expect(error.status).toBe(404);
            }
        })

        it('success get post', async () => {
            const server = testapp.getHttpServer()
            const authuser1 = await authController.login({
                username: 'testuser1'
            });

            await request(server)
                .post('/v1/post')
                .set({
                    'authorization': authuser1['data'].access_token
                })
                .send(payload)

            const posts = await request(server)
                .get('/v1/post')
                .query({
                    page: 1,
                    size: 1,
                });

            const result = await request(server)
                .get(`/v1/post/${posts.body['data'].posts[0]._id}`)
                .expect(200);

            expect(result.body['data']).toHaveProperty('_id');
            expect(result.body['data']).toHaveProperty('user');
            expect(result.body['data']).toHaveProperty('comments');
        });

        it('success get post with comments', async () => {
            const server = testapp.getHttpServer()
            await userController.create({
                username: 'testuser2'
            });

            const [authuser1, authuser2] = await Promise.all([
                authController.login({
                    username: 'testuser1'
                }),
                authController.login({
                    username: 'testuser2'
                })
            ]);

            await request(server)
                .post('/v1/post')
                .set({
                    'authorization': authuser1['data'].access_token
                })
                .send(payload)

            const posts = await request(server)
                .get('/v1/post')
                .query({
                    page: 1,
                    size: 1,
                });
            const postId = posts.body['data'].posts[0]._id;
            await request(server)
                .post('/v1/comment')
                .set({
                    'authorization': authuser2['data'].access_token
                })
                .send({
                    message: 'new comment from user 2',
                    post_id: postId
                })

            const result = await request(server)
                .get(`/v1/post/${postId}`)
                .expect(200);

            expect(result.body['data']).toHaveProperty('_id');
            expect(result.body['data']).toHaveProperty('user');
            expect(result.body['data'].comments).toHaveLength(1);
        }, 10000);

        afterEach(async () => {
            await Promise.all([
                testapp.close(),
                (await MongoDB.connection(USER_DB)).deleteMany(),
                (await MongoDB.connection(POST_DB)).deleteMany(),
                (await MongoDB.connection(COMMENT_DB)).deleteMany(),
            ]);
        });
    });

    describe('list post', () => {
        beforeEach(async () => {
            await userController.create({
                username: 'testuser1'
            });
        });

        it('list post success', async () => {
            const server = testapp.getHttpServer()
            const authuser1 = await authController.login({
                username: 'testuser1'
            });

            await request(server)
                .post('/v1/post')
                .set({
                    'authorization': authuser1['data'].access_token
                })
                .send(payload)

            const posts = await request(server)
                .get('/v1/post')
                .query({
                    page: 1,
                    size: 1,
                });
            expect(posts.body['data'].posts).toHaveLength(1);
        });

        it('list post success with topic search', async () => {
            const server = testapp.getHttpServer()
            const authuser1 = await authController.login({
                username: 'testuser1'
            });

            await request(server)
                .post('/v1/post')
                .set({
                    'authorization': authuser1['data'].access_token
                })
                .send(payload)

            const posts = await request(server)
                .get('/v1/post')
                .query({
                    page: 1,
                    size: 1,
                    topic: 'post1'
                });
            expect(posts.body['data'].posts).toHaveLength(1);
        });

        it('list post empty with topic search', async () => {
            const server = testapp.getHttpServer()
            const authuser1 = await authController.login({
                username: 'testuser1'
            });

            await request(server)
                .post('/v1/post')
                .set({
                    'authorization': authuser1['data'].access_token
                })
                .send(payload)

            const posts = await request(server)
                .get('/v1/post')
                .query({
                    page: 1,
                    size: 1,
                    topic: 'post2'
                });
            expect(posts.body['data'].posts).toHaveLength(0);
        });

        it('list only owner user1 post success', async () => {
            const server = testapp.getHttpServer()
            const authuser1 = await authController.login({
                username: 'testuser1'
            });

            await request(server)
                .post('/v1/post')
                .set({
                    'authorization': authuser1['data'].access_token
                })
                .send(payload)

            const posts = await request(server)
                .get('/v1/post')
                .set({
                    'authorization': authuser1['data'].access_token
                })
                .query({
                    page: 1,
                    size: 1,
                    private: true
                });
            expect(posts.body['data'].posts).toHaveLength(1);
        });

        it('list only owner user2 post success', async () => {
            const server = testapp.getHttpServer()
            await userController.create({
                username: 'testuser2'
            });
            const [authuser1, authuser2] = await Promise.all([
                authController.login({
                    username: 'testuser1'
                }),
                authController.login({
                    username: 'testuser2'
                })
            ]);

            await request(server)
                .post('/v1/post')
                .set({
                    'authorization': authuser1['data'].access_token
                })
                .send(payload)

            const posts = await request(server)
                .get('/v1/post')
                .set({
                    'authorization': authuser2['data'].access_token
                })
                .query({
                    page: 1,
                    size: 1,
                    private: true
                });
            expect(posts.body['data'].posts).toHaveLength(0);
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
})