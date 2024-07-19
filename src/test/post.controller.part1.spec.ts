import { ConfigModule } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import * as request from 'supertest';
import { INestApplication } from "@nestjs/common";

import { MongoDB } from "../utils";
import { PostCreateDto } from "../interface/dto/post.create";
import { AppModule } from "../app.module";

jest.setTimeout(30000);

describe('PostController', () => {
    const USER_DB = 'mock_user';
    const POST_DB = 'mock_post';
    const COMMENT_DB = 'mock_comment';
    let testapp: INestApplication;

    let accessTokenUser1 = '';
    let accessTokenUser2 = '';
    let server: any;

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
    });

    afterAll(async () => {
        await Promise.all([
            testapp.close(),
            (await MongoDB.connection(USER_DB)).deleteMany(),
            (await MongoDB.connection(POST_DB)).deleteMany()
        ]);

    });

    const payload: PostCreateDto = {
        topic: 'test post1',
        content: 'content post',
        community: 'Exercise',
    }

    describe('create post', () => {
        it('should return "invalid token"', async () => {
            try {
                request(server)
                    .post('/v1/post')
                    .send(payload)
            } catch (error) {
                expect(error.message).toBe('invalid token');
                expect(error.status).toBe(401);
            }
        });

        it('should return "create post success"', async () => {
            const result = await request(server)
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
    });

    describe('update post', () => {
        let postId = '';

        beforeAll(async () => {
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
            const result = await request(server)
                .put('/v1/post/66926bf75c6fd6a97dc0fc5c')
                .send(payload);

            const error = JSON.parse(result.error['text'])
            expect(error.message).toBe('invalid token');
            expect(result.status).toBe(401);

        });

        it('should return "post not found"', async () => {
            const result = await request(server)
                .put('/v1/post/66926bf75c6fd6a97dc0fc5c')
                .send(payload)
                .set({
                    'authorization': accessTokenUser1
                });

            const error = JSON.parse(result.error['text'])
            expect(error.message).toBe('post not found');
            expect(result.status).toBe(404);
        });

        it('user cannot update other post', async () => {
            const result = await request(server)
                .put(`/v1/post/${postId}`)
                .send(payload)
                .set({
                    'authorization': accessTokenUser2
                });

            const error = JSON.parse(result.error['text'])
            expect(error.message).toBe('post not found');
            expect(result.status).toBe(404);
        });

        it('should return "update post success"', async () => {
            const result = await request(server)
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
    });

    describe('delete post', () => {
        let postId = '';

        beforeAll(async () => {
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
            const result = await request(server)
                .delete(`/v1/post/${postId}`)

            const error = JSON.parse(result.error['text'])
            expect(error.message).toBe('invalid token');
            expect(result.status).toBe(401);
        });

        it('should return "post not found"', async () => {
            const result = await request(server)
                .delete(`/v1/post/66926bf75c6fd6a97dc0fc5c`)
                .set({
                    'authorization': accessTokenUser1
                })

            const error = JSON.parse(result.error['text'])
            expect(error.message).toBe('post not found');
            expect(result.status).toBe(404);
        });

        it('user cannot delete other post', async () => {
            const result = await request(server)
                .delete(`/v1/post/${postId}`)
                .set({
                    'authorization': accessTokenUser2
                })
            const error = JSON.parse(result.error['text'])
            expect(error.message).toBe('post not found');
            expect(result.status).toBe(404);
        });

        it('should return "delete post success"', async () => {
            const result = await request(server)
                .delete(`/v1/post/${postId}`)
                .set({
                    'authorization': accessTokenUser1
                })
                .expect(200);
            expect(result.body).toEqual({
                message: 'delete post success'
            });
        });
    });
})