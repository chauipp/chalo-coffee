import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';

export class UpdateSettingsDto {
  @ApiPropertyOptional({ example: true, description: 'Bật/tắt hiển thị wait time cho khách' })
  @IsOptional()
  @IsBoolean()
  waitTimeEnabled?: boolean;

  @ApiPropertyOptional({ example: 3, minimum: 1, maximum: 50, description: 'Số barista song song' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  baristaCount?: number;
}
