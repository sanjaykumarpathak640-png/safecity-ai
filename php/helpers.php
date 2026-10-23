<?php
/**
 * SafeCity AI - Central Helpers and Utilities
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

/**
 * Send standard JSON success response
 */
function jsonResponse(mixed $data = [], int $statusCode = 200, string $message = 'Operation successful'): void {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => true,
        'message' => $message,
        'data'    => $data,
        'timestamp' => date('c')
    ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Send standard JSON error response
 */
function jsonError(string $message, int $statusCode = 400, array $errors = []): void {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => false,
        'message' => $message,
        'errors'  => $errors,
        'timestamp' => date('c')
    ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Start secure session
 */
function startSafeSession(): void {
    if (session_status() === PHP_SESSION_NONE) {
        $cookieParams = [
            'lifetime' => SESSION_LIFETIME,
            'path'     => '/',
            'domain'   => '',
            'secure'   => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
            'httponly' => true,
            'samesite' => 'Lax'
        ];
        session_set_cookie_params($cookieParams);
        session_name(SESSION_NAME);
        session_start();
    }
}

/**
 * Get current authenticated user
 */
function getCurrentUser(): ?array {
    startSafeSession();
    if (!empty($_SESSION['user_id'])) {
        return [
            'id'    => (int)$_SESSION['user_id'],
            'name'  => $_SESSION['user_name'] ?? 'User',
            'email' => $_SESSION['user_email'] ?? '',
            'role'  => $_SESSION['user_role'] ?? 'citizen',
            'phone' => $_SESSION['user_phone'] ?? ''
        ];
    }
    return null;
}

/**
 * Generate or get CSRF token
 */
function getCSRFToken(): string {
    startSafeSession();
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

/**
 * Verify CSRF token
 */
function verifyCSRFToken(?string $token): bool {
    startSafeSession();
    if (empty($_SESSION['csrf_token']) || empty($token)) {
        return false;
    }
    return hash_equals($_SESSION['csrf_token'], $token);
}

/**
 * Validate and sanitize input string
 */
function cleanInput(?string $data): string {
    if ($data === null) return '';
    return htmlspecialchars(trim($data), ENT_QUOTES, 'UTF-8');
}

/**
 * Safe file upload handler
 */
function handleSecureUpload(array $file, string $subDir = 'complaints'): string {
    if ($file['error'] !== UPLOAD_ERR_OK) {
        $uploadErrors = [
            UPLOAD_ERR_INI_SIZE   => 'Uploaded file exceeds server file limit.',
            UPLOAD_ERR_FORM_SIZE  => 'Uploaded file exceeds form limit.',
            UPLOAD_ERR_PARTIAL    => 'File was only partially uploaded.',
            UPLOAD_ERR_NO_FILE    => 'No file was uploaded.',
            UPLOAD_ERR_NO_TMP_DIR => 'Missing temporary folder.',
            UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk.',
            UPLOAD_ERR_EXTENSION  => 'A PHP extension stopped the file upload.'
        ];
        throw new Exception($uploadErrors[$file['error']] ?? 'File upload error occurred.');
    }

    if ($file['size'] > MAX_UPLOAD_SIZE) {
        throw new Exception('File size exceeds the 5MB maximum limit.');
    }

    // Verify MIME type using finfo
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mimeType = $finfo->file($file['tmp_name']);

    if (!array_key_exists($mimeType, ALLOWED_MIME_TYPES)) {
        throw new Exception('Invalid file type. Only JPG, PNG, and WebP images are permitted.');
    }

    $ext = ALLOWED_MIME_TYPES[$mimeType];
    $safeName = sprintf('%s_%s.%s', date('Ymd_His'), bin2hex(random_bytes(8)), $ext);

    $targetDir = rtrim(UPLOAD_DIR, '/\\') . DIRECTORY_SEPARATOR . $subDir;
    if (!is_dir($targetDir)) {
        mkdir($targetDir, 0755, true);
    }

    $targetPath = $targetDir . DIRECTORY_SEPARATOR . $safeName;
    if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
        throw new Exception('Failed to save uploaded file safely.');
    }

    return 'uploads/' . $subDir . '/' . $safeName;
}

/**
 * Calculate transparent explainable complaint priority
 */
function calculateComplaintPriority(int $severity, string $category): array {
    $severityClamped = max(1, min(5, $severity));
    
    // Severity contributes 15-75 points
    $severityWeight = $severityClamped * 15;

    // Category risk hazard factor (0-25 points)
    $categoryHazardWeights = [
        'drainage'           => 20, // open manholes, falling risk
        'broken_streetlight' => 18, // night visibility and security risk
        'pothole'            => 15, // vehicular accident and skid risk
        'waterlogging'       => 12, // pedestrian hindrance and vector risk
        'damaged_footpath'   => 10, // pedestrian trip hazard
        'garbage'            => 8,  // public sanitation
        'other'              => 10
    ];

    $categoryWeight = $categoryHazardWeights[$category] ?? 10;
    $rawScore = $severityWeight + $categoryWeight;
    $priorityScore = min(100, max(15, $rawScore));

    if ($priorityScore >= 85) {
        $level = 'Critical';
        $desc = "Immediate civic hazard ($priorityScore/100): High physical vulnerability with severity score $severityClamped/5 and $category risk weighting.";
    } elseif ($priorityScore >= 70) {
        $level = 'High';
        $desc = "High priority ($priorityScore/100): Active infrastructure impediment requiring expedited dispatch.";
    } elseif ($priorityScore >= 50) {
        $level = 'Medium';
        $desc = "Moderate priority ($priorityScore/100): Standard municipal maintenance schedule queue.";
    } else {
        $level = 'Low';
        $desc = "Routine maintenance ($priorityScore/100): Non-critical community convenience report.";
    }

    return [
        'score'       => $priorityScore,
        'level'       => $level,
        'explanation' => $desc
    ];
}

/**
 * Log action into audit_logs table
 */
function logAudit(?int $userId, string $action, string $entityType, ?int $entityId, string $details = ''): void {
    try {
        $db = getDB();
        $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
        $stmt = $db->prepare('INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)');
        $stmt->execute([$userId, $action, $entityType, $entityId, $details, $ip]);
    } catch (Exception $e) {
        error_log("Audit log failed: " . $e->getMessage());
    }
}

/**
 * Connected Civic Feedback Loop:
 * Recalculates road segment safety factors when a complaint status changes!
 */
function recalculateRoadSegmentForComplaint(int $complaintId, string $newStatus, string $note, ?string $evidencePath = null): array {
    $db = getDB();
    $stmt = $db->prepare('SELECT id, category, associated_segment_id, severity FROM complaints WHERE id = ?');
    $stmt->execute([$complaintId]);
    $complaint = $stmt->fetch();

    if (!$complaint || empty($complaint['associated_segment_id'])) {
        return [
            'recalculated' => false,
            'message'      => 'No associated road segment linked to this civic issue.'
        ];
    }

    $segmentId = (int)$complaint['associated_segment_id'];
    $category = $complaint['category'];

    // Fetch current segment
    $segStmt = $db->prepare('SELECT * FROM route_segments WHERE id = ?');
    $segStmt->execute([$segmentId]);
    $segment = $segStmt->fetch();

    if (!$segment) {
        return ['recalculated' => false, 'message' => 'Segment record not found.'];
    }

    $oldLighting = (float)$segment['lighting_factor'];
    $oldRoad = (float)$segment['road_condition_factor'];
    $newLighting = $oldLighting;
    $newRoad = $oldRoad;
    $reason = '';

    if ($newStatus === 'fixed') {
        if ($category === 'broken_streetlight') {
            // Restore lighting to favorable score (up to 92.00)
            $newLighting = min(92.00, max($segment['baseline_lighting'], $oldLighting + 35.00));
            $reason = sprintf(
                "Lighting score improved from %.1f to %.1f following verified repair of municipal streetlight (Complaint #%d).",
                $oldLighting,
                $newLighting,
                $complaintId
            );
        } elseif ($category === 'pothole' || $category === 'damaged_footpath') {
            // Restore road condition factor (up to 90.00)
            $newRoad = min(90.00, max($segment['baseline_road_condition'], $oldRoad + 30.00));
            $reason = sprintf(
                "Road condition score improved from %.1f to %.1f following verified asphalt patch repair (Complaint #%d).",
                $oldRoad,
                $newRoad,
                $complaintId
            );
        } else {
            $reason = "Road condition data updated following an officer-reviewed repair record.";
        }
    } elseif ($newStatus === 'in_progress') {
        $reason = "Civic repair work currently in progress by municipal crew. Safety score monitoring active.";
    } elseif ($newStatus === 'pending') {
        // Re-penalize if reopened
        if ($category === 'broken_streetlight') {
            $newLighting = max(35.00, $oldLighting - 30.00);
            $reason = "Lighting factor reduced due to active unaddressed streetlight outage.";
        } elseif ($category === 'pothole') {
            $newRoad = max(35.00, $oldRoad - 25.00);
            $reason = "Road surface factor reduced due to reported road surface defect.";
        }
    }

    // Update the route segment
    $updateStmt = $db->prepare('UPDATE route_segments SET lighting_factor = ?, road_condition_factor = ?, last_recalculated_at = CURRENT_TIMESTAMP, recalculation_reason = ? WHERE id = ?');
    $updateStmt->execute([$newLighting, $newRoad, $reason, $segmentId]);

    // Stamp complaint with recalculation timestamp
    $stampStmt = $db->prepare('UPDATE complaints SET recalculated_at = CURRENT_TIMESTAMP WHERE id = ?');
    $stampStmt->execute([$complaintId]);

    return [
        'recalculated'   => true,
        'segment_id'     => $segmentId,
        'segment_name'   => $segment['segment_name'],
        'route_name'     => $segment['route_name'],
        'old_lighting'   => $oldLighting,
        'new_lighting'   => $newLighting,
        'old_road'       => $oldRoad,
        'new_road'       => $newRoad,
        'reason'         => $reason
    ];
}

