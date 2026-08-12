import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CloseShiftDto {
  @ApiProperty()
  @IsInt()
  @Min(0)
  @Max(2_000_000_000)
  countedCash: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
