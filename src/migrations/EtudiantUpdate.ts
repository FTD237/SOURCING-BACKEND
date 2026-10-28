import { MigrationInterface, QueryRunner } from 'typeorm';

export class EtudiantUpdate1759000000000 implements MigrationInterface {
  name = 'EtudiantUpdate1759000000000';

  public async up(q: QueryRunner): Promise<void> {
    // Enum
    await q.query(`
      DO $$ BEGIN
        CREATE TYPE "niveau_etude_enum" AS ENUM
          ('FIRST_YEAR','SECOND_YEAR','THIRD_YEAR','FOURTH_YEAR','FIFTH_YEAR','SIX_YEAR');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    // scholar_level : ajout avec défaut, donc les lignes existantes sont remplies
    await q.query(`
      ALTER TABLE "etudiant"
      ADD COLUMN IF NOT EXISTS "scholar_level" "niveau_etude_enum"
      NOT NULL DEFAULT 'FIRST_YEAR'
    `);

    // nationality : 3 étapes pour une colonne NOT NULL
    await q.query(
      `ALTER TABLE "etudiant" ADD COLUMN IF NOT EXISTS "nationality" varchar`,
    );
    await q.query(
      `UPDATE "etudiant" SET "nationality" = 'Camerounais' WHERE "nationality" IS NULL`,
    );
    await q.query(
      `ALTER TABLE "etudiant" ALTER COLUMN "nationality" SET NOT NULL`,
    );

    // main_domain, tools : nullable, sans risque
    await q.query(
      `ALTER TABLE "etudiant" ADD COLUMN IF NOT EXISTS "main_domain" varchar`,
    );
    await q.query(
      `ALTER TABLE "etudiant" ADD COLUMN IF NOT EXISTS "tools" text array`,
    );

    // languages : NOT NULL avec défaut tableau vide
    await q.query(`
      ALTER TABLE "etudiant"
      ADD COLUMN IF NOT EXISTS "languages" text array NOT NULL DEFAULT '{}'
    `);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`ALTER TABLE "etudiant" DROP COLUMN IF EXISTS "languages"`);
    await q.query(`ALTER TABLE "etudiant" DROP COLUMN IF EXISTS "tools"`);
    await q.query(`ALTER TABLE "etudiant" DROP COLUMN IF EXISTS "main_domain"`);
    await q.query(`ALTER TABLE "etudiant" DROP COLUMN IF EXISTS "nationality"`);
    await q.query(
      `ALTER TABLE "etudiant" DROP COLUMN IF EXISTS "scholar_level"`,
    );
    await q.query(`DROP TYPE IF EXISTS "niveau_etude_enum"`);
  }
}
