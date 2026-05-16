/*
  Warnings:

  - You are about to drop the column `total_sold` on the `batches` table. All the data in the column will be lost.
  - You are about to drop the `global_payment_config` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE `batches` DROP COLUMN `total_sold`;

-- DropTable
DROP TABLE `global_payment_config`;

-- CreateTable
CREATE TABLE `payment_providers` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `platformFeePercent` DECIMAL(5, 2) NOT NULL DEFAULT 10,
    `platformFeeFixed` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `payment_providers_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment_methods` (
    `id` VARCHAR(191) NOT NULL,
    `providerId` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `gatewayFeePercent` DECIMAL(5, 2) NOT NULL,
    `gatewayFeeFixed` DECIMAL(10, 2) NOT NULL,
    `allowInstallments` BOOLEAN NOT NULL DEFAULT false,
    `maxInstallments` INTEGER NOT NULL DEFAULT 3,
    `minInstallmentValue` DECIMAL(10, 2) NOT NULL DEFAULT 100,
    `interestFree` INTEGER NOT NULL DEFAULT 1,
    `interestRate` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `payment_methods_providerId_idx`(`providerId`),
    INDEX `payment_methods_slug_idx`(`slug`),
    UNIQUE INDEX `payment_methods_providerId_slug_key`(`providerId`, `slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `payment_methods` ADD CONSTRAINT `payment_methods_providerId_fkey` FOREIGN KEY (`providerId`) REFERENCES `payment_providers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
