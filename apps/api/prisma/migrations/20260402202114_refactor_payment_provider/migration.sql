/*
  Warnings:

  - You are about to drop the column `platformFeeFixed` on the `payment_providers` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `payment_providers` DROP COLUMN `platformFeeFixed`,
    ADD COLUMN `platformCoustPercent` DECIMAL(5, 2) NOT NULL DEFAULT 5;
