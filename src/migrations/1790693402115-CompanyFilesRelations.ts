import { MigrationInterface, QueryRunner } from 'typeorm';

export class CompanyFilesRelations1790693402115 implements MigrationInterface {
  name = 'CompanyFilesRelations1790693402115';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // --- Types enum (NiveauEtudeEnum sert à etudiant ET company)
    await queryRunner.query(
      `CREATE TYPE "public"."NiveauEtudeEnum" AS ENUM('FIRST_YEAR', 'SECOND_YEAR', 'THIRD_YEAR', 'FOURTH_YEAR', 'FIFTH_YEAR', 'SIX_YEAR')`,
    );
    await queryRunner.query(
      // <- remplacez par les valeurs réelles de RecruitmentStatusEnum
      `CREATE TYPE "public"."RecruitmentStatusEnum" AS ENUM('PAUSED', 'CLOSED', 'RECRUITING')`,
    );
    // --- company : colonnes NOT NULL ajoutées en 3 temps
    await queryRunner.query(
      `ALTER TABLE "company" ADD "company_name" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "company" ADD "company_description" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "company" ADD "contact_person" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "company" ADD "contact_phone" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "company" ADD "recruitment_status" "public"."RecruitmentStatusEnum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "company" ADD "minStudentLevel" "public"."NiveauEtudeEnum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "company" ADD "isPartner" boolean NOT NULL DEFAULT false`,
    );

    // valeurs de remplissage pour les lignes existantes (à adapter)
    await queryRunner.query(
      `UPDATE "company" SET
         "company_name" = 'Entreprise ' || LEFT("id"::text, 8),
         "company_description" = '',
         "contact_person" = '',
         "contact_phone" = 0,
         "recruitment_status" = 'CLOSED',
         "minStudentLevel" = 'FIRST_YEAR'`,
    );

    await queryRunner.query(
      `ALTER TABLE "company" ALTER COLUMN "company_name" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "company" ALTER COLUMN "company_description" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "company" ALTER COLUMN "contact_person" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "company" ALTER COLUMN "contact_phone" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "company" ALTER COLUMN "recruitment_status" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "company" ALTER COLUMN "minStudentLevel" SET NOT NULL`,
    );

    // --- logo / bannière
    await queryRunner.query(`ALTER TABLE "company" ADD "logo_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "company" ADD CONSTRAINT "UQ_23de0dcd3f7763e16c418cd8a9c" UNIQUE ("logo_id")`,
    );
    await queryRunner.query(`ALTER TABLE "company" ADD "banner_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "company" ADD CONSTRAINT "UQ_8103c24ed6e5e64ce093006b6ca" UNIQUE ("banner_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "company" ADD CONSTRAINT "FK_23de0dcd3f7763e16c418cd8a9c" FOREIGN KEY ("logo_id") REFERENCES "file"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "company" ADD CONSTRAINT "FK_8103c24ed6e5e64ce093006b6ca" FOREIGN KEY ("banner_id") REFERENCES "file"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // --- company
    await queryRunner.query(
      `ALTER TABLE "company" DROP CONSTRAINT "FK_8103c24ed6e5e64ce093006b6ca"`,
    );
    await queryRunner.query(
      `ALTER TABLE "company" DROP CONSTRAINT "FK_23de0dcd3f7763e16c418cd8a9c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "company" DROP CONSTRAINT "UQ_8103c24ed6e5e64ce093006b6ca"`,
    );
    await queryRunner.query(`ALTER TABLE "company" DROP COLUMN "banner_id"`);
    await queryRunner.query(
      `ALTER TABLE "company" DROP CONSTRAINT "UQ_23de0dcd3f7763e16c418cd8a9c"`,
    );
    await queryRunner.query(`ALTER TABLE "company" DROP COLUMN "logo_id"`);
    await queryRunner.query(`ALTER TABLE "company" DROP COLUMN "isPartner"`);
    await queryRunner.query(
      `ALTER TABLE "company" DROP COLUMN "minStudentLevel"`,
    );
    await queryRunner.query(
      `ALTER TABLE "company" DROP COLUMN "recruitment_status"`,
    );
    await queryRunner.query(
      `ALTER TABLE "company" DROP COLUMN "contact_phone"`,
    );
    await queryRunner.query(
      `ALTER TABLE "company" DROP COLUMN "contact_person"`,
    );
    await queryRunner.query(
      `ALTER TABLE "company" DROP COLUMN "company_description"`,
    );
    await queryRunner.query(`ALTER TABLE "company" DROP COLUMN "company_name"`);
    await queryRunner.query(`DROP TYPE "public"."RecruitmentStatusEnum"`);

    // --- etudiant : retour au type d'origine, valeurs conservées
    await queryRunner.query(
      `CREATE TYPE "public"."niveau_etude_enum" AS ENUM('FIRST_YEAR', 'SECOND_YEAR', 'THIRD_YEAR', 'FOURTH_YEAR', 'FIFTH_YEAR', 'SIX_YEAR')`,
    );
    await queryRunner.query(
      `ALTER TABLE "etudiant" ALTER COLUMN "scholar_level" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "etudiant" ALTER COLUMN "scholar_level"
        TYPE "public"."niveau_etude_enum"
        USING "scholar_level"::text::"public"."niveau_etude_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "etudiant" ALTER COLUMN "scholar_level" SET DEFAULT 'FIRST_YEAR'`,
    );
    await queryRunner.query(`DROP TYPE "public"."NiveauEtudeEnum"`);
    await queryRunner.query(
      `ALTER TABLE "etudiant" DROP COLUMN "phone_number"`,
    );
  }
}
