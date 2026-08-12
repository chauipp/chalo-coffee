import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Order } from '../../order/entities/order.entity';
import { User } from '../../user/entities/user.entity';

export enum LoyaltyPointTransactionType {
  EARN = 'EARN',
}

@Entity('loyalty_point_transactions')
@Index(['customerId', 'createdAt'])
export class LoyaltyPointTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'int' })
  customerId: number;

  @Index({ unique: true })
  @Column({ type: 'uuid' })
  orderId: string;

  @Column({ type: 'int' })
  points: number;

  @Column({
    type: 'enum',
    enum: LoyaltyPointTransactionType,
    default: LoyaltyPointTransactionType.EARN,
  })
  type: LoyaltyPointTransactionType;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'customerId' })
  customer: User;

  @ManyToOne(() => Order, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'orderId' })
  order: Order;
}
