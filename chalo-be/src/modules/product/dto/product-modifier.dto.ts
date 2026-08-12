import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsBoolean, IsEnum, IsInt, IsString, MaxLength, Min, ValidateNested } from 'class-validator';
import { ModifierSelectionType } from '../entities/product-modifier-group.entity';

export class ProductModifierOptionDto {
  @IsString() @MaxLength(80) name: string;
  @IsInt() @Min(0) priceAdjustment = 0;
  @IsInt() @Min(0) sortOrder = 0;
}

export class ProductModifierGroupDto {
  @IsString() @MaxLength(80) name: string;
  @IsEnum(ModifierSelectionType) selectionType: ModifierSelectionType;
  @IsBoolean() isRequired: boolean;
  @IsInt() @Min(0) sortOrder = 0;
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => ProductModifierOptionDto)
  options: ProductModifierOptionDto[];
}
