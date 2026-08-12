import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto, ChangePasswordDto } from './dto/update-user.dto';
import { UserRole } from '../../common/enums/user-role.enum';
import { BCRYPT_SALT_ROUNDS } from '../../common/constants';
import type { VerifiedGoogleProfile } from '../auth/google-oauth.types';
import { randomBytes } from 'crypto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  private toDto(
    user: User,
  ): Omit<User, 'password' | 'currentRefreshTokenHash'> {
    const {
      password: _password,
      currentRefreshTokenHash: _refresh,
      ...rest
    } = user;
    void _password;
    void _refresh;
    return rest;
  }

  async findById(id: number): Promise<User | null> {
    return this.userRepo.findOneBy({ id });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepo.findOneBy({ username });
  }

  async findByGoogleSubject(googleSubject: string): Promise<User | null> {
    return this.userRepo.findOneBy({ googleSubject });
  }

  async findOrCreateGoogleCustomer(
    profile: VerifiedGoogleProfile,
  ): Promise<User> {
    const existingBySubject = await this.findByGoogleSubject(profile.subject);
    if (existingBySubject) {
      return existingBySubject;
    }

    const normalizedEmail = profile.email.trim().toLowerCase();
    const existingByEmail = await this.userRepo.findOneBy({
      email: normalizedEmail,
    });
    if (existingByEmail) {
      throw new BadRequestException('Email Google đã được sử dụng');
    }

    const username = await this.uniqueGoogleUsername(normalizedEmail);
    const password = await bcrypt.hash(
      randomBytes(48).toString('base64url'),
      BCRYPT_SALT_ROUNDS,
    );
    const user = this.userRepo.create({
      username,
      password,
      fullName: profile.fullName,
      avatar: profile.avatar,
      googleSubject: profile.subject,
      email: normalizedEmail,
      role: UserRole.CUSTOMER,
      isActive: true,
      currentRefreshTokenHash: null,
    });
    return this.userRepo.save(user);
  }

  private async uniqueGoogleUsername(email: string): Promise<string> {
    const localPart =
      email
        .split('@')[0]
        .toLowerCase()
        .replace(/[^a-z0-9_]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 30) || 'customer';

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const suffix = randomBytes(4).toString('hex');
      const username = `google_${localPart}_${suffix}`.slice(0, 50);
      if (!(await this.findByUsername(username))) return username;
    }

    throw new BadRequestException('Không thể tạo tên đăng nhập Google');
  }

  async setRefreshTokenHash(
    userId: number,
    hash: string | null,
  ): Promise<void> {
    await this.userRepo.update(userId, { currentRefreshTokenHash: hash });
  }

  async page(query: {
    pageNo?: number;
    pageSize?: number;
    keyword?: string;
    role?: UserRole;
    isActive?: boolean;
  }) {
    const { pageNo = 1, pageSize = 10, keyword, role, isActive } = query;
    const skip = (pageNo - 1) * pageSize;

    const qb = this.userRepo.createQueryBuilder('u');
    if (keyword) {
      qb.andWhere('(u.username ILIKE :kw OR u.fullName ILIKE :kw)', {
        kw: `%${keyword}%`,
      });
    }
    if (role) qb.andWhere('u.role = :role', { role });
    if (isActive !== undefined)
      qb.andWhere('u.isActive = :isActive', { isActive });

    qb.orderBy('u.createdAt', 'DESC').skip(skip).take(pageSize);
    const [users, total] = await qb.getManyAndCount();
    return { list: users.map((u) => this.toDto(u)), total };
  }

  async create(dto: CreateUserDto) {
    const exists = await this.userRepo.findOneBy({ username: dto.username });
    if (exists) throw new BadRequestException('Tên đăng nhập đã tồn tại');

    const hashed = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);
    const user = this.userRepo.create({ ...dto, password: hashed });
    const saved = await this.userRepo.save(user);
    return this.toDto(saved);
  }

  async update(dto: UpdateUserDto) {
    const user = await this.userRepo.findOneBy({ id: dto.id });
    if (!user) throw new NotFoundException('Người dùng không tồn tại');

    user.fullName = dto.fullName;
    user.avatar = dto.avatar ?? null;
    user.role = dto.role;
    user.isActive = dto.isActive;

    const saved = await this.userRepo.save(user);
    return this.toDto(saved);
  }

  async changePassword(
    dto: ChangePasswordDto,
    requesterId: number,
    requesterRole: UserRole,
  ) {
    if (requesterRole === UserRole.MODERATOR && dto.id !== requesterId) {
      throw new ForbiddenException('Không có quyền');
    }
    const user = await this.userRepo.findOneBy({ id: dto.id });
    if (!user) throw new NotFoundException('Người dùng không tồn tại');

    // MODERATOR đổi mật khẩu của chính mình → bắt buộc nhập mật khẩu cũ
    if (requesterRole === UserRole.MODERATOR) {
      if (!dto.oldPassword) {
        throw new BadRequestException('Vui lòng nhập mật khẩu hiện tại');
      }
      const isMatch = await bcrypt.compare(dto.oldPassword, user.password);
      if (!isMatch) {
        throw new BadRequestException('Mật khẩu hiện tại không đúng');
      }
    }

    user.password = await bcrypt.hash(dto.newPassword, BCRYPT_SALT_ROUNDS);
    await this.userRepo.save(user);
    return null;
  }

  async delete(id: number, requesterId: number) {
    if (id === requesterId) {
      throw new BadRequestException('Không thể xóa tài khoản đang đăng nhập');
    }
    const user = await this.userRepo.findOneBy({ id });
    if (!user) throw new NotFoundException('Người dùng không tồn tại');

    await this.userRepo.remove(user);
    return null;
  }
}
