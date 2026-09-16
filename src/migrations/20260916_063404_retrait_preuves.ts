import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_hero_stats" CASCADE;
  DROP TABLE "_pages_v_version_hero_stats" CASCADE;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "pages_hero_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"label" varchar
  );
  
  CREATE TABLE "_pages_v_version_hero_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"label" varchar,
  	"_uuid" varchar
  );
  
  ALTER TABLE "pages_hero_stats" ADD CONSTRAINT "pages_hero_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_version_hero_stats" ADD CONSTRAINT "_pages_v_version_hero_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_hero_stats_order_idx" ON "pages_hero_stats" USING btree ("_order");
  CREATE INDEX "pages_hero_stats_parent_id_idx" ON "pages_hero_stats" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_version_hero_stats_order_idx" ON "_pages_v_version_hero_stats" USING btree ("_order");
  CREATE INDEX "_pages_v_version_hero_stats_parent_id_idx" ON "_pages_v_version_hero_stats" USING btree ("_parent_id");`)
}
