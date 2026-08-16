import { ProductService } from './product/product.service';
import { TableService } from './table/table.service';

function pageQueryBuilder() {
  const qb = {
    leftJoinAndSelect: jest.fn(),
    andWhere: jest.fn(),
    orderBy: jest.fn(),
    addOrderBy: jest.fn(),
    skip: jest.fn(),
    take: jest.fn(),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
  };
  Object.values(qb).forEach((value) => {
    if (typeof value === 'function' && value !== qb.getManyAndCount) {
      (value as jest.Mock).mockReturnValue(qb);
    }
  });
  return qb;
}

describe('page service pagination boundaries', () => {
  it('caps ProductService.page at 100', async () => {
    const qb = pageQueryBuilder();
    const service = new ProductService(
      { createQueryBuilder: jest.fn(() => qb) } as any,
      {} as any,
      {} as any,
    );

    await service.page({ pageNo: 2, pageSize: 1_000 });

    expect(qb.skip).toHaveBeenCalledWith(100);
    expect(qb.take).toHaveBeenCalledWith(100);
  });

  it('caps TableService.page at 100', async () => {
    const qb = pageQueryBuilder();
    const service = new TableService(
      { createQueryBuilder: jest.fn(() => qb) } as any,
      {} as any,
      { get: jest.fn() } as any,
    );

    await service.page({ pageNo: 2, pageSize: 1_000 });

    expect(qb.skip).toHaveBeenCalledWith(100);
    expect(qb.take).toHaveBeenCalledWith(100);
  });
});
