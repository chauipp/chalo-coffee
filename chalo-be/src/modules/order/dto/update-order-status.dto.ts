import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsEnum, IsString, IsOptional, MaxLength } from 'class-validator';
import { OrderStatus } from '../../../common/enums/order-status.enum';

export class UpdateOrderStatusDto {
  @ApiProperty({ example: 'uuid' })
  @IsUUID()
  id: string;

  @ApiProperty({ enum: OrderStatus })
  @IsEnum(OrderStatus)
  status: OrderStatus;
}

export class RequestPaymentDto {
  @ApiProperty({ example: 'uuid' })
  @IsUUID()
  orderId: string;
}

export class PaySingleOrderDto {
  @ApiProperty({ example: 'uuid' })
  @IsUUID()
  orderId: string;

  @ApiProperty({ description: 'qrToken của bàn — phải khớp với đơn hàng' })
  @IsString()
  tableToken: string;
}

export class PayUnpaidOrdersByTableDto {
  @ApiProperty({ description: 'qrToken của bàn' })
  @IsString()
  tableToken: string;
}

export class CallStaffDto {
  @ApiProperty({ description: 'qrToken của bàn' })
  @IsString()
  tableToken: string;

  @ApiPropertyOptional({ example: 'Cho xin thêm đá', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  reason?: string | null;
}
