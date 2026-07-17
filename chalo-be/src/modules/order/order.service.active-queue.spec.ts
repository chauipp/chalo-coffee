import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { OrderService } from './order.service';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Table } from '../table/entities/table.entity';
import { Product } from '../product/entities/product.entity';
import { SseService } from '../sse/sse.service';
import { SettingsService } from '../settings/settings.service';
import { OrderStatus } from '../../common/enums/order-status.enum';

describe('OrderService.getActiveQueue — mốc 0h00 giờ VN', () => {
  let service: OrderService;
  let qb: any;

  beforeEach(async () => {
    qb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        OrderService,
        {
          provide: getRepositoryToken(Order),
          useValue: { createQueryBuilder: () => qb },
        },
        { provide: getRepositoryToken(OrderItem), useValue: {} },
        { provide: getRepositoryToken(Table), useValue: {} },
        { provide: getRepositoryToken(Product), useValue: {} },
        { provide: DataSource, useValue: {} },
        { provide: SseService, useValue: { emit: jest.fn() } },
        { provide: SettingsService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    service = moduleRef.get(OrderService);
  });

  afterEach(() => jest.useRealTimers());

  it('lọc từ 0h00 hôm nay giờ VN, không phải cửa sổ trượt 24h', async () => {
    // 2026-07-17 10:00 giờ VN  ==  2026-07-17T03:00:00Z
    jest.useFakeTimers().setSystemTime(new Date('2026-07-17T03:00:00.000Z'));

    await service.getActiveQueue();

    const call = qb.andWhere.mock.calls.find((c: any[]) =>
      String(c[0]).includes('createdAt'),
    );
    expect(call).toBeDefined();
    // 0h00 ngày 17/07 giờ VN == 2026-07-16T17:00:00Z
    expect(call[1].cutoff).toEqual(new Date('2026-07-16T17:00:00.000Z'));
  });

  it('ngay sau nửa đêm VN, mốc nhảy sang ngày mới (đơn hôm qua rời bảng)', async () => {
    // 2026-07-18 00:30 giờ VN  ==  2026-07-17T17:30:00Z
    jest.useFakeTimers().setSystemTime(new Date('2026-07-17T17:30:00.000Z'));

    await service.getActiveQueue();

    const call = qb.andWhere.mock.calls.find((c: any[]) =>
      String(c[0]).includes('createdAt'),
    );
    // 0h00 ngày 18/07 giờ VN == 2026-07-17T17:00:00Z
    expect(call[1].cutoff).toEqual(new Date('2026-07-17T17:00:00.000Z'));
  });
});

describe('OrderService.getActiveQueue — cột "Đã phục vụ" phải gồm cả COMPLETED chưa trả tiền', () => {
  let service: OrderService;
  let qb: any;

  beforeEach(async () => {
    qb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        OrderService,
        {
          provide: getRepositoryToken(Order),
          useValue: { createQueryBuilder: () => qb },
        },
        { provide: getRepositoryToken(OrderItem), useValue: {} },
        { provide: getRepositoryToken(Table), useValue: {} },
        { provide: getRepositoryToken(Product), useValue: {} },
        { provide: DataSource, useValue: {} },
        { provide: SseService, useValue: { emit: jest.fn() } },
        { provide: SettingsService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    service = moduleRef.get(OrderService);
  });

  it('điều kiện lọc trạng thái phải OR thêm nhánh COMPLETED + chưa thanh toán, không chỉ IN 4 trạng thái đang xử lý', async () => {
    await service.getActiveQueue();

    // Điều kiện status có thể nằm ở .where() hoặc .andWhere() tuỳ cách viết —
    // tìm call nào có tham số chứa mảng statuses (nhóm "đang xử lý").
    const allCalls = [...qb.where.mock.calls, ...qb.andWhere.mock.calls];
    const call = allCalls.find(
      (c: any[]) => c[1] && Array.isArray(c[1].statuses),
    );
    expect(call).toBeDefined();

    const [sql, params] = call as [string, Record<string, unknown>];

    // Nhóm 1: 4 trạng thái "đang xử lý" như cũ, KHÔNG được rớt trạng thái nào.
    expect(params.statuses).toEqual(
      expect.arrayContaining([
        OrderStatus.PENDING,
        OrderStatus.CONFIRMED,
        OrderStatus.PREPARING,
        OrderStatus.READY,
      ]),
    );
    expect(params.statuses).toHaveLength(4);
    // COMPLETED không được nằm trong nhóm IN thuần — nó phải là nhánh OR riêng
    // có điều kiện paidStatus = false đi kèm.
    expect(params.statuses).not.toEqual(
      expect.arrayContaining([OrderStatus.COMPLETED]),
    );

    // Nhóm 2: COMPLETED nhưng chưa thanh toán vẫn phải xuất hiện trong kết quả
    // (đây chính là dữ liệu cho cột "Đã phục vụ" bên FE).
    expect(params.completedStatus).toBe(OrderStatus.COMPLETED);
    expect(params.isUnpaid).toBe(false);

    // SQL phải OR hai nhóm điều kiện lại với nhau, không phải chỉ IN đơn thuần.
    expect(sql).toEqual(expect.stringContaining('OR'));
    expect(sql).toEqual(expect.stringContaining(':completedStatus'));
    expect(sql).toEqual(expect.stringContaining(':isUnpaid'));
  });
});
