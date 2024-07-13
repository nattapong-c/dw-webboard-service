import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { PostRepositoryInterface } from './domain/ports/outbound/post.repository';
import { PostRepository } from './infrastructure/post.repository';
import { UserController } from './interface/user.controller';
import { UserService } from './application/user.service';
import { UserRepositoryInterface } from './domain/ports/outbound/user.repository';
import { UserRepository } from './infrastructure/user.repository';
import { JWT } from './utils';
import { AuthController } from './interface/auth.controller';
import { AuthService } from './application/auth.service';
import { PostService } from './application/post.service';
import { PostController } from './interface/post.controller';
import { CommentRepositoryInterface } from './domain/ports/outbound/comment.repository';
import { CommentRepository } from './infrastructure/comment.repository';
import { CommentService } from './application/comment.service';
import { CommentController } from './interface/comment.controller';

@Module({
  imports: [ConfigModule.forRoot(), JwtModule.register({
    global: true,
    secret: JWT.secret,
    signOptions: { expiresIn: '1d' },
  })],
  controllers: [UserController, AuthController, PostController, CommentController],
  providers: [
    UserService,
    AuthService,
    PostService,
    CommentService,
    {
      provide: UserRepositoryInterface,
      useClass: UserRepository
    },
    {
      provide: PostRepositoryInterface,
      useClass: PostRepository
    },
    {
      provide: CommentRepositoryInterface,
      useClass: CommentRepository
    }
  ],
})
export class AppModule { }
