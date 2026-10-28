import { MigrationInterface, QueryRunner } from 'typeorm';

export class EtudiantAvatarId1790758118037 implements MigrationInterface {
  name = 'EtudiantAvatarId1790758118037';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "etudiant" ADD "phone_number" integer`,
    );

    await queryRunner.query(`ALTER TABLE "etudiant" ADD "avatar_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "etudiant" ADD CONSTRAINT "UQ_715807ca0b9c5bc42f65b67ffde" UNIQUE ("avatar_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "etudiant" ADD CONSTRAINT "FK_715807ca0b9c5bc42f65b67ffde" FOREIGN KEY ("avatar_id") REFERENCES "file"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    // NiveauEtudeEnum existe déjà (créé par CompanyFilesRelations)
    await queryRunner.query(
      `ALTER TABLE "etudiant" ALTER COLUMN "scholar_level" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "etudiant" ALTER COLUMN "scholar_level"
       TYPE "public"."NiveauEtudeEnum"
       USING "scholar_level"::text::"public"."NiveauEtudeEnum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "etudiant" ALTER COLUMN "scholar_level" SET DEFAULT 'FIRST_YEAR'`,
    );
    await queryRunner.query(`DROP TYPE "public"."niveau_etude_enum"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
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

    await queryRunner.query(
      `ALTER TABLE "etudiant" DROP CONSTRAINT "FK_715807ca0b9c5bc42f65b67ffde"`,
    );
    await queryRunner.query(
      `ALTER TABLE "etudiant" DROP CONSTRAINT "UQ_715807ca0b9c5bc42f65b67ffde"`,
    );
    await queryRunner.query(`ALTER TABLE "etudiant" DROP COLUMN "avatar_id"`);
    await queryRunner.query(
      `ALTER TABLE "etudiant" DROP COLUMN "phone_number"`,
    );
  }
}
