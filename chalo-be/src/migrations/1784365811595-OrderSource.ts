import { MigrationInterface, QueryRunner } from 'typeorm';

export class OrderSource1784365811595 implements MigrationInterface {
  name = 'OrderSource1784365811595';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."orders_order_source_enum" AS ENUM('QR', 'POS', 'N_A')`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD "orderSource" "public"."orders_order_source_enum" NOT NULL DEFAULT 'N_A'`,
    );
    await queryRunner.query(
      `UPDATE "orders" SET "orderSource" = 'N_A' WHERE "orderSource" IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "orderSource"`);
    await queryRunner.query(`DROP TYPE "public"."orders_order_source_enum"`);
  }
}
