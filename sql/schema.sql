-- SafeCity AI Database Schema
-- Compatible with MySQL 8.0+ / MariaDB 10.4+

CREATE DATABASE IF NOT EXISTS `safecity` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `safecity`;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(150) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `role` ENUM('citizen', 'officer', 'admin') NOT NULL DEFAULT 'citizen',
    `phone` VARCHAR(20) DEFAULT NULL,
    `emergency_contact_name` VARCHAR(100) DEFAULT NULL,
    `emergency_contact_phone` VARCHAR(20) DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_user_email` (`email`),
    INDEX `idx_user_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Route Segments Table (Supports Explainable Safety Scoring)
CREATE TABLE IF NOT EXISTS `route_segments` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `route_name` VARCHAR(50) NOT NULL,
    `segment_name` VARCHAR(100) NOT NULL,
    `start_lat` DECIMAL(10, 8) NOT NULL,
    `start_lng` DECIMAL(11, 8) NOT NULL,
    `end_lat` DECIMAL(10, 8) NOT NULL,
    `end_lng` DECIMAL(11, 8) NOT NULL,
    `distance_km` DECIMAL(5, 2) NOT NULL DEFAULT 1.00,
    `lighting_factor` DECIMAL(5, 2) NOT NULL DEFAULT 70.00,
    `crowd_factor` DECIMAL(5, 2) NOT NULL DEFAULT 65.00,
    `incident_factor` DECIMAL(5, 2) NOT NULL DEFAULT 75.00,
    `help_access_factor` DECIMAL(5, 2) NOT NULL DEFAULT 80.00,
    `time_factor` DECIMAL(5, 2) NOT NULL DEFAULT 85.00,
    `road_condition_factor` DECIMAL(5, 2) NOT NULL DEFAULT 70.00,
    `community_signal_factor` DECIMAL(5, 2) NOT NULL DEFAULT 75.00,
    `baseline_lighting` DECIMAL(5, 2) NOT NULL DEFAULT 70.00,
    `baseline_road_condition` DECIMAL(5, 2) NOT NULL DEFAULT 70.00,
    `last_recalculated_at` TIMESTAMP NULL DEFAULT NULL,
    `recalculation_reason` TEXT DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_route_name` (`route_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Complaints Table
CREATE TABLE IF NOT EXISTS `complaints` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `complaint_code` VARCHAR(30) NOT NULL UNIQUE,
    `user_id` INT DEFAULT NULL,
    `category` VARCHAR(50) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `description` TEXT NOT NULL,
    `latitude` DECIMAL(10, 8) NOT NULL,
    `longitude` DECIMAL(11, 8) NOT NULL,
    `address` VARCHAR(255) DEFAULT NULL,
    `severity` TINYINT NOT NULL CHECK (severity BETWEEN 1 AND 5),
    `priority_score` INT NOT NULL DEFAULT 50,
    `priority_level` VARCHAR(20) NOT NULL DEFAULT 'Medium',
    `photo_path` VARCHAR(255) DEFAULT NULL,
    `status` ENUM('pending', 'in_progress', 'fixed', 'rejected') NOT NULL DEFAULT 'pending',
    `department` VARCHAR(100) NOT NULL DEFAULT 'Roads & Infrastructure',
    `assigned_officer_id` INT DEFAULT NULL,
    `associated_segment_id` INT DEFAULT NULL,
    `repair_evidence_photo` VARCHAR(255) DEFAULT NULL,
    `repair_notes` TEXT DEFAULT NULL,
    `recalculated_at` TIMESTAMP NULL DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_complaint_status` (`status`),
    INDEX `idx_complaint_category` (`category`),
    INDEX `idx_complaint_severity` (`severity`),
    INDEX `idx_complaint_user` (`user_id`),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`assigned_officer_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`associated_segment_id`) REFERENCES `route_segments`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Complaint Status History Table
