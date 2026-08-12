import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Table } from '../../table/entities/table.entity';
import { User } from '../../user/entities/user.entity';

export enum CustomerTableSessionStatus {
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
  EXPIRED = 'EXPIRED',
}

@Entity('customer_table_sessions')
@Index(['customerId', 'status', 'businessDate'])
export class CustomerTableSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'int' })
  customerId: number;

  @Index()
  @Column({ type: 'uuid' })
  tableId: string;

  @Column({ type: 'varchar', length: 255 })
  tableToken: string;

  @Column({
    type: 'enum',
    enum: CustomerTableSessionStatus,
    default: CustomerTableSessionStatus.ACTIVE,
  })
  status: CustomerTableSessionStatus;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  startedAt: Date;

  @Column({ type: 'timestamp with time zone' })
  lastActivityAt: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  paidAt: Date | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  endedAt: Date | null;

  @Column({ type: 'date' })
  businessDate: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  endedReason: string | null;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customerId' })
  customer: User;

  @ManyToOne(() => Table, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'tableId' })
  table: Table;
}
