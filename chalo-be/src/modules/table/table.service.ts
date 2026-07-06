import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';
import { Table } from './entities/table.entity';
import { Order } from '../order/entities/order.entity';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto, RegenerateQrDto } from './dto/update-table.dto';
import { TableStatus } from '../../common/enums/table-status.enum';
import { OrderStatus } from '../../common/enums/order-status.enum';

@Injectable()
export class TableService {
  constructor(
    @InjectRepository(Table)
    private readonly tableRepo: Repository<Table>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    private readonly configService: ConfigService,
  ) { }

  // ─── Helper: query active orders của 1 bàn ─────────────────────────────────
  // Filter: NOT CANCELLED và (chưa paid HOẶC chưa COMPLETED)
  // = còn trong luồng xử lý hoặc đã xong nhưng chưa thanh toán
  private activeOrdersQuery(tableId: string) {
    return this.orderRepo
      .createQueryBuilder('o')
      .where('o.tableId = :tableId', { tableId })
      .andWhere('o.status != :cancelled', { cancelled: OrderStatus.CANCELLED })
      .andWhere('(o.paidStatus = :unpaid OR o.status != :completed)', {
        unpaid: false,
        completed: OrderStatus.COMPLETED,
      })
      .orderBy('o.createdAt', 'ASC');
  }

  // ─── Helper: build TableDto với activeOrders nhúng sẵn ─────────────────────
  private buildDto(table: Table, activeOrders: Order[]) {
    const frontendUrl = this.configService.get<string>(
      'APP_FRONTEND_URL',
      'http://localhost:3000',
    );
    const menuUrl = `${frontendUrl}/menu/${table.qrToken}`;
    return {
      id: table.id,
      name: table.name,
      area: table.area,
      status: table.status,
      qrToken: table.qrToken,
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(menuUrl)}`,
      createdAt: table.createdAt,
      // Thay thế currentOrderId — trả ra toàn bộ đơn active của bàn
      activeOrders: activeOrders.map((o) => ({
        id: o.id,
        status: o.status,
        paidStatus: o.paidStatus,
        totalAmount: o.totalAmount,
        createdAt: o.createdAt,
      })),
    };
  }

  // ─── list() — Staff Tables page ────────────────────────────────────────────
  // Dùng IN clause để lấy active orders của tất cả bàn trong 1 query,
  // tránh N+1 khi số bàn lớn.
  async list() {
    const tables = await this.tableRepo.find({ order: { createdAt: 'ASC' } });
    if (tables.length === 0) return [];

    const tableIds = tables.map((t) => t.id);

    // 1 query lấy toàn bộ active orders của tất cả bàn cùng lúc
    const allActiveOrders = await this.orderRepo
      .createQueryBuilder('o')
      .where('o.tableId IN (:...tableIds)', { tableIds })
      .andWhere('o.status != :cancelled', { cancelled: OrderStatus.CANCELLED })
      .andWhere('(o.paidStatus = :unpaid OR o.status != :completed)', {
        unpaid: false,
        completed: OrderStatus.COMPLETED,
      })
      .orderBy('o.createdAt', 'ASC')
      .getMany();

    // Group orders theo tableId
    const ordersByTableId = allActiveOrders.reduce<Record<string, Order[]>>(
      (acc, order) => {
        if (!acc[order.tableId]) acc[order.tableId] = [];
        acc[order.tableId].push(order);
        return acc;
      },
      {},
    );

    return tables.map((t) => this.buildDto(t, ordersByTableId[t.id] ?? []));
  }

  // ─── page() — Admin Tables page ────────────────────────────────────────────
  async page(query: {
    pageNo?: number;
    pageSize?: number;
    area?: string;
    status?: TableStatus;
  }) {
    const { pageNo = 1, pageSize = 10, area, status } = query;
    const skip = (pageNo - 1) * pageSize;

    const qb = this.tableRepo.createQueryBuilder('t');
    if (area) qb.andWhere('t.area = :area', { area });
    if (status) qb.andWhere('t.status = :status', { status });
    qb.orderBy('t.createdAt', 'ASC').skip(skip).take(pageSize);

    const [tables, total] = await qb.getManyAndCount();
    if (tables.length === 0) return { list: [], total };

    const tableIds = tables.map((t) => t.id);
    const allActiveOrders = await this.orderRepo
      .createQueryBuilder('o')
      .where('o.tableId IN (:...tableIds)', { tableIds })
      .andWhere('o.status != :cancelled', { cancelled: OrderStatus.CANCELLED })
      .andWhere('(o.paidStatus = :unpaid OR o.status != :completed)', {
        unpaid: false,
        completed: OrderStatus.COMPLETED,
      })
      .orderBy('o.createdAt', 'ASC')
      .getMany();

    const ordersByTableId = allActiveOrders.reduce<Record<string, Order[]>>(
      (acc, order) => {
        if (!acc[order.tableId]) acc[order.tableId] = [];
        acc[order.tableId].push(order);
        return acc;
      },
      {},
    );

    return {
      list: tables.map((t) => this.buildDto(t, ordersByTableId[t.id] ?? [])),
      total,
    };
  }

  // ─── areas(), byToken(), create(), update(), regenerateQr(), delete() ──────
  // Các method này không trả TableDto đầy đủ hoặc không cần activeOrders
  // → giữ nguyên logic, chỉ sửa buildDto call

  async areas() {
    const results = await this.tableRepo
      .createQueryBuilder('t')
      .select('DISTINCT t.area', 'area')
      .where('t.area IS NOT NULL')
      .orderBy('area', 'ASC')
      .getRawMany<{ area: string }>();
    return results.map((r) => ({ id: r.area, name: r.area }));
  }

  async byToken(token: string) {
    const table = await this.tableRepo.findOneBy({ qrToken: token });
    if (!table) {
      throw new NotFoundException('Mã QR không hợp lệ hoặc đã hết hạn');
    }
    // byToken chỉ dùng cho Customer xác định bàn — không cần activeOrders
    return {
      id: table.id,
      name: table.name,
      area: table.area,
      status: table.status,
    };
  }

  async create(dto: CreateTableDto) {
    const table = this.tableRepo.create({
      ...dto,
      qrToken: uuidv4(),
      status: TableStatus.AVAILABLE,
    });
    const saved = await this.tableRepo.save(table);
    // Bàn mới tạo chưa có order nào
    return this.buildDto(saved, []);
  }

  async update(dto: UpdateTableDto) {
    const table = await this.tableRepo.findOneBy({ id: dto.id });
    if (!table) throw new NotFoundException('Bàn không tồn tại');
    table.name = dto.name;
    table.area = dto.area ?? null;
    const saved = await this.tableRepo.save(table);
    // Lấy lại active orders sau update
    const activeOrders = await this.activeOrdersQuery(saved.id).getMany();
    return this.buildDto(saved, activeOrders);
  }

  async regenerateQr(dto: RegenerateQrDto) {
    const table = await this.tableRepo.findOneBy({ id: dto.id });
    if (!table) throw new NotFoundException('Bàn không tồn tại');
    table.qrToken = uuidv4();
    const saved = await this.tableRepo.save(table);
    const activeOrders = await this.activeOrdersQuery(saved.id).getMany();
    return this.buildDto(saved, activeOrders);
  }

  async delete(id: string) {
    const table = await this.tableRepo.findOneBy({ id });
    if (!table) throw new NotFoundException('Bàn không tồn tại');
    if (table.status === TableStatus.OCCUPIED) {
      throw new BadRequestException('Bàn đang có khách, không thể xóa');
    }
    await this.tableRepo.remove(table);
    return null;
  }
}