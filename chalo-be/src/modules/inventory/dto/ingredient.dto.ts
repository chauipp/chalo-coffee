import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateIngredientDto {
  @ApiProperty({ example: 'Hạt cà phê' })
  @IsString() @IsNotEmpty() @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'g' })
  @IsString() @IsNotEmpty() @MaxLength(16)
  unit: string;

  @ApiProperty({ example: 2000 })
  @Type(() => Number) @IsNumber({ maxDecimalPlaces: 3 }) @Min(0) @Max(99_999_999)
  openingQuantity: number;

  @ApiProperty({ example: 500 })
  @Type(() => Number) @IsNumber({ maxDecimalPlaces: 3 }) @Min(0) @Max(99_999_999)
  reorderLevel: number;
}

export class UpdateIngredientDto {
  @ApiPropertyOptional({ example: 'Hạt Arabica' })
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 'g' })
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(16)
  unit?: string;

  @ApiPropertyOptional({ example: 500 })
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 3 }) @Min(0) @Max(99_999_999)
  reorderLevel?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional() @IsBoolean()
  isActive?: boolean;
}

export class AdjustIngredientDto {
  @ApiProperty({ example: 1000, description: 'Nhập kho là dương, hao hụt là âm.' })
  @Type(() => Number) @IsNumber({ maxDecimalPlaces: 3 }) @Min(-99_999_999) @Max(99_999_999)
  delta: number;

  @ApiProperty({ example: 'Nhập từ nhà cung cấp buổi sáng' })
  @IsString() @IsNotEmpty() @MaxLength(300)
  reason: string;
}

export class ReceiveIngredientDto {
  @ApiProperty({ example: 1000 })
  @Type(() => Number) @IsNumber({ maxDecimalPlaces: 3 }) @Min(0.001) @Max(99_999_999)
  quantity: number;

  @ApiProperty({ example: 'Nhập từ nhà cung cấp' })
  @IsString() @IsNotEmpty() @MaxLength(300)
  reason: string;
}
