import { MigrationInterface, QueryRunner } from 'typeorm';

export class PerformanceIndexes1784365811596 implements MigrationInterface {
  name = 'PerformanceIndexes1784365811596';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_order_items_order_id" ON "order_items" ("orderId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_order_items_product_id" ON "order_items" ("productId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_order_items_product_id"`);
    await queryRunner.query(`DROP INDEX "IDX_order_items_order_id"`);
  }
}
