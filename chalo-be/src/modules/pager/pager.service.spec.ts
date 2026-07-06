import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { PagerService } from './pager.service';
import { PagerToken } from './entities/pager-token.entity';
import { Order } from '../order/entities/order.entity';
import { PagerStatus } from '../../common/enums/pager-status.enum';
import { OrderStatus } from '../../common/enums/order-status.enum';

describe('PagerService', () => {
  let service: PagerService;
  let pagerRepo: any;
  let managerQb: any;
  let manager: any;
  let dataSource: any;

  beforeEach(async () => {
    managerQb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
    };
    manager = {
      findOne: jest.fn(),
      create: jest.fn((_e, v) => v),
      save: jest.fn((_e, v) => Promise.resolve({ id: 'pager-uuid', ...v })),
      getRepository: jest.fn(() => ({ createQueryBuilder: () => managerQb })),
    };
    dataSource = { transaction: jest.fn((cb: any) => cb(manager)) };

    const listQb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };
    pagerRepo = {
      createQueryBuilder: jest.fn(() => listQb),
      findOneBy: jest.fn(),
      save: jest.fn((v) => Promise.resolve(v)),
      _listQb: listQb,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PagerService,
        { provide: getRepositoryToken(PagerToken), useValue: pagerRepo },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get(PagerService);
  });

  it('list applies status filter when provided', async () => {
    await service.list(PagerStatus.ASSIGNED);
    expect(pagerRepo._listQb.where).toHaveBeenCalledWith('p.status = :status', {
      status: PagerStatus.ASSIGNED,
    });
  });

  it('assign creates an ASSIGNED pager and links the order', async () => {
    manager.findOne.mockResolvedValueOnce({
      id: 'order-1',
      status: OrderStatus.PREPARING,
      pagerId: null,
    });
    managerQb.getOne.mockResolvedValueOnce(null); // no active pager with that number

    const result = await service.assign({ number: 12, orderId: 'order-1' });

    expect(result.number).toBe(12);
    expect(result.status).toBe(PagerStatus.ASSIGNED);
    expect(result.orderId).toBe('order-1');
    expect(manager.save).toHaveBeenCalledWith(Order, expect.objectContaining({ pagerId: 'pager-uuid' }));
  });

  it('assign rejects when number already in use by an active pager', async () => {
    manager.findOne.mockResolvedValueOnce({
      id: 'order-1',
      status: OrderStatus.PREPARING,
      pagerId: null,
    });
    managerQb.getOne.mockResolvedValueOnce({ id: 'other', number: 12, status: PagerStatus.ASSIGNED });

    await expect(service.assign({ number: 12, orderId: 'order-1' })).rejects.toThrow(BadRequestException);
  });

  it('assign rejects when the order already holds a pager', async () => {
    manager.findOne.mockResolvedValueOnce({
      id: 'order-1',
      status: OrderStatus.PREPARING,
      pagerId: 'existing-pager',
    });

    await expect(service.assign({ number: 12, orderId: 'order-1' })).rejects.toThrow(BadRequestException);
  });

  it('assign rejects a finished order', async () => {
    manager.findOne.mockResolvedValueOnce({
      id: 'order-1',
      status: OrderStatus.COMPLETED,
      pagerId: null,
    });

    await expect(service.assign({ number: 12, orderId: 'order-1' })).rejects.toThrow(BadRequestException);
  });

  it('assign throws NotFound when the order does not exist', async () => {
    manager.findOne.mockResolvedValueOnce(null);
    await expect(service.assign({ number: 12, orderId: 'nope' })).rejects.toThrow(NotFoundException);
  });

  it('call moves ASSIGNED -> WAITING', async () => {
    pagerRepo.findOneBy.mockResolvedValueOnce({ id: 'p1', number: 12, status: PagerStatus.ASSIGNED });
    const result = await service.call({ id: 'p1' });
    expect(result.status).toBe(PagerStatus.WAITING);
  });

  it('call rejects a pager that is not ASSIGNED', async () => {
    pagerRepo.findOneBy.mockResolvedValueOnce({ id: 'p1', number: 12, status: PagerStatus.COMPLETED });
    await expect(service.call({ id: 'p1' })).rejects.toThrow(BadRequestException);
  });

  it('release marks the pager COMPLETED and clears the order link', async () => {
    manager.findOne
      .mockResolvedValueOnce({ id: 'p1', number: 12, status: PagerStatus.WAITING, orderId: 'order-1' }) // pager
      .mockResolvedValueOnce({ id: 'order-1', pagerId: 'p1' }); // linked order

    const result = await service.release({ id: 'p1' });

    expect(result.status).toBe(PagerStatus.COMPLETED);
    expect(result.orderId).toBeNull();
    expect(manager.save).toHaveBeenCalledWith(Order, expect.objectContaining({ pagerId: null }));
  });

  it('release is idempotent on an already COMPLETED pager', async () => {
    manager.findOne.mockResolvedValueOnce({ id: 'p1', number: 12, status: PagerStatus.COMPLETED, orderId: null });
    const result = await service.release({ id: 'p1' });
    expect(result.status).toBe(PagerStatus.COMPLETED);
  });
});
