import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class UpdateItemPreparedDto {
  @ApiProperty({
    example: 2,
    description:
      'Số ly đã pha xong của item này. GIÁ TRỊ TUYỆT ĐỐI, không phải lệnh tăng — hai máy cùng tick một ly sẽ không bị đếm đôi.',
  })
  @IsInt()
  @Min(0)
  preparedQuantity: number;
}
