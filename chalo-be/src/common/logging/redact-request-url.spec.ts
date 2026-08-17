import { redactRequestUrl } from './redact-request-url';

describe('redactRequestUrl', () => {
  it('giữ path và query an toàn nhưng che credential', () => {
    expect(
      redactRequestUrl('/api/order/events?token=jwt-value&page=2&clientSecret=secret'),
    ).toBe('/api/order/events?token=%5BREDACTED%5D&page=2&clientSecret=%5BREDACTED%5D');
  });

  it('che key theo không phân biệt hoa thường', () => {
    expect(redactRequestUrl('/api/auth?RefreshToken=x&apiKey=y')).toBe(
      '/api/auth?RefreshToken=%5BREDACTED%5D&apiKey=%5BREDACTED%5D',
    );
  });
});
