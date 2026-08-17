import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export enum AuditAction {
  REFUND_CREATED = 'REFUND_CREATED',
  INVENTORY_RECEIVED = 'INVENTORY_RECEIVED',
  INVENTORY_ADJUSTED = 'INVENTORY_ADJUSTED',
  PRODUCT_RECIPE_UPDATED = 'PRODUCT_RECIPE_UPDATED',
  SETTINGS_UPDATED = 'SETTINGS_UPDATED',
}

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'int', nullable: true }) @Index() actorUserId: number | null;
  @Column({ type: 'varchar', length: 64 }) @Index() action: AuditAction;
  @Column({ type: 'varchar', length: 64 }) @Index() entityType: string;
  @Column({ type: 'varchar', length: 64, nullable: true }) @Index() entityId: string | null;
  @Column({ type: 'jsonb', nullable: true }) metadata: Record<string, unknown> | null;
  @CreateDateColumn() @Index() createdAt: Date;
}
