import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class PagerIdDto {
  @ApiProperty({ example: 'uuid' })
  @IsUUID()
  id: string;
}
