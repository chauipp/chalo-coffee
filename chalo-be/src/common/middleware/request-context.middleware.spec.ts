import { RequestContextMiddleware } from './request-context.middleware';

describe('RequestContextMiddleware', () => {
  const middleware = new RequestContextMiddleware();

  it('giữ request id hợp lệ và trả lại trong response', () => {
    const req = { header: jest.fn().mockReturnValue('request_12345678') } as never;
    const res = { setHeader: jest.fn() } as never;
    middleware.use(req, res, jest.fn());
    expect(req.requestId).toBe('request_12345678');
    expect(res.setHeader).toHaveBeenCalledWith('x-request-id', 'request_12345678');
  });

  it('tạo id mới thay cho header không an toàn', () => {
    const req = { header: jest.fn().mockReturnValue('bad value') } as never;
    const res = { setHeader: jest.fn() } as never;
    middleware.use(req, res, jest.fn());
    expect(req.requestId).toMatch(/^[a-f0-9-]{36}$/);
  });
});
