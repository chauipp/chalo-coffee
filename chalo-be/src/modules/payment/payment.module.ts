import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentTransaction } from './entities/payment-transaction.entity';
import { PaymentAllocation } from './entities/payment-allocation.entity';
import { PaymentService } from './payment.service';
import { Order } from '../order/entities/order.entity';
import { CashShift } from '../shift/entities/cash-shift.entity';

@Module({ imports: [TypeOrmModule.forFeature([PaymentTransaction, PaymentAllocation, Order, CashShift])], providers: [PaymentService], exports: [PaymentService] })
export class PaymentModule {}
