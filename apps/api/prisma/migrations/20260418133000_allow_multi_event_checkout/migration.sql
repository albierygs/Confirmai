-- DropForeignKey
ALTER TABLE `orders` DROP FOREIGN KEY `orders_event_id_fkey`;

-- AlterTable
ALTER TABLE `orders`
    MODIFY `event_id` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_event_id_fkey`
FOREIGN KEY (`event_id`) REFERENCES `eventos`(`id`)
ON DELETE CASCADE ON UPDATE CASCADE;
