<?php
/**
 * SafeCity AI - Road Ratings Submission and Retrieval Endpoints
 */

require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/auth.php';

header('Content-Type: application/json; charset=utf-8');

$currentUser = requireAuth();

$roadName = cleanInput($_POST['road_name'] ?? '');
$latitude = filter_var($_POST['latitude'] ?? null, FILTER_VALIDATE_FLOAT);
$longitude = filter_var($_POST['longitude'] ?? null, FILTER_VALIDATE_FLOAT);
$rating = filter_var($_POST['rating'] ?? null, FILTER_VALIDATE_INT);
$lightingRating = filter_var($_POST['lighting_rating'] ?? null, FILTER_VALIDATE_INT);
$pavementRating = filter_var($_POST['pavement_rating'] ?? null, FILTER_VALIDATE_INT);
$review = cleanInput($_POST['review'] ?? '');

if (empty($roadName) || strlen($roadName) < 3) {
    jsonError('Road or area name must be at least 3 characters.', 422);
}
if ($rating === false || $rating < 1 || $rating > 5) {
    jsonError('Overall rating must be between 1 and 5 stars.', 422);
}
if ($latitude === false || $longitude === false || $latitude === null || $longitude === null) {
    jsonError('Valid geographic coordinates are required for the road rating.', 422);
}

try {
    $db = getDB();

    // Prevent duplicate abuse: check if user rated this road within past 24 hours
    $checkStmt = $db->prepare('SELECT id, created_at FROM road_ratings WHERE user_id = ? AND road_name = ? ORDER BY created_at DESC LIMIT 1');
    $checkStmt->execute([$currentUser['id'], $roadName]);
    $existing = $checkStmt->fetch();

    if ($existing) {
        $lastTime = strtotime($existing['created_at']);
        if (time() - $lastTime < 86400) {
            // Update existing rating instead of flooding duplicates
            $upStmt = $db->prepare('
                UPDATE road_ratings 
                SET rating = ?, lighting_rating = ?, pavement_rating = ?, review = ?, latitude = ?, longitude = ?, created_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ');
            $upStmt->execute([
                $rating,
                $lightingRating ?: null,
                $pavementRating ?: null,
                $review ?: null,
                $latitude,
                $longitude,
                $existing['id']
            ]);

            logAudit($currentUser['id'], 'UPDATE_ROAD_RATING', 'road_ratings', (int)$existing['id'], "Updated rating for $roadName");

            jsonResponse([
                'id' => (int)$existing['id'],
                'updated' => true
            ], 200, "Your previous rating for '$roadName' has been updated!");
        }
    }

    // Insert fresh rating
    $insStmt = $db->prepare('
        INSERT INTO road_ratings (user_id, road_name, latitude, longitude, rating, lighting_rating, pavement_rating, review)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ');
    $insStmt->execute([
        $currentUser['id'],
        $roadName,
        $latitude,
        $longitude,
        $rating,
        $lightingRating ?: null,
        $pavementRating ?: null,
        $review ?: null
    ]);

    $ratingId = (int)$db->lastInsertId();

    logAudit($currentUser['id'], 'SUBMIT_ROAD_RATING', 'road_ratings', $ratingId, "Submitted $rating stars for $roadName");

    jsonResponse([
        'id'        => $ratingId,
        'road_name' => $roadName,
        'rating'    => $rating
    ], 201, "Thank you! Your feedback for '$roadName' has been added to civic safety signals.");

} catch (Exception $e) {
    error_log("Save rating error: " . $e->getMessage());
    jsonError('Failed to record road rating.', 500);
}

