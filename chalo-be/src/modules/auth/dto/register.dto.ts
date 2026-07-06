import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'customer01' })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Nguyễn Văn Khách' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  fullName: string;
}
