-- DropForeignKey
ALTER TABLE `reservations` DROP FOREIGN KEY `reservations_user_id_fkey`;

-- DropIndex
DROP INDEX `reservations_user_id_tenant_id_key` ON `reservations`;
