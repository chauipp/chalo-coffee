import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsString, Max, MaxLength, Min } from 'class-validator';
import { PaymentMethod } from '../entities/payment-transaction.entity';

export class CreateRefundDto {
  @ApiProperty({ example: 35000 })
  @Type(() => Number) @IsInt() @Min(1) @Max(99_999_999)
  amount: number;

  @ApiProperty({ enum: [PaymentMethod.CASH, PaymentMethod.BANK_TRANSFER] })
  @IsEnum([PaymentMethod.CASH, PaymentMethod.BANK_TRANSFER])
  method: PaymentMethod.CASH | PaymentMethod.BANK_TRANSFER;

  @ApiProperty({ example: 'Khách hủy món do hết nguyên liệu' })
  @IsString() @IsNotEmpty() @MaxLength(300)
  reason: string;
}
