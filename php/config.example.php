<?php
/**
 * SafeCity AI - Configuration File Template
 * Copy this file to config.php and update with your local environment settings.
 */

// Application Settings
define('APP_NAME', 'SafeCity AI — Smart Civic Intelligence & Safer Routes');
define('APP_ENV', 'development'); // 'development' or 'production'
define('APP_TIMEZONE', 'Asia/Kolkata');

// Database Configuration
// SafeCity supports MySQL (recommended for production/XAMPP)
// and SQLite (zero-config local portable fallback).
define('DB_DRIVER', 'mysql'); // 'mysql' or 'sqlite'
define('DB_HOST', '127.0.0.1');
define('DB_PORT', 3306);
define('DB_NAME', 'safecity');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');
define('DB_SQLITE_PATH', __DIR__ . '/../safecity.sqlite');

// Upload Security Configuration
define('UPLOAD_DIR', __DIR__ . '/../uploads/');
define('MAX_UPLOAD_SIZE', 5 * 1024 * 1024); // 5 MB max
define('ALLOWED_MIME_TYPES', [
    'image/jpeg' => 'jpg',
    'image/png'  => 'png',
    'image/webp' => 'webp'
]);

// Optional AI Assist API Configuration (Leave empty to use intelligent rule-based engine)
define('GEMINI_API_KEY', getenv('GEMINI_API_KEY') ?: '');

// Session & Security Settings
define('SESSION_NAME', 'SAFECITY_SESSID');
define('SESSION_LIFETIME', 86400); // 24 hours
define('CSRF_SECRET', 'safecity_secure_random_key_2026_change_in_prod');

// Set default timezone
date_default_timezone_set(APP_TIMEZONE);

