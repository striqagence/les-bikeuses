import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_media_fond_decran" AS ENUM('smartphone', 'ordinateur');
  ALTER TABLE "media" ADD COLUMN "fond_decran" "enum_media_fond_decran";
  CREATE INDEX "media_fond_decran_idx" ON "media" USING btree ("fond_decran");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "media_fond_decran_idx";
  ALTER TABLE "media" DROP COLUMN "fond_decran";
  DROP TYPE "public"."enum_media_fond_decran";`)
}
