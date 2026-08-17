import { Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { PaymentAllocation } from './payment-allocation.entity';
import { RefundTransaction } from './refund-transaction.entity';

export enum PaymentMethod {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  LEGACY = 'LEGACY',
}

export enum PaymentSource {
  STAFF = 'STAFF',
  SEPAY = 'SEPAY',
  CUSTOMER_CONFIRMATION = 'CUSTOMER_CONFIRMATION',
  LEGACY = 'LEGACY',
}

@Entity('payment_transactions')
export class PaymentTransaction {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid' }) @Index() tableId: string;
  @Column({ type: 'enum', enum: PaymentMethod }) method: PaymentMethod;
  @Column({ type: 'enum', enum: PaymentSource }) source: PaymentSource;
  @Column({ type: 'int' }) totalAmount: number;
  @Column({ type: 'int', nullable: true }) receivedAmount: number | null;
  @Column({ type: 'int', nullable: true }) changeAmount: number | null;
  @Column({ type: 'int', nullable: true }) @Index() collectedByUserId: number | null;
  @Column({ type: 'uuid', nullable: true }) @Index() cashShiftId: string | null;
  @Column({ type: 'timestamptz' }) @Index() paidAt: Date;
  @CreateDateColumn() createdAt: Date;
  @OneToMany(() => PaymentAllocation, (allocation) => allocation.paymentTransaction) allocations: PaymentAllocation[];
  @OneToMany(() => RefundTransaction, (refund) => refund.paymentTransaction) refunds: RefundTransaction[];
}
