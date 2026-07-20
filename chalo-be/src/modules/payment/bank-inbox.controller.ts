import { Body, Controller, Headers, HttpCode, Logger, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator';

/**
 * TẠM THỜI (spike) — bắt MẪU thông báo biến động số dư do app điện thoại
 * (MacroDroid / SMS Forwarder) forward về, nhằm xác định ĐỊNH DẠNG THẬT của
 * thông báo VCB. Chỉ ghi log payload thô rồi trả 200.
 *
 * Sau khi có mẫu: thay bằng parser bóc số tiền + nội dung, tái dùng logic khớp
 * payCode của SepayWebhookService (tách `matchAndComplete()` ra service chung).
 * KHÔNG dùng endpoint này cho production khi chưa gắn secret bắt buộc.
 */
@ApiTags('Payment')
@Controller('payment')
export class BankInboxController {
  private readonly logger = new Logger('BankInbox');

  @Post('bank-inbox')
  @Public()
  @SkipThrottle()
  @HttpCode(200)
  @ApiOperation({
    summary: '[TẠM] Bắt mẫu thông báo ngân hàng do điện thoại forward về',
  })
  capture(@Headers() headers: Record<string, string>, @Body() body: unknown) {
    const secret = process.env.BANK_INBOX_SECRET;
    const provided = headers['x-inbox-secret'];
    const authOk = !secret || provided === secret;
    const rendered =
      typeof body === 'string' ? body : JSON.stringify(body ?? null);
    this.logger.log(
      `content-type=${headers['content-type'] ?? '-'} len=${rendered.length} authOk=${authOk}`,
    );
    this.logger.log(`PAYLOAD>>>${rendered}<<<PAYLOAD`);
    return { ok: authOk };
  }
}
