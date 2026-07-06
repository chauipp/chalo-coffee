import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { SeedService } from '../../seed/seed.service';
import { Category } from '../category/entities/category.entity';
import { Product } from '../product/entities/product.entity';
import { Table } from '../table/entities/table.entity';
import { Order } from '../order/entities/order.entity';
import { OrderItem } from '../order/entities/order-item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Category, Product, Table, Order, OrderItem]),
  ],
  providers: [UserService, SeedService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
