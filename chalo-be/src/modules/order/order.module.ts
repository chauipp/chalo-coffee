import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CheckoutSession } from './entities/checkout-session.entity';
import { Table } from '../table/entities/table.entity';
import { Product } from '../product/entities/product.entity';
import { PagerToken } from '../pager/entities/pager-token.entity';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { SseModule } from '../sse/sse.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, CheckoutSession, Table, Product, PagerToken]),
    SseModule,
    SettingsModule,
  ],
  providers: [OrderService],
  controllers: [OrderController],
})
export class OrderModule {}
