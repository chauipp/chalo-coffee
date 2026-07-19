import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { timingSafeEqual } from 'crypto';
import {
  SepayTransaction,
  SepayTxStatus,
} from './entities/sepay-transaction.entity';
import { SepayWebhookDto } from './dto/sepay-webhook.dto';
import {
  CheckoutSession,
  CheckoutSessionStatus,
} from '../order/entities/checkout-session.entity';
import { PAY_CODE_REGEX } from '../order/pay-code';
import { OrderService } from '../order/order.service';
import { SettingsService } from '../settings/settings.service';
import { SseService } from '../sse/sse.service';

type TxBase = Pick<
  SepayTransaction,
  | 'sepayTxId'
  | 'transferAmount'
  | 'content'
  | 'accountNumber'
  | 'transactionDate'
  | 'rawPayload'
>;

@Injectable()
export class SepayWebhookService {
  private readonly logger = new Logger(SepayWebhookService.name);

  constructor(
    @InjectRepository(SepayTransaction)
    private readonly txRepo: Repository<SepayTransaction>,
    @InjectRepository(CheckoutSession)
    private readonly sessionRepo: Repository<CheckoutSession>,
    private readonly settingsService: SettingsService,
    private readonly orderService: OrderService,
    private readonly sseService: SseService,
  ) {}

  async handleWebhook(authorization: string | undefined, dto: SepayWebhookDto) {
    await this.assertApiKey(authorization);
    return this.process(dto);
  }

  /** SePay gửi header `Authorization: Apikey <key>` — so khớp timing-safe */
  private async assertApiKey(authorization?: string) {
    const settings = await this.settingsService.get();
    const expected = settings.sepayWebhookKey;
    if (!expected) {
      throw new ServiceUnavailableException('SePay webhook chưa được cấu hình');
    }
    const provided = (authorization ?? '').replace(/^apikey\s+/i, '').trim();
    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new UnauthorizedException('Sai API key');
    }
  }

  private async process(dto: SepayWebhookDto) {
    // 1) Chống trùng: SePay có thể retry webhook cho cùng giao dịch
    const existing = await this.txRepo.findOne({
      where: { sepayTxId: String(dto.id) },
    });
    if (existing) {
      return { status: SepayTxStatus.DUPLICATE, txId: existing.id };
    }

    const base: TxBase = {
      sepayTxId: String(dto.id),
      transferAmount: dto.transferAmount,
      content: dto.content ?? null,
      accountNumber: dto.accountNumber ?? null,
      transactionDate: dto.transactionDate ?? null,
      rawPayload: { ...dto } as unknown as Record<string, unknown>,
    };

    // 2) Chỉ quan tâm tiền VÀO
    if (dto.transferType !== 'in') {
      return this.saveTx(base, SepayTxStatus.NO_MATCH, null);
    }

    // 3) Tìm payCode trong nội dung CK (ngân hàng có thể chèn thêm chữ)
    const match = (dto.content ?? '').toUpperCase().match(PAY_CODE_REGEX);
    if (!match) return this.saveTx(base, SepayTxStatus.NO_MATCH, null);

    const session = await this.sessionRepo.findOne({
      where: { payCode: match[0] },
    });
    if (!session) return this.saveTx(base, SepayTxStatus.NO_MATCH, null);

    // 4) Các ca lệch → KHÔNG tự gạt, cần người đối soát (spec mục 4.3)
    const mismatch =
      session.status !== CheckoutSessionStatus.PENDING
        ? 'Phiên đã kết thúc trước đó — nguy cơ thu trùng'
        : new Date() > session.expiresAt
          ? 'Phiên thanh toán đã hết hạn'
          : dto.transferAmount !== session.totalAmount
            ? `Số tiền không khớp (cần ${session.totalAmount})`
            : null;
    if (mismatch) return this.review(base, session, mismatch);

    // 5) Khớp — hoàn tất như thu ngân xác nhận, nguồn 'sepay'
    try {
      await this.orderService.checkoutCompleteStaff(
        { sessionId: session.id },
        'sepay',
      );
    } catch (e) {
      this.logger.error(`Hoàn tất phiên ${session.id} thất bại`, e as Error);
      return this.review(base, session, 'Hoàn tất phiên thất bại, cần kiểm tra tay');
    }
    return this.saveTx(base, SepayTxStatus.MATCHED, session.id);
  }

  private async saveTx(
    base: TxBase,
    status: SepayTxStatus,
    matchedSessionId: string | null,
  ) {
    try {
      const tx = await this.txRepo.save(
        this.txRepo.create({ ...base, status, matchedSessionId }),
      );
      return { status, txId: tx.id };
    } catch (e) {
      // 2 webhook cùng giao dịch chạy song song → unique sepayTxId đỡ nốt
      if ((e as { code?: string }).code === '23505') {
        return { status: SepayTxStatus.DUPLICATE };
      }
      throw e;
    }
  }

  private async review(base: TxBase, session: CheckoutSession, reason: string) {
    const res = await this.saveTx(base, SepayTxStatus.NEEDS_REVIEW, session.id);
    this.sseService.emit({
      type: 'payment_review_needed',
      data: {
        sepayTxId: base.sepayTxId,
        content: base.content,
        transferAmount: base.transferAmount,
        sessionId: session.id,
        tableId: session.tableId,
        reason,
      },
    });
    return res;
  }
}
