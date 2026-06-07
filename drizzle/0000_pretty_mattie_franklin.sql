CREATE TABLE `ai_analysis` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`patent_id` varchar(36) NOT NULL,
	`analysis_type` varchar(100) NOT NULL,
	`result` json NOT NULL,
	`confidence` decimal(5,4),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `ai_analysis_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `appointments` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`user_id` varchar(36) NOT NULL,
	`consultant_id` varchar(36) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`appointment_date` timestamp NOT NULL,
	`duration` int NOT NULL,
	`status` enum('pending','confirmed','completed','cancelled') DEFAULT 'pending',
	`meeting_link` varchar(500),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `appointments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `blockchain_transactions` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`patent_id` varchar(36) NOT NULL,
	`transaction_type` varchar(50) NOT NULL,
	`transaction_hash` varchar(255),
	`network_name` varchar(50) DEFAULT 'base-sepolia',
	`block_number` varchar(50),
	`gas_used` decimal(20,0),
	`status` varchar(50) DEFAULT 'pending',
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `blockchain_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chat_messages` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`chat_room_id` varchar(36) NOT NULL,
	`sender_id` varchar(36) NOT NULL,
	`message` text NOT NULL,
	`is_read` boolean DEFAULT false,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `chat_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chat_rooms` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`user_id` varchar(36) NOT NULL,
	`consultant_id` varchar(36) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `chat_rooms_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `consultants` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`user_id` varchar(36) NOT NULL,
	`specialization` varchar(255),
	`bio` text,
	`experience_years` int DEFAULT 0,
	`hourly_rate` decimal(10,2),
	`availability` json DEFAULT '{}',
	`rating` decimal(3,2) DEFAULT '0.00',
	`is_verified` boolean DEFAULT false,
	`verified_by` varchar(36),
	`verified_at` timestamp,
	`verification_notes` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `consultants_id` PRIMARY KEY(`id`),
	CONSTRAINT `consultants_user_id_unique` UNIQUE(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `patent_activity` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`patent_id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`activity_type` varchar(100) NOT NULL,
	`description` text,
	`metadata` json,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `patent_activity_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `patent_documents` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`patent_id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`file_name` varchar(255) NOT NULL,
	`file_path` varchar(500) NOT NULL,
	`file_type` varchar(100) NOT NULL,
	`file_size` int NOT NULL,
	`hash_value` varchar(255) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `patent_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `patents` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`user_id` varchar(36) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`category` enum('medical_technology','software_ai','renewable_energy','manufacturing','biotechnology','automotive','telecommunications','other') NOT NULL,
	`status` enum('draft','pending','under_review','approved','rejected','expired') DEFAULT 'draft',
	`patent_number` varchar(100),
	`file_path` varchar(500),
	`hash_value` varchar(255),
	`blockchain_tx_hash` varchar(255),
	`network_name` varchar(50),
	`blockchain_status` varchar(50),
	`ai_suggested_category` enum('medical_technology','software_ai','renewable_energy','manufacturing','biotechnology','automotive','telecommunications','other'),
	`ai_confidence` decimal(5,4),
	`estimated_value` decimal(12,2),
	`contract_signature` text,
	`signer_wallet_address` varchar(255),
	`signed_at` timestamp,
	`filed_at` timestamp,
	`approved_at` timestamp,
	`expires_at` timestamp,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `patents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `prior_art_results` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`patent_id` varchar(36) NOT NULL,
	`similar_patent_id` varchar(36),
	`external_patent_id` varchar(100),
	`similarity_score` decimal(5,4),
	`title` varchar(255),
	`description` text,
	`source` varchar(100),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `prior_art_results_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`sid` varchar(255) NOT NULL,
	`sess` json NOT NULL,
	`expire` timestamp NOT NULL,
	CONSTRAINT `sessions_sid` PRIMARY KEY(`sid`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`email` varchar(255) NOT NULL,
	`first_name` varchar(100) NOT NULL,
	`last_name` varchar(100) NOT NULL,
	`profile_image_url` varchar(500),
	`role` varchar(50) DEFAULT 'user',
	`password_hash` varchar(255),
	`is_email_verified` boolean DEFAULT false,
	`email_verification_token` varchar(255),
	`email_verification_expiry` timestamp,
	`settings` json DEFAULT '{}',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `wallet_connections` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`user_id` varchar(36) NOT NULL,
	`wallet_type` varchar(100) NOT NULL,
	`account_id` varchar(255) NOT NULL,
	`network` varchar(50) NOT NULL,
	`session_data` json,
	`is_active` boolean DEFAULT true,
	`last_connected` timestamp DEFAULT (now()),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `wallet_connections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `consultants` ADD CONSTRAINT `consultants_verified_by_users_id_fk` FOREIGN KEY (`verified_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_user_consultant_unique` ON `chat_rooms` (`user_id`,`consultant_id`);--> statement-breakpoint
CREATE INDEX `IDX_session_expire` ON `sessions` (`expire`);