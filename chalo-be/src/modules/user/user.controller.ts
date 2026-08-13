import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Query,
  Param,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiQuery, ApiOkResponse } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CustomerService } from '../customer/customer.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto, ChangePasswordDto } from './dto/update-user.dto';
import { SetActiveDto } from './dto/set-active.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@ApiTags('User')
@ApiBearerAuth('JWT-auth')
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly customerService: CustomerService,
  ) {}

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

  @Get(':id/orders')
  @Roles(UserRole.ADMIN)
  @ApiQuery({ name: 'pageNo', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiOkResponse({
    description: 'Lịch sử đơn hàng của 1 khách hàng (admin xem)',
    schema: { example: { code: 200, message: 'success', data: { list: [], total: 0, pageNo: 1, pageSize: 5 } } },
  })
  async customerOrders(
    @Param('id') id: string,
    @Query('pageNo') pageNo?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const result = await this.customerService.getOrders(Number(id), {
      pageNo: pageNo ? Number(pageNo) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
    return {
      list: result.list.map((order) => ({
        id: order.id,
        tableName: order.table?.name ?? '',
        status: order.status,
        totalAmount: order.totalAmount,
        itemsCount: order.items?.length ?? 0,
        createdAt: order.createdAt,
      })),
      total: result.total,
      pageNo: result.pageNo,
      pageSize: result.pageSize,
    };
  }

  @Get(':id/loyalty')
  @Roles(UserRole.ADMIN)
  @ApiOkResponse({
    description: 'Điểm tích luỹ của 1 khách hàng (admin xem)',
    schema: { example: { code: 200, message: 'success', data: { balance: 0 } } },
  })
  customerLoyalty(@Param('id') id: string) {
    return this.customerService.getLoyalty(Number(id));
  }

  @Put(':id/active')
  @Roles(UserRole.ADMIN)
  @ApiOkResponse({
    description: 'Khoá / mở khoá tài khoản',
    schema: { example: { code: 200, message: 'success', data: { id: 3, isActive: false } } },
  })
  setActive(
    @Param('id') id: string,
    @Body() dto: SetActiveDto,
    @Request() req: Express.Request & { user: { id: number } },
  ) {
    return this.userService.setActive(Number(id), dto.isActive, req.user.id);
  }
}
