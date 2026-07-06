import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PagerToken } from './entities/pager-token.entity';
import { Order } from '../order/entities/order.entity';
import { PagerService } from './pager.service';
import { PagerController } from './pager.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PagerToken, Order])],
  providers: [PagerService],
  controllers: [PagerController],
  exports: [PagerService],
})
export class PagerModule {}
