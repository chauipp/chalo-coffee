import { CallHandler, ExecutionContext } from '@nestjs/common';
import { SSE_METADATA } from '@nestjs/common/constants';
import { lastValueFrom, of } from 'rxjs';
import { toArray } from 'rxjs/operators';
import { ResponseInterceptor } from './response.interceptor';

/** Dựng ExecutionContext tối thiểu: chỉ những gì interceptor chạm tới */
function mockContext(
  handler: (...args: unknown[]) => unknown,
  statusCode = 200,
): ExecutionContext {
  return {
    switchToHttp: () => ({ getResponse: () => ({ statusCode }) }),
    getHandler: () => handler,
  } as unknown as ExecutionContext;
}

function callHandler(...items: unknown[]): CallHandler {
  return { handle: () => of(...items) };
}

describe('ResponseInterceptor', () => {
  const interceptor = new ResponseInterceptor();

  it('bọc response HTTP thường thành {code,message,data}', async () => {
    const ctx = mockContext(function normalHandler() {}, 201);
    const out = await lastValueFrom(
      interceptor.intercept(ctx, callHandler({ hello: 'world' })).pipe(toArray()),
    );
    expect(out).toEqual([
      { code: 201, message: 'success', data: { hello: 'world' } },
    ]);
  });

  it('data undefined → data: null (giữ hành vi cũ)', async () => {
    const ctx = mockContext(function normalHandler() {}, 200);
    const out = await lastValueFrom(
      interceptor.intercept(ctx, callHandler(undefined)).pipe(toArray()),
    );
    expect(out).toEqual([{ code: 200, message: 'success', data: null }]);
  });

  it('KHÔNG bọc item của route @Sse() — giữ nguyên {type,data} để SseStream ghi dòng event:', async () => {
    // Giả lập handler được @Sse() gắn metadata (NestJS đặt SSE_METADATA = true)
    const sseHandler = function eventsByTable() {};
    Reflect.defineMetadata(SSE_METADATA, true, sseHandler);

    const messages = [
      { type: 'payment_completed', data: { sessionId: 's1' } },
      { type: 'new_order', data: { id: 'o1' } },
    ];
    const ctx = mockContext(sseHandler);
    const out = await lastValueFrom(
      interceptor.intercept(ctx, callHandler(...messages)).pipe(toArray()),
    );

    // Nguyên vẹn: field `type` vẫn ở top-level → SseStream còn ghi được `event: <type>`
    expect(out).toEqual(messages);
  });
});
