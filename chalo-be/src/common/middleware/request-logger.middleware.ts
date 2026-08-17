import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { redactRequestUrl } from '../logging/redact-request-url';
import { MetricsService } from '../../modules/health/metrics.service';
import type { RequestWithContext } from './request-context.middleware';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');
  constructor(private readonly metrics: MetricsService) {}

  use(req: RequestWithContext, res: Response, next: NextFunction) {
    const start = Date.now();
    const { method, originalUrl, ip } = req;

    res.on('finish', () => {
      const duration = Date.now() - start;
      const { statusCode } = res;
      const len = res.get('content-length') ?? '-';
      const userAgent = req.get('user-agent') ?? '-';
      this.metrics.recordHttpRequest(method, statusCode, duration);

      const log = `[requestId=${req.requestId ?? '-'}] ${method} ${redactRequestUrl(originalUrl)} ${statusCode} ${len}b ${duration}ms - ${ip} "${userAgent}"`;

      if (statusCode >= 500) this.logger.error(log);
      else if (statusCode >= 400) this.logger.warn(log);
      else this.logger.log(log);
    });

    next();
  }
}
