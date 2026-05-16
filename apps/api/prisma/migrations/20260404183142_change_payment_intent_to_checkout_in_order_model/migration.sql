/*
  Warnings:

  - You are about to drop the column `stripe_client_secret` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `stripe_payment_intent_id` on the `orders` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[stripe_checkout_session_id]` on the table `orders` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `orders_stripe_payment_intent_id_idx` ON `orders`;

-- DropIndex
DROP INDEX `orders_stripe_payment_intent_id_key` ON `orders`;

-- AlterTable
ALTER TABLE `orders` DROP COLUMN `stripe_client_secret`,
    DROP COLUMN `stripe_payment_intent_id`,
    ADD COLUMN `stripe_checkout_session_id` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `orders_stripe_checkout_session_id_key` ON `orders`(`stripe_checkout_session_id`);
