import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  Min,
  IsString,
  MinLength,
  MaxLength,
  IsEnum,
  IsBoolean,
  IsOptional,
  IsUrl,
} from 'class-validator';
import { UserRole } from '../../../common/enums/user-role.enum';

export class UpdateUserDto {
  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  id: number;

  @ApiProperty({ example: 'Lê Văn Cập Nhật' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  fullName: string;

  @ApiPropertyOptional({ example: null, nullable: true })
  @IsOptional()
  @IsUrl()
  avatar: string | null;

  @ApiProperty({ enum: UserRole, example: UserRole.MODERATOR })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({ example: true })
  @IsBoolean()
  isActive: boolean;
}

export class ChangePasswordDto {
  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  id: number;

  @ApiPropertyOptional({ example: 'oldpass123', description: 'Bắt buộc khi MODERATOR tự đổi mật khẩu' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  oldPassword?: string;

  @ApiProperty({ example: 'newpass123' })
  @IsString()
  @MinLength(6)
  newPassword: string;
}
