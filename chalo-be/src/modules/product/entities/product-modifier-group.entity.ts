import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Product } from './product.entity';
import { ProductModifierOption } from './product-modifier-option.entity';

export enum ModifierSelectionType {
  SINGLE = 'SINGLE',
  MULTIPLE = 'MULTIPLE',
}

@Entity('product_modifier_groups')
export class ProductModifierGroup {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid' }) productId: string;
  @Column({ type: 'varchar', length: 80 }) name: string;
  @Column({ type: 'enum', enum: ModifierSelectionType, default: ModifierSelectionType.SINGLE }) selectionType: ModifierSelectionType;
  @Column({ type: 'boolean', default: false }) isRequired: boolean;
  @Column({ type: 'int', default: 0 }) sortOrder: number;
  @CreateDateColumn() createdAt: Date;
  @ManyToOne(() => Product, (product) => product.modifierGroups, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' }) product: Product;
  @OneToMany(() => ProductModifierOption, (option) => option.group, { cascade: true }) options: ProductModifierOption[];
}
