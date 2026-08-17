import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { NextFunction, Request, Response } from 'express';

export type RequestWithContext = Request & { requestId?: string };

const safeRequestId = (value: string | undefined): string | undefined =>
  value && /^[a-zA-Z0-9_-]{8,128}$/.test(value) ? value : undefined;

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: RequestWithContext, res: Response, next: NextFunction): void {
    const requestId = safeRequestId(req.header('x-request-id')) ?? randomUUID();
    req.requestId = requestId;
    res.setHeader('x-request-id', requestId);
    next();
  }
}
