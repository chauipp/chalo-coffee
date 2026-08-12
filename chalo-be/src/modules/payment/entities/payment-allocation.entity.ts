import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Order } from '../../order/entities/order.entity';
import { PaymentTransaction } from './payment-transaction.entity';

@Entity('payment_allocations')
export class PaymentAllocation {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid' }) @Index({ unique: true }) orderId: string;
  @Column({ type: 'uuid' }) @Index() paymentTransactionId: string;
  @Column({ type: 'int' }) amount: number;
  @ManyToOne(() => Order, { onDelete: 'RESTRICT' }) @JoinColumn({ name: 'orderId' }) order: Order;
  @ManyToOne(() => PaymentTransaction, (transaction) => transaction.allocations, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'paymentTransactionId' }) paymentTransaction: PaymentTransaction;
}
