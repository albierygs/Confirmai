-- CreateTable
CREATE TABLE `reservation_tickets` (
    `id` VARCHAR(191) NOT NULL,
    `reservation_id` VARCHAR(191) NOT NULL,
    `batch_ticket_id` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `reservation_tickets_batch_ticket_id_idx`(`batch_ticket_id`),
    INDEX `reservation_tickets_reservation_id_idx`(`reservation_id`),
    UNIQUE INDEX `reservation_tickets_reservation_id_batch_ticket_id_key`(`reservation_id`, `batch_ticket_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Migrate existing reservation rows into reservation_tickets (1:1)
INSERT INTO `reservation_tickets` (`id`, `reservation_id`, `batch_ticket_id`, `quantity`, `created_at`, `updated_at`)
SELECT UUID(), `id`, `batch_ticket_id`, `quantity`, `created_at`, `updated_at` FROM `reservations`;

-- Unificar reservas ACTIVE duplicadas por usuário (uma reserva ativa por carrinho)
CREATE TEMPORARY TABLE `_res_keeper` AS
SELECT DISTINCT r.`user_id`, r.`id` AS `keeper_id`
FROM `reservations` r
WHERE r.`status` = 'ACTIVE'
  AND r.`id` = (
    SELECT r2.`id`
    FROM `reservations` r2
    WHERE r2.`user_id` = r.`user_id` AND r2.`status` = 'ACTIVE'
    ORDER BY r2.`created_at` ASC, r2.`id` ASC
    LIMIT 1
  );

UPDATE `reservation_tickets` rt
INNER JOIN `reservations` r ON r.`id` = rt.`reservation_id`
INNER JOIN `_res_keeper` k ON k.`user_id` = r.`user_id`
SET rt.`reservation_id` = k.`keeper_id`
WHERE r.`status` = 'ACTIVE' AND rt.`reservation_id` <> k.`keeper_id`;

DROP TEMPORARY TABLE `_res_keeper`;

-- Se existir mais de uma linha para o mesmo par (reserva, batch), consolidar quantidades
UPDATE `reservation_tickets` rt
INNER JOIN (
    SELECT `reservation_id`, `batch_ticket_id`, MIN(`id`) AS `keep_id`, SUM(`quantity`) AS `total_q`
    FROM `reservation_tickets`
    GROUP BY `reservation_id`, `batch_ticket_id`
) g ON g.`keep_id` = rt.`id`
SET rt.`quantity` = g.`total_q`;

DELETE t FROM `reservation_tickets` t
INNER JOIN (
    SELECT `reservation_id`, `batch_ticket_id`, MIN(`id`) AS `keep_id`
    FROM `reservation_tickets`
    GROUP BY `reservation_id`, `batch_ticket_id`
) g ON g.`reservation_id` = t.`reservation_id` AND g.`batch_ticket_id` = t.`batch_ticket_id`
WHERE t.`id` <> g.`keep_id`;

-- Remove reservas órfãs (sem linhas de ingresso)
DELETE r FROM `reservations` r
LEFT JOIN `reservation_tickets` rt ON rt.`reservation_id` = r.`id`
WHERE rt.`id` IS NULL;

-- DropForeignKey
ALTER TABLE `reservations` DROP FOREIGN KEY `reservations_batch_ticket_id_fkey`;

-- DropIndex
DROP INDEX `reservations_batch_ticket_id_idx` ON `reservations`;

-- AlterTable
ALTER TABLE `reservations` DROP COLUMN `batch_ticket_id`,
    DROP COLUMN `quantity`;

-- AddForeignKey
ALTER TABLE `reservation_tickets` ADD CONSTRAINT `reservation_tickets_reservation_id_fkey` FOREIGN KEY (`reservation_id`) REFERENCES `reservations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reservation_tickets` ADD CONSTRAINT `reservation_tickets_batch_ticket_id_fkey` FOREIGN KEY (`batch_ticket_id`) REFERENCES `batch_tickets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reservations` ADD CONSTRAINT `reservations_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX `reservations_user_id_idx` ON `reservations`(`user_id`);
