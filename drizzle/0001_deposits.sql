CREATE TABLE `order_payments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` text NOT NULL,
	`kind` text NOT NULL,
	`method` text NOT NULL,
	`amount` real NOT NULL,
	`reference` text DEFAULT '' NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`recorded_by` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `order_payments_order_idx` ON `order_payments` (`order_id`);--> statement-breakpoint
ALTER TABLE `orders` ADD COLUMN `deposit_percent` real DEFAULT 50 NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD COLUMN `deposit_amount` real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD COLUMN `amount_paid` real DEFAULT 0 NOT NULL;--> statement-breakpoint
UPDATE `orders` SET `deposit_amount` = round(`total` * 0.5, 2);--> statement-breakpoint
UPDATE `orders` SET `payment_method` = 'bank_transfer' WHERE `payment_method` = 'cod';--> statement-breakpoint
UPDATE `orders` SET `amount_paid` = `total` WHERE `payment_status` = 'paid';--> statement-breakpoint
UPDATE `orders` SET `payment_status` = 'unpaid' WHERE `payment_status` = 'authorized';
