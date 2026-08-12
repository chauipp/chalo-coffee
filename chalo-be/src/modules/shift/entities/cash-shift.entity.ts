import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export enum CashShiftStatus { OPEN = 'OPEN', CLOSED = 'CLOSED' }

@Entity('cash_shifts')
export class CashShift {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'enum', enum: CashShiftStatus, default: CashShiftStatus.OPEN }) @Index() status: CashShiftStatus;
  @Column({ type: 'int', default: 0 }) openingCash: number;
  @Column({ type: 'int' }) openedByUserId: number;
  @Column({ type: 'timestamptz' }) openedAt: Date;
  @Column({ type: 'int', nullable: true }) countedCash: number | null;
  @Column({ type: 'int', nullable: true }) expectedCash: number | null;
  @Column({ type: 'int', nullable: true }) variance: number | null;
  @Column({ type: 'int', nullable: true }) closedByUserId: number | null;
  @Column({ type: 'timestamptz', nullable: true }) closedAt: Date | null;
  @Column({ type: 'text', nullable: true }) note: string | null;
  @CreateDateColumn() createdAt: Date;
}
