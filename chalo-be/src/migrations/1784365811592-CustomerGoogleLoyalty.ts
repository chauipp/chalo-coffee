import { MigrationInterface, QueryRunner } from 'typeorm';

export class CustomerGoogleLoyalty1784365811592
  implements MigrationInterface
{
  name = 'CustomerGoogleLoyalty1784365811592';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "googleSubject" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "email" character varying(320)`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD "customerId" integer`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_users_google_subject" ON "users" ("googleSubject") WHERE "googleSubject" IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_users_email" ON "users" ("email") WHERE "email" IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_orders_customer_id" ON "orders" ("customerId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "FK_orders_customer" FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."customer_table_sessions_status_enum" AS ENUM('ACTIVE', 'CLOSED', 'EXPIRED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "customer_table_sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "customerId" integer NOT NULL, "tableId" uuid NOT NULL, "tableToken" character varying(255) NOT NULL, "status" "public"."customer_table_sessions_status_enum" NOT NULL DEFAULT 'ACTIVE', "startedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "lastActivityAt" TIMESTAMP WITH TIME ZONE NOT NULL, "paidAt" TIMESTAMP WITH TIME ZONE, "endedAt" TIMESTAMP WITH TIME ZONE, "businessDate" date NOT NULL, "endedReason" character varying(50), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_customer_table_sessions" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_customer_table_sessions_customer_status_date" ON "customer_table_sessions" ("customerId", "status", "businessDate")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_customer_table_sessions_customer_id" ON "customer_table_sessions" ("customerId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_customer_table_sessions_table_id" ON "customer_table_sessions" ("tableId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_table_sessions" ADD CONSTRAINT "FK_customer_table_sessions_customer" FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_table_sessions" ADD CONSTRAINT "FK_customer_table_sessions_table" FOREIGN KEY ("tableId") REFERENCES "tables"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."loyalty_point_transactions_type_enum" AS ENUM('EARN')`,
    );
    await queryRunner.query(
      `CREATE TABLE "loyalty_point_transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "customerId" integer NOT NULL, "orderId" uuid NOT NULL, "points" integer NOT NULL, "type" "public"."loyalty_point_transactions_type_enum" NOT NULL DEFAULT 'EARN', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_loyalty_point_transactions_order" UNIQUE ("orderId"), CONSTRAINT "PK_loyalty_point_transactions" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_loyalty_point_transactions_customer_created" ON "loyalty_point_transactions" ("customerId", "createdAt")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_loyalty_point_transactions_customer_id" ON "loyalty_point_transactions" ("customerId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "loyalty_point_transactions" ADD CONSTRAINT "FK_loyalty_point_transactions_customer" FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "loyalty_point_transactions" ADD CONSTRAINT "FK_loyalty_point_transactions_order" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "loyalty_point_transactions" DROP CONSTRAINT "FK_loyalty_point_transactions_order"`,
    );
    await queryRunner.query(
      `ALTER TABLE "loyalty_point_transactions" DROP CONSTRAINT "FK_loyalty_point_transactions_customer"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_loyalty_point_transactions_customer_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_loyalty_point_transactions_customer_created"`,
    );
    await queryRunner.query(`DROP TABLE "loyalty_point_transactions"`);
    await queryRunner.query(`DROP TYPE "public"."loyalty_point_transactions_type_enum"`);

    await queryRunner.query(
      `ALTER TABLE "customer_table_sessions" DROP CONSTRAINT "FK_customer_table_sessions_table"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_table_sessions" DROP CONSTRAINT "FK_customer_table_sessions_customer"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_customer_table_sessions_table_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_customer_table_sessions_customer_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_customer_table_sessions_customer_status_date"`,
    );
    await queryRunner.query(`DROP TABLE "customer_table_sessions"`);
    await queryRunner.query(`DROP TYPE "public"."customer_table_sessions_status_enum"`);

    await queryRunner.query(
      `ALTER TABLE "orders" DROP CONSTRAINT "FK_orders_customer"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_orders_customer_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_users_email"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_users_google_subject"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "customerId"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "email"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "googleSubject"`);
  }
}
