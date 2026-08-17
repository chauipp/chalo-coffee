import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

const decimalTransformer = {
  to: (value: number) => value,
  from: (value: string | number) => Number(value),
};

@Entity('ingredients')
export class Ingredient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 16 })
  unit: string;

  @Column({ type: 'numeric', precision: 12, scale: 3, default: 0, transformer: decimalTransformer })
  onHand: number;

  @Column({ type: 'numeric', precision: 12, scale: 3, default: 0, transformer: decimalTransformer })
  reorderLevel: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
