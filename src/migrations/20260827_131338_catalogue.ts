import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_products_homologation" AS ENUM('ce-aa', 'ce-a', 'ce-b', 'ce-kp', 'ece-2206', 'aucune');
  CREATE TYPE "public"."enum_products_saison" AS ENUM('ete', 'mi-saison', 'hiver', 'toutes-saisons');
  CREATE TABLE "products_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  ALTER TABLE "products" ADD COLUMN "marque" varchar;
  ALTER TABLE "products" ADD COLUMN "homologation" "enum_products_homologation";
  ALTER TABLE "products" ADD COLUMN "saison" "enum_products_saison";
  ALTER TABLE "products" ADD COLUMN "matiere" varchar;
  ALTER TABLE "products" ADD COLUMN "protections" varchar;
  ALTER TABLE "products_texts" ADD CONSTRAINT "products_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "products_texts_order_parent" ON "products_texts" USING btree ("order","parent_id");
  CREATE INDEX "products_texts_text_idx" ON "products_texts" USING btree ("text");
  CREATE INDEX "products_marque_idx" ON "products" USING btree ("marque");
  CREATE INDEX "products_homologation_idx" ON "products" USING btree ("homologation");
  CREATE INDEX "products_saison_idx" ON "products" USING btree ("saison");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products_texts" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "products_texts" CASCADE;
  DROP INDEX "products_marque_idx";
  DROP INDEX "products_homologation_idx";
  DROP INDEX "products_saison_idx";
  ALTER TABLE "products" DROP COLUMN "marque";
  ALTER TABLE "products" DROP COLUMN "homologation";
  ALTER TABLE "products" DROP COLUMN "saison";
  ALTER TABLE "products" DROP COLUMN "matiere";
  ALTER TABLE "products" DROP COLUMN "protections";
  DROP TYPE "public"."enum_products_homologation";
  DROP TYPE "public"."enum_products_saison";`)
}
