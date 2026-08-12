import { MigrationInterface, QueryRunner } from 'typeorm';

export class ShiftReconciliation1784365811593 implements MigrationInterface {
  name = 'ShiftReconciliation1784365811593';
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."payment_transactions_method_enum" AS ENUM('CASH', 'BANK_TRANSFER', 'LEGACY')`);
    await queryRunner.query(`CREATE TYPE "public"."payment_transactions_source_enum" AS ENUM('STAFF', 'CUSTOMER_CONFIRMATION', 'LEGACY')`);
    await queryRunner.query(`CREATE TABLE "payment_transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tableId" uuid NOT NULL, "method" "public"."payment_transactions_method_enum" NOT NULL, "source" "public"."payment_transactions_source_enum" NOT NULL, "totalAmount" integer NOT NULL, "receivedAmount" integer, "changeAmount" integer, "collectedByUserId" integer, "cashShiftId" uuid, "paidAt" TIMESTAMP WITH TIME ZONE NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_payment_transactions" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_payment_transactions_paid_at" ON "payment_transactions" ("paidAt")`);
    await queryRunner.query(`CREATE INDEX "IDX_payment_transactions_cash_shift" ON "payment_transactions" ("cashShiftId")`);
    await queryRunner.query(`CREATE INDEX "IDX_payment_transactions_collector" ON "payment_transactions" ("collectedByUserId")`);
    await queryRunner.query(`CREATE TYPE "public"."cash_shifts_status_enum" AS ENUM('OPEN', 'CLOSED')`);
    await queryRunner.query(`CREATE TABLE "cash_shifts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" "public"."cash_shifts_status_enum" NOT NULL DEFAULT 'OPEN', "openingCash" integer NOT NULL DEFAULT 0, "openedByUserId" integer NOT NULL, "openedAt" TIMESTAMP WITH TIME ZONE NOT NULL, "countedCash" integer, "expectedCash" integer, "variance" integer, "closedByUserId" integer, "closedAt" TIMESTAMP WITH TIME ZONE, "note" text, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_cash_shifts" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_cash_shifts_one_open" ON "cash_shifts" ("status") WHERE "status" = 'OPEN'`);
    await queryRunner.query(`ALTER TABLE "payment_transactions" ADD CONSTRAINT "FK_payment_transactions_cash_shift" FOREIGN KEY ("cashShiftId") REFERENCES "cash_shifts"("id") ON DELETE SET NULL`);
    await queryRunner.query(`ALTER TABLE "payment_transactions" ADD CONSTRAINT "FK_payment_transactions_collector" FOREIGN KEY ("collectedByUserId") REFERENCES "users"("id") ON DELETE SET NULL`);
    await queryRunner.query(`CREATE TABLE "payment_allocations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "orderId" uuid NOT NULL, "paymentTransactionId" uuid NOT NULL, "amount" integer NOT NULL, CONSTRAINT "PK_payment_allocations" PRIMARY KEY ("id"), CONSTRAINT "UQ_payment_allocations_order" UNIQUE ("orderId"))`);
    await queryRunner.query(`CREATE INDEX "IDX_payment_allocations_transaction" ON "payment_allocations" ("paymentTransactionId")`);
    await queryRunner.query(`ALTER TABLE "payment_allocations" ADD CONSTRAINT "FK_payment_allocations_order" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT`);
    await queryRunner.query(`ALTER TABLE "payment_allocations" ADD CONSTRAINT "FK_payment_allocations_transaction" FOREIGN KEY ("paymentTransactionId") REFERENCES "payment_transactions"("id") ON DELETE CASCADE`);
    await queryRunner.query(`DO $$ DECLARE legacy_order RECORD; transaction_id uuid; BEGIN FOR legacy_order IN SELECT "id", "tableId", "totalAmount", "updatedAt" FROM "orders" WHERE "paidStatus" = true LOOP INSERT INTO "payment_transactions" ("tableId", "method", "source", "totalAmount", "paidAt") VALUES (legacy_order."tableId", 'LEGACY', 'LEGACY', legacy_order."totalAmount", legacy_order."updatedAt") RETURNING "id" INTO transaction_id; INSERT INTO "payment_allocations" ("orderId", "paymentTransactionId", "amount") VALUES (legacy_order."id", transaction_id, legacy_order."totalAmount"); END LOOP; END $$`);
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "payment_allocations" DROP CONSTRAINT "FK_payment_allocations_transaction"`); await queryRunner.query(`ALTER TABLE "payment_allocations" DROP CONSTRAINT "FK_payment_allocations_order"`); await queryRunner.query(`DROP TABLE "payment_allocations"`); await queryRunner.query(`ALTER TABLE "payment_transactions" DROP CONSTRAINT "FK_payment_transactions_collector"`); await queryRunner.query(`ALTER TABLE "payment_transactions" DROP CONSTRAINT "FK_payment_transactions_cash_shift"`); await queryRunner.query(`DROP TABLE "payment_transactions"`); await queryRunner.query(`DROP TYPE "public"."payment_transactions_source_enum"`); await queryRunner.query(`DROP TYPE "public"."payment_transactions_method_enum"`); await queryRunner.query(`DROP INDEX "public"."UQ_cash_shifts_one_open"`); await queryRunner.query(`DROP TABLE "cash_shifts"`); await queryRunner.query(`DROP TYPE "public"."cash_shifts_status_enum"`);
  }
}
