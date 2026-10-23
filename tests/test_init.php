<?php
require_once __DIR__ . '/../php/db.php';
$db = getDB();
echo "Database Connected Successfully!\n";
echo "Active PDO Driver: " . $db->getAttribute(PDO::ATTR_DRIVER_NAME) . "\n";
echo "Complaints in DB: " . $db->query('SELECT COUNT(*) FROM complaints')->fetchColumn() . "\n";
echo "Users in DB: " . $db->query('SELECT COUNT(*) FROM users')->fetchColumn() . "\n";
echo "Route Segments in DB: " . $db->query('SELECT COUNT(*) FROM route_segments')->fetchColumn() . "\n";
echo "Safe Places in DB: " . $db->query('SELECT COUNT(*) FROM safe_places')->fetchColumn() . "\n";
echo "Road Ratings in DB: " . $db->query('SELECT COUNT(*) FROM road_ratings')->fetchColumn() . "\n";

