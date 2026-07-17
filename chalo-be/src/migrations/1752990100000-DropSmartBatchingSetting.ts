import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Gỡ toggle gợi ý gộp đơn: khu pha chế giờ gom theo món nên đã tự gộp,
 * không còn cơ chế gộp thủ công nào để bật/tắt.
 */
export class DropSmartBatchingSetting1752990100000 implements MigrationInterface {
  name = 'DropSmartBatchingSetting1752990100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "app_settings" DROP COLUMN IF EXISTS "smartBatchingEnabled"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "app_settings" ADD COLUMN IF NOT EXISTS "smartBatchingEnabled" boolean NOT NULL DEFAULT true`,
    );
  }
}
