import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_parcours_entrees_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum_pages_blocks_index_categories_items_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum_pages_blocks_debuter_links_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum_pages_blocks_journal_links_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum_pages_blocks_journal_populate_by" AS ENUM('collection', 'selection');
  CREATE TYPE "public"."enum__pages_v_blocks_parcours_entrees_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum__pages_v_blocks_index_categories_items_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum__pages_v_blocks_debuter_links_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum__pages_v_blocks_journal_links_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum__pages_v_blocks_journal_populate_by" AS ENUM('collection', 'selection');
  CREATE TABLE "pages_hero_media_secondary" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer
  );
  
  CREATE TABLE "pages_hero_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"label" varchar
  );
  
  CREATE TABLE "pages_hero_marquee" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "pages_blocks_parcours_entrees" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"text" varchar,
  	"link_type" "enum_pages_blocks_parcours_entrees_link_type" DEFAULT 'reference',
  	"link_new_tab" boolean,
  	"link_url" varchar,
  	"link_label" varchar
  );
  
  CREATE TABLE "pages_blocks_parcours" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar DEFAULT 'Par où commencer',
  	"title" varchar,
  	"intro" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_index_categories_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"meta" varchar,
  	"link_type" "enum_pages_blocks_index_categories_items_link_type" DEFAULT 'reference',
  	"link_new_tab" boolean,
  	"link_url" varchar
  );
  
  CREATE TABLE "pages_blocks_index_categories" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar DEFAULT 'L''index',
  	"title" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_debuter_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"link_type" "enum_pages_blocks_debuter_links_link_type" DEFAULT 'reference',
  	"link_new_tab" boolean,
  	"link_url" varchar,
  	"link_label" varchar
  );
  
  CREATE TABLE "pages_blocks_debuter_etapes" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"text" varchar
  );
  
  CREATE TABLE "pages_blocks_debuter" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar DEFAULT 'Débuter la moto',
  	"title" varchar,
  	"title_accent" varchar,
  	"intro" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_journal_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"link_type" "enum_pages_blocks_journal_links_link_type" DEFAULT 'reference',
  	"link_new_tab" boolean,
  	"link_url" varchar,
  	"link_label" varchar
  );
  
  CREATE TABLE "pages_blocks_journal" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar DEFAULT 'Le journal',
  	"title" varchar,
  	"populate_by" "enum_pages_blocks_journal_populate_by" DEFAULT 'collection',
  	"limit" numeric DEFAULT 5,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_version_hero_media_secondary" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_version_hero_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"label" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_version_hero_marquee" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_parcours_entrees" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"text" varchar,
  	"link_type" "enum__pages_v_blocks_parcours_entrees_link_type" DEFAULT 'reference',
  	"link_new_tab" boolean,
  	"link_url" varchar,
  	"link_label" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_parcours" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar DEFAULT 'Par où commencer',
  	"title" varchar,
  	"intro" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_index_categories_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"meta" varchar,
  	"link_type" "enum__pages_v_blocks_index_categories_items_link_type" DEFAULT 'reference',
  	"link_new_tab" boolean,
  	"link_url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_index_categories" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar DEFAULT 'L''index',
  	"title" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_debuter_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"link_type" "enum__pages_v_blocks_debuter_links_link_type" DEFAULT 'reference',
  	"link_new_tab" boolean,
  	"link_url" varchar,
  	"link_label" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_debuter_etapes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_debuter" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar DEFAULT 'Débuter la moto',
  	"title" varchar,
  	"title_accent" varchar,
  	"intro" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_journal_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"link_type" "enum__pages_v_blocks_journal_links_link_type" DEFAULT 'reference',
  	"link_new_tab" boolean,
  	"link_url" varchar,
  	"link_label" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_journal" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar DEFAULT 'Le journal',
  	"title" varchar,
  	"populate_by" "enum__pages_v_blocks_journal_populate_by" DEFAULT 'collection',
  	"limit" numeric DEFAULT 5,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  ALTER TABLE "pages" ADD COLUMN "hero_eyebrow" varchar;
  ALTER TABLE "_pages_v" ADD COLUMN "version_hero_eyebrow" varchar;
  ALTER TABLE "pages_hero_media_secondary" ADD CONSTRAINT "pages_hero_media_secondary_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_hero_media_secondary" ADD CONSTRAINT "pages_hero_media_secondary_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_hero_stats" ADD CONSTRAINT "pages_hero_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_hero_marquee" ADD CONSTRAINT "pages_hero_marquee_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_parcours_entrees" ADD CONSTRAINT "pages_blocks_parcours_entrees_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_parcours"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_parcours" ADD CONSTRAINT "pages_blocks_parcours_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_index_categories_items" ADD CONSTRAINT "pages_blocks_index_categories_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_index_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_index_categories" ADD CONSTRAINT "pages_blocks_index_categories_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_debuter_links" ADD CONSTRAINT "pages_blocks_debuter_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_debuter"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_debuter_etapes" ADD CONSTRAINT "pages_blocks_debuter_etapes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_debuter"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_debuter" ADD CONSTRAINT "pages_blocks_debuter_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_journal_links" ADD CONSTRAINT "pages_blocks_journal_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_journal"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_journal" ADD CONSTRAINT "pages_blocks_journal_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_version_hero_media_secondary" ADD CONSTRAINT "_pages_v_version_hero_media_secondary_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_version_hero_media_secondary" ADD CONSTRAINT "_pages_v_version_hero_media_secondary_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_version_hero_stats" ADD CONSTRAINT "_pages_v_version_hero_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_version_hero_marquee" ADD CONSTRAINT "_pages_v_version_hero_marquee_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_parcours_entrees" ADD CONSTRAINT "_pages_v_blocks_parcours_entrees_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_parcours"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_parcours" ADD CONSTRAINT "_pages_v_blocks_parcours_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_index_categories_items" ADD CONSTRAINT "_pages_v_blocks_index_categories_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_index_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_index_categories" ADD CONSTRAINT "_pages_v_blocks_index_categories_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_debuter_links" ADD CONSTRAINT "_pages_v_blocks_debuter_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_debuter"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_debuter_etapes" ADD CONSTRAINT "_pages_v_blocks_debuter_etapes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_debuter"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_debuter" ADD CONSTRAINT "_pages_v_blocks_debuter_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_journal_links" ADD CONSTRAINT "_pages_v_blocks_journal_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_journal"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_journal" ADD CONSTRAINT "_pages_v_blocks_journal_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_hero_media_secondary_order_idx" ON "pages_hero_media_secondary" USING btree ("_order");
  CREATE INDEX "pages_hero_media_secondary_parent_id_idx" ON "pages_hero_media_secondary" USING btree ("_parent_id");
  CREATE INDEX "pages_hero_media_secondary_image_idx" ON "pages_hero_media_secondary" USING btree ("image_id");
  CREATE INDEX "pages_hero_stats_order_idx" ON "pages_hero_stats" USING btree ("_order");
  CREATE INDEX "pages_hero_stats_parent_id_idx" ON "pages_hero_stats" USING btree ("_parent_id");
  CREATE INDEX "pages_hero_marquee_order_idx" ON "pages_hero_marquee" USING btree ("_order");
  CREATE INDEX "pages_hero_marquee_parent_id_idx" ON "pages_hero_marquee" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_parcours_entrees_order_idx" ON "pages_blocks_parcours_entrees" USING btree ("_order");
  CREATE INDEX "pages_blocks_parcours_entrees_parent_id_idx" ON "pages_blocks_parcours_entrees" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_parcours_order_idx" ON "pages_blocks_parcours" USING btree ("_order");
  CREATE INDEX "pages_blocks_parcours_parent_id_idx" ON "pages_blocks_parcours" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_parcours_path_idx" ON "pages_blocks_parcours" USING btree ("_path");
  CREATE INDEX "pages_blocks_index_categories_items_order_idx" ON "pages_blocks_index_categories_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_index_categories_items_parent_id_idx" ON "pages_blocks_index_categories_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_index_categories_order_idx" ON "pages_blocks_index_categories" USING btree ("_order");
  CREATE INDEX "pages_blocks_index_categories_parent_id_idx" ON "pages_blocks_index_categories" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_index_categories_path_idx" ON "pages_blocks_index_categories" USING btree ("_path");
  CREATE INDEX "pages_blocks_debuter_links_order_idx" ON "pages_blocks_debuter_links" USING btree ("_order");
  CREATE INDEX "pages_blocks_debuter_links_parent_id_idx" ON "pages_blocks_debuter_links" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_debuter_etapes_order_idx" ON "pages_blocks_debuter_etapes" USING btree ("_order");
  CREATE INDEX "pages_blocks_debuter_etapes_parent_id_idx" ON "pages_blocks_debuter_etapes" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_debuter_order_idx" ON "pages_blocks_debuter" USING btree ("_order");
  CREATE INDEX "pages_blocks_debuter_parent_id_idx" ON "pages_blocks_debuter" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_debuter_path_idx" ON "pages_blocks_debuter" USING btree ("_path");
  CREATE INDEX "pages_blocks_journal_links_order_idx" ON "pages_blocks_journal_links" USING btree ("_order");
  CREATE INDEX "pages_blocks_journal_links_parent_id_idx" ON "pages_blocks_journal_links" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_journal_order_idx" ON "pages_blocks_journal" USING btree ("_order");
  CREATE INDEX "pages_blocks_journal_parent_id_idx" ON "pages_blocks_journal" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_journal_path_idx" ON "pages_blocks_journal" USING btree ("_path");
  CREATE INDEX "_pages_v_version_hero_media_secondary_order_idx" ON "_pages_v_version_hero_media_secondary" USING btree ("_order");
  CREATE INDEX "_pages_v_version_hero_media_secondary_parent_id_idx" ON "_pages_v_version_hero_media_secondary" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_version_hero_media_secondary_image_idx" ON "_pages_v_version_hero_media_secondary" USING btree ("image_id");
  CREATE INDEX "_pages_v_version_hero_stats_order_idx" ON "_pages_v_version_hero_stats" USING btree ("_order");
  CREATE INDEX "_pages_v_version_hero_stats_parent_id_idx" ON "_pages_v_version_hero_stats" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_version_hero_marquee_order_idx" ON "_pages_v_version_hero_marquee" USING btree ("_order");
  CREATE INDEX "_pages_v_version_hero_marquee_parent_id_idx" ON "_pages_v_version_hero_marquee" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_parcours_entrees_order_idx" ON "_pages_v_blocks_parcours_entrees" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_parcours_entrees_parent_id_idx" ON "_pages_v_blocks_parcours_entrees" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_parcours_order_idx" ON "_pages_v_blocks_parcours" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_parcours_parent_id_idx" ON "_pages_v_blocks_parcours" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_parcours_path_idx" ON "_pages_v_blocks_parcours" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_index_categories_items_order_idx" ON "_pages_v_blocks_index_categories_items" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_index_categories_items_parent_id_idx" ON "_pages_v_blocks_index_categories_items" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_index_categories_order_idx" ON "_pages_v_blocks_index_categories" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_index_categories_parent_id_idx" ON "_pages_v_blocks_index_categories" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_index_categories_path_idx" ON "_pages_v_blocks_index_categories" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_debuter_links_order_idx" ON "_pages_v_blocks_debuter_links" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_debuter_links_parent_id_idx" ON "_pages_v_blocks_debuter_links" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_debuter_etapes_order_idx" ON "_pages_v_blocks_debuter_etapes" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_debuter_etapes_parent_id_idx" ON "_pages_v_blocks_debuter_etapes" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_debuter_order_idx" ON "_pages_v_blocks_debuter" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_debuter_parent_id_idx" ON "_pages_v_blocks_debuter" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_debuter_path_idx" ON "_pages_v_blocks_debuter" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_journal_links_order_idx" ON "_pages_v_blocks_journal_links" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_journal_links_parent_id_idx" ON "_pages_v_blocks_journal_links" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_journal_order_idx" ON "_pages_v_blocks_journal" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_journal_parent_id_idx" ON "_pages_v_blocks_journal" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_journal_path_idx" ON "_pages_v_blocks_journal" USING btree ("_path");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_hero_media_secondary" CASCADE;
  DROP TABLE "pages_hero_stats" CASCADE;
  DROP TABLE "pages_hero_marquee" CASCADE;
  DROP TABLE "pages_blocks_parcours_entrees" CASCADE;
  DROP TABLE "pages_blocks_parcours" CASCADE;
  DROP TABLE "pages_blocks_index_categories_items" CASCADE;
  DROP TABLE "pages_blocks_index_categories" CASCADE;
  DROP TABLE "pages_blocks_debuter_links" CASCADE;
  DROP TABLE "pages_blocks_debuter_etapes" CASCADE;
  DROP TABLE "pages_blocks_debuter" CASCADE;
  DROP TABLE "pages_blocks_journal_links" CASCADE;
  DROP TABLE "pages_blocks_journal" CASCADE;
  DROP TABLE "_pages_v_version_hero_media_secondary" CASCADE;
  DROP TABLE "_pages_v_version_hero_stats" CASCADE;
  DROP TABLE "_pages_v_version_hero_marquee" CASCADE;
  DROP TABLE "_pages_v_blocks_parcours_entrees" CASCADE;
  DROP TABLE "_pages_v_blocks_parcours" CASCADE;
  DROP TABLE "_pages_v_blocks_index_categories_items" CASCADE;
  DROP TABLE "_pages_v_blocks_index_categories" CASCADE;
  DROP TABLE "_pages_v_blocks_debuter_links" CASCADE;
  DROP TABLE "_pages_v_blocks_debuter_etapes" CASCADE;
  DROP TABLE "_pages_v_blocks_debuter" CASCADE;
  DROP TABLE "_pages_v_blocks_journal_links" CASCADE;
  DROP TABLE "_pages_v_blocks_journal" CASCADE;
  ALTER TABLE "pages" DROP COLUMN "hero_eyebrow";
  ALTER TABLE "_pages_v" DROP COLUMN "version_hero_eyebrow";
  DROP TYPE "public"."enum_pages_blocks_parcours_entrees_link_type";
  DROP TYPE "public"."enum_pages_blocks_index_categories_items_link_type";
  DROP TYPE "public"."enum_pages_blocks_debuter_links_link_type";
  DROP TYPE "public"."enum_pages_blocks_journal_links_link_type";
  DROP TYPE "public"."enum_pages_blocks_journal_populate_by";
  DROP TYPE "public"."enum__pages_v_blocks_parcours_entrees_link_type";
  DROP TYPE "public"."enum__pages_v_blocks_index_categories_items_link_type";
  DROP TYPE "public"."enum__pages_v_blocks_debuter_links_link_type";
  DROP TYPE "public"."enum__pages_v_blocks_journal_links_link_type";
  DROP TYPE "public"."enum__pages_v_blocks_journal_populate_by";`)
}
