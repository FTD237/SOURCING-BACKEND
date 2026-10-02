import { MigrationInterface, QueryRunner } from "typeorm";

export class OffreChampsDetails1790942395908 implements MigrationInterface {
    name = 'OffreChampsDetails1790942395908'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "offre" ADD "required_documents" text array NOT NULL`);
        await queryRunner.query(`ALTER TABLE "offre" ADD "domain" text array NOT NULL`);
        await queryRunner.query(`CREATE TYPE "public"."NiveauEtudeEnum" AS ENUM('FIRST_YEAR', 'SECOND_YEAR', 'THIRD_YEAR', 'FOURTH_YEAR', 'FIFTH_YEAR', 'SIX_YEAR')`);
        await queryRunner.query(`ALTER TABLE "offre" ADD "level" "public"."NiveauEtudeEnum" NOT NULL`);
        await queryRunner.query(`ALTER TABLE "offre" ADD "duration" bigint NOT NULL`);
        await queryRunner.query(`ALTER TABLE "offre" ADD "offre_ville" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "offre" ADD "offre_address" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "etudiant" ADD "phone_number" integer`);
        await queryRunner.query(`ALTER TABLE "etudiant" ADD "avatar_id" uuid`);
        await queryRunner.query(`ALTER TABLE "etudiant" ADD CONSTRAINT "UQ_715807ca0b9c5bc42f65b67ffde" UNIQUE ("avatar_id")`);
        await queryRunner.query(`ALTER TABLE "company" ADD "company_name" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "company" ADD "logo_id" uuid`);
        await queryRunner.query(`ALTER TABLE "company" ADD CONSTRAINT "UQ_23de0dcd3f7763e16c418cd8a9c" UNIQUE ("logo_id")`);
        await queryRunner.query(`ALTER TABLE "company" ADD "banner_id" uuid`);
        await queryRunner.query(`ALTER TABLE "company" ADD CONSTRAINT "UQ_8103c24ed6e5e64ce093006b6ca" UNIQUE ("banner_id")`);
        await queryRunner.query(`ALTER TABLE "company" ADD "company_description" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "company" ADD "contact_person" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "company" ADD "contact_phone" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "company" ADD "isPartner" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`CREATE TYPE "public"."RecruitmentStatusEnum" AS ENUM('RECRUITING', 'PAUSED', 'CLOSED')`);
        await queryRunner.query(`ALTER TABLE "company" ADD "recruitment_status" "public"."RecruitmentStatusEnum" NOT NULL`);
        await queryRunner.query(`CREATE TYPE "public"."NiveauEtudeEnum" AS ENUM('FIRST_YEAR', 'SECOND_YEAR', 'THIRD_YEAR', 'FOURTH_YEAR', 'FIFTH_YEAR', 'SIX_YEAR')`);
        await queryRunner.query(`ALTER TABLE "company" ADD "minStudentLevel" "public"."NiveauEtudeEnum" NOT NULL`);
        await queryRunner.query(`ALTER TYPE "public"."niveau_etude_enum" RENAME TO "niveau_etude_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."NiveauEtudeEnum" AS ENUM('FIRST_YEAR', 'SECOND_YEAR', 'THIRD_YEAR', 'FOURTH_YEAR', 'FIFTH_YEAR', 'SIX_YEAR')`);
        await queryRunner.query(`ALTER TABLE "etudiant" ALTER COLUMN "scholar_level" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "etudiant" ALTER COLUMN "scholar_level" TYPE "public"."NiveauEtudeEnum" USING "scholar_level"::"text"::"public"."NiveauEtudeEnum"`);
        await queryRunner.query(`ALTER TABLE "etudiant" ALTER COLUMN "scholar_level" SET DEFAULT 'FIRST_YEAR'`);
        await queryRunner.query(`DROP TYPE "public"."niveau_etude_enum_old"`);
        await queryRunner.query(`ALTER TABLE "etudiant" ADD CONSTRAINT "FK_715807ca0b9c5bc42f65b67ffde" FOREIGN KEY ("avatar_id") REFERENCES "file"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "company" ADD CONSTRAINT "FK_23de0dcd3f7763e16c418cd8a9c" FOREIGN KEY ("logo_id") REFERENCES "file"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "company" ADD CONSTRAINT "FK_8103c24ed6e5e64ce093006b6ca" FOREIGN KEY ("banner_id") REFERENCES "file"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "company" DROP CONSTRAINT "FK_8103c24ed6e5e64ce093006b6ca"`);
        await queryRunner.query(`ALTER TABLE "company" DROP CONSTRAINT "FK_23de0dcd3f7763e16c418cd8a9c"`);
        await queryRunner.query(`ALTER TABLE "etudiant" DROP CONSTRAINT "FK_715807ca0b9c5bc42f65b67ffde"`);
        await queryRunner.query(`CREATE TYPE "public"."niveau_etude_enum_old" AS ENUM('FIRST_YEAR', 'SECOND_YEAR', 'THIRD_YEAR', 'FOURTH_YEAR', 'FIFTH_YEAR', 'SIX_YEAR')`);
        await queryRunner.query(`ALTER TABLE "etudiant" ALTER COLUMN "scholar_level" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "etudiant" ALTER COLUMN "scholar_level" TYPE "public"."niveau_etude_enum_old" USING "scholar_level"::"text"::"public"."niveau_etude_enum_old"`);
        await queryRunner.query(`ALTER TABLE "etudiant" ALTER COLUMN "scholar_level" SET DEFAULT 'FIRST_YEAR'`);
        await queryRunner.query(`DROP TYPE "public"."NiveauEtudeEnum"`);
        await queryRunner.query(`ALTER TYPE "public"."niveau_etude_enum_old" RENAME TO "niveau_etude_enum"`);
        await queryRunner.query(`ALTER TABLE "company" DROP COLUMN "minStudentLevel"`);
        await queryRunner.query(`DROP TYPE "public"."NiveauEtudeEnum"`);
        await queryRunner.query(`ALTER TABLE "company" DROP COLUMN "recruitment_status"`);
        await queryRunner.query(`DROP TYPE "public"."RecruitmentStatusEnum"`);
        await queryRunner.query(`ALTER TABLE "company" DROP COLUMN "isPartner"`);
        await queryRunner.query(`ALTER TABLE "company" DROP COLUMN "contact_phone"`);
        await queryRunner.query(`ALTER TABLE "company" DROP COLUMN "contact_person"`);
        await queryRunner.query(`ALTER TABLE "company" DROP COLUMN "company_description"`);
        await queryRunner.query(`ALTER TABLE "company" DROP CONSTRAINT "UQ_8103c24ed6e5e64ce093006b6ca"`);
        await queryRunner.query(`ALTER TABLE "company" DROP COLUMN "banner_id"`);
        await queryRunner.query(`ALTER TABLE "company" DROP CONSTRAINT "UQ_23de0dcd3f7763e16c418cd8a9c"`);
        await queryRunner.query(`ALTER TABLE "company" DROP COLUMN "logo_id"`);
        await queryRunner.query(`ALTER TABLE "company" DROP COLUMN "company_name"`);
        await queryRunner.query(`ALTER TABLE "etudiant" DROP CONSTRAINT "UQ_715807ca0b9c5bc42f65b67ffde"`);
        await queryRunner.query(`ALTER TABLE "etudiant" DROP COLUMN "avatar_id"`);
        await queryRunner.query(`ALTER TABLE "etudiant" DROP COLUMN "phone_number"`);
        await queryRunner.query(`ALTER TABLE "offre" DROP COLUMN "offre_address"`);
        await queryRunner.query(`ALTER TABLE "offre" DROP COLUMN "offre_ville"`);
        await queryRunner.query(`ALTER TABLE "offre" DROP COLUMN "duration"`);
        await queryRunner.query(`ALTER TABLE "offre" DROP COLUMN "level"`);
        await queryRunner.query(`DROP TYPE "public"."NiveauEtudeEnum"`);
        await queryRunner.query(`ALTER TABLE "offre" DROP COLUMN "domain"`);
        await queryRunner.query(`ALTER TABLE "offre" DROP COLUMN "required_documents"`);
    }

}
