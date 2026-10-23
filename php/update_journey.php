<?php
/**
 * SafeCity AI - Update Journey Status (Complete or Cancel)
 * POST /php/update_journey.php
 */

require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/auth.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Method not allowed. Use POST.', 405);
}

$currentUser = requireAuth();

$journeyId = filter_var($_POST['journey_id'] ?? null, FILTER_VALIDATE_INT);
$status    = cleanInput($_POST['status'] ?? 'completed');

if (!$journeyId || !in_array($status, ['completed', 'cancelled', 'active'], true)) {
    jsonError('Valid journey ID and status (completed/cancelled) are required.', 422);
}

try {
    $db = getDB();

    // Verify ownership
    $checkStmt = $db->prepare('SELECT id, status, user_id FROM journeys WHERE id = ?');
    $checkStmt->execute([$journeyId]);
    $journey = $checkStmt->fetch();

    if (!$journey || (int)$journey['user_id'] !== $currentUser['id']) {
        jsonError('Journey record not found or access denied.', 404);
    }

    $endedAt = ($status === 'completed' || $status === 'cancelled') ? date('Y-m-d H:i:s') : null;

    $stmt = $db->prepare('UPDATE journeys SET status = ?, ended_at = ? WHERE id = ?');
    $stmt->execute([$status, $endedAt, $journeyId]);

    logAudit($currentUser['id'], 'UPDATE_JOURNEY', 'journeys', $journeyId, "Journey status changed to $status");

    jsonResponse([
        'journey_id' => $journeyId,
        'status'     => $status,
        'ended_at'   => $endedAt
    ], 200, "Journey marked as $status. Travel safe!");

} catch (Exception $e) {
    error_log("Update journey error: " . $e->getMessage());
    jsonError('Failed to update journey status.', 500);
}

