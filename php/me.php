<?php
/**
 * SafeCity AI - Current Session / User Endpoint
 * GET /php/me.php
 */

require_once __DIR__ . '/helpers.php';

header('Content-Type: application/json; charset=utf-8');

$user = getCurrentUser();

if (!$user) {
    jsonResponse([
        'authenticated' => false,
        'user'          => null,
        'csrf_token'    => getCSRFToken()
    ], 200, 'Guest session');
}

try {
    $db = getDB();
    $stmt = $db->prepare('SELECT id, name, email, role, phone, emergency_contact_name, emergency_contact_phone, created_at FROM users WHERE id = ?');
    $stmt->execute([$user['id']]);
    $freshUser = $stmt->fetch();

    if (!$freshUser) {
        jsonResponse([
            'authenticated' => false,
            'user'          => null,
            'csrf_token'    => getCSRFToken()
        ]);
    }

    jsonResponse([
        'authenticated' => true,
        'user'          => [
            'id'    => (int)$freshUser['id'],
            'name'  => $freshUser['name'],
            'email' => $freshUser['email'],
            'role'  => $freshUser['role'],
            'phone' => $freshUser['phone'],
            'emergency_contact_name'  => $freshUser['emergency_contact_name'],
            'emergency_contact_phone' => $freshUser['emergency_contact_phone'],
            'created_at'              => $freshUser['created_at']
        ],
        'csrf_token' => getCSRFToken()
    ], 200, 'Session verified');

} catch (Exception $e) {
    jsonError('Failed to fetch user state: ' . $e->getMessage(), 500);
}

