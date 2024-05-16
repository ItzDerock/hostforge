CREATE TABLE `project_deployment` (
	`id` text PRIMARY KEY DEFAULT (uuid_generate_v7()) NOT NULL,
	`project_id` text NOT NULL,
	`deployed_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`status` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY DEFAULT (uuid_generate_v7()) NOT NULL,
	`friendly_name` text NOT NULL,
	`internal_name` text NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`owner_id` text NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `service` (
	`id` text PRIMARY KEY DEFAULT (uuid_generate_v7()) NOT NULL,
	`name` text NOT NULL,
	`project_id` text NOT NULL,
	`latest_generation_id` text NOT NULL,
	`redeploy_secret` text NOT NULL,
	`deployed_generation_id` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`latest_generation_id`) REFERENCES `service_generation`(`id`) ON UPDATE no action ON DELETE no action DEFERRABLE INITIALLY DEFERRED, -- MODIFIED TO ADD DEFERRED CONSTRAINTS
	FOREIGN KEY (`deployed_generation_id`) REFERENCES `service_generation`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `service_deployment` (
	`id` text PRIMARY KEY DEFAULT (uuid_generate_v7()) NOT NULL,
	`project_deployment_id` text NOT NULL,
	`service_id` text NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`deployed_by` text,
	`build_logs` blob,
	`status` integer NOT NULL,
	FOREIGN KEY (`project_deployment_id`) REFERENCES `project_deployment`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`service_id`) REFERENCES `service_generation`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`deployed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `service_domain` (
	`id` text PRIMARY KEY DEFAULT (uuid_generate_v7()) NOT NULL,
	`service_id` text NOT NULL,
	`domain` text NOT NULL,
	`internal_port` integer NOT NULL,
	`https` integer DEFAULT false NOT NULL,
	`force_ssl` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`service_id`) REFERENCES `service_generation`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `service_generation` (
	`id` text PRIMARY KEY DEFAULT (uuid_generate_v7()) NOT NULL,
	`service_id` text NOT NULL,
	`deployment_id` text,
	`source` integer NOT NULL,
	`environment` text,
	`docker_image` text,
	`docker_registry_username` text,
	`docker_registry_password` text,
	`github_username` text,
	`github_repository` text,
	`github_branch` text,
	`git_url` text,
	`git_branch` text,
	`build_method` integer DEFAULT 2 NOT NULL,
	`build_path` text DEFAULT '/' NOT NULL,
	`command` text,
	`entrypoint` text,
	`replicas` integer DEFAULT 1 NOT NULL,
	`max_replicas_per_node` integer,
	`deploy_mode` integer DEFAULT 1 NOT NULL,
	`zero_downtime` integer DEFAULT false NOT NULL,
	`max_cpu` real DEFAULT 0 NOT NULL,
	`max_memory` text DEFAULT '0' NOT NULL,
	`max_pids` integer DEFAULT false NOT NULL,
	`restart` integer DEFAULT 2 NOT NULL,
	`restart_delay` text DEFAULT '5s',
	`restart_max_attempts` integer,
	`healthcheck_enabled` integer DEFAULT false NOT NULL,
	`healthcheck_command` text,
	`healthcheck_interval` text DEFAULT '30s' NOT NULL,
	`healthcheck_timeout` text DEFAULT '30s' NOT NULL,
	`healthcheck_retries` integer DEFAULT 3 NOT NULL,
	`healthcheck_start_period` text DEFAULT '0s' NOT NULL,
	`logging_max_size` text DEFAULT '-1' NOT NULL,
	`logging_max_files` integer DEFAULT 1 NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,

	-- MODIFIED TO ADD DEFERRED CONSTRAINTS
	FOREIGN KEY (`service_id`) REFERENCES `service`(`id`) ON UPDATE no action ON DELETE cascade DEFERRABLE INITIALLY DEFERRED,
	FOREIGN KEY (`deployment_id`) REFERENCES `service_deployment`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `service_port` (
	`id` text PRIMARY KEY DEFAULT (uuid_generate_v7()) NOT NULL,
	`service_id` text NOT NULL,
	`internal_port` integer NOT NULL,
	`external_port` integer NOT NULL,
	`port_type` integer NOT NULL,
	`type` integer NOT NULL,
	FOREIGN KEY (`service_id`) REFERENCES `service_generation`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `service_sysctl` (
	`id` text PRIMARY KEY DEFAULT (uuid_generate_v7()) NOT NULL,
	`service_id` text NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL,
	FOREIGN KEY (`service_id`) REFERENCES `service_generation`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `service_ulimit` (
	`id` text PRIMARY KEY DEFAULT (uuid_generate_v7()) NOT NULL,
	`service_id` text NOT NULL,
	`name` text NOT NULL,
	`soft` integer NOT NULL,
	`hard` integer NOT NULL,
	FOREIGN KEY (`service_id`) REFERENCES `service_generation`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `service_volume` (
	`id` text PRIMARY KEY DEFAULT (uuid_generate_v7()) NOT NULL,
	`service_id` text NOT NULL,
	`source` text,
	`target` text NOT NULL,
	`type` text NOT NULL,
	FOREIGN KEY (`service_id`) REFERENCES `service_generation`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `session` (
	`token` text PRIMARY KEY NOT NULL,
	`last_useragent` text,
	`last_ip` text,
	`last_accessed` integer,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`id` text NOT NULL,
	FOREIGN KEY (`id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `system_stats` (
	`id` integer PRIMARY KEY DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`cpu_usage` integer,
	`memory_usage` integer NOT NULL,
	`disk_usage` integer NOT NULL,
	`network_tx` integer NOT NULL,
	`network_rx` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY DEFAULT (uuid_generate_v7()) NOT NULL,
	`username` text NOT NULL,
	`password` text,
	`mfa_token` blob
);
--> statement-breakpoint
CREATE INDEX `proj_deployment_idx` ON `project_deployment` (`id`,`project_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `projects_internal_name_unique` ON `projects` (`internal_name`);--> statement-breakpoint
CREATE INDEX `name_project_idx` ON `service` (`name`,`project_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `name_project_unq` ON `service` (`name`,`project_id`);--> statement-breakpoint
CREATE INDEX `proj_generation_idx` ON `service_generation` (`id`,`service_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
CREATE INDEX `username_idx` ON `users` (`username`);
