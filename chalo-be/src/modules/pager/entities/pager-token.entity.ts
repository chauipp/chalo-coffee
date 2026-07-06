import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { PagerStatus } from '../../../common/enums/pager-status.enum';
import { Order } from '../../order/entities/order.entity';

@Entity('pager_tokens')
export class PagerToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Số in trên thẻ bàn (vd 12). Unique giữa các thẻ chưa COMPLETED
  // — ràng buộc bằng partial unique index trong migration.
  @Index()
  @Column({ type: 'int' })
  number: number;

  @Column({
    type: 'enum',
    enum: PagerStatus,
    default: PagerStatus.ASSIGNED,
  })
  status: PagerStatus;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  orderId: string | null;

  @ManyToOne(() => Order, { eager: false, nullable: true })
  @JoinColumn({ name: 'orderId' })
  order: Order | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
