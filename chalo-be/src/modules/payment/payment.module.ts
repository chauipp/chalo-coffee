import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentTransaction } from './entities/payment-transaction.entity';
import { PaymentAllocation } from './entities/payment-allocation.entity';

@Module({ imports: [TypeOrmModule.forFeature([PaymentTransaction, PaymentAllocation])], exports: [TypeOrmModule] })
export class PaymentModule {}
