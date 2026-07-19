import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSepayPayment1784850000000 implements MigrationInterface {
    name = 'AddSepayPayment1784850000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "checkout_sessions" ADD "payCode" character varying(16)`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_checkout_sessions_payCode" ON "checkout_sessions" ("payCode")`);
        await queryRunner.query(`ALTER TABLE "app_settings" ADD "sepayWebhookKey" character varying(128)`);
        await queryRunner.query(`CREATE TYPE "public"."sepay_transactions_status_enum" AS ENUM('MATCHED', 'NO_MATCH', 'DUPLICATE', 'NEEDS_REVIEW')`);
        await queryRunner.query(`CREATE TABLE "sepay_transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "sepayTxId" character varying(64) NOT NULL, "transferAmount" integer NOT NULL, "content" text, "accountNumber" character varying(30), "transactionDate" character varying(32), "matchedSessionId" uuid, "status" "public"."sepay_transactions_status_enum" NOT NULL, "rawPayload" json NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_sepay_transactions_sepayTxId" UNIQUE ("sepayTxId"), CONSTRAINT "PK_sepay_transactions_id" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "sepay_transactions"`);
        await queryRunner.query(`DROP TYPE "public"."sepay_transactions_status_enum"`);
        await queryRunner.query(`ALTER TABLE "app_settings" DROP COLUMN "sepayWebhookKey"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_checkout_sessions_payCode"`);
        await queryRunner.query(`ALTER TABLE "checkout_sessions" DROP COLUMN "payCode"`);
    }
}
