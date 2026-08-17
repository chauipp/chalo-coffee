import { ForbiddenException } from '@nestjs/common';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';

describe('MetricsController', () => {
  const metrics = new MetricsService();
  const config = { get: jest.fn().mockReturnValue('metrics-secret') };
  const controller = new MetricsController(metrics, config as never);

  it('từ chối metrics khi thiếu bearer token', () => {
    expect(() => controller.getMetrics(undefined, {} as never)).toThrow(ForbiddenException);
  });

  it('trả Prometheus plaintext cho token đúng', () => {
    metrics.recordHttpRequest('GET', 200, 24);
    const response = { type: jest.fn().mockReturnThis(), send: jest.fn() };
    controller.getMetrics('Bearer metrics-secret', response as never);
    expect(response.type).toHaveBeenCalledWith('text/plain; version=0.0.4; charset=utf-8');
    expect(response.send).toHaveBeenCalledWith(expect.stringContaining('chalo_http_requests_total'));
  });
});
