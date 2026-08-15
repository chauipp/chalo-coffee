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
import { CustomerService } from '../customer/customer.service';
import { ProductStatus } from '../../common/enums/product-status.enum';
import { UserRole } from '../../common/enums/user-role.enum';
import { OrderSource } from '../../common/enums/order-source.enum';

describe('OrderService customer ownership', () => {
  let service: OrderService;
  let manager: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let customerService: {
    getActiveShortcut: jest.Mock;
    touchShortcut: jest.Mock;
  };
  let savedOrder: Record<string, unknown> | null;

  const dto = {
    tableToken: 'fixed-table-qr',
    items: [{ productId: 'product-1', quantity: 2 }],
  };

  const customer = {
    id: 42,
    username: 'google_customer',
    role: UserRole.CUSTOMER,
  };

  beforeEach(async () => {
    savedOrder = null;
    manager = {
      findOne: jest
        .fn()
        .mockResolvedValueOnce({
          id: 'table-1', name: 'Bàn 01', qrToken: dto.tableToken,
        })
        .mockResolvedValueOnce({
          id: 'product-1', name: 'Cà phê sữa', imageUrl: null, price: 35000,
          status: ProductStatus.AVAILABLE, modifierGroups: [],
        })
        .mockImplementationOnce(async () => ({
          ...savedOrder, items: [], table: { name: 'Bàn 01' }, pager: null,
        })),
      create: jest.fn((_entity, values) => ({ id: 'order-1', ...values })),
      save: jest.fn(async (entity, value) => {
        if (entity === Order) savedOrder = value;
        return value;
      }),
    };
    customerService = {
      getActiveShortcut: jest.fn(),
      touchShortcut: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: getRepositoryToken(Order), useValue: {} },
        { provide: getRepositoryToken(OrderItem), useValue: {} },
        { provide: getRepositoryToken(Table), useValue: {} },
        { provide: getRepositoryToken(Product), useValue: {} },
        {
          provide: DataSource,
          useValue: { transaction: jest.fn(async (cb: any) => cb(manager)) },
        },
        { provide: SseService, useValue: { emit: jest.fn() } },
        {
          provide: SettingsService,
          useValue: {
            get: jest
              .fn()
              .mockResolvedValue({ waitTimeEnabled: false, baristaCount: 1 }),
          },
        },
        { provide: CustomerService, useValue: customerService },
      ],
    }).compile();

    service = moduleRef.get(OrderService);
  });

  it('gắn customerId khi CUSTOMER có shortcut active đúng QR', async () => {
    customerService.getActiveShortcut.mockResolvedValue({
      customerId: customer.id,
      tableToken: dto.tableToken,
    });
    customerService.touchShortcut.mockResolvedValue({
      customerId: customer.id,
      tableToken: dto.tableToken,
    });

    const order = await service.create(dto, customer);

    expect(order.customerId).toBe(customer.id);
    expect(customerService.getActiveShortcut).toHaveBeenCalledWith(customer.id);
    expect(customerService.touchShortcut).toHaveBeenCalledWith(
      customer.id,
      dto.tableToken,
    );
  });

  it('giữ đơn vãng lai khi không có bearer token', async () => {
    const order = await service.create(dto, null);

    expect(order.customerId).toBeNull();
    expect(customerService.getActiveShortcut).not.toHaveBeenCalled();
  });

  it('lưu QR cho request public', async () => {
    await service.create(dto, null);

    expect(savedOrder?.orderSource).toBe(OrderSource.QR);
  });

  it('lưu POS cho vai trò nội bộ', async () => {
    await service.create(dto, {
      ...customer,
      role: UserRole.MODERATOR,
    });

    expect(savedOrder?.orderSource).toBe(OrderSource.POS);
  });

  it('lưu POS khi ADMIN tạo đơn trực tiếp', async () => {
    await service.create(dto, {
      ...customer,
      role: UserRole.ADMIN,
    });

    expect(savedOrder?.orderSource).toBe(OrderSource.POS);
  });

  it('giữ đơn vãng lai nếu bearer không phải CUSTOMER', async () => {
    const order = await service.create(dto, {
      ...customer,
      role: UserRole.ADMIN,
    });

    expect(order.customerId).toBeNull();
    expect(customerService.getActiveShortcut).not.toHaveBeenCalled();
  });

  it('giữ đơn vãng lai nếu shortcut không khớp QR đang đặt', async () => {
    customerService.getActiveShortcut.mockResolvedValue({
      customerId: customer.id,
      tableToken: 'another-table-qr',
    });

    const order = await service.create(dto, customer);

    expect(order.customerId).toBeNull();
    expect(customerService.touchShortcut).not.toHaveBeenCalled();
  });
});
