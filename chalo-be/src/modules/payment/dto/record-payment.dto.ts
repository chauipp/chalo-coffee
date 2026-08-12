import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { PaymentMethod } from '../entities/payment-transaction.entity';

export class RecordStaffPaymentDto {
  @ApiProperty({ enum: [PaymentMethod.CASH, PaymentMethod.BANK_TRANSFER] })
  @IsOptional()
  @IsEnum([PaymentMethod.CASH, PaymentMethod.BANK_TRANSFER])
  method?: PaymentMethod.CASH | PaymentMethod.BANK_TRANSFER;

  @ApiPropertyOptional({ description: 'Tiền khách đưa, bắt buộc nếu tiền mặt' })
  @IsOptional()
  @IsInt()
  @Min(0)
  receivedAmount?: number;
}
