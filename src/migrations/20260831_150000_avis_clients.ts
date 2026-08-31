import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "avis" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"woo_id" numeric NOT NULL,
  	"auteur" varchar NOT NULL,
  	"note" numeric NOT NULL,
  	"texte" varchar,
  	"publie_le" timestamp(3) with time zone NOT NULL,
  	"verifie" boolean,
  	"produit_nom" varchar,
  	"produit_slug" varchar,
  	"rayon" varchar,
  	"en_avant" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "avis_id" integer;
  CREATE UNIQUE INDEX "avis_woo_id_idx" ON "avis" USING btree ("woo_id");
  CREATE INDEX "avis_note_idx" ON "avis" USING btree ("note");
  CREATE INDEX "avis_publie_le_idx" ON "avis" USING btree ("publie_le");
  CREATE INDEX "avis_produit_slug_idx" ON "avis" USING btree ("produit_slug");
  CREATE INDEX "avis_rayon_idx" ON "avis" USING btree ("rayon");
  CREATE INDEX "avis_updated_at_idx" ON "avis" USING btree ("updated_at");
  CREATE INDEX "avis_created_at_idx" ON "avis" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_avis_fk" FOREIGN KEY ("avis_id") REFERENCES "public"."avis"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_avis_id_idx" ON "payload_locked_documents_rels" USING btree ("avis_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "avis" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "avis" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_avis_fk";
  
  DROP INDEX "payload_locked_documents_rels_avis_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "avis_id";`)
}
