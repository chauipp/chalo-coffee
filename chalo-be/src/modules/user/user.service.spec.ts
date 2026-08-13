import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { UserRole } from '../../common/enums/user-role.enum';

describe('UserService.update', () => {
  const staffUpdate = {
    id: 2,
    fullName: 'Nhân Viên Mới',
    avatar: null,
    role: UserRole.MODERATOR,
    isActive: true,
  };

  it('refuses to touch a customer account from the staff admin screen', async () => {
    const customer = {
      id: 3,
      username: 'google_chaupt_06cc6028',
      fullName: 'Phạm Thái Châu',
      googleSubject: 'google-subject-123',
      role: UserRole.CUSTOMER,
      isActive: true,
    } as User;
    const repo = {
      findOneBy: jest.fn().mockResolvedValue(customer),
      save: jest.fn(),
    };
    const service = new UserService(repo as unknown as Repository<User>);

    await expect(
      service.update({ ...staffUpdate, id: 3 }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('refuses to demote a staff account into a customer', async () => {
    const staff = {
      id: 2,
      username: 'staff',
      role: UserRole.MODERATOR,
      isActive: true,
    } as User;
    const repo = {
      findOneBy: jest.fn().mockResolvedValue(staff),
      save: jest.fn(),
    };
    const service = new UserService(repo as unknown as Repository<User>);

    await expect(
      service.update({ ...staffUpdate, role: UserRole.CUSTOMER }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('still updates a regular staff account', async () => {
    const staff = {
      id: 2,
      username: 'staff',
      fullName: 'Staff',
      avatar: null,
      role: UserRole.MODERATOR,
      isActive: true,
    } as User;
    const repo = {
      findOneBy: jest.fn().mockResolvedValue(staff),
      save: jest.fn(async (input: User) => input),
    };
    const service = new UserService(repo as unknown as Repository<User>);

    const updated = await service.update({
      ...staffUpdate,
      role: UserRole.ADMIN,
    });

    expect(updated).toMatchObject({ id: 2, role: UserRole.ADMIN });
  });
});

describe('UserService.page', () => {
  const buildRepo = () => {
    const calls: Array<{ clause: string; params?: Record<string, unknown> }> =
      [];
    const qb = {
      andWhere: jest.fn((clause: string, params?: Record<string, unknown>) => {
        calls.push({ clause, params });
        return qb;
      }),
      orderBy: jest.fn(() => qb),
      skip: jest.fn(() => qb),
      take: jest.fn(() => qb),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    };
    const repo = { createQueryBuilder: jest.fn(() => qb) };
    return { repo, calls };
  };

  it('hides customer accounts from the staff listing by default', async () => {
    const { repo, calls } = buildRepo();
    const service = new UserService(repo as unknown as Repository<User>);

    await service.page({});

    const roleFilter = calls.find((call) => call.clause.includes('u.role'));
    expect(roleFilter).toBeDefined();
    expect(roleFilter?.params).toMatchObject({
      roles: [UserRole.ADMIN, UserRole.MODERATOR],
    });
  });

  it('still honours an explicit role filter', async () => {
    const { repo, calls } = buildRepo();
    const service = new UserService(repo as unknown as Repository<User>);

    await service.page({ role: UserRole.CUSTOMER });

    const roleFilter = calls.find((call) => call.clause.includes('u.role'));
    expect(roleFilter?.params).toMatchObject({ role: UserRole.CUSTOMER });
  });
});
