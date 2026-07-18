import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1784365811591 implements MigrationInterface {
    name = 'InitialSchema1784365811591'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "description" text, "imageUrl" character varying(500), "sortOrder" integer NOT NULL DEFAULT '0', "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."products_status_enum" AS ENUM('AVAILABLE', 'UNAVAILABLE', 'OUT_OF_STOCK')`);
        await queryRunner.query(`CREATE TABLE "products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "categoryId" uuid NOT NULL, "name" character varying(100) NOT NULL, "description" text, "imageUrl" character varying(500), "price" integer NOT NULL, "prepTime" integer NOT NULL DEFAULT '5', "status" "public"."products_status_enum" NOT NULL DEFAULT 'AVAILABLE', "isActive" boolean NOT NULL DEFAULT true, "sortOrder" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_ff56834e735fa78a15d0cf2192" ON "products" ("categoryId") `);
        await queryRunner.query(`CREATE TABLE "order_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "orderId" uuid NOT NULL, "productId" uuid NOT NULL, "productName" character varying(100) NOT NULL, "productImageUrl" character varying(500), "price" integer NOT NULL, "quantity" integer NOT NULL, "preparedQuantity" integer NOT NULL DEFAULT '0', "subtotal" integer NOT NULL, "note" text, CONSTRAINT "PK_005269d8574e6fac0493715c308" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."pager_tokens_status_enum" AS ENUM('WAITING', 'ASSIGNED', 'COMPLETED')`);
        await queryRunner.query(`CREATE TABLE "pager_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "number" integer NOT NULL, "status" "public"."pager_tokens_status_enum" NOT NULL DEFAULT 'ASSIGNED', "orderId" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_87639c44a43e9278ab8acb153b8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_09bbf7ecdc3a6b28607f1460d7" ON "pager_tokens" ("number") `);
        await queryRunner.query(`CREATE INDEX "IDX_4165e349d315a30a3618a78a7e" ON "pager_tokens" ("orderId") `);
        await queryRunner.query(`CREATE TYPE "public"."orders_status_enum" AS ENUM('PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED')`);
        await queryRunner.query(`CREATE TABLE "orders" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tableId" uuid NOT NULL, "tableToken" character varying(255) NOT NULL, "status" "public"."orders_status_enum" NOT NULL DEFAULT 'PENDING', "paidStatus" boolean NOT NULL DEFAULT false, "totalAmount" integer NOT NULL, "estimatedWaitMinutes" integer, "note" text, "paymentRequested" boolean NOT NULL DEFAULT false, "pagerId" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_2a7fdd7af437285a3ef0fc8b64" ON "orders" ("tableId") `);
        await queryRunner.query(`CREATE INDEX "IDX_33c02ffdcef9fbca050414f71b" ON "orders" ("tableToken") `);
        await queryRunner.query(`CREATE INDEX "IDX_baa44d00e5a16410bb4ecddf43" ON "orders" ("pagerId") `);
        await queryRunner.query(`CREATE INDEX "IDX_1f4b9818a08b822a31493fdee9" ON "orders" ("createdAt") `);
        await queryRunner.query(`CREATE TYPE "public"."tables_status_enum" AS ENUM('AVAILABLE', 'OCCUPIED')`);
        await queryRunner.query(`CREATE TABLE "tables" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(50) NOT NULL, "area" character varying(100), "status" "public"."tables_status_enum" NOT NULL DEFAULT 'AVAILABLE', "qrToken" character varying(255) NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_0fc85221960b588e27d825c4abd" UNIQUE ("qrToken"), CONSTRAINT "PK_7cf2aca7af9550742f855d4eb69" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('ADMIN', 'MODERATOR', 'CUSTOMER')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" SERIAL NOT NULL, "username" character varying(50) NOT NULL, "password" character varying(255) NOT NULL, "fullName" character varying(100) NOT NULL, "avatar" character varying(500), "role" "public"."users_role_enum" NOT NULL DEFAULT 'MODERATOR', "isActive" boolean NOT NULL DEFAULT true, "currentRefreshTokenHash" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "app_settings" ("id" integer NOT NULL DEFAULT '1', "waitTimeEnabled" boolean NOT NULL DEFAULT true, "baristaCount" integer NOT NULL DEFAULT '3', "bankBin" character varying(6), "bankAccountNo" character varying(30), "bankAccountName" character varying(100), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "CHK_1c3087db8170680a7788103713" CHECK ("id" = 1), CONSTRAINT "PK_4800b266ba790931744b3e53a74" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."checkout_sessions_status_enum" AS ENUM('PENDING', 'COMPLETED', 'CANCELLED')`);
        await queryRunner.query(`CREATE TABLE "checkout_sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tableToken" character varying(255) NOT NULL, "tableId" uuid NOT NULL, "orderIds" json NOT NULL, "totalAmount" integer NOT NULL, "status" "public"."checkout_sessions_status_enum" NOT NULL DEFAULT 'PENDING', "clientSecret" character varying(64) NOT NULL, "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5730b2bbc190203a94941d82bd1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_a0ce9094eaceeaeb21c328cfc8" ON "checkout_sessions" ("tableToken") `);
        await queryRunner.query(`CREATE INDEX "IDX_7618ff18516cbf928b15dc337b" ON "checkout_sessions" ("expiresAt") `);
        await queryRunner.query(`ALTER TABLE "products" ADD CONSTRAINT "FK_ff56834e735fa78a15d0cf21926" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_items" ADD CONSTRAINT "FK_f1d359a55923bb45b057fbdab0d" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_items" ADD CONSTRAINT "FK_cdb99c05982d5191ac8465ac010" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pager_tokens" ADD CONSTRAINT "FK_4165e349d315a30a3618a78a7ea" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_baa44d00e5a16410bb4ecddf437" FOREIGN KEY ("pagerId") REFERENCES "pager_tokens"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_2a7fdd7af437285a3ef0fc8b64f" FOREIGN KEY ("tableId") REFERENCES "tables"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_2a7fdd7af437285a3ef0fc8b64f"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_baa44d00e5a16410bb4ecddf437"`);
        await queryRunner.query(`ALTER TABLE "pager_tokens" DROP CONSTRAINT "FK_4165e349d315a30a3618a78a7ea"`);
        await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "FK_cdb99c05982d5191ac8465ac010"`);
        await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "FK_f1d359a55923bb45b057fbdab0d"`);
        await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_ff56834e735fa78a15d0cf21926"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7618ff18516cbf928b15dc337b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a0ce9094eaceeaeb21c328cfc8"`);
        await queryRunner.query(`DROP TABLE "checkout_sessions"`);
        await queryRunner.query(`DROP TYPE "public"."checkout_sessions_status_enum"`);
        await queryRunner.query(`DROP TABLE "app_settings"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`DROP TABLE "tables"`);
        await queryRunner.query(`DROP TYPE "public"."tables_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1f4b9818a08b822a31493fdee9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_baa44d00e5a16410bb4ecddf43"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_33c02ffdcef9fbca050414f71b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2a7fdd7af437285a3ef0fc8b64"`);
        await queryRunner.query(`DROP TABLE "orders"`);
        await queryRunner.query(`DROP TYPE "public"."orders_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4165e349d315a30a3618a78a7e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_09bbf7ecdc3a6b28607f1460d7"`);
        await queryRunner.query(`DROP TABLE "pager_tokens"`);
        await queryRunner.query(`DROP TYPE "public"."pager_tokens_status_enum"`);
        await queryRunner.query(`DROP TABLE "order_items"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ff56834e735fa78a15d0cf2192"`);
        await queryRunner.query(`DROP TABLE "products"`);
        await queryRunner.query(`DROP TYPE "public"."products_status_enum"`);
        await queryRunner.query(`DROP TABLE "categories"`);
    }

}
