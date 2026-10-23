<?php
/**
 * SafeCity AI - Authentication and Role Authorization Middleware
 */

require_once __DIR__ . '/helpers.php';

function requireAuth(): array {
    $user = getCurrentUser();
    if (!$user) {
        jsonError('Authentication required. Please sign in to continue.', 401);
    }
    return $user;
}

function requireOfficer(): array {
    $user = requireAuth();
    if (!in_array($user['role'], ['officer', 'admin'], true)) {
        jsonError('Access denied: Municipal Officer or Administrator authorization required.', 403);
    }
    return $user;
}

function requireAdmin(): array {
    $user = requireAuth();
    if ($user['role'] !== 'admin') {
        jsonError('Access denied: Administrator privileges required.', 403);
    }
    return $user;
}

