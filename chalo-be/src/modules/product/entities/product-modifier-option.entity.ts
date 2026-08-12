import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ProductModifierGroup } from './product-modifier-group.entity';

@Entity('product_modifier_options')
export class ProductModifierOption {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid' }) groupId: string;
  @Column({ type: 'varchar', length: 80 }) name: string;
  @Column({ type: 'int', default: 0 }) priceAdjustment: number;
  @Column({ type: 'int', default: 0 }) sortOrder: number;
  @ManyToOne(() => ProductModifierGroup, (group) => group.options, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'groupId' }) group: ProductModifierGroup;
}
