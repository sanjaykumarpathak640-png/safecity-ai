<?php
/**
 * SafeCity AI - SafeRoute Route Comparison & Scoring Engine
 * GET /php/get_routes.php?origin=Metro+Station&destination=Tech+Park
 */

require_once __DIR__ . '/helpers.php';

header('Content-Type: application/json; charset=utf-8');

$origin = cleanInput($_GET['origin'] ?? 'Metro Central Station');
$destination = cleanInput($_GET['destination'] ?? 'Tech Innovation Hub');

try {
    $db = getDB();

    // Fetch all segments grouped by route_name
    $stmt = $db->query('SELECT * FROM route_segments ORDER BY route_name ASC, id ASC');
    $allSegments = $stmt->fetchAll();

    // Group segments by route
    $groupedRoutes = [];
    foreach ($allSegments as $seg) {
        $routeName = $seg['route_name'];
        if (!isset($groupedRoutes[$routeName])) {
            $groupedRoutes[$routeName] = [];
        }
        $groupedRoutes[$routeName][] = $seg;
    }

    // Safety Engine Weights
    $weights = [
        'lighting'         => 0.20,
        'crowd'            => 0.15,
        'incident'         => 0.25,
        'help_access'      => 0.15,
        'time'             => 0.10,
        'road_condition'   => 0.10,
        'community_signal' => 0.05
    ];

    $processedRoutes = [];

    foreach ($groupedRoutes as $rName => $segments) {
        $totalDist = 0;
        $weightedLighting = 0;
        $weightedCrowd = 0;
        $weightedIncident = 0;
        $weightedHelp = 0;
        $weightedTime = 0;
        $weightedRoad = 0;
        $weightedCommunity = 0;

        $coordinates = [];
        $segmentSummaries = [];
        $recalculationNotices = [];
        $segmentIds = [];

        foreach ($segments as $s) {
            $dist = (float)$s['distance_km'];
            $totalDist += $dist;
            $segmentIds[] = (int)$s['id'];

            $weightedLighting  += (float)$s['lighting_factor'] * $dist;
            $weightedCrowd     += (float)$s['crowd_factor'] * $dist;
            $weightedIncident  += (float)$s['incident_factor'] * $dist;
            $weightedHelp      += (float)$s['help_access_factor'] * $dist;
            $weightedTime      += (float)$s['time_factor'] * $dist;
            $weightedRoad      += (float)$s['road_condition_factor'] * $dist;
            $weightedCommunity += (float)$s['community_signal_factor'] * $dist;

            // Geometry polyline points
            $coordinates[] = [(float)$s['start_lat'], (float)$s['start_lng']];
            $coordinates[] = [(float)$s['end_lat'], (float)$s['end_lng']];

            $segmentSummaries[] = [
                'id'             => (int)$s['id'],
                'name'           => $s['segment_name'],
                'distance_km'    => $dist,
                'lighting'       => (float)$s['lighting_factor'],
                'road_condition' => (float)$s['road_condition_factor'],
                'crowd'          => (float)$s['crowd_factor'],
                'last_recalculated' => $s['last_recalculated_at'],
                'recalculation_reason' => $s['recalculation_reason']
            ];

            if (!empty($s['last_recalculated_at'])) {
                $recalculationNotices[] = [
                    'segment'   => $s['segment_name'],
                    'timestamp' => $s['last_recalculated_at'],
                    'reason'    => $s['recalculation_reason']
                ];
            }
        }

        // Avoid division by zero
        $safeDist = max(0.1, $totalDist);
        $avgLighting  = round($weightedLighting / $safeDist, 1);
        $avgCrowd     = round($weightedCrowd / $safeDist, 1);
        $avgIncident  = round($weightedIncident / $safeDist, 1);
        $avgHelp      = round($weightedHelp / $safeDist, 1);
        $avgTime      = round($weightedTime / $safeDist, 1);
        $avgRoad      = round($weightedRoad / $safeDist, 1);
        $avgCommunity = round($weightedCommunity / $safeDist, 1);

        // Overall Safety Score calculation
        $rawScore = ($avgLighting * $weights['lighting'])
                  + ($avgCrowd * $weights['crowd'])
                  + ($avgIncident * $weights['incident'])
                  + ($avgHelp * $weights['help_access'])
                  + ($avgTime * $weights['time'])
                  + ($avgRoad * $weights['road_condition'])
                  + ($avgCommunity * $weights['community_signal']);

        $overallScore = round(max(0, min(100, $rawScore)), 1);

        // Estimated travel duration (minutes)
        $speed = ($rName === 'Route A') ? 28 : 22; // km/h
        $durationMinutes = ceil(($totalDist / $speed) * 60);

        // Fetch civic complaints along this route's segments
        $compList = [];
        if (!empty($segmentIds)) {
            $inClause = implode(',', $segmentIds);
            $compStmt = $db->query("SELECT id, complaint_code, category, title, severity, status, latitude, longitude, address FROM complaints WHERE associated_segment_id IN ($inClause)");
            $compList = $compStmt->fetchAll();
        }

        // Qualitative assessment tag
        if ($overallScore >= 80) {
            $ratingLabel = 'Optimal Recommended Route';
            $ratingBadge = 'safe';
        } elseif ($overallScore >= 60) {
            $ratingLabel = 'Moderate Caution / Partially Lit';
            $ratingBadge = 'caution';
        } else {
            $ratingLabel = 'Multiple Active Infrastructure Concerns';
            $ratingBadge = 'warning';
        }

        $processedRoutes[] = [
            'route_name'       => $rName,
            'title'            => ($rName === 'Route A') ? 'Commercial Transit Corridor (Well-Lit)' : 'Alternative Old Bypass Link',
            'summary'          => ($rName === 'Route A') ? 'Via Commercial Boulevard with high street lighting and CCTV coverage' : 'Via Secondary Industrial Corridor with fewer pedestrian zones',
            'distance_km'      => round($totalDist, 2),
            'duration_minutes' => $durationMinutes,
            'safety_score'     => $overallScore,
            'rating_label'     => $ratingLabel,
            'rating_badge'     => $ratingBadge,
            'factors'          => [
                'lighting' => [
                    'name'   => 'Lighting Quality',
                    'score'  => $avgLighting,
                    'weight' => '20%',
                    'desc'   => 'Measured from verified street illumination fixtures and absence of active blackouts.'
                ],
                'crowd' => [
                    'name'   => 'Crowd Activity',
                    'score'  => $avgCrowd,
                    'weight' => '15%',
                    'desc'   => 'Pedestrian presence, open commercial shops, and transit hubs along corridor.'
                ],
                'incident_history' => [
                    'name'   => 'Incident-History Signal',
                    'score'  => $avgIncident,
                    'weight' => '25%',
                    'desc'   => 'Historical safety indices and verified civic incident frequencies.'
                ],
                'help_access' => [
                    'name'   => 'Proximity to Help Points',
                    'score'  => $avgHelp,
                    'weight' => '15%',
                    'desc'   => 'Buffer radius to police booths, 24/7 hospitals, and verified public kiosks.'
                ],
                'time_factor' => [
                    'name'   => 'Time-Related Factor',
                    'score'  => $avgTime,
                    'weight' => '10%',
                    'desc'   => 'Dynamic adjustment for daylight hours versus late evening isolation.'
                ],
                'road_condition' => [
                    'name'   => 'Road Condition',
                    'score'  => $avgRoad,
                    'weight' => '10%',
                    'desc'   => 'Asphalt smoothness, sidewalk integrity, and absence of open hazardous potholes.'
                ],
                'community_signal' => [
                    'name'   => 'Approved Community Reports',
                    'score'  => $avgCommunity,
                    'weight' => '5%',
                    'desc'   => 'Officer-moderated community feedback and citizen star ratings.'
                ]
            ],
            'coordinates'          => $coordinates,
            'segments'             => $segmentSummaries,
            'complaints'           => $compList,
            'recalculation_notices'=> $recalculationNotices
        ];
    }

    jsonResponse([
        'query' => [
            'origin'      => $origin,
            'destination' => $destination,
            'mode'        => 'demonstration_corridor'
        ],
        'weights' => $weights,
        'disclaimer' => 'Scores represent transparent heuristic indicators from reported infrastructure conditions. Higher scores mean more favorable reported conditions in this prototype; they do not predict criminality or guarantee personal safety.',
        'routes'  => $processedRoutes
    ]);

} catch (Exception $e) {
    error_log("Get routes error: " . $e->getMessage());
    jsonError('Failed to compute route safety data.', 500);
}

