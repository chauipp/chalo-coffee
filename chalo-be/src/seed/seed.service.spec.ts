import { DataSource, Repository } from 'typeorm';
import { SeedService } from './seed.service';

function makeService() {
  const repo = () => ({}) as unknown as Repository<any>;
  const dataSource = { query: jest.fn() } as unknown as DataSource;
  const service = new SeedService(
    repo(), repo(), repo(), repo(), repo(), repo(),
    dataSource,
  );
  // Stub every private step so a "true" run performs no real DB work.
  const reset = jest
    .spyOn(service as any, 'resetAllData')
    .mockResolvedValue(undefined);
  jest.spyOn(service as any, 'seedUsers').mockResolvedValue(undefined);
  jest.spyOn(service as any, 'seedCategoriesFromMenu').mockResolvedValue([]);
  jest.spyOn(service as any, 'seedProductsFromMenu').mockResolvedValue([]);
  jest.spyOn(service as any, 'seedTables').mockResolvedValue([]);
  jest.spyOn(service as any, 'seedOrders').mockResolvedValue(undefined);
  jest.spyOn(service as any, 'syncTableCurrentOrders').mockResolvedValue(undefined);
  return { service, reset };
}

describe('SeedService.onModuleInit — destructive-seed gate', () => {
  const original = process.env.SEED_ON_STARTUP;
  afterEach(() => {
    process.env.SEED_ON_STARTUP = original;
    jest.restoreAllMocks();
  });

  it('does NOT reset data when SEED_ON_STARTUP is unset', async () => {
    delete process.env.SEED_ON_STARTUP;
    const { service, reset } = makeService();
    await service.onModuleInit();
    expect(reset).not.toHaveBeenCalled();
  });

  it('does NOT reset data when SEED_ON_STARTUP is "false"', async () => {
    process.env.SEED_ON_STARTUP = 'false';
    const { service, reset } = makeService();
    await service.onModuleInit();
    expect(reset).not.toHaveBeenCalled();
  });

  it('resets data only when SEED_ON_STARTUP is exactly "true"', async () => {
    process.env.SEED_ON_STARTUP = 'true';
    const { service, reset } = makeService();
    await service.onModuleInit();
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
