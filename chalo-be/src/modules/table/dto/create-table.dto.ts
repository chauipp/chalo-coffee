import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
} from 'class-validator';

export class CreateTableDto {
  @ApiProperty({ example: 'Bàn 09' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name: string;

  @ApiPropertyOptional({ example: 'Tầng 2' })
  @IsOptional()
  @IsString()
  area?: string;
}
