import { getMetadataArgsStorage } from 'typeorm';
import { Order } from '../../order/entities/order.entity';
import { User } from '../../user/entities/user.entity';
import {
  CustomerTableSession,
  CustomerTableSessionStatus,
} from './customer-table-session.entity';
import {
  LoyaltyPointTransaction,
  LoyaltyPointTransactionType,
} from './loyalty-point-transaction.entity';

describe('customer loyalty data model', () => {
  it('cho phép nhiều shortcut active của khách khác nhau tại cùng một bàn', () => {
    const sessionA = Object.assign(new CustomerTableSession(), {
      customerId: 1,
      tableId: '6e72ca6b-c2db-43dc-8ef9-9584debc70af',
      tableToken: 'fixed-print-qr',
      status: CustomerTableSessionStatus.ACTIVE,
    });
    const sessionB = Object.assign(new CustomerTableSession(), {
      customerId: 2,
      tableId: '6e72ca6b-c2db-43dc-8ef9-9584debc70af',
      tableToken: 'fixed-print-qr',
      status: CustomerTableSessionStatus.ACTIVE,
    });

    expect(sessionA.tableId).toBe(sessionB.tableId);
    expect(sessionA.customerId).not.toBe(sessionB.customerId);
    expect(sessionA.status).toBe(CustomerTableSessionStatus.ACTIVE);
    expect(sessionB.status).toBe(CustomerTableSessionStatus.ACTIVE);
  });

  it('mỗi order chỉ có tối đa một giao dịch tích điểm', () => {
    const loyaltyTransaction = Object.assign(new LoyaltyPointTransaction(), {
      orderId: '5e72ca6b-c2db-43dc-8ef9-9584debc70af',
      customerId: 1,
      type: LoyaltyPointTransactionType.EARN,
      points: 100,
    });
    const orderIdIndex = getMetadataArgsStorage().indices.find(
      (index) =>
        index.target === LoyaltyPointTransaction &&
        index.unique === true &&
        index.columns?.join(',') === 'orderId',
    );

    expect(loyaltyTransaction).toMatchObject({
      type: LoyaltyPointTransactionType.EARN,
      points: 100,
    });
    expect(orderIdIndex).toBeDefined();
  });

  it('lưu định danh Google nullable cho user và customer nullable cho order', () => {
    const columns = getMetadataArgsStorage().columns;
    const googleSubject = columns.find(
      (column) => column.target === User && column.propertyName === 'googleSubject',
    );
    const email = columns.find(
      (column) => column.target === User && column.propertyName === 'email',
    );
    const customerId = columns.find(
      (column) => column.target === Order && column.propertyName === 'customerId',
    );

    const googleSubjectIndex = getMetadataArgsStorage().indices.find(
      (index) =>
        index.target === User &&
        index.unique === true &&
        index.columns?.join(',') === 'googleSubject',
    );
    const emailIndex = getMetadataArgsStorage().indices.find(
      (index) =>
        index.target === User &&
        index.unique === true && index.columns?.join(',') === 'email',
    );

    expect(googleSubject?.options.nullable).toBe(true);
    expect(email?.options.nullable).toBe(true);
    expect(googleSubjectIndex).toBeDefined();
    expect(emailIndex).toBeDefined();
    expect(customerId?.options.nullable).toBe(true);
  });

  it('có index để truy vấn shortcut active và ledger của khách hiệu quả', () => {
    const indices = getMetadataArgsStorage().indices;
    const sessionIndex = indices.find(
      (index) =>
        index.target === CustomerTableSession &&
        index.columns?.join(',') === 'customerId,status,businessDate',
    );
    const ledgerIndex = indices.find(
      (index) =>
        index.target === LoyaltyPointTransaction &&
        index.columns?.join(',') === 'customerId,createdAt',
    );

    expect(sessionIndex).toBeDefined();
    expect(ledgerIndex).toBeDefined();
  });
});
