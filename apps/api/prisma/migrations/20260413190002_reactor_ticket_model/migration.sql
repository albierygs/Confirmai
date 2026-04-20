/*
  Warnings:

  - You are about to drop the column `owner_document` on the `tickets` table. All the data in the column will be lost.
  - You are about to drop the column `owner_email` on the `tickets` table. All the data in the column will be lost.
  - You are about to drop the column `owner_name` on the `tickets` table. All the data in the column will be lost.
  - Added the required column `user_id` to the `tickets` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `tickets` DROP COLUMN `owner_document`,
    DROP COLUMN `owner_email`,
    DROP COLUMN `owner_name`,
    ADD COLUMN `user_id` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `tickets` ADD CONSTRAINT `tickets_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
