import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserAuth } from '../types/user-auth.type';

export const AuthUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserAuth => {
    const request = ctx.switchToHttp().getRequest();
    return request.userAuth;
  },
);
