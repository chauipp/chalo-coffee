import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SepayTransaction } from './entities/sepay-transaction.entity';
import { CheckoutSession } from '../order/entities/checkout-session.entity';
import { SepayWebhookController } from './sepay-webhook.controller';
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
  controllers: [SepayWebhookController],
  providers: [SepayWebhookService],
})
export class PaymentModule {}
