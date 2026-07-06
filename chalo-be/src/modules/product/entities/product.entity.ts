import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Category } from '../../category/entities/category.entity';
import { ProductStatus } from '../../../common/enums/product-status.enum';
import { OrderItem } from '../../order/entities/order-item.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  categoryId: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  imageUrl: string | null;

  @Column({ type: 'int' })
  price: number;

  @Column({ type: 'int', default: 5 })
  prepTime: number;

  @Column({
    type: 'enum',
    enum: ProductStatus,
    default: ProductStatus.AVAILABLE,
  })
  status: ProductStatus;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Category, (category) => category.products)
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @OneToMany(() => OrderItem, (item) => item.product)
  orderItems: OrderItem[];
}
