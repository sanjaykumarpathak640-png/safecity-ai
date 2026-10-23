<?php
/**
 * SafeCity AI - Moderate Community Safety Report Endpoint
 * POST /php/moderate_report.php
 */

require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/auth.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Method not allowed. Use POST.', 405);
}

$officer = requireOfficer();

$reportId = filter_var($_POST['report_id'] ?? null, FILTER_VALIDATE_INT);
$status   = cleanInput($_POST['status'] ?? ''); // 'approved' or 'rejected'

if (!$reportId || !in_array($status, ['approved', 'rejected'], true)) {
    jsonError('Valid report ID and moderation status (approved/rejected) are required.', 422);
}

try {
    $db = getDB();

    $stmt = $db->prepare('UPDATE community_reports SET status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?');
    $stmt->execute([$status, $officer['id'], $reportId]);

    logAudit($officer['id'], 'MODERATE_REPORT', 'community_reports', $reportId, "Community report #$reportId $status");

    jsonResponse([
        'report_id' => $reportId,
        'status'    => $status
    ], 200, "Community report has been $status.");

} catch (Exception $e) {
    error_log("Moderate report error: " . $e->getMessage());
    jsonError('Failed to update report status.', 500);
}

