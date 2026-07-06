import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { OrderStatus } from '../../../common/enums/order-status.enum';
import { Table } from '../../table/entities/table.entity';
import { OrderItem } from './order-item.entity';
import { PagerToken } from '../../pager/entities/pager-token.entity';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  tableId: string;

  @Index()
  @Column({ type: 'varchar', length: 255 })
  tableToken: string;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Column({ type: 'boolean', default: false })
  paidStatus: boolean;

  @Column({ type: 'int' })
  totalAmount: number;

  @Column({ type: 'int', nullable: true })
  estimatedWaitMinutes: number | null;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @Column({ type: 'boolean', default: false })
  paymentRequested: boolean;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  pagerId: string | null;

  @ManyToOne(() => PagerToken, { eager: false, nullable: true })
  @JoinColumn({ name: 'pagerId' })
  pager: PagerToken | null;

  @Index()
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Table, { eager: false })
  @JoinColumn({ name: 'tableId' })
  table: Table;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];
}
