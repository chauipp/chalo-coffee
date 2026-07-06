import { Reflector } from '@nestjs/core';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';
import { RegisterDto } from './dto/register.dto';

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
});
