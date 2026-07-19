import { Body, Controller, Headers, HttpCode, Post } from '@nestjs/common';
import { ApiHeader, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { SepayWebhookService } from './sepay-webhook.service';
import { SepayWebhookDto } from './dto/sepay-webhook.dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Payment')
@Controller('payment')
export class SepayWebhookController {
  constructor(private readonly sepayWebhookService: SepayWebhookService) {}

  @Post('sepay/webhook')
  @Public()
  @SkipThrottle()
  @HttpCode(200)
  @ApiOperation({
    summary: 'Webhook SePay — tự động xác nhận thanh toán khi tiền về',
    description:
      'SePay gọi khi tài khoản nhận giao dịch mới. Xác thực bằng header ' +
      '`Authorization: Apikey <sepayWebhookKey>` (cấu hình trong Cài đặt admin). ' +
      'Luôn trả 200 khi đã ghi nhận (kể cả không khớp) để SePay không retry vô hạn.',
  })
  @ApiHeader({ name: 'authorization', description: 'Apikey <sepayWebhookKey>' })
  @ApiOkResponse({
    schema: {
      example: { code: 200, message: 'success', data: { status: 'MATCHED', txId: 'uuid' } },
    },
  })
  webhook(
    @Headers('authorization') authorization: string | undefined,
    @Body() dto: SepayWebhookDto,
  ) {
    return this.sepayWebhookService.handleWebhook(authorization, dto);
  }
}
