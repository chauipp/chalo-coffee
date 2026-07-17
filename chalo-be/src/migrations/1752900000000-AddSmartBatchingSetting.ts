import { MigrationInterface, QueryRunner } from 'typeorm';

/** Gợi ý gộp đơn thông minh: admin bật/tắt, staff prep đọc (GET /settings public). */
export class AddSmartBatchingSetting1752900000000 implements MigrationInterface {
  name = 'AddSmartBatchingSetting1752900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "app_settings" ADD COLUMN IF NOT EXISTS "smartBatchingEnabled" boolean NOT NULL DEFAULT true`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "app_settings" DROP COLUMN IF EXISTS "smartBatchingEnabled"`,
    );
  }
}
