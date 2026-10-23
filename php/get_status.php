<?php
/**
 * SafeCity AI - Public Complaint Tracking Endpoint
 * GET /php/get_status.php?code=SC-2026-1001 or ?id=1
 * Privacy-scrubbed: never exposes emails, phone numbers, or user account IDs
 */

require_once __DIR__ . '/helpers.php';

header('Content-Type: application/json; charset=utf-8');

$code = cleanInput($_GET['code'] ?? '');
$id   = filter_var($_GET['id'] ?? null, FILTER_VALIDATE_INT);

if (empty($code) && ($id === false || $id === null)) {
    jsonError('Please provide a valid Complaint Tracking Code (e.g. SC-2026-1001).', 400);
}

try {
    $db = getDB();

    if (!empty($code)) {
        $stmt = $db->prepare('
            SELECT c.id, c.complaint_code, c.category, c.title, c.description,
                   c.latitude, c.longitude, c.address, c.severity, c.priority_score,
                   c.priority_level, c.photo_path, c.status, c.department,
                   c.repair_evidence_photo, c.repair_notes, c.recalculated_at,
                   c.created_at, c.updated_at,
                   rs.segment_name, rs.route_name
            FROM complaints c
            LEFT JOIN route_segments rs ON c.associated_segment_id = rs.id
            WHERE UPPER(c.complaint_code) = UPPER(?)
        ');
        $stmt->execute([$code]);
    } else {
        $stmt = $db->prepare('
            SELECT c.id, c.complaint_code, c.category, c.title, c.description,
                   c.latitude, c.longitude, c.address, c.severity, c.priority_score,
                   c.priority_level, c.photo_path, c.status, c.department,
                   c.repair_evidence_photo, c.repair_notes, c.recalculated_at,
                   c.created_at, c.updated_at,
                   rs.segment_name, rs.route_name
            FROM complaints c
            LEFT JOIN route_segments rs ON c.associated_segment_id = rs.id
            WHERE c.id = ?
        ');
        $stmt->execute([$id]);
    }

    $complaint = $stmt->fetch();

    if (!$complaint) {
        jsonError("No complaint record found matching tracking reference '$code'. Please verify the ID and try again.", 404);
    }

    // Fetch public timeline history (strictly scrub private notes or internal officer IDs)
    $histStmt = $db->prepare('
        SELECT h.id, h.from_status, h.to_status, h.note, h.evidence_photo, h.created_at,
               u.role as updater_role
        FROM complaint_status_history h
        LEFT JOIN users u ON h.changed_by_user_id = u.id
        WHERE h.complaint_id = ? AND h.is_public = 1
        ORDER BY h.created_at ASC
    ');
    $histStmt->execute([$complaint['id']]);
    $history = $histStmt->fetchAll();

    $cleanHistory = array_map(function($h) {
        return [
            'from_status'    => $h['from_status'],
            'to_status'      => $h['to_status'],
            'note'           => $h['note'],
            'evidence_photo' => $h['evidence_photo'],
            'updated_by'     => ($h['updater_role'] === 'officer' || $h['updater_role'] === 'admin') ? 'Municipal Verification Officer' : 'System',
            'timestamp'      => $h['created_at']
        ];
    }, $history);

    jsonResponse([
        'complaint_code' => $complaint['complaint_code'],
        'category'       => $complaint['category'],
        'title'          => $complaint['title'],
        'description'    => $complaint['description'],
        'location'       => [
            'latitude'   => (float)$complaint['latitude'],
            'longitude'  => (float)$complaint['longitude'],
            'address'    => $complaint['address']
        ],
        'severity'       => (int)$complaint['severity'],
        'priority_score' => (int)$complaint['priority_score'],
        'priority_level' => $complaint['priority_level'],
        'photo_path'     => $complaint['photo_path'],
        'status'         => $complaint['status'],
        'department'     => $complaint['department'],
        'associated_route' => $complaint['segment_name'] ? "{$complaint['route_name']} ({$complaint['segment_name']})" : null,
        'repair_evidence_photo' => $complaint['repair_evidence_photo'],
        'repair_notes'   => $complaint['repair_notes'],
        'recalculated_at'=> $complaint['recalculated_at'],
        'timeline'       => $cleanHistory,
        'created_at'     => $complaint['created_at'],
        'updated_at'     => $complaint['updated_at']
    ], 200, 'Complaint details retrieved successfully.');

} catch (Exception $e) {
    error_log("Tracking error: " . $e->getMessage());
    jsonError('Failed to lookup complaint record.', 500);
}

