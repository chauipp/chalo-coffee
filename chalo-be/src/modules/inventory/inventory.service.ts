import { BadRequestException, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
import { Ingredient } from './entities/ingredient.entity';
import { InventoryMovement, InventoryMovementType } from './entities/inventory-movement.entity';
import { ProductRecipe } from './entities/product-recipe.entity';
import { Product } from '../product/entities/product.entity';
import { ProductStatus } from '../../common/enums/product-status.enum';
import { AdjustIngredientDto, CreateIngredientDto, ReceiveIngredientDto, UpdateIngredientDto } from './dto/ingredient.dto';
import { AuditAction } from '../audit/entities/audit-log.entity';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Ingredient) private readonly ingredientRepo: Repository<Ingredient>,
    @InjectRepository(InventoryMovement) private readonly movementRepo: Repository<InventoryMovement>,
    @InjectRepository(ProductRecipe) private readonly recipeRepo: Repository<ProductRecipe>,
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
    @Optional() private readonly auditService?: AuditService,
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
    await this.auditService?.record({ actorUserId: actorId, action: AuditAction.INVENTORY_ADJUSTED, entityType: 'ingredient', entityId: id, metadata: { delta: dto.delta, reason: dto.reason.trim() } });
    await this.syncProductsForIngredient(id);
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
    await this.auditService?.record({ actorUserId: actorId, action: AuditAction.INVENTORY_RECEIVED, entityType: 'ingredient', entityId: id, metadata: { quantity: dto.quantity, reason: dto.reason.trim() } });
    await this.syncProductsForIngredient(id);
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

  async recipeForProduct(productId: string) {
    const lines = await this.recipeRepo.find({ where: { productId }, order: { ingredientId: 'ASC' } });
    const ingredients = lines.length
      ? await this.ingredientRepo.find({ where: { id: In(lines.map((line) => line.ingredientId)) } })
      : [];
    const byId = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]));
    return lines.map((line) => ({
      ingredientId: line.ingredientId, quantity: Number(line.quantity),
      ingredientName: byId.get(line.ingredientId)?.name ?? null,
      unit: byId.get(line.ingredientId)?.unit ?? null,
    }));
  }

  async updateProductRecipe(productId: string, lines: Array<{ ingredientId: string; quantity: number }>, actorId?: number) {
    if (new Set(lines.map((line) => line.ingredientId)).size !== lines.length) {
      throw new BadRequestException('Một nguyên liệu chỉ được có một lần trong công thức');
    }
    const product = await this.productRepo.findOneBy({ id: productId });
    if (!product) throw new NotFoundException('Sản phẩm không tồn tại');
    const ingredients = lines.length
      ? await this.ingredientRepo.find({ where: { id: In(lines.map((line) => line.ingredientId)), isActive: true } })
      : [];
    if (ingredients.length !== lines.length) throw new BadRequestException('Công thức chứa nguyên liệu không tồn tại hoặc đã ngừng dùng');
    await this.recipeRepo.manager.transaction(async (manager) => {
      await manager.delete(ProductRecipe, { productId });
      if (lines.length) await manager.save(ProductRecipe, lines.map((line) => manager.create(ProductRecipe, { productId, ...line })));
      await this.syncProductAvailability(manager, [productId]);
      await this.auditService?.record({ actorUserId: actorId ?? null, action: AuditAction.PRODUCT_RECIPE_UPDATED, entityType: 'product', entityId: productId, metadata: { lineCount: lines.length } }, manager);
    });
    return this.recipeForProduct(productId);
  }

  async syncProductAvailability(manager: EntityManager, productIds: string[]) {
    const ids = [...new Set(productIds)];
    if (!ids.length) return;
    const products = await manager.find(Product, { where: { id: In(ids) } });
    const recipes = await manager.getRepository(ProductRecipe).find({ where: { productId: In(ids) } });
    const ingredientIds = [...new Set(recipes.map((recipe) => recipe.ingredientId))];
    const ingredients = ingredientIds.length ? await manager.find(Ingredient, { where: { id: In(ingredientIds) } }) : [];
    const ingredientById = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]));
    const recipesByProduct = new Map<string, ProductRecipe[]>();
    for (const recipe of recipes) recipesByProduct.set(recipe.productId, [...(recipesByProduct.get(recipe.productId) ?? []), recipe]);
    const changed = products.filter((product) => {
      const productRecipes = recipesByProduct.get(product.id) ?? [];
      const canMakeOne = productRecipes.every((recipe) => {
        const ingredient = ingredientById.get(recipe.ingredientId);
        return !!ingredient?.isActive && Number(ingredient.onHand) >= Number(recipe.quantity);
      });
      if (productRecipes.length && !canMakeOne && product.status === ProductStatus.AVAILABLE) {
        product.status = ProductStatus.OUT_OF_STOCK;
        product.inventoryAutoOutOfStock = true;
        return true;
      }
      if (product.inventoryAutoOutOfStock && canMakeOne) {
        product.status = ProductStatus.AVAILABLE;
        product.inventoryAutoOutOfStock = false;
        return true;
      }
      return false;
    });
    if (changed.length) await manager.save(Product, changed);
  }

  private async syncProductsForIngredient(ingredientId: string) {
    const recipes = await this.recipeRepo.find({ where: { ingredientId } });
    const productIds = recipes.map((recipe) => recipe.productId);
    if (!productIds.length) return;
    await this.recipeRepo.manager.transaction((manager) => this.syncProductAvailability(manager, productIds));
  }

  /** Trừ nguyên liệu của đơn trong transaction caller; thiếu bất kỳ dòng nào thì rollback toàn bộ. */
  async reserveForOrder(
    manager: EntityManager,
    items: Array<{ productId: string; quantity: number }>,
    orderId: string,
  ) {
    const productQuantities = new Map<string, number>();
    for (const item of items) {
      productQuantities.set(item.productId, (productQuantities.get(item.productId) ?? 0) + item.quantity);
    }
    const recipes = await manager.getRepository(ProductRecipe).find({
      where: { productId: In([...productQuantities.keys()]) },
    });
    const required = new Map<string, number>();
    for (const recipe of recipes) {
      const productQuantity = productQuantities.get(recipe.productId) ?? 0;
      required.set(recipe.ingredientId, (required.get(recipe.ingredientId) ?? 0) + Number(recipe.quantity) * productQuantity);
    }
    if (required.size === 0) return [];

    const ingredientIds = [...required.keys()].sort();
    const ingredients = await manager.find(Ingredient, {
      where: { id: In(ingredientIds) },
      lock: { mode: 'pessimistic_write' },
    });
    const ingredientById = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]));
    for (const ingredientId of ingredientIds) {
      const ingredient = ingredientById.get(ingredientId);
      const amount = required.get(ingredientId)!;
      if (!ingredient || !ingredient.isActive || Number(ingredient.onHand) < amount) {
        const name = ingredient?.name ?? 'nguyên liệu không tồn tại';
        throw new BadRequestException(`Không đủ ${name} để tạo đơn`);
      }
    }

    const movements = ingredientIds.map((ingredientId) => {
      const ingredient = ingredientById.get(ingredientId)!;
      const amount = required.get(ingredientId)!;
      ingredient.onHand = Number(ingredient.onHand) - amount;
      return manager.getRepository(InventoryMovement).create({
        ingredientId, type: InventoryMovementType.SALE, delta: -amount,
        onHandAfter: ingredient.onHand, reason: 'Trừ theo đơn hàng', actorId: null, orderId,
      });
    });
    await manager.save(Ingredient, ingredientIds.map((id) => ingredientById.get(id)!));
    await manager.save(InventoryMovement, movements);
    await this.syncProductAvailability(manager, [...productQuantities.keys()]);
    return movements;
  }

  /** Hoàn tồn một lần khi đơn bị hủy; hàng CANCELLATION là idempotency marker. */
  async releaseForCancelledOrder(manager: EntityManager, orderId: string) {
    const movementRepo = manager.getRepository(InventoryMovement);
    const sales = await movementRepo.find({ where: { orderId, type: InventoryMovementType.SALE } });
    if (sales.length === 0) return [];
    const priorReleases = await movementRepo.find({ where: { orderId, type: InventoryMovementType.CANCELLATION } });
    if (priorReleases.length > 0) return [];

    const amounts = new Map<string, number>();
    for (const sale of sales) {
      amounts.set(sale.ingredientId, (amounts.get(sale.ingredientId) ?? 0) + Math.abs(Number(sale.delta)));
    }
    const ingredientIds = [...amounts.keys()].sort();
    const ingredients = await manager.find(Ingredient, {
      where: { id: In(ingredientIds) },
      lock: { mode: 'pessimistic_write' },
    });
    const ingredientById = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]));
    if (ingredientById.size !== ingredientIds.length) {
      throw new NotFoundException('Không tìm thấy nguyên liệu cần hoàn tồn');
    }
    const movements = ingredientIds.map((ingredientId) => {
      const ingredient = ingredientById.get(ingredientId)!;
      const amount = amounts.get(ingredientId)!;
      ingredient.onHand = Number(ingredient.onHand) + amount;
      return movementRepo.create({
        ingredientId, type: InventoryMovementType.CANCELLATION, delta: amount,
        onHandAfter: ingredient.onHand, reason: 'Hoàn tồn do hủy đơn', actorId: null, orderId,
      });
    });
    await manager.save(Ingredient, ingredientIds.map((id) => ingredientById.get(id)!));
    await manager.save(InventoryMovement, movements);
    const recipes = await manager.getRepository(ProductRecipe).find({ where: { ingredientId: In(ingredientIds) } });
    await this.syncProductAvailability(manager, recipes.map((recipe) => recipe.productId));
    return movements;
  }
}
