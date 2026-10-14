import { MigrationInterface, QueryRunner } from "typeorm";

export class AddJobseekerAndExpMedia1791975371947 implements MigrationInterface {
    name = 'AddJobseekerAndExpMedia1791975371947'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."jobseeker_statut_enum" AS ENUM('actif', 'inactif', 'supprime', 'EN_ATTENTE_ACTIVATION')`);
        await queryRunner.query(`CREATE TABLE "jobseeker" ("dte_creation" TIMESTAMP NOT NULL DEFAULT now(), "dte_modif" TIMESTAMP NOT NULL DEFAULT now(), "statut" "public"."jobseeker_statut_enum" NOT NULL DEFAULT 'actif', "dte_suppression" TIMESTAMP, "create_by" character varying, "updated_by" character varying, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "studentId" uuid NOT NULL, "entreprise" character varying, "poste" character varying, "is_jobless" boolean NOT NULL DEFAULT true, CONSTRAINT "REL_1836532bbed1fae0388ef3e33b" UNIQUE ("studentId"), CONSTRAINT "PK_aaa8de62b5cfc465926e0c0a7e3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "experience" ADD "media_ids" uuid array NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "jobseeker" ADD CONSTRAINT "FK_1836532bbed1fae0388ef3e33bd" FOREIGN KEY ("studentId") REFERENCES "etudiant"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "jobseeker" DROP CONSTRAINT "FK_1836532bbed1fae0388ef3e33bd"`);
        await queryRunner.query(`ALTER TABLE "experience" DROP COLUMN "media_ids"`);
        await queryRunner.query(`DROP TABLE "jobseeker"`);
        await queryRunner.query(`DROP TYPE "public"."jobseeker_statut_enum"`);
    }

}
