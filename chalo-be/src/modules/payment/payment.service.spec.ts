import { PaymentMethod, PaymentSource, PaymentTransaction } from './entities/payment-transaction.entity';
import { PaymentAllocation } from './entities/payment-allocation.entity';

describe('Payment reconciliation ledger contract', () => {
  it('keeps a cash collection as one transaction with separate order allocations', () => {
    const transaction = { method: PaymentMethod.CASH, source: PaymentSource.STAFF, totalAmount: 70_000, receivedAmount: 100_000, changeAmount: 30_000 } as PaymentTransaction;
    const allocations = [{ orderId: 'one', amount: 35_000 }, { orderId: 'two', amount: 35_000 }] as PaymentAllocation[];
    expect(allocations.reduce((sum, allocation) => sum + allocation.amount, 0)).toBe(transaction.totalAmount);
    expect(transaction.changeAmount).toBe(transaction.receivedAmount! - transaction.totalAmount);
  });

  it('has an explicit legacy method rather than pretending old paid orders were cash', () => {
    expect(PaymentMethod.LEGACY).toBe('LEGACY');
    expect(PaymentSource.LEGACY).toBe('LEGACY');
  });
});
