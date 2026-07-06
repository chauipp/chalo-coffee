import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  MinLength,
  MaxLength,
  IsUUID,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { ProductStatus } from '../../../common/enums/product-status.enum';

export class CreateProductDto {
  @ApiProperty({ example: 'Cà phê đen' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'uuid' })
  @IsUUID()
  categoryId: string;

  @ApiPropertyOptional({ example: null })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ example: null, nullable: true })
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

  @ApiProperty({ enum: ProductStatus, example: ProductStatus.AVAILABLE })
  @IsEnum(ProductStatus)
  status: ProductStatus;

  @ApiProperty({ example: true })
  @IsBoolean()
  isActive: boolean;
}
