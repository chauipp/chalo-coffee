import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { StringValue } from 'ms';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service';
import { UserRole } from '../../common/enums/user-role.enum';
import { BCRYPT_SALT_ROUNDS } from '../../common/constants';
import { RegisterDto } from './dto/register.dto';

const PERMISSIONS: Record<UserRole, string[]> = {
  [UserRole.ADMIN]: ['menu:write', 'table:write', 'order:write', 'staff:write'],
  [UserRole.MODERATOR]: ['order:write', 'order:read'],
  [UserRole.CUSTOMER]: [],
};

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private buildTokens(userId: number, username: string, role: UserRole) {
    const payload = { sub: userId, username, role };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET') as string,
      expiresIn: (this.configService.get<string>('JWT_ACCESS_EXPIRES') ?? '15m') as StringValue,
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET') as string,
      expiresIn: (this.configService.get<string>('JWT_REFRESH_EXPIRES') ?? '7d') as StringValue,
    });
    return { accessToken, refreshToken };
  }

  async login(username: string, password: string) {
    const user = await this.userService.findByUsername(username);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Sai tên đăng nhập hoặc mật khẩu');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('Tài khoản đã bị khóa');
    }

    const tokens = this.buildTokens(user.id, user.username, user.role);

    const tokenHash = await bcrypt.hash(tokens.refreshToken, BCRYPT_SALT_ROUNDS);
    await this.userService.setRefreshTokenHash(user.id, tokenHash);

    return {
      ...tokens,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        avatar: user.avatar,
        role: user.role,
        permission: PERMISSIONS[user.role],
      },
    };
  }

  async register(dto: RegisterDto) {
    // UserService.create hashes the password (bcrypt) and enforces the
    // unique-username guard → BadRequestException('Tên đăng nhập đã tồn tại').
    const user = await this.userService.create({
      username: dto.username,
      password: dto.password,
      fullName: dto.fullName,
      role: UserRole.CUSTOMER,
      isActive: true,
    });

    const tokens = this.buildTokens(user.id, user.username, user.role);
    const tokenHash = await bcrypt.hash(tokens.refreshToken, BCRYPT_SALT_ROUNDS);
    await this.userService.setRefreshTokenHash(user.id, tokenHash);

    return {
      ...tokens,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        avatar: user.avatar,
        role: user.role,
        permission: PERMISSIONS[user.role],
      },
    };
  }

  async refresh(refreshToken: string) {
    let payload: { sub: number; username: string; role: UserRole };
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET') as string,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.userService.findById(payload.sub);
    if (!user || !user.isActive || !user.currentRefreshTokenHash) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const isMatch = await bcrypt.compare(refreshToken, user.currentRefreshTokenHash);
    if (!isMatch) throw new UnauthorizedException('Invalid refresh token');

    const tokens = this.buildTokens(user.id, user.username, user.role);
    const newHash = await bcrypt.hash(tokens.refreshToken, BCRYPT_SALT_ROUNDS);
    await this.userService.setRefreshTokenHash(user.id, newHash);
    return tokens;
  }

  async logout(userId: number) {
    await this.userService.setRefreshTokenHash(userId, null);
    return null;
  }

  async me(userId: number) {
    const user = await this.userService.findById(userId);
    if (!user) throw new UnauthorizedException('Người dùng không tồn tại');
    return {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      avatar: user.avatar,
      role: user.role,
      permission: PERMISSIONS[user.role],
    };
  }
}
