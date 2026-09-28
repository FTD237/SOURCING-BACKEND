import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1790590857974 implements MigrationInterface {
    name = 'Migrations1790590857974'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "etudiant" ADD "scholar_level" character varying NOT NULL DEFAULT 'FIRST_YEAR'`);
        await queryRunner.query(`ALTER TABLE "etudiant" ADD "nationality" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "etudiant" ADD "phone_number" integer`);
        await queryRunner.query(`ALTER TABLE "etudiant" ADD "main_domain" character varying`);
        await queryRunner.query(`ALTER TABLE "etudiant" ADD "tools" text array`);
        await queryRunner.query(`ALTER TABLE "etudiant" ADD "languages" text array NOT NULL DEFAULT '{}'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "etudiant" DROP COLUMN "languages"`);
        await queryRunner.query(`ALTER TABLE "etudiant" DROP COLUMN "tools"`);
        await queryRunner.query(`ALTER TABLE "etudiant" DROP COLUMN "main_domain"`);
        await queryRunner.query(`ALTER TABLE "etudiant" DROP COLUMN "phone_number"`);
        await queryRunner.query(`ALTER TABLE "etudiant" DROP COLUMN "nationality"`);
        await queryRunner.query(`ALTER TABLE "etudiant" DROP COLUMN "scholar_level"`);
    }

}
