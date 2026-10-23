<?php
/**
 * SafeCity AI - Public Shared Journey Status Endpoint for Trusted Contacts
 * GET /php/get_shared_journey.php?token=...
 * Privacy-first: strictly scrubs user ID, email, account data, and personal details.
 */

require_once __DIR__ . '/helpers.php';

header('Content-Type: application/json; charset=utf-8');

$token = cleanInput($_GET['token'] ?? '');

if (empty($token) || strlen($token) < 16) {
    jsonError('A valid journey sharing token is required to view status.', 400);
}

try {
    $db = getDB();

    $stmt = $db->prepare('
        SELECT j.journey_code, j.start_location, j.destination_location,
               j.selected_route, j.route_safety_score, j.status,
               j.share_token_expires_at, j.is_share_revoked,
               j.started_at, j.ended_at,
               u.name as traveler_first_name
        FROM journeys j
        JOIN users u ON j.user_id = u.id
        WHERE j.share_token = ?
    ');
    $stmt->execute([$token]);
    $journey = $stmt->fetch();

    if (!$journey) {
        jsonError('This shared journey link is invalid or does not exist.', 404);
    }

    if ((int)$journey['is_share_revoked'] === 1) {
        jsonError('Access to this journey tracking link has been revoked by the traveler.', 410);
    }

    $expiresAt = strtotime($journey['share_token_expires_at']);
    if ($expiresAt && time() > $expiresAt) {
        jsonError('This journey sharing link has expired. For privacy protection, journey status links are temporary.', 410);
    }

    // Extract first name only for privacy
    $firstName = explode(' ', trim($journey['traveler_first_name']))[0] ?? 'Traveler';

    // Calculate elapsed minutes
    $startEpoch = strtotime($journey['started_at']);
    $endEpoch = $journey['ended_at'] ? strtotime($journey['ended_at']) : time();
    $elapsedMinutes = max(0, round(($endEpoch - $startEpoch) / 60));

    jsonResponse([
        'journey_code'         => $journey['journey_code'],
        'traveler_name'        => $firstName,
        'start_location'       => $journey['start_location'],
        'destination_location' => $journey['destination_location'],
        'selected_route'       => $journey['selected_route'],
        'route_safety_score'   => (float)$journey['route_safety_score'],
        'status'               => $journey['status'],
        'started_at'           => $journey['started_at'],
        'ended_at'             => $journey['ended_at'],
        'elapsed_minutes'      => $elapsedMinutes,
        'expires_at'           => $journey['share_token_expires_at'],
        'tracking_mode'        => 'journey_status_checkin',
        'disclaimer'           => 'This interface provides verified journey status milestones. It does not perform continuous GPS surveillance or stream live telemetry without explicit manual traveler check-in.'
    ], 200, 'Journey status verified.');

} catch (Exception $e) {
    error_log("Get shared journey error: " . $e->getMessage());
    jsonError('Failed to retrieve journey status.', 500);
}

