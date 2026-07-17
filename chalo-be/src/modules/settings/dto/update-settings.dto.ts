import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

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

  @ApiPropertyOptional({
    example: '970422',
    description: 'VietQR: mã BIN ngân hàng (6 số). Chuỗi rỗng = xoá cấu hình.',
  })
  @IsOptional()
  @Matches(/^(\d{6})?$/, { message: 'bankBin phải là 6 chữ số' })
  bankBin?: string;

  @ApiPropertyOptional({ example: '0123456789', description: 'VietQR: số tài khoản' })
  @IsOptional()
  @Matches(/^[0-9]{0,30}$/, { message: 'bankAccountNo chỉ gồm chữ số' })
  bankAccountNo?: string;

  @ApiPropertyOptional({ example: 'NGUYEN VAN A', description: 'VietQR: tên chủ tài khoản' })
  @IsOptional()
  @MaxLength(100)
  bankAccountName?: string;
}
