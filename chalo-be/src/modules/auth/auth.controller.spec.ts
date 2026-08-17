import { Reflector } from '@nestjs/core';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';
import { RegisterDto } from './dto/register.dto';
import { THROTTLER_LIMIT, THROTTLER_TTL } from '@nestjs/throttler/dist/throttler.constants';

describe('AuthController.register', () => {
  const authService = { register: jest.fn() };
  const controller = new AuthController(authService as unknown as AuthService);

  const dto: RegisterDto = {
    username: 'customer01',
    password: '123456',
    fullName: 'Nguyễn Văn Khách',
  };

  it('delegates to AuthService.register', async () => {
    const payload = { accessToken: 'a', refreshToken: 'r', user: {} };
    authService.register.mockResolvedValue(payload);
    await expect(controller.register(dto)).resolves.toBe(payload);
    expect(authService.register).toHaveBeenCalledWith(dto);
  });

  it('is a public route', () => {
    const isPublic = new Reflector().get<boolean>(IS_PUBLIC_KEY, controller.register);
    expect(isPublic).toBe(true);
  });

  it('giới hạn các auth endpoint công khai chặt hơn rate limit toàn cục', () => {
    expect(Reflect.getMetadata(`${THROTTLER_LIMIT}default`, controller.login)).toBe(5);
    expect(Reflect.getMetadata(`${THROTTLER_TTL}default`, controller.login)).toBe(15 * 60 * 1000);
    expect(Reflect.getMetadata(`${THROTTLER_LIMIT}default`, controller.register)).toBe(3);
    expect(Reflect.getMetadata(`${THROTTLER_TTL}default`, controller.register)).toBe(60 * 60 * 1000);
    expect(Reflect.getMetadata(`${THROTTLER_LIMIT}default`, controller.refresh)).toBe(20);
    expect(Reflect.getMetadata(`${THROTTLER_TTL}default`, controller.refresh)).toBe(15 * 60 * 1000);
  });
});
