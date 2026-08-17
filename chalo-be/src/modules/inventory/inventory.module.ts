import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ingredient } from './entities/ingredient.entity';
import { InventoryMovement } from './entities/inventory-movement.entity';
import { ProductRecipe } from './entities/product-recipe.entity';
import { Product } from '../product/entities/product.entity';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';

@Module({
  imports: [TypeOrmModule.forFeature([Ingredient, InventoryMovement, ProductRecipe, Product])],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService, TypeOrmModule],
})
export class InventoryModule {}
