CREATE TABLE `battery_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`packId` varchar(64) NOT NULL,
	`name` varchar(120) NOT NULL,
	`chemistry` varchar(64) NOT NULL,
	`manufacturer` varchar(120),
	`model` varchar(120),
	`nominalCapacityAh` decimal(12,3) NOT NULL,
	`nominalVoltage` decimal(8,3) NOT NULL,
	`minVoltage` decimal(8,3),
	`maxVoltage` decimal(8,3),
	`ratedCurrentA` decimal(12,3),
	`thermalLimitC` decimal(8,3),
	`installationDate` timestamp,
	`priorCycles` int NOT NULL DEFAULT 0,
	`topology` varchar(64),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `battery_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `battery_profiles_packId_unique` UNIQUE(`packId`)
);
--> statement-breakpoint
CREATE TABLE `model_runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`profileId` int NOT NULL,
	`modelName` varchar(120) NOT NULL,
	`modelVersion` varchar(64) NOT NULL,
	`status` enum('queued','running','completed','failed') NOT NULL DEFAULT 'queued',
	`datasetName` varchar(160),
	`metrics` json,
	`assumptions` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `model_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `safety_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`profileId` int NOT NULL,
	`source` enum('telemetry','vision','model','system') NOT NULL,
	`severity` enum('info','watch','urgent') NOT NULL,
	`title` varchar(180) NOT NULL,
	`description` text NOT NULL,
	`status` enum('open','acknowledged','resolved') NOT NULL DEFAULT 'open',
	`evidence` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`resolvedAt` timestamp,
	CONSTRAINT `safety_alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `telemetry_readings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`profileId` int NOT NULL,
	`recordedAt` timestamp NOT NULL,
	`cycleId` int,
	`voltage` double NOT NULL,
	`current` double NOT NULL,
	`temperatureC` double NOT NULL,
	`soc` double,
	`depthOfDischarge` double,
	`internalResistanceProxy` double,
	`source` varchar(32) NOT NULL DEFAULT 'gateway',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `telemetry_readings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
CREATE TABLE `vision_inspections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`profileId` int NOT NULL,
	`imageUrl` text NOT NULL,
	`imageKey` varchar(255),
	`status` enum('queued','review','clear','escalate','failed') NOT NULL DEFAULT 'queued',
	`findings` json,
	`confidence` double,
	`capturedAt` timestamp NOT NULL,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `vision_inspections_id` PRIMARY KEY(`id`)
);
