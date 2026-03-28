import { Injectable } from '@nestjs/common';
import { CurrentUserData } from '../../common/decorators/current-user.decorator';

@Injectable()
export class AuthService {
  async getMe(user: CurrentUserData): Promise<CurrentUserData> {
    return user;
  }
}
