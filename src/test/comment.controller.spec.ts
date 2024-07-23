import { INestApplication } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import * as request from 'supertest';

import { MongoDB } from "../utils";
import { PostCreateDto } from "../interface/dto/post.create";
import { AppModule } from "../app.module";

describe('CommentController', () => {
    const USER_DB = 'mock_user';
    const POST_DB = 'mock_post';
    const COMMENT_DB = 'mock_comment';
    let testapp: INestApplication;
    let accessTokenUser1 = '';
    let accessTokenUser2 = '';
    let server: any;
    let postId = '';

    beforeAll(async () => {
        const app: TestingModule = await Test.createTestingModule({
            imports: [
                ConfigModule.forRoot({
                    envFilePath: '.env.test.local'
                }),
                AppModule
            ],
        }).compile();

        testapp = app.createNestApplication();
        await testapp.init();
        server = testapp.getHttpServer();

        await Promise.all([
            request(server)
                .post('/v1/user')
                .send({
                    username: 'testuser1'
                }),
            request(server)
                .post('/v1/user')
                .send({
                    username: 'testuser2'
                })
        ])

        const [authuser1, authuser2] = await Promise.all([
            request(server)
                .post('/v1/auth/login')
                .send({
                    username: 'testuser1'
                }),
            request(server)
                .post('/v1/auth/login')
                .send({
                    username: 'testuser2'
                })
        ])

        accessTokenUser1 = authuser1.body.data.access_token;
        accessTokenUser2 = authuser2.body.data.access_token;

        await request(server)
            .post('/v1/post')
            .set({
                'authorization': accessTokenUser1
            })
            .send(payload);

        const posts = await request(server)
            .get('/v1/post')
            .query({
                page: 1,
                size: 1,
            });

        postId = posts.body['data'].posts[0]._id;
    });


    afterAll(async () => {
        await Promise.all([
            testapp.close(),
            (await MongoDB.connection(USER_DB)).deleteMany(),
            (await MongoDB.connection(POST_DB)).deleteMany(),
            (await MongoDB.connection(COMMENT_DB)).deleteMany(),
        ]);

    });

    const payload: PostCreateDto = {
        topic: 'test post1',
        content: 'content post',
        community: 'Exercise',
    }

    describe('create comment', () => {
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

        it('should return "create comment success"', async () => {
            const server = testapp.getHttpServer();
            const result = await request(server)
                .post('/v1/comment')
                .set({
                    'authorization': accessTokenUser1
                })
                .send({
                    message: 'comment test 1',
                    post_id: postId
                });
            expect(result.body).toEqual({
                message: 'create comment success'
            });
        });
    });

    describe('update comment', () => {
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
    });

    describe('delete comment', () => {
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
    });
});