import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min, IsUUID } from 'class-validator';

export class AssignPagerDto {
  @ApiProperty({ example: 12, description: 'Số in trên thẻ bàn' })
  @IsInt()
  @Min(1)
  number: number;

  @ApiProperty({ example: 'uuid' })
  @IsUUID()
  orderId: string;
}
