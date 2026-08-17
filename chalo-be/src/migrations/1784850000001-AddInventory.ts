import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInventory1784850000001 implements MigrationInterface {
  name = 'AddInventory1784850000001';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "ingredients" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "unit" character varying(16) NOT NULL, "onHand" numeric(12,3) NOT NULL DEFAULT '0', "reorderLevel" numeric(12,3) NOT NULL DEFAULT '0', "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_ingredients_name" UNIQUE ("name"), CONSTRAINT "PK_ingredients_id" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TYPE "public"."inventory_movement_type_enum" AS ENUM('OPENING', 'RECEIPT', 'ADJUSTMENT', 'SALE', 'CANCELLATION')`);
    await queryRunner.query(`CREATE TABLE "inventory_movements" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "ingredientId" uuid NOT NULL, "type" "public"."inventory_movement_type_enum" NOT NULL, "delta" numeric(12,3) NOT NULL, "onHandAfter" numeric(12,3) NOT NULL, "reason" character varying(300), "actorId" integer, "orderId" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_inventory_movements_id" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TABLE "product_recipes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "productId" uuid NOT NULL, "ingredientId" uuid NOT NULL, "quantity" numeric(12,3) NOT NULL, CONSTRAINT "UQ_product_recipes_product_ingredient" UNIQUE ("productId", "ingredientId"), CONSTRAINT "PK_product_recipes_id" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_inventory_movements_ingredient" ON "inventory_movements" ("ingredientId")`);
    await queryRunner.query(`CREATE INDEX "IDX_inventory_movements_actor" ON "inventory_movements" ("actorId")`);
    await queryRunner.query(`CREATE INDEX "IDX_inventory_movements_order" ON "inventory_movements" ("orderId")`);
    await queryRunner.query(`CREATE INDEX "IDX_product_recipes_product" ON "product_recipes" ("productId")`);
    await queryRunner.query(`CREATE INDEX "IDX_product_recipes_ingredient" ON "product_recipes" ("ingredientId")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "product_recipes"`);
    await queryRunner.query(`DROP TABLE "inventory_movements"`);
    await queryRunner.query(`DROP TYPE "public"."inventory_movement_type_enum"`);
    await queryRunner.query(`DROP TABLE "ingredients"`);
  }
}
