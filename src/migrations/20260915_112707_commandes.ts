import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_commandes_statut" AS ENUM('brouillon', 'attente-paiement', 'payee', 'preparation', 'expediee', 'livree', 'annulee', 'remboursee');
  CREATE TABLE "commandes_lignes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"produit_id" integer,
  	"titre" varchar NOT NULL,
  	"reference" varchar,
  	"taille" varchar,
  	"declinaison" varchar,
  	"prix_unitaire" numeric NOT NULL,
  	"quantite" numeric DEFAULT 1 NOT NULL
  );
  
  CREATE TABLE "commandes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"numero" varchar,
  	"statut" "enum_commandes_statut" DEFAULT 'brouillon' NOT NULL,
  	"client_email" varchar NOT NULL,
  	"client_telephone" varchar,
  	"client_prenom" varchar,
  	"client_nom" varchar,
  	"livraison_adresse" varchar,
  	"livraison_complement" varchar,
  	"livraison_code_postal" varchar,
  	"livraison_ville" varchar,
  	"livraison_pays" varchar DEFAULT 'France',
  	"sous_total" numeric,
  	"frais_port" numeric DEFAULT 0,
  	"total" numeric,
  	"paiement_fournisseur" varchar,
  	"paiement_reference" varchar,
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "commandes_id" integer;
  ALTER TABLE "commandes_lignes" ADD CONSTRAINT "commandes_lignes_produit_id_products_id_fk" FOREIGN KEY ("produit_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "commandes_lignes" ADD CONSTRAINT "commandes_lignes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."commandes"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "commandes_lignes_order_idx" ON "commandes_lignes" USING btree ("_order");
  CREATE INDEX "commandes_lignes_parent_id_idx" ON "commandes_lignes" USING btree ("_parent_id");
  CREATE INDEX "commandes_lignes_produit_idx" ON "commandes_lignes" USING btree ("produit_id");
  CREATE UNIQUE INDEX "commandes_numero_idx" ON "commandes" USING btree ("numero");
  CREATE INDEX "commandes_statut_idx" ON "commandes" USING btree ("statut");
  CREATE INDEX "commandes_updated_at_idx" ON "commandes" USING btree ("updated_at");
  CREATE INDEX "commandes_created_at_idx" ON "commandes" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_commandes_fk" FOREIGN KEY ("commandes_id") REFERENCES "public"."commandes"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_commandes_id_idx" ON "payload_locked_documents_rels" USING btree ("commandes_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "commandes_lignes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "commandes" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "commandes_lignes" CASCADE;
  DROP TABLE "commandes" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_commandes_fk";
  
  DROP INDEX "payload_locked_documents_rels_commandes_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "commandes_id";
  DROP TYPE "public"."enum_commandes_statut";`)
}
