import { redactRequestUrl } from './redact-request-url';

describe('redactRequestUrl', () => {
  it('keeps safe query values while hiding credentials', () => {
    expect(redactRequestUrl('/api/order/events?token=jwt-value&page=2&apiKey=secret')).toBe(
      '/api/order/events?token=%5BREDACTED%5D&page=2&apiKey=%5BREDACTED%5D',
    );
  });

  it('matches sensitive parameter names case-insensitively', () => {
    expect(redactRequestUrl('/api/auth?RefreshToken=x&clientSecret=y&password=z')).toBe(
      '/api/auth?RefreshToken=%5BREDACTED%5D&clientSecret=%5BREDACTED%5D&password=%5BREDACTED%5D',
    );
  });
});
