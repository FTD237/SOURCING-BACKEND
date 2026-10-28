import { MigrationInterface, QueryRunner } from 'typeorm';

export class OffreChampsDetails1790942395908 implements MigrationInterface {
  name = 'OffreChampsDetails1790942395908';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Ajout en nullable (la table peut contenir des lignes)
    await queryRunner.query(
      `ALTER TABLE "offre" ADD "required_documents" text array`,
    );
    await queryRunner.query(`ALTER TABLE "offre" ADD "domain" text array`);
    // NiveauEtudeEnum est créé par CompanyFilesRelations
    await queryRunner.query(
      `ALTER TABLE "offre" ADD "level" "public"."NiveauEtudeEnum"`,
    );
    await queryRunner.query(`ALTER TABLE "offre" ADD "duration" bigint`);
    await queryRunner.query(
      `ALTER TABLE "offre" ADD "offre_ville" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "offre" ADD "offre_address" character varying`,
    );

    // 2. Remplissage (duration en secondes : 2592000 = 1 mois, le minimum autorisé)
    await queryRunner.query(
      `UPDATE "offre" SET
         "required_documents" = '{}',
         "domain" = '{}',
         "level" = 'FIRST_YEAR',
         "duration" = 2592000,
         "offre_ville" = '',
         "offre_address" = ''`,
    );
    await queryRunner.query(
      `UPDATE "offre" o SET
         "offre_ville" = COALESCE(c."localisation"->>'city', ''),
         "offre_address" = COALESCE(c."localisation"->>'address', '')
       FROM "company" c
       WHERE c."id"::text = o."companyId"::text`,
    );

    // 3. Contraintes NOT NULL
    await queryRunner.query(
      `ALTER TABLE "offre" ALTER COLUMN "required_documents" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "offre" ALTER COLUMN "domain" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "offre" ALTER COLUMN "level" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "offre" ALTER COLUMN "duration" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "offre" ALTER COLUMN "offre_ville" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "offre" ALTER COLUMN "offre_address" SET NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "offre" DROP COLUMN "offre_address"`);
    await queryRunner.query(`ALTER TABLE "offre" DROP COLUMN "offre_ville"`);
    await queryRunner.query(`ALTER TABLE "offre" DROP COLUMN "duration"`);
    await queryRunner.query(`ALTER TABLE "offre" DROP COLUMN "level"`);
    await queryRunner.query(`ALTER TABLE "offre" DROP COLUMN "domain"`);
    await queryRunner.query(
      `ALTER TABLE "offre" DROP COLUMN "required_documents"`,
    );
  }
}
