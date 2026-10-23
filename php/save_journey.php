<?php
/**
 * SafeCity AI - Safe Journey Initialization Endpoint
 * POST /php/save_journey.php
 */

require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/auth.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Method not allowed. Use POST.', 405);
}

$currentUser = requireAuth();

$startLocation = cleanInput($_POST['start_location'] ?? 'Current Location');
$destLocation  = cleanInput($_POST['destination_location'] ?? 'Destination Point');
$selectedRoute = cleanInput($_POST['selected_route'] ?? 'Route A');
$routeScore    = filter_var($_POST['route_safety_score'] ?? 85.0, FILTER_VALIDATE_FLOAT);

$journeyCode = sprintf('JRN-%s-%04d', date('Ymd'), mt_rand(1000, 9999));
$shareToken  = bin2hex(random_bytes(24));
$expiresAt   = date('Y-m-d H:i:s', time() + 3 * 3600); // 3 hours validity

try {
    $db = getDB();

    $stmt = $db->prepare('
        INSERT INTO journeys (journey_code, user_id, start_location, destination_location, selected_route, route_safety_score, status, share_token, share_token_expires_at, is_share_revoked)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ');
    $stmt->execute([
        $journeyCode,
        $currentUser['id'],
        $startLocation,
        $destLocation,
        $selectedRoute,
        $routeScore,
        'active',
        $shareToken,
        $expiresAt,
        0
    ]);

    $journeyId = (int)$db->lastInsertId();

    logAudit($currentUser['id'], 'START_JOURNEY', 'journeys', $journeyId, "Started journey along $selectedRoute (Score: $routeScore)");

    jsonResponse([
        'journey_id'       => $journeyId,
        'journey_code'     => $journeyCode,
        'start_location'   => $startLocation,
        'destination'      => $destLocation,
        'selected_route'   => $selectedRoute,
        'route_score'      => $routeScore,
        'share_token'      => $shareToken,
        'share_url'        => "shared-journey.html?token=$shareToken",
        'expires_at'       => $expiresAt,
        'started_at'       => date('c')
    ], 201, 'Safe Journey monitoring started successfully.');

} catch (Exception $e) {
    error_log("Save journey error: " . $e->getMessage());
    jsonError('Failed to initiate journey monitoring.', 500);
}

