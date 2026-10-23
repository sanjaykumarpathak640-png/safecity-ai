<?php
/**
 * SafeCity AI - Detailed Complaint View for Authenticated Users / Officers
 * GET /php/get_complaint.php?id=1
 */

require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/auth.php';

header('Content-Type: application/json; charset=utf-8');

$currentUser = requireAuth();
$id = filter_var($_GET['id'] ?? null, FILTER_VALIDATE_INT);
$code = cleanInput($_GET['code'] ?? '');

if (($id === false || $id === null) && empty($code)) {
    jsonError('Valid complaint ID or code is required.', 400);
}

try {
    $db = getDB();

    if ($id) {
        $stmt = $db->prepare('
            SELECT c.*, u.name as reporter_name, u.email as reporter_email, u.phone as reporter_phone,
                   o.name as officer_name, rs.segment_name, rs.route_name
            FROM complaints c
            LEFT JOIN users u ON c.user_id = u.id
            LEFT JOIN users o ON c.assigned_officer_id = o.id
            LEFT JOIN route_segments rs ON c.associated_segment_id = rs.id
            WHERE c.id = ?
        ');
        $stmt->execute([$id]);
    } else {
        $stmt = $db->prepare('
            SELECT c.*, u.name as reporter_name, u.email as reporter_email, u.phone as reporter_phone,
                   o.name as officer_name, rs.segment_name, rs.route_name
            FROM complaints c
            LEFT JOIN users u ON c.user_id = u.id
            LEFT JOIN users o ON c.assigned_officer_id = o.id
            LEFT JOIN route_segments rs ON c.associated_segment_id = rs.id
            WHERE c.complaint_code = ?
        ');
        $stmt->execute([$code]);
    }

    $complaint = $stmt->fetch();

    if (!$complaint) {
        jsonError('Complaint not found.', 404);
    }

    $isOfficer = in_array($currentUser['role'], ['officer', 'admin'], true);
    $isOwner = $currentUser['id'] === (int)$complaint['user_id'];

    if (!$isOfficer && !$isOwner) {
        // Obfuscate reporter details for other citizens
        $complaint['reporter_name'] = 'Registered Citizen';
        $complaint['reporter_email'] = null;
        $complaint['reporter_phone'] = null;
    }

    // Fetch status history
    $histStmt = $db->prepare('
        SELECT h.*, u.name as changed_by_name, u.role as changed_by_role
        FROM complaint_status_history h
        LEFT JOIN users u ON h.changed_by_user_id = u.id
        WHERE h.complaint_id = ?
        ORDER BY h.created_at ASC
    ');
    $histStmt->execute([$complaint['id']]);
    $history = $histStmt->fetchAll();

    jsonResponse([
        'complaint' => $complaint,
        'history'   => $history
    ]);

} catch (Exception $e) {
    error_log("Get complaint detail error: " . $e->getMessage());
    jsonError('Failed to fetch complaint details.', 500);
}

