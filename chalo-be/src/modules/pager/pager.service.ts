import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PagerToken } from './entities/pager-token.entity';
import { Order } from '../order/entities/order.entity';
import { AssignPagerDto } from './dto/assign-pager.dto';
import { PagerIdDto } from './dto/pager-id.dto';
import { PagerStatus } from '../../common/enums/pager-status.enum';
import { OrderStatus } from '../../common/enums/order-status.enum';

@Injectable()
export class PagerService {
  constructor(
    @InjectRepository(PagerToken)
    private readonly pagerRepo: Repository<PagerToken>,
    private readonly dataSource: DataSource,
  ) {}

  private buildDto(pager: PagerToken) {
    return {
      id: pager.id,
      number: pager.number,
      status: pager.status,
      orderId: pager.orderId ?? null,
      createdAt: pager.createdAt,
      updatedAt: pager.updatedAt,
    };
  }

  async list(status?: PagerStatus) {
    const qb = this.pagerRepo.createQueryBuilder('p');
    if (status) qb.where('p.status = :status', { status });
    qb.orderBy('p.createdAt', 'DESC');
    const pagers = await qb.getMany();
    return pagers.map((p) => this.buildDto(p));
  }

  async assign(dto: AssignPagerDto) {
    return this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(Order, {
        where: { id: dto.orderId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!order) throw new NotFoundException('Đơn hàng không tồn tại');
      if (
        order.status === OrderStatus.CANCELLED ||
        order.status === OrderStatus.COMPLETED
      ) {
        throw new BadRequestException('Đơn hàng đã kết thúc, không thể gán thẻ bàn');
      }
      if (order.pagerId) {
        throw new BadRequestException('Đơn hàng đã có thẻ bàn');
      }

      const active = await manager
        .getRepository(PagerToken)
        .createQueryBuilder('p')
        .where('p.number = :number', { number: dto.number })
        .andWhere('p.status != :completed', { completed: PagerStatus.COMPLETED })
        .getOne();
      if (active) {
        throw new BadRequestException(`Thẻ bàn #${dto.number} đang được sử dụng`);
      }

      const pager = manager.create(PagerToken, {
        number: dto.number,
        status: PagerStatus.ASSIGNED,
        orderId: order.id,
      });
      const saved = await manager.save(PagerToken, pager);

      order.pagerId = saved.id;
      await manager.save(Order, order);

      return this.buildDto(saved);
    });
  }

  // ASSIGNED -> WAITING: đồ uống đã xong, gọi khách tới lấy
  async call(dto: PagerIdDto) {
    const pager = await this.pagerRepo.findOneBy({ id: dto.id });
    if (!pager) throw new NotFoundException('Thẻ bàn không tồn tại');
    if (pager.status !== PagerStatus.ASSIGNED) {
      throw new BadRequestException('Chỉ thẻ đang phục vụ mới có thể gọi khách');
    }
    pager.status = PagerStatus.WAITING;
    const saved = await this.pagerRepo.save(pager);
    return this.buildDto(saved);
  }

  // -> COMPLETED: thu hồi thẻ, gỡ liên kết order. Idempotent.
  async release(dto: PagerIdDto) {
    return this.dataSource.transaction(async (manager) => {
      const pager = await manager.findOne(PagerToken, {
        where: { id: dto.id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!pager) throw new NotFoundException('Thẻ bàn không tồn tại');
      if (pager.status === PagerStatus.COMPLETED) {
        return this.buildDto(pager);
      }

      if (pager.orderId) {
        const order = await manager.findOne(Order, { where: { id: pager.orderId } });
        if (order && order.pagerId === pager.id) {
          order.pagerId = null;
          await manager.save(Order, order);
        }
      }

      pager.status = PagerStatus.COMPLETED;
      pager.orderId = null;
      const saved = await manager.save(PagerToken, pager);
      return this.buildDto(saved);
    });
  }
}
