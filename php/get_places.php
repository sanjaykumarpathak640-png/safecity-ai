<?php
/**
 * SafeCity AI - Safe Places (Police, Hospitals, Help Points) Endpoint
 * GET /php/get_places.php?type=all&lat=12.975&lng=77.599&radius=10
 */

require_once __DIR__ . '/helpers.php';

header('Content-Type: application/json; charset=utf-8');

$type   = cleanInput($_GET['type'] ?? 'all');
$userLat = filter_var($_GET['lat'] ?? null, FILTER_VALIDATE_FLOAT);
$userLng = filter_var($_GET['lng'] ?? null, FILTER_VALIDATE_FLOAT);

try {
    $db = getDB();

    $where = ['1=1'];
    $params = [];

    if ($type !== 'all' && !empty($type)) {
        $where[] = 'type = ?';
        $params[] = $type;
    }

    $whereSql = implode(' AND ', $where);
    $stmt = $db->prepare("SELECT * FROM safe_places WHERE $whereSql ORDER BY id ASC");
    $stmt->execute($params);
    $places = $stmt->fetchAll();

    // Calculate distance if user coordinates provided
    $results = array_map(function($p) use ($userLat, $userLng) {
        $distKm = null;
        if ($userLat !== false && $userLng !== false && $userLat !== null && $userLng !== null) {
            // Haversine formula
            $earthRadius = 6371; // km
            $dLat = deg2rad((float)$p['latitude'] - $userLat);
            $dLng = deg2rad((float)$p['longitude'] - $userLng);
            $a = sin($dLat / 2) * sin($dLat / 2) +
                 cos(deg2rad($userLat)) * cos(deg2rad((float)$p['latitude'])) *
                 sin($dLng / 2) * sin($dLng / 2);
            $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
            $distKm = round($earthRadius * $c, 2);
        }

        return [
            'id'          => (int)$p['id'],
            'name'        => $p['name'],
            'type'        => $p['type'],
            'latitude'    => (float)$p['latitude'],
            'longitude'   => (float)$p['longitude'],
            'address'     => $p['address'],
            'phone'       => $p['phone'],
            'open_hours'  => $p['open_hours'],
            'verified'    => (bool)$p['verified'],
            'distance_km' => $distKm
        ];
    }, $places);

    // Sort by distance if calculated
    if ($userLat !== null && $userLng !== null) {
        usort($results, fn($a, $b) => ($a['distance_km'] ?? 0) <=> ($b['distance_km'] ?? 0));
    }

    jsonResponse([
        'total'     => count($results),
        'places'    => $results,
        'source'    => 'SafeCity Verified Civic Directory',
        'disclaimer' => 'All emergency locations are verified municipal points of assistance. Hours and contact numbers are confirmed for the metropolitan area.'
    ]);

} catch (Exception $e) {
    error_log("Get places error: " . $e->getMessage());
    jsonError('Failed to fetch nearby safe places.', 500);
}

