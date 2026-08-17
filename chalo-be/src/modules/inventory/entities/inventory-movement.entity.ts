import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export enum InventoryMovementType {
  OPENING = 'OPENING',
  RECEIPT = 'RECEIPT',
  ADJUSTMENT = 'ADJUSTMENT',
  SALE = 'SALE',
  CANCELLATION = 'CANCELLATION',
}

const decimalTransformer = {
  to: (value: number) => value,
  from: (value: string | number) => Number(value),
};

@Entity('inventory_movements')
export class InventoryMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  ingredientId: string;

  @Column({ type: 'enum', enum: InventoryMovementType, enumName: 'inventory_movement_type_enum' })
  type: InventoryMovementType;

  @Column({ type: 'numeric', precision: 12, scale: 3, transformer: decimalTransformer })
  delta: number;

  @Column({ type: 'numeric', precision: 12, scale: 3, transformer: decimalTransformer })
  onHandAfter: number;

  @Column({ type: 'varchar', length: 300, nullable: true })
  reason: string | null;

  @Index()
  @Column({ type: 'int', nullable: true })
  actorId: number | null;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  orderId: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
