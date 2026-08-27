import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products" ADD COLUMN "woo_id" numeric;
  ALTER TABLE "products" ADD COLUMN "source_url" varchar;
  CREATE INDEX "products_woo_id_idx" ON "products" USING btree ("woo_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "products_woo_id_idx";
  ALTER TABLE "products" DROP COLUMN "woo_id";
  ALTER TABLE "products" DROP COLUMN "source_url";`)
}
