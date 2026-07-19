import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum CheckoutSessionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity('checkout_sessions')
export class CheckoutSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 255 })
  tableToken: string;

  @Column({ type: 'uuid' })
  tableId: string;

  @Column({ type: 'json' })
  orderIds: string[];

  @Column({ type: 'int' })
  totalAmount: number;

  @Column({
    type: 'enum',
    enum: CheckoutSessionStatus,
    default: CheckoutSessionStatus.PENDING,
  })
  status: CheckoutSessionStatus;

  @Column({ type: 'varchar', length: 64 })
  clientSecret: string;

  /** Nội dung CK duy nhất trong VietQR (VD "CK7F3K2M") — webhook SePay khớp phiên theo mã này */
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 16, nullable: true })
  payCode: string | null;

  @Index()
  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
