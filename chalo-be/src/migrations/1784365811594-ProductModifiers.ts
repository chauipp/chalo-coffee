import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProductModifiers1784365811594 implements MigrationInterface {
  name = 'ProductModifiers1784365811594';
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."product_modifier_groups_selectiontype_enum" AS ENUM('SINGLE', 'MULTIPLE')`);
    await queryRunner.query(`CREATE TABLE "product_modifier_groups" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "productId" uuid NOT NULL, "name" character varying(80) NOT NULL, "selectionType" "public"."product_modifier_groups_selectiontype_enum" NOT NULL DEFAULT 'SINGLE', "isRequired" boolean NOT NULL DEFAULT false, "sortOrder" integer NOT NULL DEFAULT 0, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_product_modifier_groups" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_product_modifier_groups_product" ON "product_modifier_groups" ("productId")`);
    await queryRunner.query(`CREATE TABLE "product_modifier_options" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "groupId" uuid NOT NULL, "name" character varying(80) NOT NULL, "priceAdjustment" integer NOT NULL DEFAULT 0, "sortOrder" integer NOT NULL DEFAULT 0, CONSTRAINT "PK_product_modifier_options" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_product_modifier_options_group" ON "product_modifier_options" ("groupId")`);
    await queryRunner.query(`ALTER TABLE "product_modifier_groups" ADD CONSTRAINT "FK_product_modifier_groups_product" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE "product_modifier_options" ADD CONSTRAINT "FK_product_modifier_options_group" FOREIGN KEY ("groupId") REFERENCES "product_modifier_groups"("id") ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE "order_items" ADD "selectedModifiers" jsonb NOT NULL DEFAULT '[]'::jsonb`);
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "order_items" DROP COLUMN "selectedModifiers"`);
    await queryRunner.query(`ALTER TABLE "product_modifier_options" DROP CONSTRAINT "FK_product_modifier_options_group"`);
    await queryRunner.query(`ALTER TABLE "product_modifier_groups" DROP CONSTRAINT "FK_product_modifier_groups_product"`);
    await queryRunner.query(`DROP TABLE "product_modifier_options"`);
    await queryRunner.query(`DROP TABLE "product_modifier_groups"`);
    await queryRunner.query(`DROP TYPE "public"."product_modifier_groups_selectiontype_enum"`);
  }
}
