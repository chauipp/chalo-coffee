import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CashShift } from './entities/cash-shift.entity';
import { PaymentTransaction } from '../payment/entities/payment-transaction.entity';
import { PaymentAllocation } from '../payment/entities/payment-allocation.entity';
import { Order } from '../order/entities/order.entity';
import { ShiftService } from './shift.service';
import { ShiftController } from './shift.controller';

@Module({ imports: [TypeOrmModule.forFeature([CashShift, PaymentTransaction, PaymentAllocation, Order])], providers: [ShiftService], controllers: [ShiftController], exports: [ShiftService] })
export class ShiftModule {}
