import { Body, Controller, Get, Post, Query, Request } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { CustomerService } from './customer.service';
import { ScanTableDto } from './dto/scan-table.dto';

type CustomerRequest = Express.Request & {
  user: { id: number; role: UserRole };
};

@ApiTags('Customer')
@ApiBearerAuth('JWT-auth')
@Roles(UserRole.CUSTOMER)
@Controller('customer')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get('me')
  @ApiOkResponse({ description: 'Hồ sơ khách hàng hiện tại' })
  me(@Request() req: CustomerRequest) {
    return this.customerService.getMe(req.user.id);
  }

  @Get('table-session')
  @ApiOkResponse({ description: 'Lối tắt bàn còn hiệu lực của khách' })
  tableSession(@Request() req: CustomerRequest) {
    return this.customerService.getActiveShortcut(req.user.id);
  }

  @Post('table-session/scan')
  @ApiOkResponse({ description: 'Liên kết lối tắt cá nhân với QR bàn' })
  scanTable(@Body() dto: ScanTableDto, @Request() req: CustomerRequest) {
    return this.customerService.scanTable(req.user.id, dto);
  }

  @Post('table-session/leave')
  @ApiOkResponse({ description: 'Đóng lối tắt bàn của chính khách' })
  leaveTable(@Request() req: CustomerRequest) {
    return this.customerService.leaveTable(req.user.id);
  }

  @Get('loyalty')
  @ApiOkResponse({ description: 'Tổng điểm tích lũy của khách' })
  loyalty(@Request() req: CustomerRequest) {
    return this.customerService.getLoyalty(req.user.id);
  }

  @Get('loyalty/history')
  @ApiQuery({ name: 'pageNo', required: false })
  @ApiQuery({ name: 'pageSize', required: false, maximum: 50 })
  loyaltyHistory(
    @Request() req: CustomerRequest,
    @Query('pageNo') pageNo?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.customerService.getLoyaltyHistory(req.user.id, {
      pageNo: pageNo ? Number(pageNo) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }

  @Get('orders')
  @ApiQuery({ name: 'pageNo', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiOkResponse({ description: 'Lịch sử đơn của khách' })
  orders(
    @Request() req: CustomerRequest,
    @Query('pageNo') pageNo?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.customerService.getOrders(req.user.id, {
      pageNo: pageNo ? Number(pageNo) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }
}
