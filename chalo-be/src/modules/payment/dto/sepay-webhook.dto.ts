import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

/** Payload SePay gửi khi có giao dịch mới (docs.sepay.vn — webhooks) */
export class SepayWebhookDto {
  @ApiProperty({ description: 'ID giao dịch phía SePay' })
  @Type(() => String)
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiPropertyOptional({ description: 'Ngân hàng (VD "MBBank")' })
  @IsOptional()
  @IsString()
  gateway?: string;

  @ApiPropertyOptional({ description: 'VD "2026-07-19 14:02:37"' })
  @IsOptional()
  @IsString()
  transactionDate?: string;

  @ApiPropertyOptional({ description: 'Số tài khoản nhận' })
  @IsOptional()
  @IsString()
  accountNumber?: string;

  @ApiPropertyOptional({ description: 'Nội dung chuyển khoản' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({ description: '"in" = tiền vào, "out" = tiền ra' })
  @IsIn(['in', 'out'])
  transferType: 'in' | 'out';

  @ApiProperty({ description: 'Số tiền giao dịch (VND, số nguyên)' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  transferAmount: number;

  @ApiPropertyOptional({ description: 'Mã tham chiếu phía ngân hàng' })
  @IsOptional()
  @IsString()
  referenceCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}
