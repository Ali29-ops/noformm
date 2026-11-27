CREATE TABLE `product_photos` (
  `id` text PRIMARY KEY NOT NULL,
  `content_type` text NOT NULL,
  `bytes` blob NOT NULL,
  `uploader_id` text,
  `uploaded_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `product_photos_drafts_idx` ON `product_photos` (`uploader_id`, `uploaded_at`);
