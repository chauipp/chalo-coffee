import { buildCorsOriginPolicy, parseAllowedOrigins } from './cors';

describe('CORS origin policy', () => {
  const policy = buildCorsOriginPolicy('https://chalocoffee.com/, https://staff.chalocoffee.com');

  it('normalizes configured origins and allows configured browser origins', (done) => {
    expect(parseAllowedOrigins('https://chalocoffee.com/')).toEqual(
      new Set(['https://chalocoffee.com']),
    );

    policy('https://chalocoffee.com', (error, allowed) => {
      expect(error).toBeNull();
      expect(allowed).toBe(true);
      done();
    });
  });

  it('rejects unconfigured browser origins', (done) => {
    policy('https://evil.example', (error, allowed) => {
      expect(error).toBeInstanceOf(Error);
      expect(allowed).toBe(false);
      done();
    });
  });

  it('allows requests without Origin for server-to-server and health checks', (done) => {
    policy(undefined, (error, allowed) => {
      expect(error).toBeNull();
      expect(allowed).toBe(true);
      done();
    });
  });
});
