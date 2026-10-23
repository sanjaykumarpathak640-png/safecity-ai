<?php
/**
 * SafeCity AI - Fetch Road Ratings & Aggregates
 * GET /php/get_ratings.php?road_name=MG+Road+North
 */

require_once __DIR__ . '/helpers.php';

header('Content-Type: application/json; charset=utf-8');

$roadName = cleanInput($_GET['road_name'] ?? '');
$limit = min(50, max(1, (int)($_GET['limit'] ?? 20)));

try {
    $db = getDB();

    $where = ['1=1'];
    $params = [];

    if (!empty($roadName)) {
        $where[] = 'r.road_name = ?';
        $params[] = $roadName;
    }

    $whereSql = implode(' AND ', $where);

    $sql = "
        SELECT r.id, r.road_name, r.latitude, r.longitude, r.rating,
               r.lighting_rating, r.pavement_rating, r.review, r.created_at,
               u.name as reviewer_name
        FROM road_ratings r
        JOIN users u ON r.user_id = u.id
        WHERE $whereSql
        ORDER BY r.created_at DESC
        LIMIT ?
    ";

    $stmt = $db->prepare($sql);
    $allParams = array_merge($params, [$limit]);
    $stmt->execute($allParams);
    $reviews = $stmt->fetchAll();

    // Calculate aggregated statistics
    $aggSql = "
        SELECT COUNT(*) as total_count,
               AVG(rating) as avg_rating,
               AVG(lighting_rating) as avg_lighting,
               AVG(pavement_rating) as avg_pavement
        FROM road_ratings r
        WHERE $whereSql
    ";
    $aggStmt = $db->prepare($aggSql);
    $aggStmt->execute($params);
    $stats = $aggStmt->fetch();

    $sanitizedReviews = array_map(function($r) {
        return [
            'id'              => (int)$r['id'],
            'road_name'       => $r['road_name'],
            'latitude'        => (float)$r['latitude'],
            'longitude'       => (float)$r['longitude'],
            'rating'          => (int)$r['rating'],
            'lighting_rating' => $r['lighting_rating'] ? (int)$r['lighting_rating'] : null,
            'pavement_rating' => $r['pavement_rating'] ? (int)$r['pavement_rating'] : null,
            'review'          => $r['review'],
            'reviewer_name'   => $r['reviewer_name'],
            'created_at'      => $r['created_at']
        ];
    }, $reviews);

    jsonResponse([
        'stats' => [
            'total_reviews' => (int)($stats['total_count'] ?? 0),
            'avg_rating'    => round((float)($stats['avg_rating'] ?? 0), 1),
            'avg_lighting'  => round((float)($stats['avg_lighting'] ?? 0), 1),
            'avg_pavement'  => round((float)($stats['avg_pavement'] ?? 0), 1)
        ],
        'reviews' => $sanitizedReviews,
        'disclaimer' => 'Community ratings reflect perceived convenience and illumination by participating citizens. Ratings do not constitute legal or security guarantees.'
    ]);

} catch (Exception $e) {
    error_log("Get ratings error: " . $e->getMessage());
    jsonError('Failed to fetch road ratings.', 500);
}

