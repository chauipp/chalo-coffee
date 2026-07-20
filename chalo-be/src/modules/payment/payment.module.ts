import {
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { text } from 'express';
import { SepayTransaction } from './entities/sepay-transaction.entity';
import { CheckoutSession } from '../order/entities/checkout-session.entity';
import { SepayWebhookController } from './sepay-webhook.controller';
import { BankInboxController } from './bank-inbox.controller';
import { SepayWebhookService } from './sepay-webhook.service';
import { OrderModule } from '../order/order.module';
import { SettingsModule } from '../settings/settings.module';
import { SseModule } from '../sse/sse.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SepayTransaction, CheckoutSession]),
    OrderModule,
    SettingsModule,
    SseModule,
  ],
  controllers: [SepayWebhookController, BankInboxController],
  providers: [SepayWebhookService],
})
export class PaymentModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Ép MỌI content-type về text thô cho endpoint bắt mẫu — tránh phụ thuộc
    // app forward gửi JSON hợp lệ (SMS/notification có xuống dòng, ký tự lạ).
    // json/urlencoded toàn cục vẫn xử lý đúng loại của chúng trước; text chỉ
    // nhận phần chưa được parse.
    consumer.apply(text({ type: '*/*', limit: '64kb' })).forRoutes(BankInboxController);
  }
}
