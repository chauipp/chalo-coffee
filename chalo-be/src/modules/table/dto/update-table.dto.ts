import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
} from 'class-validator';

export class UpdateTableDto {
  @ApiProperty({ example: 'uuid' })
  @IsUUID()
  id: string;

  @ApiProperty({ example: 'Bàn 09 updated' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name: string;

  @ApiPropertyOptional({ example: 'Tầng 2' })
  @IsOptional()
  @IsString()
  area?: string;
}

export class RegenerateQrDto {
  @ApiProperty({ example: 'uuid' })
  @IsUUID()
  id: string;
}
