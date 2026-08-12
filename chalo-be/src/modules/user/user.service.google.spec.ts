import { BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { UserRole } from '../../common/enums/user-role.enum';

describe('UserService.findOrCreateGoogleCustomer', () => {
  const profile = {
    subject: 'google-subject-123',
    email: 'Customer@Example.com',
    emailVerified: true as const,
    fullName: 'Khách Google',
    avatar: 'https://example.com/avatar.jpg',
  };

  it('creates a new Google account with CUSTOMER role and no usable password', async () => {
    const repo = {
      findOneBy: jest.fn().mockResolvedValue(null),
      create: jest.fn((input) => input),
      save: jest.fn(async (input) => ({ id: 17, ...input })),
    };
    const service = new UserService(repo as unknown as Repository<User>);

    const user = await service.findOrCreateGoogleCustomer(profile);

    expect(user).toMatchObject({
      id: 17,
      googleSubject: 'google-subject-123',
      email: 'customer@example.com',
      fullName: 'Khách Google',
      role: UserRole.CUSTOMER,
      isActive: true,
    });
    expect(user.password).not.toContain('Customer@Example.com');
  });

  it('preserves an existing promoted role when logging in again by Google subject', async () => {
    const promoted = {
      id: 17,
      googleSubject: 'google-subject-123',
      role: UserRole.MODERATOR,
    } as User;
    const repo = {
      findOneBy: jest.fn().mockResolvedValue(promoted),
    };
    const service = new UserService(repo as unknown as Repository<User>);

    await expect(service.findOrCreateGoogleCustomer(profile)).resolves.toBe(
      promoted,
    );
  });

  it('does not silently link a Google identity to an existing password account', async () => {
    const existingPasswordAccount = {
      id: 9,
      email: 'customer@example.com',
      googleSubject: null,
      role: UserRole.CUSTOMER,
    } as User;
    const repo = {
      findOneBy: jest
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(existingPasswordAccount),
      save: jest.fn(),
    };
    const service = new UserService(repo as unknown as Repository<User>);

    await expect(
      service.findOrCreateGoogleCustomer(profile),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repo.save).not.toHaveBeenCalled();
  });
});
