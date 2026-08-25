import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_footer_colonnes_items_link_type" AS ENUM('reference', 'custom');
  CREATE TABLE "footer_colonnes_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"link_type" "enum_footer_colonnes_items_link_type" DEFAULT 'reference',
  	"link_new_tab" boolean,
  	"link_url" varchar,
  	"link_label" varchar NOT NULL
  );
  
  CREATE TABLE "footer_colonnes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"titre" varchar NOT NULL
  );
  
  CREATE TABLE "footer_paiements" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL
  );
  
  ALTER TABLE "footer" ADD COLUMN "a_propos_titre" varchar DEFAULT 'À propos';
  ALTER TABLE "footer" ADD COLUMN "a_propos_texte" varchar;
  ALTER TABLE "footer" ADD COLUMN "contact_titre" varchar DEFAULT 'Nous contacter';
  ALTER TABLE "footer" ADD COLUMN "contact_mention" varchar;
  ALTER TABLE "footer" ADD COLUMN "contact_telephone" varchar;
  ALTER TABLE "footer" ADD COLUMN "contact_email" varchar;
  ALTER TABLE "footer" ADD COLUMN "contact_horaires" varchar;
  ALTER TABLE "footer_colonnes_items" ADD CONSTRAINT "footer_colonnes_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."footer_colonnes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_colonnes" ADD CONSTRAINT "footer_colonnes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."footer"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_paiements" ADD CONSTRAINT "footer_paiements_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."footer"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "footer_colonnes_items_order_idx" ON "footer_colonnes_items" USING btree ("_order");
  CREATE INDEX "footer_colonnes_items_parent_id_idx" ON "footer_colonnes_items" USING btree ("_parent_id");
  CREATE INDEX "footer_colonnes_order_idx" ON "footer_colonnes" USING btree ("_order");
  CREATE INDEX "footer_colonnes_parent_id_idx" ON "footer_colonnes" USING btree ("_parent_id");
  CREATE INDEX "footer_paiements_order_idx" ON "footer_paiements" USING btree ("_order");
  CREATE INDEX "footer_paiements_parent_id_idx" ON "footer_paiements" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "footer_colonnes_items" CASCADE;
  DROP TABLE "footer_colonnes" CASCADE;
  DROP TABLE "footer_paiements" CASCADE;
  ALTER TABLE "footer" DROP COLUMN "a_propos_titre";
  ALTER TABLE "footer" DROP COLUMN "a_propos_texte";
  ALTER TABLE "footer" DROP COLUMN "contact_titre";
  ALTER TABLE "footer" DROP COLUMN "contact_mention";
  ALTER TABLE "footer" DROP COLUMN "contact_telephone";
  ALTER TABLE "footer" DROP COLUMN "contact_email";
  ALTER TABLE "footer" DROP COLUMN "contact_horaires";
  DROP TYPE "public"."enum_footer_colonnes_items_link_type";`)
}
