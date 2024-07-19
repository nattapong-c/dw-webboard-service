import { Test, TestingModule } from "@nestjs/testing";
import { ConfigModule } from "@nestjs/config";
import { INestApplication } from "@nestjs/common";
import * as request from 'supertest';

import { MongoDB } from "../utils";
import { AppModule } from "../app.module";

describe('AuthController', () => {
    const USER_DB = 'mock_user';
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
        ]);

    });

    describe('login', () => {
        it('should return "invalid username"', async () => {
            const result = await request(server)
                .post('/v1/auth/login')
                .send({
                    username: 'testuser3'
                });

            const error = JSON.parse(result.error['text'])
            expect(error.message).toBe('invalid username');
            expect(result.status).toBe(401);
        });

        it('should return access_token in response', async () => {
            const result = await request(server)
                .post('/v1/auth/login')
                .send({
                    username: 'testuser1'
                });
            expect(result.body['data'].access_token).not.toBeUndefined()
        });
    })
})