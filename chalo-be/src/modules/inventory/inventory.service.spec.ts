import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { InventoryService } from './inventory.service';
import { Ingredient } from './entities/ingredient.entity';
import {
  InventoryMovement,
  InventoryMovementType,
} from './entities/inventory-movement.entity';
import { ProductRecipe } from './entities/product-recipe.entity';

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
        { provide: getRepositoryToken(ProductRecipe), useValue: {} },
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
});
