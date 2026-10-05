import { MigrationInterface, QueryRunner } from "typeorm";

export class Addevaluation1791233040025 implements MigrationInterface {
    name = 'Addevaluation1791233040025'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."evaluation_statut_enum" AS ENUM('actif', 'inactif', 'supprime', 'EN_ATTENTE_ACTIVATION')`);
        await queryRunner.query(`CREATE TABLE "evaluation" ("dte_creation" TIMESTAMP NOT NULL DEFAULT now(), "dte_modif" TIMESTAMP NOT NULL DEFAULT now(), "statut" "public"."evaluation_statut_enum" NOT NULL DEFAULT 'actif', "dte_suppression" TIMESTAMP, "create_by" character varying, "updated_by" character varying, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "experience_id" uuid NOT NULL, "student_id" uuid NOT NULL, "company_id" uuid NOT NULL, "note" smallint NOT NULL, "commentaire" text, CONSTRAINT "UQ_EVALUATION_EXPERIENCE" UNIQUE ("experience_id"), CONSTRAINT "REL_379bba19d8dcf01fc83ca46d54" UNIQUE ("experience_id"), CONSTRAINT "CHK_EVALUATION_NOTE" CHECK ("note" BETWEEN 1 AND 5), CONSTRAINT "PK_b72edd439b9db736f55b584fa54" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "evaluation" ADD CONSTRAINT "FK_379bba19d8dcf01fc83ca46d54a" FOREIGN KEY ("experience_id") REFERENCES "experience"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "evaluation" ADD CONSTRAINT "FK_309ab53a347dc253f77e691deea" FOREIGN KEY ("student_id") REFERENCES "etudiant"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "evaluation" ADD CONSTRAINT "FK_037aee984ecd9f871e75dbb2f69" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "evaluation" DROP CONSTRAINT "FK_037aee984ecd9f871e75dbb2f69"`);
        await queryRunner.query(`ALTER TABLE "evaluation" DROP CONSTRAINT "FK_309ab53a347dc253f77e691deea"`);
        await queryRunner.query(`ALTER TABLE "evaluation" DROP CONSTRAINT "FK_379bba19d8dcf01fc83ca46d54a"`);
        await queryRunner.query(`DROP TABLE "evaluation"`);
        await queryRunner.query(`DROP TYPE "public"."evaluation_statut_enum"`);
    }

}
