import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { RegisterDto } from './dto/register.dto';
import { UserRole } from '../../common/enums/user-role.enum';

describe('AuthService.register', () => {
  let service: AuthService;
  let userService: { create: jest.Mock; setRefreshTokenHash: jest.Mock };

  const dto: RegisterDto = {
    username: 'customer01',
    password: '123456',
    fullName: 'Nguyễn Văn Khách',
  };

  beforeEach(async () => {
    userService = {
      create: jest.fn(),
      setRefreshTokenHash: jest.fn().mockResolvedValue(undefined),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: userService },
        {
          provide: JwtService,
          useValue: { sign: jest.fn(() => 'signed.jwt.token') },
        },
        { provide: ConfigService, useValue: { get: jest.fn(() => 'secret') } },
      ],
    }).compile();
    service = moduleRef.get(AuthService);
  });

  it('creates a CUSTOMER account and returns tokens + user (login-shaped)', async () => {
    userService.create.mockResolvedValue({
      id: 5,
      username: 'customer01',
      fullName: 'Nguyễn Văn Khách',
      avatar: null,
      role: UserRole.CUSTOMER,
      isActive: true,
    });

    const result = await service.register(dto);

    // reuses UserService.create with forced CUSTOMER role + isActive
    expect(userService.create).toHaveBeenCalledWith({
      username: 'customer01',
      password: '123456',
      fullName: 'Nguyễn Văn Khách',
      role: UserRole.CUSTOMER,
      isActive: true,
    });
    // persists a refresh-token hash for user 5
    expect(userService.setRefreshTokenHash).toHaveBeenCalledWith(
      5,
      expect.any(String),
    );
    expect(result).toEqual({
      accessToken: 'signed.jwt.token',
      refreshToken: 'signed.jwt.token',
      user: {
        id: 5,
        username: 'customer01',
        fullName: 'Nguyễn Văn Khách',
        avatar: null,
        role: UserRole.CUSTOMER,
        permission: [],
      },
    });
  });

  it('propagates the duplicate-username error from UserService.create', async () => {
    userService.create.mockRejectedValue(
      new BadRequestException('Tên đăng nhập đã tồn tại'),
    );
    await expect(service.register(dto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(userService.setRefreshTokenHash).not.toHaveBeenCalled();
  });
});

describe('AuthService.refresh', () => {
  it('signs replacement tokens with the current database role after promotion', async () => {
    const refreshToken = 'valid-refresh-token';
    const userService = {
      findById: jest.fn().mockResolvedValue({
        id: 5,
        username: 'promoted-google-user',
        role: UserRole.ADMIN,
        isActive: true,
        currentRefreshTokenHash: await bcrypt.hash(refreshToken, 4),
      }),
      setRefreshTokenHash: jest.fn().mockResolvedValue(undefined),
    };
    const jwtService = {
      verify: jest.fn().mockReturnValue({
        sub: 5,
        username: 'promoted-google-user',
        role: UserRole.CUSTOMER,
      }),
      sign: jest.fn().mockReturnValue('replacement-token'),
    };
    const config = { get: jest.fn(() => 'a-secure-test-secret') };
    const service = new AuthService(
      userService as unknown as UserService,
      jwtService as unknown as JwtService,
      config as unknown as ConfigService,
    );

    await service.refresh(refreshToken);

    expect(jwtService.sign).toHaveBeenCalledWith(
      expect.objectContaining({ sub: 5, role: UserRole.ADMIN }),
      expect.any(Object),
    );
  });
});
