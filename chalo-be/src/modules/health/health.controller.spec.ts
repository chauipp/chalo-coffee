import { HealthController } from './health.controller';

describe('HealthController', () => {
  const health = { check: jest.fn() };
  const db = { pingCheck: jest.fn().mockReturnValue('database-check') };
  const memory = { checkHeap: jest.fn().mockReturnValue('memory-check') };
  const controller = new HealthController(health as never, db as never, memory as never);

  beforeEach(() => jest.clearAllMocks());

  it('liveness không phụ thuộc database', () => {
    expect(controller.live()).toEqual({ status: 'ok' });
    expect(health.check).not.toHaveBeenCalled();
  });

  it('readiness kiểm tra database và memory', async () => {
    health.check.mockImplementation(async (checks: Array<() => unknown>) => {
      checks.forEach((check) => check());
      return { status: 'ok' };
    });
    await expect(controller.ready()).resolves.toEqual({ status: 'ok' });
    expect(db.pingCheck).toHaveBeenCalledWith('database', { timeout: 1500 });
    expect(memory.checkHeap).toHaveBeenCalledWith('memory_heap', 300 * 1024 * 1024);
  });
});
