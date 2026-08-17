import { Body, Controller, Get, Param, Post, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { CreateRefundDto } from './dto/create-refund.dto';
import { PaymentService } from './payment.service';

@ApiTags('Payment')
@ApiBearerAuth('JWT-auth')
@Controller('payment-transactions')
@Roles(UserRole.ADMIN)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get('by-order/:orderId/refunds')
  refundsForOrder(@Param('orderId') orderId: string) {
    return this.paymentService.refundsForOrder(orderId);
  }

  @Get(':paymentTransactionId/refunds')
  listRefunds(@Param('paymentTransactionId') paymentTransactionId: string) {
    return this.paymentService.listRefunds(paymentTransactionId);
  }

  @Post(':paymentTransactionId/refunds')
  refund(
    @Param('paymentTransactionId') paymentTransactionId: string,
    @Body() dto: CreateRefundDto,
    @Request() req: { user: { id: number } },
  ) {
    return this.paymentService.refund(paymentTransactionId, dto, req.user.id);
  }
}
