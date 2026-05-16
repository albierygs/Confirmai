-- AlterTable
ALTER TABLE `eventos` ADD COLUMN `location` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `inscricoes` (
    `id` VARCHAR(191) NOT NULL,
    `tenant_id` VARCHAR(191) NOT NULL,
    `evento_id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `curso` VARCHAR(191) NULL,
    `status` ENUM('pendente', 'confirmada', 'cancelada') NOT NULL DEFAULT 'pendente',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `qr_hash` VARCHAR(191) NULL,
    `qr_code` LONGTEXT NULL,
    `email_status` VARCHAR(191) NULL DEFAULT 'pendente',
    `checkin_realizado` BOOLEAN NOT NULL DEFAULT false,
    `checkin_data` DATETIME(3) NULL,

    UNIQUE INDEX `inscricoes_qr_hash_key`(`qr_hash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
