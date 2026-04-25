/*
  Warnings:

  - You are about to drop the column `service_fee` on the `orders` table. All the data in the column will be lost.
  - You are about to alter the column `stripe_application_fee` on the `orders` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Decimal(19,4)`.

*/
-- AlterTable
ALTER TABLE `orders` DROP COLUMN `service_fee`,
    MODIFY `stripe_application_fee` DECIMAL(19, 4) NULL;

-- AddForeignKey
ALTER TABLE `reservations` ADD CONSTRAINT `reservations_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
