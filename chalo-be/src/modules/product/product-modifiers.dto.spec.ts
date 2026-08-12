import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ProductModifierGroupDto } from './dto/product-modifier.dto';
import { ModifierSelectionType } from './entities/product-modifier-group.entity';

describe('ProductModifierGroupDto', () => {
  it('accepts an option with the default free price', async () => {
    const dto = plainToInstance(ProductModifierGroupDto, {
      name: 'Đường', selectionType: ModifierSelectionType.SINGLE, isRequired: false,
      options: [{ name: 'Ít đường' }],
    });
    expect(await validate(dto)).toHaveLength(0);
    expect(dto.options[0].priceAdjustment).toBe(0);
  });

  it('rejects groups without options and negative option prices', async () => {
    const empty = plainToInstance(ProductModifierGroupDto, {
      name: 'Size', selectionType: ModifierSelectionType.SINGLE, isRequired: true, options: [],
    });
    const negative = plainToInstance(ProductModifierGroupDto, {
      name: 'Topping', selectionType: ModifierSelectionType.MULTIPLE, isRequired: false,
      options: [{ name: 'Trân châu', priceAdjustment: -1 }],
    });
    expect(await validate(empty)).not.toHaveLength(0);
    expect(await validate(negative)).not.toHaveLength(0);
  });
});
