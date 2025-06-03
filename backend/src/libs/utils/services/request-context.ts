import { REQUEST } from '@nestjs/core';
import { Global, Inject, Injectable, Module, Scope } from '@nestjs/common';
import { User } from 'src/libs/database/entities/user.entity';
import { IRequest } from '../helpers/types/common.helpers.types';

@Injectable({ scope: Scope.REQUEST })
export class RequestContextService<T = User> {
  constructor(@Inject(REQUEST) private readonly request: IRequest<T>) {}

  get req() {
    return this.request;
  }
  get currentUser() {
    return this.request.user;
  }

  get currentAdmin() {
    return this.request.user;
  }

  get currentTeam() {
    return this.request.currentTeam;
  }
}

@Global()
@Module({
  providers: [RequestContextService],
  exports: [RequestContextService],
})
export class RequestContextModule {}
