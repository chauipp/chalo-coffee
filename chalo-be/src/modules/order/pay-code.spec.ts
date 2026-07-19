import { generatePayCode, PAY_CODE_REGEX } from './pay-code';

describe('generatePayCode', () => {
  it('sinh mã CK + 6 ký tự không nhầm lẫn (không 0/O/1/I/L)', () => {
    for (let i = 0; i < 200; i++) {
      const code = generatePayCode();
      expect(code).toHaveLength(8);
      expect(code).toMatch(/^CK[A-HJKMNP-Z2-9]{6}$/);
    }
  });

  it('PAY_CODE_REGEX bắt được mã nằm giữa nội dung CK ngân hàng thêm rác', () => {
    expect('MBVCB.123 CK7F3K2M GD 999'.match(PAY_CODE_REGEX)?.[0]).toBe('CK7F3K2M');
    expect('KHONG CO MA NAO O DAY'.match(PAY_CODE_REGEX)).toBeNull();
  });
});
