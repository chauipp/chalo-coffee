import {
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { SepayWebhookService } from './sepay-webhook.service';
import { SepayTxStatus } from './entities/sepay-transaction.entity';
import { CheckoutSessionStatus } from '../order/entities/checkout-session.entity';
import { SepayWebhookDto } from './dto/sepay-webhook.dto';

describe('SepayWebhookService', () => {
  const KEY = 'test-api-key';
  const futureDate = new Date(Date.now() + 10 * 60 * 1000);

  const session = () => ({
    id: 'sess-1',
    tableId: 'tbl-1',
    tableToken: 'tok-1',
    orderIds: ['ord-1'],
    totalAmount: 85000,
    status: CheckoutSessionStatus.PENDING,
    payCode: 'CK7F3K2M',
    expiresAt: futureDate,
  });

  const dto = (over: Partial<SepayWebhookDto> = {}): SepayWebhookDto =>
    ({
      id: 'tx-100',
      transferType: 'in',
      transferAmount: 85000,
      content: 'MBVCB CK7F3K2M chuyen tien',
      ...over,
    }) as SepayWebhookDto;

  let txRepo: { findOne: jest.Mock; create: jest.Mock; save: jest.Mock };
  let sessionRepo: { findOne: jest.Mock };
  let settingsService: { get: jest.Mock };
  let orderService: { checkoutCompleteStaff: jest.Mock };
  let sseService: { emit: jest.Mock };
  let service: SepayWebhookService;

  beforeEach(() => {
    txRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((v) => v),
      save: jest.fn((v) => Promise.resolve({ id: 'log-1', ...v })),
    };
    sessionRepo = { findOne: jest.fn().mockResolvedValue(session()) };
    settingsService = {
      get: jest.fn().mockResolvedValue({ sepayWebhookKey: KEY }),
    };
    orderService = {
      checkoutCompleteStaff: jest.fn().mockResolvedValue({ idempotent: false }),
    };
    sseService = { emit: jest.fn() };
    service = new SepayWebhookService(
      txRepo as never,
      sessionRepo as never,
      settingsService as never,
      orderService as never,
      sseService as never,
    );
  });

  it('sai API key → 401', async () => {
    await expect(
      service.handleWebhook('Apikey wrong-key', dto()),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('chưa cấu hình key → 503', async () => {
    settingsService.get.mockResolvedValue({ sepayWebhookKey: null });
    await expect(
      service.handleWebhook(`Apikey ${KEY}`, dto()),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('trùng sepayTxId → DUPLICATE, không complete', async () => {
    txRepo.findOne.mockResolvedValue({ id: 'log-0' });
    const res = await service.handleWebhook(`Apikey ${KEY}`, dto());
    expect(res.status).toBe(SepayTxStatus.DUPLICATE);
    expect(orderService.checkoutCompleteStaff).not.toHaveBeenCalled();
  });

  it('tiền RA (transferType=out) → NO_MATCH', async () => {
    const res = await service.handleWebhook(
      `Apikey ${KEY}`,
      dto({ transferType: 'out' }),
    );
    expect(res.status).toBe(SepayTxStatus.NO_MATCH);
  });

  it('không có payCode trong nội dung → NO_MATCH', async () => {
    const res = await service.handleWebhook(
      `Apikey ${KEY}`,
      dto({ content: 'chuyen tien an trua' }),
    );
    expect(res.status).toBe(SepayTxStatus.NO_MATCH);
    expect(sessionRepo.findOne).not.toHaveBeenCalled();
  });

  it('có mã nhưng không có phiên → NO_MATCH', async () => {
    sessionRepo.findOne.mockResolvedValue(null);
    const res = await service.handleWebhook(`Apikey ${KEY}`, dto());
    expect(res.status).toBe(SepayTxStatus.NO_MATCH);
  });

  it('sai số tiền → NEEDS_REVIEW + SSE payment_review_needed, không complete', async () => {
    const res = await service.handleWebhook(
      `Apikey ${KEY}`,
      dto({ transferAmount: 10000 }),
    );
    expect(res.status).toBe(SepayTxStatus.NEEDS_REVIEW);
    expect(orderService.checkoutCompleteStaff).not.toHaveBeenCalled();
    expect(sseService.emit).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'payment_review_needed' }),
    );
  });

  it('phiên hết hạn → NEEDS_REVIEW', async () => {
    sessionRepo.findOne.mockResolvedValue({
      ...session(),
      expiresAt: new Date(Date.now() - 1000),
    });
    const res = await service.handleWebhook(`Apikey ${KEY}`, dto());
    expect(res.status).toBe(SepayTxStatus.NEEDS_REVIEW);
  });

  it('phiên ĐÃ thanh toán trước đó → NEEDS_REVIEW (nguy cơ thu trùng)', async () => {
    sessionRepo.findOne.mockResolvedValue({
      ...session(),
      status: CheckoutSessionStatus.COMPLETED,
    });
    const res = await service.handleWebhook(`Apikey ${KEY}`, dto());
    expect(res.status).toBe(SepayTxStatus.NEEDS_REVIEW);
    expect(orderService.checkoutCompleteStaff).not.toHaveBeenCalled();
  });

  it('khớp mã + đúng tiền → complete với source sepay, MATCHED', async () => {
    const res = await service.handleWebhook(`Apikey ${KEY}`, dto());
    expect(orderService.checkoutCompleteStaff).toHaveBeenCalledWith(
      { sessionId: 'sess-1' },
      'sepay',
    );
    expect(res.status).toBe(SepayTxStatus.MATCHED);
    expect(txRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: SepayTxStatus.MATCHED,
        matchedSessionId: 'sess-1',
      }),
    );
  });

  it('txRepo.save đụng unique 23505 (2 webhook song song) → DUPLICATE, không throw', async () => {
    txRepo.save.mockRejectedValue({ code: '23505' });
    const res = await service.handleWebhook(`Apikey ${KEY}`, dto());
    expect(res.status).toBe(SepayTxStatus.DUPLICATE);
  });

  it('checkoutCompleteStaff thất bại → NEEDS_REVIEW + SSE cảnh báo đối soát', async () => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    orderService.checkoutCompleteStaff.mockRejectedValue(new Error('db down'));
    const res = await service.handleWebhook(`Apikey ${KEY}`, dto());
    expect(res.status).toBe(SepayTxStatus.NEEDS_REVIEW);
    expect(txRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: SepayTxStatus.NEEDS_REVIEW,
        matchedSessionId: 'sess-1',
      }),
    );
    expect(sseService.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'payment_review_needed',
        data: expect.objectContaining({
          reason: 'Hoàn tất phiên thất bại, cần kiểm tra tay',
        }),
      }),
    );
  });
});
