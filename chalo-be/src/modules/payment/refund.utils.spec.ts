import { calculateRefundableAmount, validateRefundAmount } from './refund.utils';

describe('refund financial invariants', () => {
  it('never allows refunds larger than the original collection minus prior refunds', () => {
    expect(calculateRefundableAmount(100_000, [25_000, 20_000])).toBe(55_000);
    expect(() => validateRefundAmount(55_001, 55_000)).toThrow('vượt số tiền còn có thể hoàn');
    expect(validateRefundAmount(55_000, 55_000)).toBe(55_000);
  });

  it('only permits positive whole-VND refunds', () => {
    expect(() => validateRefundAmount(0, 1)).toThrow('lớn hơn 0');
    expect(() => validateRefundAmount(1.5, 2)).toThrow('số nguyên');
  });
});
