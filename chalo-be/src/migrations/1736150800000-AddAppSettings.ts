import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAppSettings1736150800000 implements MigrationInterface {
  name = 'AddAppSettings1736150800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "app_settings" (
        "id" integer NOT NULL DEFAULT 1,
        "waitTimeEnabled" boolean NOT NULL DEFAULT true,
        "baristaCount" integer NOT NULL DEFAULT 3,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_app_settings" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_app_settings_singleton" CHECK ("id" = 1)
      )
    `);
    await queryRunner.query(`
      INSERT INTO "app_settings" ("id", "waitTimeEnabled", "baristaCount")
      VALUES (1, true, 3)
      ON CONFLICT ("id") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "app_settings"`);
  }
}
