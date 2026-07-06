import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { ProductStatus } from '../../../common/enums/product-status.enum';

export class UpdateProductDto {
  @ApiProperty({ example: 'uuid' })
  @IsUUID()
  id: string;

  @ApiProperty({ example: 'Cà phê đen updated' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'uuid' })
  @IsUUID()
  categoryId: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  imageUrl?: string | null;

  @ApiProperty({ example: 25000 })
  @IsInt()
  @Min(1000)
  price: number;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(60)
  prepTime?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiProperty({ enum: ProductStatus })
  @IsEnum(ProductStatus)
  status: ProductStatus;

  @ApiProperty({ example: true })
  @IsBoolean()
  isActive: boolean;
}

export class UpdateProductStatusDto {
  @ApiProperty({ example: 'uuid' })
  @IsUUID()
  id: string;

  @ApiProperty({ enum: ProductStatus })
  @IsEnum(ProductStatus)
  status: ProductStatus;
}
