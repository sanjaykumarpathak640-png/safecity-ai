<?php
require_once __DIR__ . '/../php/db.php';
$db = getDB();
$seedFile = __DIR__ . '/../sql/seed.sql';
$seedSql = file_get_contents($seedFile);
// Remove comments
$seedSql = preg_replace('/^--.*$/m', '', $seedSql);
$seedSql = str_replace('`', '', $seedSql);
$statements = explode(';', $seedSql);
$success = 0;
$errors = 0;
foreach ($statements as $stmt) {
    $stmt = trim($stmt);
    if (!empty($stmt)) {
        try {
            $db->exec($stmt);
            $success++;
        } catch (Exception $e) {
            echo "Error on stmt: " . substr($stmt, 0, 50) . " => " . $e->getMessage() . "\n";
            $errors++;
        }
    }
}
echo "Seeding completed: $success success, $errors errors.\n";
echo "Complaints count: " . $db->query('SELECT COUNT(*) FROM complaints')->fetchColumn() . "\n";
echo "Users count: " . $db->query('SELECT COUNT(*) FROM users')->fetchColumn() . "\n";
echo "Route Segments count: " . $db->query('SELECT COUNT(*) FROM route_segments')->fetchColumn() . "\n";
echo "Safe Places count: " . $db->query('SELECT COUNT(*) FROM safe_places')->fetchColumn() . "\n";

