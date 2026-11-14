CREATE TABLE `shop_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`kind` text NOT NULL,
	`slug` text NOT NULL,
	`visitor` text NOT NULL,
	`customer_id` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `shop_events_kind_idx` ON `shop_events` (`kind`,`created_at`);
--> statement-breakpoint
CREATE INDEX `shop_events_slug_idx` ON `shop_events` (`slug`);
--> statement-breakpoint
CREATE TABLE `open_carts` (
	`visitor` text PRIMARY KEY NOT NULL,
	`customer_id` text,
	`lines` text NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL
);
