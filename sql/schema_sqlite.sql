-- SafeCity AI SQLite Schema for Zero-Config Local / Test Execution
-- Fully compatible with PHP PDO SQLite

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'citizen',
    phone TEXT DEFAULT NULL,
    emergency_contact_name TEXT DEFAULT NULL,
    emergency_contact_phone TEXT DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS route_segments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    route_name TEXT NOT NULL,
    segment_name TEXT NOT NULL,
    start_lat REAL NOT NULL,
    start_lng REAL NOT NULL,
    end_lat REAL NOT NULL,
    end_lng REAL NOT NULL,
    distance_km REAL NOT NULL DEFAULT 1.00,
    lighting_factor REAL NOT NULL DEFAULT 70.00,
    crowd_factor REAL NOT NULL DEFAULT 65.00,
    incident_factor REAL NOT NULL DEFAULT 75.00,
    help_access_factor REAL NOT NULL DEFAULT 80.00,
    time_factor REAL NOT NULL DEFAULT 85.00,
    road_condition_factor REAL NOT NULL DEFAULT 70.00,
    community_signal_factor REAL NOT NULL DEFAULT 75.00,
    baseline_lighting REAL NOT NULL DEFAULT 70.00,
    baseline_road_condition REAL NOT NULL DEFAULT 70.00,
    last_recalculated_at DATETIME DEFAULT NULL,
    recalculation_reason TEXT DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS complaints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    complaint_code TEXT NOT NULL UNIQUE,
    user_id INTEGER DEFAULT NULL,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    address TEXT DEFAULT NULL,
    severity INTEGER NOT NULL,
    priority_score INTEGER NOT NULL DEFAULT 50,
    priority_level TEXT NOT NULL DEFAULT 'Medium',
    photo_path TEXT DEFAULT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    department TEXT NOT NULL DEFAULT 'Roads & Infrastructure',
    assigned_officer_id INTEGER DEFAULT NULL,
    associated_segment_id INTEGER DEFAULT NULL,
    repair_evidence_photo TEXT DEFAULT NULL,
    repair_notes TEXT DEFAULT NULL,
    recalculated_at DATETIME DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_officer_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (associated_segment_id) REFERENCES route_segments(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS complaint_status_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    complaint_id INTEGER NOT NULL,
    changed_by_user_id INTEGER DEFAULT NULL,
    from_status TEXT NOT NULL,
    to_status TEXT NOT NULL,
    note TEXT DEFAULT NULL,
    is_public INTEGER NOT NULL DEFAULT 1,
    evidence_photo TEXT DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS road_ratings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    road_name TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    rating INTEGER NOT NULL,
    lighting_rating INTEGER DEFAULT NULL,
    pavement_rating INTEGER DEFAULT NULL,
    review TEXT DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS safe_places (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    address TEXT NOT NULL,
    phone TEXT DEFAULT NULL,
    open_hours TEXT DEFAULT '24/7',
    verified INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS community_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    address TEXT DEFAULT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    reviewed_by INTEGER DEFAULT NULL,
    reviewed_at DATETIME DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS journeys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    journey_code TEXT NOT NULL UNIQUE,
    user_id INTEGER NOT NULL,
    start_location TEXT NOT NULL,
    destination_location TEXT NOT NULL,
    selected_route TEXT NOT NULL,
    route_safety_score REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    share_token TEXT UNIQUE DEFAULT NULL,
    share_token_expires_at DATETIME DEFAULT NULL,
    is_share_revoked INTEGER NOT NULL DEFAULT 0,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ended_at DATETIME DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sos_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER DEFAULT NULL,
    user_name TEXT DEFAULT 'Anonymous Citizen',
    phone TEXT DEFAULT NULL,
    latitude REAL DEFAULT NULL,
    longitude REAL DEFAULT NULL,
    address TEXT DEFAULT NULL,
    status TEXT NOT NULL DEFAULT 'triggered',
    demo_mode INTEGER NOT NULL DEFAULT 1,
    dispatched_note TEXT DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER DEFAULT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id INTEGER DEFAULT NULL,
    details TEXT DEFAULT NULL,
    ip_address TEXT DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

