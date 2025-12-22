import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1703123456789 implements MigrationInterface {
    name = 'InitialSchema1703123456789'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "companies" (
                "id" SERIAL NOT NULL, 
                "name" character varying(200) NOT NULL, 
                "industry" character varying(100), 
                "description" character varying(500), 
                "isActive" boolean NOT NULL DEFAULT true, 
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(), 
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), 
                CONSTRAINT "PK_d4bc3e82a314fa9e29f652c2c22" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" SERIAL NOT NULL, 
                "name" character varying(100) NOT NULL, 
                "email" character varying(150) NOT NULL, 
                "phone" character varying, 
                "isActive" boolean NOT NULL DEFAULT true, 
                "lastLogin" TIMESTAMP NOT NULL DEFAULT now(), 
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(), 
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), 
                "company_id" integer, 
                CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), 
                CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "audit_logs" (
                "id" SERIAL NOT NULL, 
                "entityType" character varying(50) NOT NULL, 
                "entityId" integer NOT NULL, 
                "fieldName" character varying(100) NOT NULL, 
                "oldValue" text, 
                "newValue" text, 
                "transactionId" character varying(100), 
                "userId" character varying(100), 
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(), 
                CONSTRAINT "PK_4af0d6ac1b9b6d51a7b26e7e6c4" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_audit_entity" ON "audit_logs" ("entityType", "entityId")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_audit_transaction" ON "audit_logs" ("transactionId")
        `);

        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD CONSTRAINT "FK_7bb54c2b8e8b8e8b8e8b8e8b8e8" 
            FOREIGN KEY ("company_id") 
            REFERENCES "companies"("id") 
            ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_7bb54c2b8e8b8e8b8e8b8e8b8e8"`);
        await queryRunner.query(`DROP INDEX "IDX_audit_transaction"`);
        await queryRunner.query(`DROP INDEX "IDX_audit_entity"`);
        await queryRunner.query(`DROP TABLE "audit_logs"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "companies"`);
    }
}