CREATE TABLE IF NOT EXISTS `complaint_status_history` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `complaint_id` INT NOT NULL,
    `changed_by_user_id` INT DEFAULT NULL,
    `from_status` VARCHAR(20) NOT NULL,
    `to_status` VARCHAR(20) NOT NULL,
    `note` TEXT DEFAULT NULL,
    `is_public` TINYINT(1) NOT NULL DEFAULT 1,
    `evidence_photo` VARCHAR(255) DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_history_complaint` (`complaint_id`),
    FOREIGN KEY (`complaint_id`) REFERENCES `complaints`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`changed_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Road Ratings Table
CREATE TABLE IF NOT EXISTS `road_ratings` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `road_name` VARCHAR(150) NOT NULL,
    `latitude` DECIMAL(10, 8) NOT NULL,
    `longitude` DECIMAL(11, 8) NOT NULL,
    `rating` TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    `lighting_rating` TINYINT DEFAULT NULL,
    `pavement_rating` TINYINT DEFAULT NULL,
    `review` TEXT DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_road_name` (`road_name`),
    INDEX `idx_rating_user` (`user_id`),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Safe Places Table
CREATE TABLE IF NOT EXISTS `safe_places` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(150) NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `latitude` DECIMAL(10, 8) NOT NULL,
    `longitude` DECIMAL(11, 8) NOT NULL,
    `address` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(50) DEFAULT NULL,
    `open_hours` VARCHAR(50) DEFAULT '24/7',
    `verified` TINYINT(1) DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_place_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Community Reports Table
CREATE TABLE IF NOT EXISTS `community_reports` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `category` VARCHAR(50) NOT NULL,
    `title` VARCHAR(150) NOT NULL,
    `description` TEXT NOT NULL,
    `latitude` DECIMAL(10, 8) NOT NULL,
    `longitude` DECIMAL(11, 8) NOT NULL,
    `address` VARCHAR(255) DEFAULT NULL,
    `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    `reviewed_by` INT DEFAULT NULL,
    `reviewed_at` TIMESTAMP NULL DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_community_status` (`status`),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Journeys Table
CREATE TABLE IF NOT EXISTS `journeys` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `journey_code` VARCHAR(50) NOT NULL UNIQUE,
    `user_id` INT NOT NULL,
    `start_location` VARCHAR(255) NOT NULL,
    `destination_location` VARCHAR(255) NOT NULL,
    `selected_route` VARCHAR(50) NOT NULL,
    `route_safety_score` DECIMAL(5, 2) NOT NULL,
    `status` ENUM('active', 'completed', 'cancelled') NOT NULL DEFAULT 'active',
    `share_token` VARCHAR(64) UNIQUE DEFAULT NULL,
    `share_token_expires_at` TIMESTAMP NULL DEFAULT NULL,
    `is_share_revoked` TINYINT(1) NOT NULL DEFAULT 0,
    `started_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `ended_at` TIMESTAMP NULL DEFAULT NULL,
    INDEX `idx_journey_token` (`share_token`),
    INDEX `idx_journey_user` (`user_id`),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. SOS Alerts Table
CREATE TABLE IF NOT EXISTS `sos_alerts` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT DEFAULT NULL,
    `user_name` VARCHAR(100) DEFAULT 'Anonymous Citizen',
    `phone` VARCHAR(20) DEFAULT NULL,
    `latitude` DECIMAL(10, 8) DEFAULT NULL,
    `longitude` DECIMAL(11, 8) DEFAULT NULL,
    `address` VARCHAR(255) DEFAULT NULL,
    `status` ENUM('triggered', 'cancelled', 'acknowledged', 'resolved') NOT NULL DEFAULT 'triggered',
    `demo_mode` TINYINT(1) NOT NULL DEFAULT 1,
    `dispatched_note` TEXT DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_sos_status` (`status`),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Audit Logs Table
CREATE TABLE IF NOT EXISTS `audit_logs` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT DEFAULT NULL,
    `action` VARCHAR(100) NOT NULL,
    `entity_type` VARCHAR(50) NOT NULL,
    `entity_id` INT DEFAULT NULL,
    `details` TEXT DEFAULT NULL,
    `ip_address` VARCHAR(45) DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_audit_action` (`action`),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

