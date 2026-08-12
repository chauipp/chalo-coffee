import { IsDateString, IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ReportQueryDto {
  @ApiPropertyOptional({ description: 'ISO date/time bắt đầu' })
  @IsOptional()
  @IsDateString()
  from?: string;
  @ApiPropertyOptional({ description: 'ISO date/time kết thúc' })
  @IsOptional()
  @IsDateString()
  to?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  shiftId?: string;
}
