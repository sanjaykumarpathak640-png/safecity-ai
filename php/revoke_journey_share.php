<?php
/**
 * SafeCity AI - Revoke Journey Share Token Endpoint
 * POST /php/revoke_journey_share.php
 */

require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/auth.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Method not allowed. Use POST.', 405);
}

$currentUser = requireAuth();
$journeyId = filter_var($_POST['journey_id'] ?? null, FILTER_VALIDATE_INT);

if (!$journeyId) {
    jsonError('Valid journey ID is required.', 422);
}

try {
    $db = getDB();

    $stmt = $db->prepare('UPDATE journeys SET is_share_revoked = 1 WHERE id = ? AND user_id = ?');
    $stmt->execute([$journeyId, $currentUser['id']]);

    if ($stmt->rowCount() === 0) {
        jsonError('Journey not found or you do not have permission to revoke it.', 404);
    }

    logAudit($currentUser['id'], 'REVOKE_JOURNEY_SHARE', 'journeys', $journeyId, 'Journey share link revoked');

    jsonResponse(null, 200, 'Public journey sharing link has been permanently revoked.');

} catch (Exception $e) {
    error_log("Revoke error: " . $e->getMessage());
    jsonError('Failed to revoke journey link.', 500);
}

