<?php
/**
 * SafeCity AI - Dashboard Metrics & Analytics Endpoint
 * GET /php/get_dashboard_stats.php
 */

require_once __DIR__ . '/helpers.php';

header('Content-Type: application/json; charset=utf-8');

try {
    $db = getDB();

    // Overall status counts
    $statusStmt = $db->query("
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
            SUM(CASE WHEN status = 'fixed' THEN 1 ELSE 0 END) as fixed,
            SUM(CASE WHEN severity >= 4 THEN 1 ELSE 0 END) as high_severity
        FROM complaints
    ");
    $counts = $statusStmt->fetch();

    $total = (int)($counts['total'] ?? 0);
    $pending = (int)($counts['pending'] ?? 0);
    $inProgress = (int)($counts['in_progress'] ?? 0);
    $fixed = (int)($counts['fixed'] ?? 0);
    $highSeverity = (int)($counts['high_severity'] ?? 0);
    $resolutionRate = ($total > 0) ? round(($fixed / $total) * 100, 1) : 0;

    // Category distribution
    $catStmt = $db->query("
        SELECT category, COUNT(*) as count 
        FROM complaints 
        GROUP BY category 
        ORDER BY count DESC
    ");
    $categories = $catStmt->fetchAll();

    // Format category distribution
    $categoryLabels = [
        'pothole'            => 'Potholes / Road Damage',
        'broken_streetlight' => 'Broken Streetlights',
        'garbage'            => 'Garbage Accumulation',
        'waterlogging'       => 'Waterlogging',
        'damaged_footpath'   => 'Damaged Footpaths',
        'drainage'           => 'Drainage Issues',
        'other'              => 'Other Civic Issues'
    ];

    $formattedCategories = [];
    foreach ($categories as $cat) {
        $cKey = $cat['category'];
        $formattedCategories[] = [
            'key'   => $cKey,
            'label' => $categoryLabels[$cKey] ?? ucfirst(str_replace('_', ' ', $cKey)),
            'count' => (int)$cat['count']
        ];
    }

    // Recent 5 complaints
    $recentStmt = $db->query("
        SELECT c.id, c.complaint_code, c.category, c.title, c.severity, c.priority_level,
               c.status, c.address, c.created_at, u.name as reporter_name
        FROM complaints c
        LEFT JOIN users u ON c.user_id = u.id
        ORDER BY c.created_at DESC
        LIMIT 6
    ");
    $recent = $recentStmt->fetchAll();

    // Average safety score of routes
    $routeStmt = $db->query("
        SELECT route_name, AVG(lighting_factor) as avg_light, AVG(road_condition_factor) as avg_road
        FROM route_segments
        GROUP BY route_name
    ");
    $routeStats = $routeStmt->fetchAll();

    jsonResponse([
        'metrics' => [
            'total_complaints'     => $total,
            'pending_complaints'   => $pending,
            'in_progress'          => $inProgress,
            'fixed_complaints'     => $fixed,
            'high_severity'        => $highSeverity,
            'resolution_rate'      => $resolutionRate,
            'active_sos_alerts'    => 1,
            'safe_places_count'    => 6
        ],
        'categories'       => $formattedCategories,
        'recent_complaints'=> $recent,
        'route_summary'    => $routeStats,
        'generated_at'     => date('c')
    ]);

} catch (Exception $e) {
    error_log("Dashboard stats error: " . $e->getMessage());
    jsonError('Failed to calculate dashboard statistics.', 500);
}

