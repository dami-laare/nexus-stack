import { Expose } from 'class-transformer';

export class UserResponse {
  constructor(partial: any) {
    Object.assign(this, partial);
  }

  @Expose()
  firstName: string;

  @Expose()
  lastName: string;

  @Expose()
  email: string;

  @Expose()
  username: string;

  @Expose()
  createdAt: string;
}
