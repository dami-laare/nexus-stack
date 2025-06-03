import { Expose, Type } from 'class-transformer';
import { User } from 'src/libs/database/entities/user.entity';
import { UserResponse } from 'src/modules/users/dto/response.dto';

class TokenResponse {
  constructor(partial: any) {
    Object.assign(this, partial);
  }

  @Expose()
  token: string;

  @Expose()
  exp: string;
}

export class LoginResponse {
  constructor(partial: any) {
    Object.assign(this, partial);
  }

  @Expose()
  @Type(() => TokenResponse)
  access: TokenResponse;

  @Expose()
  @Type(() => TokenResponse)
  refresh: TokenResponse;

  @Expose()
  @Type(() => UserResponse)
  user: User;
}
