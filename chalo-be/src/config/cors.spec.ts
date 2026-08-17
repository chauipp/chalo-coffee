import { buildCorsOriginPolicy } from './cors';

describe('buildCorsOriginPolicy', () => {
  const policy = buildCorsOriginPolicy('https://chalocoffee.com, https://staff.chalocoffee.com');

  it('chỉ chấp nhận các origin được khai báo', (done) => {
    policy('https://chalocoffee.com', (error, allowed) => {
      expect(error).toBeNull();
      expect(allowed).toBe(true);
      done();
    });
  });

  it('từ chối origin lạ', (done) => {
    policy('https://evil.example', (error, allowed) => {
      expect(error).toBeInstanceOf(Error);
      expect(allowed).toBe(false);
      done();
    });
  });

  it('cho phép request không có Origin để health check/server-to-server không hỏng', (done) => {
    policy(undefined, (error, allowed) => {
      expect(error).toBeNull();
      expect(allowed).toBe(true);
      done();
    });
  });
});
