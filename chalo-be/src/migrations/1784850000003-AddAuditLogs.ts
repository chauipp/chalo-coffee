import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuditLogs1784850000003 implements MigrationInterface {
  name = 'AddAuditLogs1784850000003';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "actorUserId" integer, "action" character varying(64) NOT NULL, "entityType" character varying(64) NOT NULL, "entityId" character varying(64), "metadata" jsonb, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_audit_logs" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_audit_logs_actor" ON "audit_logs" ("actorUserId")`);
    await queryRunner.query(`CREATE INDEX "IDX_audit_logs_action" ON "audit_logs" ("action")`);
    await queryRunner.query(`CREATE INDEX "IDX_audit_logs_entity_type" ON "audit_logs" ("entityType")`);
    await queryRunner.query(`CREATE INDEX "IDX_audit_logs_entity_id" ON "audit_logs" ("entityId")`);
    await queryRunner.query(`CREATE INDEX "IDX_audit_logs_created" ON "audit_logs" ("createdAt")`);
    await queryRunner.query(`ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_audit_logs_actor" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE SET NULL`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_audit_logs_actor"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_audit_logs_created"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_audit_logs_entity_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_audit_logs_entity_type"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_audit_logs_action"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_audit_logs_actor"`);
    await queryRunner.query(`DROP TABLE "audit_logs"`);
  }
}
