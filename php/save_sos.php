<?php
/**
 * SafeCity AI - SOS Emergency Alert Logging Endpoint
 * POST /php/save_sos.php
 * Transparent Demonstration Mode with Local Emergency Persistence
 */

require_once __DIR__ . '/helpers.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Method not allowed. Use POST.', 405);
}

$currentUser = getCurrentUser();

$latitude  = filter_var($_POST['latitude'] ?? null, FILTER_VALIDATE_FLOAT);
$longitude = filter_var($_POST['longitude'] ?? null, FILTER_VALIDATE_FLOAT);
$address   = cleanInput($_POST['address'] ?? '');
$status    = cleanInput($_POST['status'] ?? 'triggered'); // 'triggered' or 'cancelled'
$demoMode  = isset($_POST['demo_mode']) ? (int)(bool)$_POST['demo_mode'] : 1;

$userName  = $currentUser ? $currentUser['name'] : cleanInput($_POST['user_name'] ?? 'Anonymous Citizen');
$userPhone = $currentUser ? ($currentUser['phone'] ?? null) : cleanInput($_POST['phone'] ?? null);
$userId    = $currentUser ? $currentUser['id'] : null;

try {
    $db = getDB();

    // Prevent spam: if triggered within past 30 seconds by same user or IP, rate limit
    if ($status === 'triggered') {
        $recentStmt = $db->prepare('
            SELECT id FROM sos_alerts 
            WHERE (user_id = ? OR (user_id IS NULL AND address = ?))
              AND status = "triggered"
              AND created_at >= ' . ($db->getAttribute(PDO::ATTR_DRIVER_NAME) === 'sqlite' ? "datetime('now', '-30 seconds')" : "NOW() - INTERVAL 30 SECOND") . '
        ');
        $recentStmt->execute([$userId, $address]);
        if ($recentStmt->fetch()) {
            jsonResponse([
                'duplicate_ignored' => true,
                'disclaimer' => 'Recent SOS alert is already on record. Please dial 112 directly for immediate emergency services.'
            ], 200, 'Alert already registered within recent window.');
        }
    }

    $dispatchedNote = ($status === 'cancelled')
        ? 'Alert cancelled by user during verification window.'
        : 'Demonstration SOS event logged in database. In a production municipal deployment, this event triggers automated SMS relays to designated contacts and CAD police dispatch.';

    $stmt = $db->prepare('
        INSERT INTO sos_alerts (user_id, user_name, phone, latitude, longitude, address, status, demo_mode, dispatched_note)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ');
    $stmt->execute([
        $userId,
        $userName,
        $userPhone,
        ($latitude !== false) ? $latitude : null,
        ($longitude !== false) ? $longitude : null,
        $address ?: 'Geocoded City Alert Zone',
        $status,
        $demoMode,
        $dispatchedNote
    ]);

    $alertId = (int)$db->lastInsertId();

    if ($userId) {
        logAudit($userId, 'SOS_EVENT_' . strtoupper($status), 'sos_alerts', $alertId, "SOS event $status logged");
    }

    $statusMessage = ($status === 'cancelled')
        ? 'SOS alert cancelled. Your safety confirmation has been registered.'
        : 'SOS event successfully recorded in database (Demo Mode). External emergency dispatch is NOT automatically contacted in this prototype.';

    jsonResponse([
        'alert_id'       => $alertId,
        'status'         => $status,
        'demo_mode'      => (bool)$demoMode,
        'timestamp'      => date('c'),
        'emergency_helplines' => [
            'national_emergency' => '112',
            'police'             => '100',
            'women_helpline'     => '1091',
            'ambulance'          => '108'
        ],
        'disclaimer'     => 'CRITICAL NOTICE: Storing an alert in this database does not contact police or dispatch emergency medical services. Always dial 112 for real emergencies.'
    ], 201, $statusMessage);

} catch (Exception $e) {
    error_log("SOS alert error: " . $e->getMessage());
    jsonError('Failed to record SOS event.', 500);
}

