import { Controller, ForbiddenException, Get, Headers, Res } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { SkipThrottle } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { MetricsService } from './metrics.service';

@ApiTags('Health')
@Controller('metrics')
export class MetricsController {
  constructor(
    private readonly metrics: MetricsService,
    private readonly config: ConfigService,
  ) {}

  @Get()
  @Public()
  @SkipThrottle()
  @ApiExcludeEndpoint()
  getMetrics(@Headers('authorization') authorization: string | undefined, @Res() response: Response): void {
    const token = this.config.get<string>('METRICS_TOKEN');
    if (!token || authorization !== `Bearer ${token}`) {
      throw new ForbiddenException('Metrics token không hợp lệ');
    }
    response.type('text/plain; version=0.0.4; charset=utf-8').send(this.metrics.renderPrometheus());
  }
}
