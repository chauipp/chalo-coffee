import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { InventoryService } from './inventory.service';
import { Ingredient } from './entities/ingredient.entity';
import {
  InventoryMovement,
  InventoryMovementType,
} from './entities/inventory-movement.entity';
import { ProductRecipe } from './entities/product-recipe.entity';
import { Product } from '../product/entities/product.entity';
import { BadRequestException } from '@nestjs/common';

describe('InventoryService', () => {
  let service: InventoryService;
  let ingredientRepo: { create: jest.Mock; save: jest.Mock; find: jest.Mock; findOneBy: jest.Mock };
  let movementRepo: { create: jest.Mock; save: jest.Mock; find: jest.Mock };

  beforeEach(async () => {
    ingredientRepo = {
      create: jest.fn((value) => ({ id: 'ingredient-1', ...value })),
      save: jest.fn(async (value) => value),
      find: jest.fn(),
      findOneBy: jest.fn(),
    };
    movementRepo = {
      create: jest.fn((value) => ({ id: 'movement-1', ...value })),
      save: jest.fn(async (value) => value),
      find: jest.fn(),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: getRepositoryToken(Ingredient), useValue: ingredientRepo },
        { provide: getRepositoryToken(InventoryMovement), useValue: movementRepo },
        { provide: getRepositoryToken(ProductRecipe), useValue: { find: jest.fn().mockResolvedValue([]) } },
        { provide: getRepositoryToken(Product), useValue: { findOneBy: jest.fn(), find: jest.fn(), save: jest.fn() } },
      ],
    }).compile();
    service = moduleRef.get(InventoryService);
  });

  it('tạo nguyên liệu ghi một movement OPENING cùng lượng tồn đầu', async () => {
    await service.createIngredient(
      {
        name: 'Hạt cà phê',
        unit: 'g',
        openingQuantity: 2_000,
        reorderLevel: 500,
      },
      1,
    );

    expect(ingredientRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Hạt cà phê', onHand: 2_000 }),
    );
    expect(movementRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        type: InventoryMovementType.OPENING,
        delta: 2_000,
        actorId: 1,
      }),
    );
  });

  it('điều chỉnh chỉ thêm movement, cập nhật tồn theo delta và không sửa history', async () => {
    ingredientRepo.findOneBy.mockResolvedValue({
      id: 'ingredient-1',
      name: 'Sữa tươi',
      unit: 'ml',
      onHand: 1_000,
      reorderLevel: 300,
      isActive: true,
    });

    await service.adjustIngredient(
      'ingredient-1',
      { delta: -125, reason: 'Hỏng trong ca sáng' },
      2,
    );

    expect(ingredientRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'ingredient-1', onHand: 875 }),
    );
    expect(movementRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: InventoryMovementType.ADJUSTMENT,
        delta: -125,
        reason: 'Hỏng trong ca sáng',
        actorId: 2,
      }),
    );
    expect(movementRepo).not.toHaveProperty('update');
  });

  it('nhập kho chỉ nhận lượng dương và ghi movement RECEIPT', async () => {
    ingredientRepo.findOneBy.mockResolvedValue({
      id: 'ingredient-1', name: 'Sữa tươi', unit: 'ml', onHand: 1_000,
      reorderLevel: 300, isActive: true,
    });

    await service.receiveIngredient(
      'ingredient-1',
      { quantity: 500, reason: 'Nhập từ nhà cung cấp' },
      2,
    );

    expect(ingredientRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ onHand: 1_500 }),
    );
    expect(movementRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ type: InventoryMovementType.RECEIPT, delta: 500 }),
    );
  });

  it('reserveForOrder gộp công thức chung và không để tồn âm', async () => {
    const recipeRepo = {
      find: jest.fn().mockResolvedValue([
        { productId: 'espresso', ingredientId: 'coffee', quantity: 18 },
        { productId: 'latte', ingredientId: 'coffee', quantity: 18 },
        { productId: 'latte', ingredientId: 'milk', quantity: 180 },
      ]),
    };
    const movementWriteRepo = { create: jest.fn((row) => row) };
    const manager = {
      getRepository: jest.fn((entity) => entity === ProductRecipe ? recipeRepo : movementWriteRepo),
      find: jest.fn().mockResolvedValue([
        { id: 'coffee', name: 'Hạt cà phê', onHand: 100, isActive: true },
        { id: 'milk', name: 'Sữa tươi', onHand: 200, isActive: true },
      ]),
      save: jest.fn(async (_entity, row) => row),
    };

    await service.reserveForOrder(manager as never, [
      { productId: 'espresso', quantity: 2 },
      { productId: 'latte', quantity: 1 },
    ], 'order-1');

    expect(manager.save).toHaveBeenCalledWith(
      Ingredient,
      expect.arrayContaining([
        expect.objectContaining({ id: 'coffee', onHand: 46 }),
        expect.objectContaining({ id: 'milk', onHand: 20 }),
      ]),
    );
    expect(manager.save).toHaveBeenCalledWith(
      InventoryMovement,
      expect.arrayContaining([
        expect.objectContaining({ ingredientId: 'coffee', type: InventoryMovementType.SALE, delta: -54, orderId: 'order-1' }),
      ]),
    );
  });

  it('reserveForOrder từ chối toàn bộ đơn khi một nguyên liệu thiếu', async () => {
    const recipeRepo = { find: jest.fn().mockResolvedValue([{ productId: 'latte', ingredientId: 'milk', quantity: 180 }]) };
    const manager = {
      getRepository: jest.fn(() => recipeRepo),
      find: jest.fn().mockResolvedValue([{ id: 'milk', name: 'Sữa tươi', onHand: 100, isActive: true }]),
      save: jest.fn(),
    };

    await expect(service.reserveForOrder(manager as never, [{ productId: 'latte', quantity: 1 }], 'order-1'))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(manager.save).not.toHaveBeenCalled();
  });

  it('releaseForCancelledOrder hoàn tồn đúng một lần từ các SALE movement', async () => {
    const movementWriteRepo = {
      find: jest
        .fn()
        .mockResolvedValueOnce([{ ingredientId: 'milk', delta: -180 }])
        .mockResolvedValueOnce([]),
      create: jest.fn((row) => row),
    };
    const manager = {
      getRepository: jest.fn((entity) =>
        entity === InventoryMovement
          ? movementWriteRepo
          : { find: jest.fn().mockResolvedValue([]) },
      ),
      find: jest.fn().mockResolvedValue([{ id: 'milk', name: 'Sữa tươi', onHand: 20, isActive: true }]),
      save: jest.fn(async (_entity, row) => row),
    };

    await service.releaseForCancelledOrder(manager as never, 'order-1');

    expect(manager.save).toHaveBeenCalledWith(
      Ingredient,
      [expect.objectContaining({ id: 'milk', onHand: 200 })],
    );
    expect(manager.save).toHaveBeenCalledWith(
      InventoryMovement,
      [expect.objectContaining({ ingredientId: 'milk', type: InventoryMovementType.CANCELLATION, delta: 180, orderId: 'order-1' })],
    );
  });

  it('syncProductAvailability chỉ mở lại món từng bị kho tự khóa', async () => {
    const product = { id: 'latte', status: 'OUT_OF_STOCK', inventoryAutoOutOfStock: true };
    const recipeRepo = { find: jest.fn().mockResolvedValue([{ productId: 'latte', ingredientId: 'milk', quantity: 180 }]) };
    const manager = {
      getRepository: jest.fn(() => recipeRepo),
      find: jest
        .fn()
        .mockResolvedValueOnce([product])
        .mockResolvedValueOnce([{ id: 'milk', onHand: 500, isActive: true }]),
      save: jest.fn(async (_entity, row) => row),
    };

    await service.syncProductAvailability(manager as never, ['latte']);

    expect(product).toMatchObject({ status: 'AVAILABLE', inventoryAutoOutOfStock: false });
    expect(manager.save).toHaveBeenCalled();
  });
});
