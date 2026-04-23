/*
  Warnings:

  - You are about to drop the column `event_id` on the `orders` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[user_id,tenant_id]` on the table `reservations` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `reservation_id` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenant_id` to the `reservations` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `orders` DROP FOREIGN KEY `orders_event_id_fkey`;

-- DropIndex
DROP INDEX `orders_event_id_idx` ON `orders`;

-- AlterTable
ALTER TABLE `orders` DROP COLUMN `event_id`,
    ADD COLUMN `reservation_id` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `reservations` ADD COLUMN `tenant_id` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE INDEX `orders_reservation_id_idx` ON `orders`(`reservation_id`);

-- CreateIndex
CREATE INDEX `reservations_tenant_id_idx` ON `reservations`(`tenant_id`);

-- CreateIndex
CREATE UNIQUE INDEX `reservations_user_id_tenant_id_key` ON `reservations`(`user_id`, `tenant_id`);

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_reservation_id_fkey` FOREIGN KEY (`reservation_id`) REFERENCES `reservations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reservations` ADD CONSTRAINT `reservations_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
