import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Query,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiQuery, ApiOkResponse } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto, ChangePasswordDto } from './dto/update-user.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@ApiTags('User')
@ApiBearerAuth('JWT-auth')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('page')
  @Roles(UserRole.ADMIN)
  @ApiQuery({ name: 'pageNo', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'keyword', required: false })
  @ApiQuery({ name: 'role', required: false, enum: UserRole })
  @ApiQuery({ name: 'isActive', required: false })
  @ApiOkResponse({ description: 'Paginated users', schema: { example: { code: 200, message: 'success', data: { list: [], total: 0 } } } })
  page(
    @Query('pageNo') pageNo?: number,
    @Query('pageSize') pageSize?: number,
    @Query('keyword') keyword?: string,
    @Query('role') role?: UserRole,
    @Query('isActive') isActive?: string,
  ) {
    return this.userService.page({
      pageNo: pageNo ? Number(pageNo) : 1,
      pageSize: pageSize ? Number(pageSize) : 10,
      keyword,
      role,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });
  }

  @Post('create')
  @Roles(UserRole.ADMIN)
  @ApiOkResponse({ description: 'Create user success', schema: { example: { code: 201, message: 'success', data: { id: 2, username: 'staff02' } } } })
  create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }

  @Put('update')
  @Roles(UserRole.ADMIN)
  @ApiOkResponse({ description: 'Update user success', schema: { example: { code: 200, message: 'success', data: { id: 2, fullName: 'Updated Name' } } } })
  update(@Body() dto: UpdateUserDto) {
    return this.userService.update(dto);
  }

  @Put('change-password')
  @ApiOkResponse({ description: 'Change password success', schema: { example: { code: 200, message: 'success', data: null } } })
  changePassword(@Body() dto: ChangePasswordDto, @Request() req: Express.Request & { user: { id: number; role: UserRole } }) {
    return this.userService.changePassword(dto, req.user.id, req.user.role);
  }

  @Delete('delete')
  @Roles(UserRole.ADMIN)
  @ApiQuery({ name: 'id', required: true })
  @ApiOkResponse({ description: 'Delete user success', schema: { example: { code: 200, message: 'success', data: null } } })
  delete(@Query('id') id: number, @Request() req: Express.Request & { user: { id: number } }) {
    return this.userService.delete(Number(id), req.user.id);
  }
}
