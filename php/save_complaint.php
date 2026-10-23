<?php
/**
 * SafeCity AI - Save Civic Complaint Submission Endpoint
 * POST /php/save_complaint.php
 */

require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/auth.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Method not allowed. Use POST.', 405);
}

// User must be authenticated
$currentUser = requireAuth();

$category    = cleanInput($_POST['category'] ?? '');
$title       = cleanInput($_POST['title'] ?? '');
$description = cleanInput($_POST['description'] ?? '');
$latitude    = filter_var($_POST['latitude'] ?? null, FILTER_VALIDATE_FLOAT);
$longitude   = filter_var($_POST['longitude'] ?? null, FILTER_VALIDATE_FLOAT);
$address     = cleanInput($_POST['address'] ?? '');
$severity    = filter_var($_POST['severity'] ?? null, FILTER_VALIDATE_INT);
$department  = cleanInput($_POST['department'] ?? '');

$validCategories = [
    'pothole',
    'broken_streetlight',
    'garbage',
    'waterlogging',
    'damaged_footpath',
    'drainage',
    'other'
];

$errors = [];
if (!in_array($category, $validCategories, true)) {
    $errors['category'] = 'Please select a valid civic complaint category.';
}
if (empty($title) || strlen($title) < 5) {
    $errors['title'] = 'Complaint title must be at least 5 characters.';
}
if (empty($description) || strlen($description) < 10) {
    $errors['description'] = 'Please provide a clear description of at least 10 characters.';
}
if ($latitude === false || $longitude === false || $latitude < -90 || $latitude > 90 || $longitude < -180 || $longitude > 180) {
    $errors['location'] = 'Valid geographic coordinates (latitude and longitude) are required.';
}
if ($severity === false || $severity < 1 || $severity > 5) {
    $errors['severity'] = 'Severity level must be an integer between 1 and 5.';
}

if (!empty($errors)) {
    jsonError('Please correct the validation errors in your submission.', 422, $errors);
}

// Map default department based on category if not explicitly chosen
$departmentMap = [
    'pothole'            => 'Roads & Infrastructure',
    'broken_streetlight' => 'Electrical & Public Lighting',
    'garbage'            => 'Solid Waste Management',
    'waterlogging'       => 'Stormwater & Drainage',
    'damaged_footpath'   => 'Roads & Infrastructure',
    'drainage'           => 'Stormwater & Drainage',
    'other'              => 'Civic Administration'
];
if (empty($department)) {
    $department = $departmentMap[$category] ?? 'Civic Administration';
}

// Handle Photo Upload if supplied
$photoPath = null;
if (!empty($_FILES['photo']) && $_FILES['photo']['error'] !== UPLOAD_ERR_NO_FILE) {
    try {
        $photoPath = handleSecureUpload($_FILES['photo'], 'complaints');
    } catch (Exception $e) {
        jsonError($e->getMessage(), 400);
    }
}

try {
    $db = getDB();

    // Auto-detect closest route segment within ~1km to link for safety score recalculation
    $associatedSegmentId = null;
    $segStmt = $db->query('SELECT id, start_lat, start_lng, end_lat, end_lng FROM route_segments');
    $segments = $segStmt->fetchAll();

    $minDist = PHP_FLOAT_MAX;
    foreach ($segments as $seg) {
        $midLat = ($seg['start_lat'] + $seg['end_lat']) / 2;
        $midLng = ($seg['start_lng'] + $seg['end_lng']) / 2;
        // Euclidean approximation for small distance
        $dist = sqrt(pow($latitude - $midLat, 2) + pow($longitude - $midLng, 2));
        if ($dist < $minDist && $dist < 0.02) { // roughly within ~2 km
            $minDist = $dist;
            $associatedSegmentId = (int)$seg['id'];
        }
    }

    // Calculate priority
    $priorityData = calculateComplaintPriority((int)$severity, $category);

    // Generate unique Complaint Code (e.g. SC-2026-8492)
    $complaintCode = '';
    do {
        $codeCandidate = sprintf('SC-%s-%04d', date('Y'), mt_rand(1000, 9999));
        $codeCheck = $db->prepare('SELECT id FROM complaints WHERE complaint_code = ?');
        $codeCheck->execute([$codeCandidate]);
        if (!$codeCheck->fetch()) {
            $complaintCode = $codeCandidate;
        }
    } while (empty($complaintCode));

    // Insert complaint
    $insertSql = 'INSERT INTO complaints (
        complaint_code, user_id, category, title, description,
        latitude, longitude, address, severity, priority_score,
        priority_level, photo_path, status, department, associated_segment_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

    $insertStmt = $db->prepare($insertSql);
    $insertStmt->execute([
        $complaintCode,
        $currentUser['id'],
        $category,
        $title,
        $description,
        $latitude,
        $longitude,
        $address ?: 'Geocoded City Location',
        (int)$severity,
        $priorityData['score'],
        $priorityData['level'],
        $photoPath,
        'pending',
        $department,
        $associatedSegmentId
    ]);

    $complaintId = (int)$db->lastInsertId();

    // Insert status history
    $histStmt = $db->prepare('INSERT INTO complaint_status_history (complaint_id, changed_by_user_id, from_status, to_status, note, is_public) VALUES (?, ?, ?, ?, ?, ?)');
    $histStmt->execute([
        $complaintId,
        $currentUser['id'],
        'submitted',
        'pending',
        'Complaint filed by citizen. Severity assessed and priority generated.',
        1
    ]);

    logAudit($currentUser['id'], 'SUBMIT_COMPLAINT', 'complaints', $complaintId, "Complaint $complaintCode filed with priority {$priorityData['score']}");

    jsonResponse([
        'complaint_id'   => $complaintId,
        'complaint_code' => $complaintCode,
        'category'       => $category,
        'severity'       => (int)$severity,
        'priority_score' => $priorityData['score'],
        'priority_level' => $priorityData['level'],
        'priority_explanation' => $priorityData['explanation'],
        'department'     => $department,
        'photo_path'     => $photoPath,
        'status'         => 'pending',
        'associated_segment_id' => $associatedSegmentId
    ], 201, "Complaint successfully registered! Your tracking ID is $complaintCode.");

} catch (Exception $e) {
    error_log("Complaint save error: " . $e->getMessage());
    jsonError('A server error occurred while recording your complaint. Please try again.', 500);
}

