import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { PaymentMethod, PaymentTransaction } from './payment-transaction.entity';

/** Append-only internal accounting record. The actual bank/cash payout is performed by the admin. */
@Entity('refund_transactions')
export class RefundTransaction {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid' }) @Index() paymentTransactionId: string;
  @Column({ type: 'int' }) amount: number;
  @Column({ type: 'enum', enum: PaymentMethod }) method: PaymentMethod;
  @Column({ type: 'varchar', length: 300 }) reason: string;
  @Column({ type: 'int' }) @Index() processedByUserId: number;
  @CreateDateColumn() @Index() createdAt: Date;
  @ManyToOne(() => PaymentTransaction, { onDelete: 'RESTRICT' }) @JoinColumn({ name: 'paymentTransactionId' }) paymentTransaction: PaymentTransaction;
}
