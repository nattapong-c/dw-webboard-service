import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PostRepositoryInterface } from './domain/ports/outbound/post.repository';
import { PostRepository } from './infrastructure/post.repository';
import { UserController } from './interface/user.controller';
import { UserService } from './application/user.service';
import { UserRepositoryInterface } from './domain/ports/outbound/user.repository';
import { UserRepository } from './infrastructure/user.repository';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [UserController],
  providers: [
    UserService,
    {
      provide: UserRepositoryInterface,
      useClass: UserRepository
    },
    {
      provide: PostRepositoryInterface,
      useClass: PostRepository
    }
  ],
})
export class AppModule { }
