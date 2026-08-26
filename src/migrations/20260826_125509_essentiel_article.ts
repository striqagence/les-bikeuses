import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "posts_essentiel" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"texte" varchar
  );
  
  CREATE TABLE "_posts_v_version_essentiel" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"texte" varchar,
  	"_uuid" varchar
  );
  
  ALTER TABLE "posts_essentiel" ADD CONSTRAINT "posts_essentiel_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_posts_v_version_essentiel" ADD CONSTRAINT "_posts_v_version_essentiel_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_posts_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "posts_essentiel_order_idx" ON "posts_essentiel" USING btree ("_order");
  CREATE INDEX "posts_essentiel_parent_id_idx" ON "posts_essentiel" USING btree ("_parent_id");
  CREATE INDEX "_posts_v_version_essentiel_order_idx" ON "_posts_v_version_essentiel" USING btree ("_order");
  CREATE INDEX "_posts_v_version_essentiel_parent_id_idx" ON "_posts_v_version_essentiel" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "posts_essentiel" CASCADE;
  DROP TABLE "_posts_v_version_essentiel" CASCADE;`)
}
