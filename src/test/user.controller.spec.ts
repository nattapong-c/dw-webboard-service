import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import * as request from 'supertest';

import { MongoDB } from '../utils';
import { AppModule } from '../app.module';
import { INestApplication } from '@nestjs/common';


describe('UserController', () => {
    const USER_DB = 'mock_user'
    let testapp: INestApplication;
    let server: any;

    beforeEach(async () => {
        const app: TestingModule = await Test.createTestingModule({
            imports: [ConfigModule.forRoot({
                envFilePath: '.env.test.local'
            }), AppModule]
        }).compile();

        testapp = app.createNestApplication();
        await testapp.init();
        server = testapp.getHttpServer();
    });

    afterAll(async () => {
        (await MongoDB.connection(USER_DB)).deleteMany()
    });

    describe('create user', () => {
        it('should return "create user success"', async () => {
            const result = await request(server)
                .post('/v1/user')
                .send({ username: 'testuser1' })
            expect(result.body.message).toBe('create user success');
        });


        it('should return "username already used"', async () => {
            const result = await request(server)
                .post('/v1/user')
                .send({ username: 'testuser1' })

            const error = JSON.parse(result.error['text'])
            expect(error.message).toBe('username already used');
            expect(result.status).toBe(400);
        });
    });
});
