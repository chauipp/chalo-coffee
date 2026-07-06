import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  MinLength,
  MaxLength,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { UserRole } from '../../../common/enums/user-role.enum';

export class CreateUserDto {
  @ApiProperty({ example: 'staff02' })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Lê Văn Nhân Viên' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  fullName: string;

  @ApiProperty({ enum: UserRole, example: UserRole.MODERATOR })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({ example: true })
  @IsBoolean()
  isActive: boolean;
}
