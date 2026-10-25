<?php
/**
 * SafeCity AI - Fetch List of Complaints with Filters
 * GET /php/get_complaints.php
 */

require_once __DIR__ . '/helpers.php';

header('Content-Type: application/json; charset=utf-8');

$currentUser = getCurrentUser();

$status   = cleanInput($_GET['status'] ?? '');
$category = cleanInput($_GET['category'] ?? '');
$severity = filter_var($_GET['severity'] ?? null, FILTER_VALIDATE_INT);
$userOnly = !empty($_GET['user_only']);
$limit    = min(100, max(1, (int)($_GET['limit'] ?? 50)));
$offset   = max(0, (int)($_GET['offset'] ?? 0));

try {
    $db = getDB();

    $where = ['1=1'];
    $params = [];

    if ($userOnly) {
        if (!$currentUser) {
            // Gracefully return empty list if not logged in (client merges with localStorage)
            jsonResponse([
                'total' => 0,
                'complaints' => [],
                'limit' => $limit,
                'offset' => $offset
            ]);
            exit;
        }
        $where[] = 'c.user_id = ?';
        $params[] = $currentUser['id'];
    }

    if (!empty($status)) {
        $where[] = 'c.status = ?';
        $params[] = $status;
    }

    if (!empty($category)) {
        $where[] = 'c.category = ?';
        $params[] = $category;
    }

    if ($severity !== false && $severity !== null) {
        $where[] = 'c.severity = ?';
        $params[] = $severity;
    }

    $whereSql = implode(' AND ', $where);

    $sql = "SELECT c.*, 
                   u.name as reporter_name,
                   o.name as officer_name,
                   rs.segment_name,
                   rs.route_name
            FROM complaints c
            LEFT JOIN users u ON c.user_id = u.id
            LEFT JOIN users o ON c.assigned_officer_id = o.id
            LEFT JOIN route_segments rs ON c.associated_segment_id = rs.id
            WHERE $whereSql
            ORDER BY c.created_at DESC
            LIMIT ? OFFSET ?";

    $stmt = $db->prepare($sql);
    $allParams = array_merge($params, [$limit, $offset]);
    $stmt->execute($allParams);
    $complaints = $stmt->fetchAll();

    // Total count for pagination
    $countSql = "SELECT COUNT(*) FROM complaints c WHERE $whereSql";
    $countStmt = $db->prepare($countSql);
    $countStmt->execute($params);
    $totalCount = (int)$countStmt->fetchColumn();

    // Map and sanitize output
    $sanitized = array_map(function($comp) use ($currentUser) {
        $isOfficerOrOwner = $currentUser && ($currentUser['role'] === 'officer' || $currentUser['role'] === 'admin' || $currentUser['id'] === (int)$comp['user_id']);
        return [
            'id'             => (int)$comp['id'],
            'complaint_code' => $comp['complaint_code'],
            'category'       => $comp['category'],
            'title'          => $comp['title'],
            'description'    => $comp['description'],
            'latitude'       => (float)$comp['latitude'],
            'longitude'      => (float)$comp['longitude'],
            'address'        => $comp['address'],
            'severity'       => (int)$comp['severity'],
            'priority_score' => (int)$comp['priority_score'],
            'priority_level' => $comp['priority_level'],
            'photo_path'     => $comp['photo_path'],
            'status'         => $comp['status'],
            'department'     => $comp['department'],
            'assigned_officer' => $comp['officer_name'] ?? 'Unassigned',
            'reporter_name'  => $isOfficerOrOwner ? ($comp['reporter_name'] ?? 'Citizen') : 'Citizen',
            'associated_segment' => $comp['segment_name'] ? "{$comp['route_name']}: {$comp['segment_name']}" : null,
            'repair_evidence_photo' => $comp['repair_evidence_photo'],
            'repair_notes'   => $comp['repair_notes'],
            'created_at'     => $comp['created_at'],
            'updated_at'     => $comp['updated_at']
        ];
    }, $complaints);

    jsonResponse([
        'complaints'  => $sanitized,
        'total'       => $totalCount,
        'limit'       => $limit,
        'offset'      => $offset
    ]);

} catch (Exception $e) {
    error_log("Get complaints error: " . $e->getMessage());
    jsonError('Failed to fetch complaints list.', 500);
}

