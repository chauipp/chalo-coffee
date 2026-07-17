import { MigrationInterface, QueryRunner } from 'typeorm';

/** Số ly đã pha xong của từng item — barista tick ở khu pha chế; đủ mọi item thì đơn tự sang READY. */
export class AddOrderItemPreparedQuantity1752990000000 implements MigrationInterface {
  name = 'AddOrderItemPreparedQuantity1752990000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "preparedQuantity" integer NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP COLUMN IF EXISTS "preparedQuantity"`,
    );
  }
}
