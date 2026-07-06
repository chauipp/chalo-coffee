import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPagerTokens1736150900000 implements MigrationInterface {
  name = 'AddPagerTokens1736150900000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."pager_tokens_status_enum" AS ENUM('WAITING', 'ASSIGNED', 'COMPLETED')`,
    );
    await queryRunner.query(`
      CREATE TABLE "pager_tokens" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "number" integer NOT NULL,
        "status" "public"."pager_tokens_status_enum" NOT NULL DEFAULT 'ASSIGNED',
        "orderId" uuid,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_pager_tokens" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_pager_tokens_number" ON "pager_tokens" ("number")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_pager_tokens_status" ON "pager_tokens" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_pager_tokens_order_id" ON "pager_tokens" ("orderId")`,
    );
    // Một số thẻ chỉ được dùng bởi 1 thẻ đang hoạt động (chưa COMPLETED).
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_pager_tokens_active_number" ON "pager_tokens" ("number") WHERE "status" <> 'COMPLETED'`,
    );
    await queryRunner.query(
      `ALTER TABLE "pager_tokens" ADD CONSTRAINT "FK_pager_tokens_order" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    // Liên kết ngược order → pager
    await queryRunner.query(`ALTER TABLE "orders" ADD "pagerId" uuid`);
    await queryRunner.query(
      `CREATE INDEX "IDX_orders_pager_id" ON "orders" ("pagerId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "FK_orders_pager" FOREIGN KEY ("pagerId") REFERENCES "pager_tokens"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_orders_pager"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_orders_pager_id"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "pagerId"`);
    await queryRunner.query(`ALTER TABLE "pager_tokens" DROP CONSTRAINT "FK_pager_tokens_order"`);
    await queryRunner.query(`DROP INDEX "public"."UQ_pager_tokens_active_number"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_pager_tokens_order_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_pager_tokens_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_pager_tokens_number"`);
    await queryRunner.query(`DROP TABLE "pager_tokens"`);
    await queryRunner.query(`DROP TYPE "public"."pager_tokens_status_enum"`);
  }
}
