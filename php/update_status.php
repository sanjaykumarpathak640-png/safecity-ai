<?php
/**
 * SafeCity AI - Officer Status Update & Civic Repair Recalculation Endpoint
 * POST /php/update_status.php
 * Signature Feature: Recalculates route safety factors on verified fix!
 */

require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/auth.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Method not allowed. Use POST.', 405);
}

// Authorized municipal officer required
$officer = requireOfficer();

$complaintId = filter_var($_POST['complaint_id'] ?? null, FILTER_VALIDATE_INT);
$newStatus   = cleanInput($_POST['status'] ?? '');
$note        = cleanInput($_POST['note'] ?? '');
$isPublic    = isset($_POST['is_public']) ? (int)(bool)$_POST['is_public'] : 1;

$validStatuses = ['pending', 'in_progress', 'fixed', 'rejected'];
if (!$complaintId) {
    jsonError('Valid complaint ID is required.', 422);
}
if (!in_array($newStatus, $validStatuses, true)) {
    jsonError('Invalid status value provided.', 422);
}

// Handle repair evidence photo upload if supplied
$repairEvidencePhoto = null;
if (!empty($_FILES['repair_evidence_photo']) && $_FILES['repair_evidence_photo']['error'] !== UPLOAD_ERR_NO_FILE) {
    try {
        $repairEvidencePhoto = handleSecureUpload($_FILES['repair_evidence_photo'], 'repairs');
    } catch (Exception $e) {
        jsonError('Repair evidence upload failed: ' . $e->getMessage(), 400);
    }
}

try {
    $db = getDB();

    // Check existing complaint
    $checkStmt = $db->prepare('SELECT * FROM complaints WHERE id = ?');
    $checkStmt->execute([$complaintId]);
    $complaint = $checkStmt->fetch();

    if (!$complaint) {
        jsonError('Complaint record not found.', 404);
    }

    $oldStatus = $complaint['status'];

    // Require repair note or evidence when resolving
    if ($newStatus === 'fixed' && empty($note) && empty($repairEvidencePhoto) && empty($complaint['repair_evidence_photo'])) {
        // Warning or default note
        $note = 'Civic infrastructure defect addressed and verified by Municipal Field Inspection team.';
    }

    // Update complaint record
    $updateFields = ['status = ?', 'assigned_officer_id = ?'];
    $params = [$newStatus, $officer['id']];

    if ($repairEvidencePhoto) {
        $updateFields[] = 'repair_evidence_photo = ?';
        $params[] = $repairEvidencePhoto;
    }
    if (!empty($note)) {
        $updateFields[] = 'repair_notes = ?';
        $params[] = $note;
    }

    $params[] = $complaintId;
    $updateSql = 'UPDATE complaints SET ' . implode(', ', $updateFields) . ', updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    $updateStmt = $db->prepare($updateSql);
    $updateStmt->execute($params);

    // Record Status History
    $historyStmt = $db->prepare('
        INSERT INTO complaint_status_history (complaint_id, changed_by_user_id, from_status, to_status, note, is_public, evidence_photo)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ');
    $historyStmt->execute([
        $complaintId,
        $officer['id'],
        $oldStatus,
        $newStatus,
        $note,
        $isPublic,
        $repairEvidencePhoto
    ]);

    // Recalculate Road Segment Safety Factors
    $recalculationResult = recalculateRoadSegmentForComplaint($complaintId, $newStatus, $note, $repairEvidencePhoto);

    // Log Audit Trail
    logAudit(
        $officer['id'],
        'UPDATE_COMPLAINT_STATUS',
        'complaints',
        $complaintId,
        "Status updated from $oldStatus to $newStatus by Officer {$officer['name']}"
    );

    $responseMessage = ($newStatus === 'fixed')
        ? "Complaint #{$complaint['complaint_code']} marked as Fixed! Road condition data updated following officer-reviewed repair record."
        : "Complaint #{$complaint['complaint_code']} status successfully updated to " . ucfirst(str_replace('_', ' ', $newStatus)) . ".";

    jsonResponse([
        'complaint_id'   => $complaintId,
        'old_status'     => $oldStatus,
        'new_status'     => $newStatus,
        'repair_evidence_photo' => $repairEvidencePhoto ?: $complaint['repair_evidence_photo'],
        'recalculation'  => $recalculationResult
    ], 200, $responseMessage);

} catch (Exception $e) {
    error_log("Update status error: " . $e->getMessage());
    jsonError('A database error occurred while updating the complaint status.', 500);
}

