import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

const decimalTransformer = {
  to: (value: number) => value,
  from: (value: string | number) => Number(value),
};

@Entity('product_recipes')
@Index(['productId', 'ingredientId'], { unique: true })
export class ProductRecipe {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  productId: string;

  @Index()
  @Column({ type: 'uuid' })
  ingredientId: string;

  @Column({ type: 'numeric', precision: 12, scale: 3, transformer: decimalTransformer })
  quantity: number;
}
