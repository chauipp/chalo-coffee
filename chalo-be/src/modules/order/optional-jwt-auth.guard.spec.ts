import { UnauthorizedException } from '@nestjs/common';
import { UserRole } from '../../common/enums/user-role.enum';
import { OptionalJwtAuthGuard } from './optional-jwt-auth.guard';

describe('OptionalJwtAuthGuard', () => {
  const guard = new OptionalJwtAuthGuard();

  it('giữ user hợp lệ để route public có thể gắn đơn với khách', () => {
    const user = {
      id: 42,
      username: 'google_customer',
      role: UserRole.CUSTOMER,
    };

    expect(
      guard.handleRequest(null, user, null, {} as never),
    ).toEqual(user);
  });

  it('coi bearer thiếu hoặc sai là khách vãng lai thay vì chặn tạo đơn', () => {
    expect(
      guard.handleRequest(
        new UnauthorizedException(),
        false,
        new Error('invalid token'),
        {} as never,
      ),
    ).toBeNull();
  });
});
