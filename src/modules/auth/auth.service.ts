import { Injectable } from '@nestjs/common';
import { CurrentUserData } from '../../common/decorators/current-user.decorator';

@Injectable()
export class AuthService {
  getMe(user: CurrentUserData): CurrentUserData {
    return user;
  }
}
