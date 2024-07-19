import { ConfigModule } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import * as request from 'supertest';
import { INestApplication } from "@nestjs/common";

import { MongoDB } from "../utils";
import { UserController } from "../interface/user.controller";
import { AuthController } from "../interface/auth.controller";
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

        await request(server)
            .post('/v1/post')
            .set({
                'authorization': accessTokenUser1
            })
            .send(payload)
    });

    afterAll(async () => {
        await Promise.all([
            testapp.close(),
            (await MongoDB.connection(USER_DB)).deleteMany(),
            (await MongoDB.connection(POST_DB)).deleteMany(),
            (await MongoDB.connection(COMMENT_DB)).deleteMany()
        ]);

    });

    const payload: PostCreateDto = {
        topic: 'test post1',
        content: 'content post',
        community: 'Exercise',
    }

    describe('get post detail', () => {
        let postId = '';

        beforeEach(async () => {
            const posts = await request(server)
                .get('/v1/post')
                .query({
                    page: 1,
                    size: 1,
                });
            postId = posts.body['data'].posts[0]._id
        });

        it('post not found', async () => {
            const result = await request(server)
                .get(`/v1/post/66926bf75c6fd6a97dc0fc5c`)
            const error = JSON.parse(result.error['text'])
            expect(error.message).toBe('post not found');
            expect(result.status).toBe(404);
        })

        it('success get post', async () => {
            const result = await request(server)
                .get(`/v1/post/${postId}`)
                .expect(200);

            expect(result.body['data']).toHaveProperty('_id');
            expect(result.body['data']).toHaveProperty('user');
            expect(result.body['data']).toHaveProperty('comments');
        });

        it('success get post with comments', async () => {
            await request(server)
                .post('/v1/comment')
                .set({
                    'authorization': accessTokenUser2
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
        });
    });

    describe('list post', () => {
        it('list post success', async () => {
            const posts = await request(server)
                .get('/v1/post')
                .query({
                    page: 1,
                    size: 1,
                });
            expect(posts.body['data'].posts).toHaveLength(1);
        });

        it('list post success with topic search', async () => {
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
            const posts = await request(server)
                .get('/v1/post')
                .set({
                    'authorization': accessTokenUser1
                })
                .query({
                    page: 1,
                    size: 1,
                    private: true
                });
            expect(posts.body['data'].posts).toHaveLength(1);
        });

        it('list only owner user2 post success', async () => {
            const posts = await request(server)
                .get('/v1/post')
                .set({
                    'authorization': accessTokenUser2
                })
                .query({
                    page: 1,
                    size: 1,
                    private: true
                });
            console.log(posts.body['data'].posts)
            expect(posts.body['data'].posts).toHaveLength(0);
        });
    });
})