import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentTransaction } from './entities/payment-transaction.entity';
import { PaymentAllocation } from './entities/payment-allocation.entity';
import { PaymentService } from './payment.service';
import { Order } from '../order/entities/order.entity';
import { CashShift } from '../shift/entities/cash-shift.entity';
import { SepayTransaction } from './entities/sepay-transaction.entity';
import { CheckoutSession } from '../order/entities/checkout-session.entity';
import { SepayWebhookController } from './sepay-webhook.controller';
import { SepayWebhookService } from './sepay-webhook.service';
import { OrderModule } from '../order/order.module';
import { SettingsModule } from '../settings/settings.module';
import { SseModule } from '../sse/sse.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PaymentTransaction,
      PaymentAllocation,
      Order,
      CashShift,
      SepayTransaction,
      CheckoutSession,
    ]),
    forwardRef(() => OrderModule),
    SettingsModule,
    SseModule,
  ],
  controllers: [SepayWebhookController],
  providers: [PaymentService, SepayWebhookService],
  exports: [PaymentService],
})
export class PaymentModule {}
