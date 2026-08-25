import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_slider_slides_links_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum_pages_blocks_slider_slides_position_image" AS ENUM('center', 'left', 'right', 'top', 'bottom');
  CREATE TYPE "public"."enum_pages_blocks_slider_slides_cote_carton" AS ENUM('gauche', 'droite');
  CREATE TYPE "public"."enum__pages_v_blocks_slider_slides_links_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum__pages_v_blocks_slider_slides_position_image" AS ENUM('center', 'left', 'right', 'top', 'bottom');
  CREATE TYPE "public"."enum__pages_v_blocks_slider_slides_cote_carton" AS ENUM('gauche', 'droite');
  CREATE TYPE "public"."enum_header_nav_items_sous_items_link_type" AS ENUM('reference', 'custom');
  CREATE TABLE "pages_blocks_slider_slides_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"link_type" "enum_pages_blocks_slider_slides_links_link_type" DEFAULT 'reference',
  	"link_new_tab" boolean,
  	"link_url" varchar,
  	"link_label" varchar
  );
  
  CREATE TABLE "pages_blocks_slider_slides" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"position_image" "enum_pages_blocks_slider_slides_position_image" DEFAULT 'center',
  	"cote_carton" "enum_pages_blocks_slider_slides_cote_carton" DEFAULT 'gauche',
  	"eyebrow" varchar,
  	"titre" varchar,
  	"titre_accent" varchar,
  	"texte" varchar
  );
  
  CREATE TABLE "pages_blocks_slider" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"defilement_auto" boolean DEFAULT true,
  	"delai" numeric DEFAULT 6,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_slider_slides_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"link_type" "enum__pages_v_blocks_slider_slides_links_link_type" DEFAULT 'reference',
  	"link_new_tab" boolean,
  	"link_url" varchar,
  	"link_label" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_slider_slides" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"position_image" "enum__pages_v_blocks_slider_slides_position_image" DEFAULT 'center',
  	"cote_carton" "enum__pages_v_blocks_slider_slides_cote_carton" DEFAULT 'gauche',
  	"eyebrow" varchar,
  	"titre" varchar,
  	"titre_accent" varchar,
  	"texte" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_slider" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"defilement_auto" boolean DEFAULT true,
  	"delai" numeric DEFAULT 6,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "header_nav_items_sous_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"link_type" "enum_header_nav_items_sous_items_link_type" DEFAULT 'reference',
  	"link_new_tab" boolean,
  	"link_url" varchar,
  	"link_label" varchar NOT NULL,
  	"meta" varchar
  );
  
  ALTER TABLE "header_nav_items" ADD COLUMN "accent" boolean DEFAULT false;
  ALTER TABLE "header" ADD COLUMN "annonce_actif" boolean DEFAULT true;
  ALTER TABLE "header" ADD COLUMN "annonce_texte" varchar;
  ALTER TABLE "header" ADD COLUMN "annonce_url" varchar;
  ALTER TABLE "header" ADD COLUMN "baseline" varchar DEFAULT 'LE site pour les femmes à moto';
  ALTER TABLE "pages_blocks_slider_slides_links" ADD CONSTRAINT "pages_blocks_slider_slides_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_slider_slides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_slider_slides" ADD CONSTRAINT "pages_blocks_slider_slides_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_slider_slides" ADD CONSTRAINT "pages_blocks_slider_slides_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_slider"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_slider" ADD CONSTRAINT "pages_blocks_slider_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_slider_slides_links" ADD CONSTRAINT "_pages_v_blocks_slider_slides_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_slider_slides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_slider_slides" ADD CONSTRAINT "_pages_v_blocks_slider_slides_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_slider_slides" ADD CONSTRAINT "_pages_v_blocks_slider_slides_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_slider"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_slider" ADD CONSTRAINT "_pages_v_blocks_slider_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "header_nav_items_sous_items" ADD CONSTRAINT "header_nav_items_sous_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."header_nav_items"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_slider_slides_links_order_idx" ON "pages_blocks_slider_slides_links" USING btree ("_order");
  CREATE INDEX "pages_blocks_slider_slides_links_parent_id_idx" ON "pages_blocks_slider_slides_links" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_slider_slides_order_idx" ON "pages_blocks_slider_slides" USING btree ("_order");
  CREATE INDEX "pages_blocks_slider_slides_parent_id_idx" ON "pages_blocks_slider_slides" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_slider_slides_image_idx" ON "pages_blocks_slider_slides" USING btree ("image_id");
  CREATE INDEX "pages_blocks_slider_order_idx" ON "pages_blocks_slider" USING btree ("_order");
  CREATE INDEX "pages_blocks_slider_parent_id_idx" ON "pages_blocks_slider" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_slider_path_idx" ON "pages_blocks_slider" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_slider_slides_links_order_idx" ON "_pages_v_blocks_slider_slides_links" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_slider_slides_links_parent_id_idx" ON "_pages_v_blocks_slider_slides_links" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_slider_slides_order_idx" ON "_pages_v_blocks_slider_slides" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_slider_slides_parent_id_idx" ON "_pages_v_blocks_slider_slides" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_slider_slides_image_idx" ON "_pages_v_blocks_slider_slides" USING btree ("image_id");
  CREATE INDEX "_pages_v_blocks_slider_order_idx" ON "_pages_v_blocks_slider" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_slider_parent_id_idx" ON "_pages_v_blocks_slider" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_slider_path_idx" ON "_pages_v_blocks_slider" USING btree ("_path");
  CREATE INDEX "header_nav_items_sous_items_order_idx" ON "header_nav_items_sous_items" USING btree ("_order");
  CREATE INDEX "header_nav_items_sous_items_parent_id_idx" ON "header_nav_items_sous_items" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_slider_slides_links" CASCADE;
  DROP TABLE "pages_blocks_slider_slides" CASCADE;
  DROP TABLE "pages_blocks_slider" CASCADE;
  DROP TABLE "_pages_v_blocks_slider_slides_links" CASCADE;
  DROP TABLE "_pages_v_blocks_slider_slides" CASCADE;
  DROP TABLE "_pages_v_blocks_slider" CASCADE;
  DROP TABLE "header_nav_items_sous_items" CASCADE;
  ALTER TABLE "header_nav_items" DROP COLUMN "accent";
  ALTER TABLE "header" DROP COLUMN "annonce_actif";
  ALTER TABLE "header" DROP COLUMN "annonce_texte";
  ALTER TABLE "header" DROP COLUMN "annonce_url";
  ALTER TABLE "header" DROP COLUMN "baseline";
  DROP TYPE "public"."enum_pages_blocks_slider_slides_links_link_type";
  DROP TYPE "public"."enum_pages_blocks_slider_slides_position_image";
  DROP TYPE "public"."enum_pages_blocks_slider_slides_cote_carton";
  DROP TYPE "public"."enum__pages_v_blocks_slider_slides_links_link_type";
  DROP TYPE "public"."enum__pages_v_blocks_slider_slides_position_image";
  DROP TYPE "public"."enum__pages_v_blocks_slider_slides_cote_carton";
  DROP TYPE "public"."enum_header_nav_items_sous_items_link_type";`)
}
