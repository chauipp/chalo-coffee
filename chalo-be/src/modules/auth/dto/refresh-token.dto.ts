import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({ example: 'eyJ...' })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
