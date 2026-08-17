import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRefundTransactions1784850000002 implements MigrationInterface {
  name = 'AddRefundTransactions1784850000002';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "refund_transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "paymentTransactionId" uuid NOT NULL, "amount" integer NOT NULL, "method" "public"."payment_transactions_method_enum" NOT NULL, "reason" character varying(300) NOT NULL, "processedByUserId" integer NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_refund_transactions" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_refund_transactions_payment" ON "refund_transactions" ("paymentTransactionId")`);
    await queryRunner.query(`CREATE INDEX "IDX_refund_transactions_processor" ON "refund_transactions" ("processedByUserId")`);
    await queryRunner.query(`CREATE INDEX "IDX_refund_transactions_created" ON "refund_transactions" ("createdAt")`);
    await queryRunner.query(`ALTER TABLE "refund_transactions" ADD CONSTRAINT "FK_refund_transactions_payment" FOREIGN KEY ("paymentTransactionId") REFERENCES "payment_transactions"("id") ON DELETE RESTRICT`);
    await queryRunner.query(`ALTER TABLE "refund_transactions" ADD CONSTRAINT "FK_refund_transactions_processor" FOREIGN KEY ("processedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "refund_transactions" DROP CONSTRAINT "FK_refund_transactions_processor"`);
    await queryRunner.query(`ALTER TABLE "refund_transactions" DROP CONSTRAINT "FK_refund_transactions_payment"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_refund_transactions_created"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_refund_transactions_processor"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_refund_transactions_payment"`);
    await queryRunner.query(`DROP TABLE "refund_transactions"`);
  }
}
