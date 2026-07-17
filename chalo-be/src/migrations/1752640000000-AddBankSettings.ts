import { MigrationInterface, QueryRunner } from 'typeorm';

/** VietQR: cấu hình tài khoản ngân hàng nhận tiền (sinh QR động theo bàn). */
export class AddBankSettings1752640000000 implements MigrationInterface {
  name = 'AddBankSettings1752640000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "app_settings" ADD COLUMN IF NOT EXISTS "bankBin" character varying(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE "app_settings" ADD COLUMN IF NOT EXISTS "bankAccountNo" character varying(30)`,
    );
    await queryRunner.query(
      `ALTER TABLE "app_settings" ADD COLUMN IF NOT EXISTS "bankAccountName" character varying(100)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "app_settings" DROP COLUMN IF EXISTS "bankAccountName"`);
    await queryRunner.query(`ALTER TABLE "app_settings" DROP COLUMN IF EXISTS "bankAccountNo"`);
    await queryRunner.query(`ALTER TABLE "app_settings" DROP COLUMN IF EXISTS "bankBin"`);
  }
}
