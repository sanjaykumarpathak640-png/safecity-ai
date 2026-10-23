<?php
/**
 * SafeCity AI - Database Connection Manager (PDO)
 * Supports MySQL primary with auto-initializing SQLite fallback
 */

require_once __DIR__ . '/config.php';

function getDB(): PDO {
    static $pdoInstance = null;

    if ($pdoInstance !== null) {
        return $pdoInstance;
    }

    $driver = defined('DB_DRIVER') ? DB_DRIVER : 'auto';

    // 1. Try MySQL if configured or in auto mode
    if ($driver === 'mysql' || $driver === 'auto') {
        try {
            $dsn = sprintf(
                'mysql:host=%s;port=%d;dbname=%s;charset=%s',
                DB_HOST,
                DB_PORT,
                DB_NAME,
                DB_CHARSET
            );
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ];
            $pdoInstance = new PDO($dsn, DB_USER, DB_PASS, $options);
            return $pdoInstance;
        } catch (PDOException $e) {
            if ($driver === 'mysql') {
                error_log("SafeCity MySQL Connection Error: " . $e->getMessage());
                throw new Exception("Database connection failed. Please ensure MySQL is running in XAMPP or update config.php.");
            }
            // In 'auto' mode, fall through to SQLite
        }
    }

    // 2. SQLite Portable / Zero-Config Engine
    try {
        $dbPath = DB_SQLITE_PATH;
        $isNewDb = !file_exists($dbPath) || filesize($dbPath) === 0;

        $dsn = 'sqlite:' . $dbPath;
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        $pdoInstance = new PDO($dsn, null, null, $options);
        $pdoInstance->exec('PRAGMA foreign_keys = ON;');

        if ($isNewDb) {
            initSqliteDatabase($pdoInstance);
        }

        return $pdoInstance;
    } catch (PDOException $e) {
        error_log("SafeCity SQLite Connection Error: " . $e->getMessage());
        throw new Exception("SQLite database initialization failed: " . $e->getMessage());
    }
}

/**
 * Initializes SQLite database from schema and seed files
 */
function initSqliteDatabase(PDO $pdo): void {
    $schemaFile = __DIR__ . '/../sql/schema_sqlite.sql';
    $seedFile = __DIR__ . '/../sql/seed.sql';

    if (file_exists($schemaFile)) {
        $schemaSql = file_get_contents($schemaFile);
        $pdo->exec($schemaSql);
    }

    if (file_exists($seedFile)) {
        $seedSql = file_get_contents($seedFile);
        // Strip SQL comments and backticks for clean SQLite execution
        $seedSql = preg_replace('/^--.*$/m', '', $seedSql);
        $seedSql = str_replace('`', '', $seedSql);
        $statements = array_filter(array_map('trim', explode(';', $seedSql)));
        foreach ($statements as $stmt) {
            if (!empty($stmt)) {
                try {
                    $pdo->exec($stmt);
                } catch (Exception $e) {
                    error_log("Seed notice: " . $e->getMessage());
                }
            }
        }
    }
}
