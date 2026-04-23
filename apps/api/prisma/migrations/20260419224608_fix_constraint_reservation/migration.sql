-- DropForeignKey
ALTER TABLE `reservations` DROP FOREIGN KEY `reservations_user_id_fkey`;

-- DropIndex
DROP INDEX `reservations_user_id_tenant_id_key` ON `reservations`;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_reservation_id_fkey` FOREIGN KEY (`reservation_id`) REFERENCES `reservations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
