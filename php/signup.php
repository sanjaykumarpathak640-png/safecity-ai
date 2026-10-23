<?php
/**
 * SafeCity AI - User Registration Endpoint
 * POST /php/signup.php
 */

require_once __DIR__ . '/helpers.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Method not allowed. Use POST.', 405);
}

// Support both JSON body and multipart form data
$rawBody = file_get_contents('php://input');
$body = json_decode($rawBody, true) ?? $_POST;

$name  = cleanInput($body['name'] ?? '');
$email = filter_var(trim($body['email'] ?? ''), FILTER_VALIDATE_EMAIL);
$password = $body['password'] ?? '';
$role = in_array($body['role'] ?? '', ['citizen', 'officer'], true) ? $body['role'] : 'citizen';
$phone = cleanInput($body['phone'] ?? '');
$emergencyContactName  = cleanInput($body['emergency_contact_name'] ?? '');
$emergencyContactPhone = cleanInput($body['emergency_contact_phone'] ?? '');

$errors = [];
if (empty($name) || strlen($name) < 2) {
    $errors['name'] = 'Full name must be at least 2 characters.';
}
if (!$email) {
    $errors['email'] = 'A valid email address is required.';
}
if (empty($password) || strlen($password) < 6) {
    $errors['password'] = 'Password must be at least 6 characters.';
}

if (!empty($errors)) {
    jsonError('Validation failed. Please correct the highlighted errors.', 422, $errors);
}

try {
    $db = getDB();

    // Check duplicate email
    $checkStmt = $db->prepare('SELECT id FROM users WHERE email = ?');
    $checkStmt->execute([$email]);
    if ($checkStmt->fetch()) {
        jsonError('This email address is already registered. Please sign in instead.', 409, ['email' => 'Email already registered']);
    }

    $hashedPassword = password_hash($password, PASSWORD_BCRYPT);

    $insertStmt = $db->prepare(
        'INSERT INTO users (name, email, password, role, phone, emergency_contact_name, emergency_contact_phone) 
         VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    $insertStmt->execute([
        $name,
        $email,
        $hashedPassword,
        $role,
        $phone ?: null,
        $emergencyContactName ?: null,
        $emergencyContactPhone ?: null
    ]);

    $userId = (int)$db->lastInsertId();

    // Establish session
    startSafeSession();
    session_regenerate_id(true);
    $_SESSION['user_id']    = $userId;
    $_SESSION['user_name']  = $name;
    $_SESSION['user_email'] = $email;
    $_SESSION['user_role']  = $role;
    $_SESSION['user_phone'] = $phone;

    logAudit($userId, 'USER_SIGNUP', 'users', $userId, "User registered with role: $role");

    jsonResponse([
        'user' => [
            'id'    => $userId,
            'name'  => $name,
            'email' => $email,
            'role'  => $role,
            'phone' => $phone,
            'emergency_contact_name'  => $emergencyContactName,
            'emergency_contact_phone' => $emergencyContactPhone
        ],
        'csrf_token' => getCSRFToken()
    ], 201, 'Account successfully created. Welcome to SafeCity!');

} catch (Exception $e) {
    error_log("Signup error: " . $e->getMessage());
    jsonError('An internal error occurred while creating your account. Please try again.', 500);
}

