<?php
/**
 * SafeCity AI - User Authentication / Login Endpoint
 * POST /php/login.php
 */

require_once __DIR__ . '/helpers.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Method not allowed. Use POST.', 405);
}

$rawBody = file_get_contents('php://input');
$body = json_decode($rawBody, true) ?? $_POST;

$email = filter_var(trim($body['email'] ?? ''), FILTER_VALIDATE_EMAIL);
$password = $body['password'] ?? '';

if (!$email || empty($password)) {
    jsonError('Please provide both a valid email address and password.', 422);
}

try {
    $db = getDB();
    $stmt = $db->prepare('SELECT id, name, email, password, role, phone, emergency_contact_name, emergency_contact_phone FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password'])) {
        jsonError('Invalid email or password. Please verify your credentials.', 401);
    }

    // Secure session regeneration
    startSafeSession();
    session_regenerate_id(true);
    $_SESSION['user_id']    = (int)$user['id'];
    $_SESSION['user_name']  = $user['name'];
    $_SESSION['user_email'] = $user['email'];
    $_SESSION['user_role']  = $user['role'];
    $_SESSION['user_phone'] = $user['phone'] ?? '';

    logAudit((int)$user['id'], 'USER_LOGIN', 'users', (int)$user['id'], 'User logged in successfully');

    jsonResponse([
        'user' => [
            'id'    => (int)$user['id'],
            'name'  => $user['name'],
            'email' => $user['email'],
            'role'  => $user['role'],
            'phone' => $user['phone'],
            'emergency_contact_name'  => $user['emergency_contact_name'],
            'emergency_contact_phone' => $user['emergency_contact_phone']
        ],
        'csrf_token' => getCSRFToken()
    ], 200, 'Sign in successful. Welcome back, ' . $user['name'] . '!');

} catch (Exception $e) {
    error_log("Login error: " . $e->getMessage());
    jsonError('A server error occurred during authentication. Please try again.', 500);
}

