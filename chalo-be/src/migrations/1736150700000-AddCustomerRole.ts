import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCustomerRole1736150700000 implements MigrationInterface {
  name = 'AddCustomerRole1736150700000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_type t WHERE t.typname = 'users_role_enum'
        ) THEN
          ALTER TYPE "public"."users_role_enum" ADD VALUE IF NOT EXISTS 'CUSTOMER';
        END IF;
      END
      $$;
    `);
  }

  public async down(): Promise<void> {
    // PostgreSQL does not support removing enum values safely.
  }
}
