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
    const payload = {
      accessToken: 'a',
      refreshToken: 'r',
      user: { id: 1, username: 'customer01', fullName: 'Khách', avatar: null, role: 'CUSTOMER', permission: [] },
    };
    const response = { cookie: jest.fn() };
    authService.register.mockResolvedValue(payload);
    await expect(controller.register(dto, response as never)).resolves.toEqual({ user: payload.user });
    expect(authService.register).toHaveBeenCalledWith(dto);
    expect(response.cookie).toHaveBeenCalledTimes(3);
  });

  it('is a public route', () => {
    const isPublic = new Reflector().get<boolean>(IS_PUBLIC_KEY, controller.register);
    expect(isPublic).toBe(true);
  });

  it('rate limits public auth endpoints more strictly than the global policy', () => {
    expect(Reflect.getMetadata(`${THROTTLER_LIMIT}default`, controller.login)).toBe(5);
    expect(Reflect.getMetadata(`${THROTTLER_TTL}default`, controller.login)).toBe(15 * 60 * 1000);
    expect(Reflect.getMetadata(`${THROTTLER_LIMIT}default`, controller.register)).toBe(3);
    expect(Reflect.getMetadata(`${THROTTLER_TTL}default`, controller.register)).toBe(60 * 60 * 1000);
    expect(Reflect.getMetadata(`${THROTTLER_LIMIT}default`, controller.refresh)).toBe(20);
    expect(Reflect.getMetadata(`${THROTTLER_TTL}default`, controller.refresh)).toBe(15 * 60 * 1000);
  });
});
