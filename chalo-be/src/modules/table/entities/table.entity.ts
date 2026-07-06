import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { TableStatus } from '../../../common/enums/table-status.enum';
import { Order } from '../../order/entities/order.entity';

@Entity('tables')
export class Table {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  name: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  area: string | null;

  @Column({
    type: 'enum',
    enum: TableStatus,
    default: TableStatus.AVAILABLE,
  })
  status: TableStatus;

  @Column({ type: 'varchar', length: 255, unique: true })
  qrToken: string;

  // currentOrderId đã bị xóa — thay bằng relation @OneToMany
  @OneToMany(() => Order, (order) => order.table)
  orders: Order[];

  @CreateDateColumn()
  createdAt: Date;
}