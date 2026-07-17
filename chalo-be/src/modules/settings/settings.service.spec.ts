import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SettingsService } from './settings.service';
import { AppSettings } from './entities/app-settings.entity';

describe('SettingsService', () => {
  let service: SettingsService;
  let repo: {
    findOneBy: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };

  const defaultRow: AppSettings = {
    id: 1,
    waitTimeEnabled: true,
    baristaCount: 3,
    bankBin: null,
    bankAccountNo: null,
    bankAccountName: null,
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(async () => {
    repo = {
      findOneBy: jest.fn(),
      create: jest.fn((v) => v),
      save: jest.fn((v) => Promise.resolve(v)),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        SettingsService,
        { provide: getRepositoryToken(AppSettings), useValue: repo },
      ],
    }).compile();
    service = moduleRef.get(SettingsService);
  });

  it('get() returns the existing singleton row', async () => {
    repo.findOneBy.mockResolvedValue(defaultRow);
    await expect(service.get()).resolves.toEqual(defaultRow);
    expect(repo.findOneBy).toHaveBeenCalledWith({ id: 1 });
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('get() self-heals by creating the default row when missing', async () => {
    repo.findOneBy.mockResolvedValue(null);
    const result = await service.get();
    expect(repo.create).toHaveBeenCalledWith({ id: 1, waitTimeEnabled: true, baristaCount: 3 });
    expect(repo.save).toHaveBeenCalled();
    expect(result).toMatchObject({ id: 1, waitTimeEnabled: true, baristaCount: 3 });
  });

  it('update() applies only provided fields', async () => {
    repo.findOneBy.mockResolvedValue({ ...defaultRow });
    const result = await service.update({ waitTimeEnabled: false });
    expect(result.waitTimeEnabled).toBe(false);
    expect(result.baristaCount).toBe(3); // untouched
    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1, waitTimeEnabled: false, baristaCount: 3 }),
    );
  });

  it('update() can change baristaCount alone', async () => {
    repo.findOneBy.mockResolvedValue({ ...defaultRow });
    const result = await service.update({ baristaCount: 5 });
    expect(result.baristaCount).toBe(5);
    expect(result.waitTimeEnabled).toBe(true);
  });
});
