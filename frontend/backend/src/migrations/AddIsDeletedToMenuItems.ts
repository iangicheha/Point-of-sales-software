import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsDeletedToMenuItems1711012345678 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "menu_items" 
      ADD COLUMN "isDeleted" boolean NOT NULL DEFAULT false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "menu_items" 
      DROP COLUMN "isDeleted"
    `);
  }
} 