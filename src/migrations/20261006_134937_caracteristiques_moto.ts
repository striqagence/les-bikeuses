import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "posts" ADD COLUMN "moto_prix" numeric;
  ALTER TABLE "posts" ADD COLUMN "moto_type_moto" varchar;
  ALTER TABLE "posts" ADD COLUMN "moto_cylindree" numeric;
  ALTER TABLE "posts" ADD COLUMN "moto_hauteur_selle" numeric;
  ALTER TABLE "posts" ADD COLUMN "moto_poids" numeric;
  ALTER TABLE "posts" ADD COLUMN "moto_poids_avec_plein" boolean;
  ALTER TABLE "posts" ADD COLUMN "moto_permis_a2" boolean;
  ALTER TABLE "posts" ADD COLUMN "moto_annee" numeric;
  ALTER TABLE "_posts_v" ADD COLUMN "version_moto_prix" numeric;
  ALTER TABLE "_posts_v" ADD COLUMN "version_moto_type_moto" varchar;
  ALTER TABLE "_posts_v" ADD COLUMN "version_moto_cylindree" numeric;
  ALTER TABLE "_posts_v" ADD COLUMN "version_moto_hauteur_selle" numeric;
  ALTER TABLE "_posts_v" ADD COLUMN "version_moto_poids" numeric;
  ALTER TABLE "_posts_v" ADD COLUMN "version_moto_poids_avec_plein" boolean;
  ALTER TABLE "_posts_v" ADD COLUMN "version_moto_permis_a2" boolean;
  ALTER TABLE "_posts_v" ADD COLUMN "version_moto_annee" numeric;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "posts" DROP COLUMN "moto_prix";
  ALTER TABLE "posts" DROP COLUMN "moto_type_moto";
  ALTER TABLE "posts" DROP COLUMN "moto_cylindree";
  ALTER TABLE "posts" DROP COLUMN "moto_hauteur_selle";
  ALTER TABLE "posts" DROP COLUMN "moto_poids";
  ALTER TABLE "posts" DROP COLUMN "moto_poids_avec_plein";
  ALTER TABLE "posts" DROP COLUMN "moto_permis_a2";
  ALTER TABLE "posts" DROP COLUMN "moto_annee";
  ALTER TABLE "_posts_v" DROP COLUMN "version_moto_prix";
  ALTER TABLE "_posts_v" DROP COLUMN "version_moto_type_moto";
  ALTER TABLE "_posts_v" DROP COLUMN "version_moto_cylindree";
  ALTER TABLE "_posts_v" DROP COLUMN "version_moto_hauteur_selle";
  ALTER TABLE "_posts_v" DROP COLUMN "version_moto_poids";
  ALTER TABLE "_posts_v" DROP COLUMN "version_moto_poids_avec_plein";
  ALTER TABLE "_posts_v" DROP COLUMN "version_moto_permis_a2";
  ALTER TABLE "_posts_v" DROP COLUMN "version_moto_annee";`)
}
