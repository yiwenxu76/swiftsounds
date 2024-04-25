/*
  Warnings:

  - You are about to drop the column `age` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `User` DROP COLUMN `age`,
    ADD COLUMN `signUpDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);
