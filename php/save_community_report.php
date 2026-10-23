<?php
/**
 * SafeCity AI - Community Safety Reports Endpoint
 * POST /php/save_community_report.php
 */

require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/auth.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Method not allowed. Use POST.', 405);
}

$currentUser = requireAuth();

$category    = cleanInput($_POST['category'] ?? 'poor_lighting');
$title       = cleanInput($_POST['title'] ?? '');
$description = cleanInput($_POST['description'] ?? '');
$latitude    = filter_var($_POST['latitude'] ?? null, FILTER_VALIDATE_FLOAT);
$longitude   = filter_var($_POST['longitude'] ?? null, FILTER_VALIDATE_FLOAT);
$address     = cleanInput($_POST['address'] ?? '');

$validCategories = ['poor_lighting', 'isolated_area', 'damaged_sidewalk', 'blocked_access', 'harassment_hotspot'];

if (!in_array($category, $validCategories, true)) {
    jsonError('Please select a valid community report category.', 422);
}
if (empty($title) || strlen($title) < 5) {
    jsonError('Title must be at least 5 characters.', 422);
}
if (empty($description) || strlen($description) < 10) {
    jsonError('Description must be at least 10 characters.', 422);
}
if ($latitude === false || $longitude === false || $latitude === null || $longitude === null) {
    jsonError('Valid geographic coordinates are required.', 422);
}

try {
    $db = getDB();

    $stmt = $db->prepare('
        INSERT INTO community_reports (user_id, category, title, description, latitude, longitude, address, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, "pending")
    ');
    $stmt->execute([
        $currentUser['id'],
        $category,
        $title,
        $description,
        $latitude,
        $longitude,
        $address ?: 'Community Location'
    ]);

    $reportId = (int)$db->lastInsertId();

    logAudit($currentUser['id'], 'SUBMIT_COMMUNITY_REPORT', 'community_reports', $reportId, "Community report submitted: $title");

    jsonResponse([
        'report_id' => $reportId,
        'status'    => 'pending',
        'notice'    => 'Your report has been submitted for municipal officer review before influencing public safety scores.'
    ], 201, 'Community report submitted successfully. Thank you for making our city safer!');

} catch (Exception $e) {
    error_log("Community report error: " . $e->getMessage());
    jsonError('Failed to record community report.', 500);
}

