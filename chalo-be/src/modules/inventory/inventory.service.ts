import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ingredient } from './entities/ingredient.entity';
import { InventoryMovement, InventoryMovementType } from './entities/inventory-movement.entity';
import { ProductRecipe } from './entities/product-recipe.entity';
import { AdjustIngredientDto, CreateIngredientDto, ReceiveIngredientDto, UpdateIngredientDto } from './dto/ingredient.dto';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Ingredient) private readonly ingredientRepo: Repository<Ingredient>,
    @InjectRepository(InventoryMovement) private readonly movementRepo: Repository<InventoryMovement>,
    @InjectRepository(ProductRecipe) private readonly recipeRepo: Repository<ProductRecipe>,
  ) {}

  private ingredientDto(row: Ingredient) {
    return {
      id: row.id, name: row.name, unit: row.unit, onHand: Number(row.onHand),
      reorderLevel: Number(row.reorderLevel), isActive: row.isActive,
      isLow: row.isActive && Number(row.onHand) <= Number(row.reorderLevel),
      createdAt: row.createdAt, updatedAt: row.updatedAt,
    };
  }

  async listIngredients() {
    const rows = await this.ingredientRepo.find({ order: { name: 'ASC' } });
    return rows.map((row) => this.ingredientDto(row));
  }

  async createIngredient(dto: CreateIngredientDto, actorId: number) {
    const ingredient = await this.ingredientRepo.save(this.ingredientRepo.create({
      name: dto.name.trim(), unit: dto.unit.trim(), onHand: dto.openingQuantity,
      reorderLevel: dto.reorderLevel, isActive: true,
    }));
    const movement = this.movementRepo.create({
      ingredientId: ingredient.id, type: InventoryMovementType.OPENING,
      delta: dto.openingQuantity, onHandAfter: dto.openingQuantity,
      reason: 'Tồn đầu kỳ', actorId, orderId: null,
    });
    await this.movementRepo.save(movement);
    return this.ingredientDto(ingredient);
  }

  async updateIngredient(id: string, dto: UpdateIngredientDto) {
    const ingredient = await this.ingredientRepo.findOneBy({ id });
    if (!ingredient) throw new NotFoundException('Nguyên liệu không tồn tại');
    if (dto.name !== undefined) ingredient.name = dto.name.trim();
    if (dto.unit !== undefined) ingredient.unit = dto.unit.trim();
    if (dto.reorderLevel !== undefined) ingredient.reorderLevel = dto.reorderLevel;
    if (dto.isActive !== undefined) ingredient.isActive = dto.isActive;
    return this.ingredientDto(await this.ingredientRepo.save(ingredient));
  }

  async adjustIngredient(id: string, dto: AdjustIngredientDto, actorId: number) {
    if (dto.delta === 0) throw new BadRequestException('Lượng điều chỉnh phải khác 0');
    const ingredient = await this.ingredientRepo.findOneBy({ id });
    if (!ingredient) throw new NotFoundException('Nguyên liệu không tồn tại');
    const nextOnHand = Number(ingredient.onHand) + dto.delta;
    if (nextOnHand < 0) throw new BadRequestException('Điều chỉnh làm tồn kho âm');
    ingredient.onHand = nextOnHand;
    const saved = await this.ingredientRepo.save(ingredient);
    await this.movementRepo.save(this.movementRepo.create({
      ingredientId: id, type: InventoryMovementType.ADJUSTMENT, delta: dto.delta,
      onHandAfter: nextOnHand, reason: dto.reason.trim(), actorId, orderId: null,
    }));
    return this.ingredientDto(saved);
  }

  async receiveIngredient(id: string, dto: ReceiveIngredientDto, actorId: number) {
    const ingredient = await this.ingredientRepo.findOneBy({ id });
    if (!ingredient) throw new NotFoundException('Nguyên liệu không tồn tại');
    const nextOnHand = Number(ingredient.onHand) + dto.quantity;
    ingredient.onHand = nextOnHand;
    const saved = await this.ingredientRepo.save(ingredient);
    await this.movementRepo.save(this.movementRepo.create({
      ingredientId: id, type: InventoryMovementType.RECEIPT, delta: dto.quantity,
      onHandAfter: nextOnHand, reason: dto.reason.trim(), actorId, orderId: null,
    }));
    return this.ingredientDto(saved);
  }

  async movementHistory(ingredientId: string) {
    const ingredient = await this.ingredientRepo.findOneBy({ id: ingredientId });
    if (!ingredient) throw new NotFoundException('Nguyên liệu không tồn tại');
    return this.movementRepo.find({ where: { ingredientId }, order: { createdAt: 'DESC' }, take: 200 });
  }

  async lowStock() {
    const rows = await this.ingredientRepo.find({ where: { isActive: true }, order: { name: 'ASC' } });
    return rows.filter((row) => Number(row.onHand) <= Number(row.reorderLevel)).map((row) => this.ingredientDto(row));
  }
}
