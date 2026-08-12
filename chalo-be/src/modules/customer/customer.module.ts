import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../order/entities/order.entity';
import { Table } from '../table/entities/table.entity';
import { User } from '../user/entities/user.entity';
import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';
import { CustomerTableSession } from './entities/customer-table-session.entity';
import { LoyaltyPointTransaction } from './entities/loyalty-point-transaction.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CustomerTableSession,
      LoyaltyPointTransaction,
      Table,
      User,
      Order,
    ]),
  ],
  controllers: [CustomerController],
  providers: [CustomerService],
  exports: [CustomerService],
})
export class CustomerModule {}
