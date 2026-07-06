import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOkResponse } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
} from '@nestjs/terminus';
import { Public } from '../../common/decorators/public.decorator';
import { SkipThrottle } from '@nestjs/throttler';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
  ) {}

  @Get()
  @Public()
  @SkipThrottle()
  @HealthCheck()
  @ApiOkResponse({
    description: 'Health check response',
    schema: { example: { code: 200, message: 'success', data: { status: 'ok', info: { database: { status: 'up' } } } } },
  })
  check() {
    return this.health.check([
      () => this.db.pingCheck('database', { timeout: 1500 }),
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),
    ]);
  }
}
