import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "products_variantes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"taille" varchar,
  	"declinaison" varchar,
  	"reference" varchar,
  	"prix" numeric,
  	"stock" numeric,
  	"disponible" boolean DEFAULT true,
  	"woo_id" numeric
  );
  
  ALTER TABLE "products" ADD COLUMN "en_stock" boolean DEFAULT true;
  ALTER TABLE "products_variantes" ADD CONSTRAINT "products_variantes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "products_variantes_order_idx" ON "products_variantes" USING btree ("_order");
  CREATE INDEX "products_variantes_parent_id_idx" ON "products_variantes" USING btree ("_parent_id");
  CREATE INDEX "products_variantes_woo_id_idx" ON "products_variantes" USING btree ("woo_id");
  CREATE INDEX "products_en_stock_idx" ON "products" USING btree ("en_stock");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products_variantes" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "products_variantes" CASCADE;
  DROP INDEX "products_en_stock_idx";
  ALTER TABLE "products" DROP COLUMN "en_stock";`)
}
