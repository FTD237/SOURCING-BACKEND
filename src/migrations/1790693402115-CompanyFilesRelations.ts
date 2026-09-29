import { MigrationInterface, QueryRunner } from "typeorm";

export class CompanyFilesRelations1790693402115 implements MigrationInterface {
    name = 'CompanyFilesRelations1790693402115'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "etudiant" ADD "phone_number" integer`);
        await queryRunner.query(`ALTER TABLE "company" ADD "company_name" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "company" ADD "logo_id" uuid`);
        await queryRunner.query(`ALTER TABLE "company" ADD CONSTRAINT "UQ_23de0dcd3f7763e16c418cd8a9c" UNIQUE ("logo_id")`);
        await queryRunner.query(`ALTER TABLE "company" ADD "banner_id" uuid`);
        await queryRunner.query(`ALTER TABLE "company" ADD CONSTRAINT "UQ_8103c24ed6e5e64ce093006b6ca" UNIQUE ("banner_id")`);
        await queryRunner.query(`ALTER TABLE "company" ADD "company_description" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "company" ADD "contact_person" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "company" ADD "contact_phone" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "company" ADD "isPartner" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "company" ADD "recruitment_status" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "company" ADD "minStudentLevel" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "etudiant" DROP COLUMN "scholar_level"`);
        await queryRunner.query(`DROP TYPE "public"."niveau_etude_enum"`);
        await queryRunner.query(`ALTER TABLE "etudiant" ADD "scholar_level" character varying NOT NULL DEFAULT 'FIRST_YEAR'`);
        await queryRunner.query(`ALTER TABLE "company" ADD CONSTRAINT "FK_23de0dcd3f7763e16c418cd8a9c" FOREIGN KEY ("logo_id") REFERENCES "file"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "company" ADD CONSTRAINT "FK_8103c24ed6e5e64ce093006b6ca" FOREIGN KEY ("banner_id") REFERENCES "file"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "company" DROP CONSTRAINT "FK_8103c24ed6e5e64ce093006b6ca"`);
        await queryRunner.query(`ALTER TABLE "company" DROP CONSTRAINT "FK_23de0dcd3f7763e16c418cd8a9c"`);
        await queryRunner.query(`ALTER TABLE "etudiant" DROP COLUMN "scholar_level"`);
        await queryRunner.query(`CREATE TYPE "public"."niveau_etude_enum" AS ENUM('FIRST_YEAR', 'SECOND_YEAR', 'THIRD_YEAR', 'FOURTH_YEAR', 'FIFTH_YEAR', 'SIX_YEAR')`);
        await queryRunner.query(`ALTER TABLE "etudiant" ADD "scholar_level" "public"."niveau_etude_enum" NOT NULL DEFAULT 'FIRST_YEAR'`);
        await queryRunner.query(`ALTER TABLE "company" DROP COLUMN "minStudentLevel"`);
        await queryRunner.query(`ALTER TABLE "company" DROP COLUMN "recruitment_status"`);
        await queryRunner.query(`ALTER TABLE "company" DROP COLUMN "isPartner"`);
        await queryRunner.query(`ALTER TABLE "company" DROP COLUMN "contact_phone"`);
        await queryRunner.query(`ALTER TABLE "company" DROP COLUMN "contact_person"`);
        await queryRunner.query(`ALTER TABLE "company" DROP COLUMN "company_description"`);
        await queryRunner.query(`ALTER TABLE "company" DROP CONSTRAINT "UQ_8103c24ed6e5e64ce093006b6ca"`);
        await queryRunner.query(`ALTER TABLE "company" DROP COLUMN "banner_id"`);
        await queryRunner.query(`ALTER TABLE "company" DROP CONSTRAINT "UQ_23de0dcd3f7763e16c418cd8a9c"`);
        await queryRunner.query(`ALTER TABLE "company" DROP COLUMN "logo_id"`);
        await queryRunner.query(`ALTER TABLE "company" DROP COLUMN "company_name"`);
        await queryRunner.query(`ALTER TABLE "etudiant" DROP COLUMN "phone_number"`);
    }

}
