-- SafeCity AI Demonstration Seed Data
-- Note: All sample records are clearly labelled as demonstration data for testing and evaluation.

-- Demo Password for all seed users is: password123
-- Hash: $2y$10$R6.d9kIYSOimo7lJ54598urEOOo3lmuMvdgR9kSIItKSUM4MAqnpa

INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `phone`, `emergency_contact_name`, `emergency_contact_phone`) VALUES
(1, 'Priya Sharma (Demo Citizen)', 'citizen@safecity.org', '$2y$10$R6.d9kIYSOimo7lJ54598urEOOo3lmuMvdgR9kSIItKSUM4MAqnpa', 'citizen', '+91 98765 43210', 'Rohit Sharma (Brother)', '+91 98765 11111'),
(2, 'Inspector Rajesh Varma (Demo Officer)', 'officer@safecity.org', '$2y$10$R6.d9kIYSOimo7lJ54598urEOOo3lmuMvdgR9kSIItKSUM4MAqnpa', 'officer', '+91 98765 43211', 'Control Room', '112'),
(3, 'Admin User', 'admin@safecity.org', '$2y$10$R6.d9kIYSOimo7lJ54598urEOOo3lmuMvdgR9kSIItKSUM4MAqnpa', 'admin', '+91 98765 43212', 'Operations Desk', '112');

-- Route Segments for Route A (Main Commercial Corridor) and Route B (Old Bypass Link)
INSERT INTO `route_segments` (`id`, `route_name`, `segment_name`, `start_lat`, `start_lng`, `end_lat`, `end_lng`, `distance_km`, `lighting_factor`, `crowd_factor`, `incident_factor`, `help_access_factor`, `time_factor`, `road_condition_factor`, `community_signal_factor`, `baseline_lighting`, `baseline_road_condition`, `recalculation_reason`) VALUES
(1, 'Route A', 'MG Road North - Commercial Corridor', 12.97160000, 77.59460000, 12.97800000, 77.60100000, 1.20, 88.00, 82.00, 85.00, 90.00, 80.00, 82.00, 85.00, 88.00, 82.00, 'Baseline well-monitored commercial avenue'),
(2, 'Route A', 'Brigade Avenue - Central Junction', 12.97800000, 77.60100000, 12.98500000, 77.61000000, 1.50, 84.00, 78.00, 82.00, 88.00, 82.00, 78.00, 80.00, 84.00, 78.00, 'Active street with retail and CCTV coverage'),
(3, 'Route A', 'Metro Viaduct Highway', 12.98500000, 77.61000000, 12.99300000, 77.62000000, 1.80, 92.00, 85.00, 90.00, 92.00, 85.00, 88.00, 88.00, 92.00, 88.00, 'Main arterial transit route with continuous illumination'),
(4, 'Route B', 'Industrial Link Road', 12.97160000, 77.59460000, 12.97400000, 77.60800000, 1.40, 45.00, 35.00, 55.00, 50.00, 60.00, 40.00, 50.00, 45.00, 40.00, 'Reported low illumination and damaged road surface'),
(5, 'Route B', 'Canal Side Lane', 12.97400000, 77.60800000, 12.98300000, 77.61800000, 1.60, 50.00, 40.00, 58.00, 48.00, 65.00, 52.00, 52.00, 50.00, 52.00, 'Narrow corridor with sparse pedestrian traffic'),
(6, 'Route B', 'Suburban Backroad Connector', 12.98300000, 77.61800000, 12.99300000, 77.62000000, 1.30, 55.00, 45.00, 62.00, 55.00, 70.00, 60.00, 58.00, 55.00, 60.00, 'Connecting stretch with intermittent street lighting');

-- Civic Complaints
INSERT INTO `complaints` (`id`, `complaint_code`, `user_id`, `category`, `title`, `description`, `latitude`, `longitude`, `address`, `severity`, `priority_score`, `priority_level`, `photo_path`, `status`, `department`, `assigned_officer_id`, `associated_segment_id`) VALUES
(1, 'SC-2026-1001', 1, 'pothole', 'Deep asphalt pothole causing vehicle hazard', 'Large pothole across the left lane approximately 1.5 feet wide and 5 inches deep. Poses immediate skid risk for two-wheelers at night.', 12.97320000, 77.60250000, 'Industrial Link Road near Pillar 45', 4, 85, 'High', 'assets/demo_pothole.jpg', 'pending', 'Roads & Infrastructure', 2, 4),
(2, 'SC-2026-1002', 1, 'broken_streetlight', 'Consecutive streetlights non-functional on connector', 'Three continuous municipal streetlights are completely dead creating a 200m pitch dark stretch after 7:30 PM.', 12.97380000, 77.60550000, 'Industrial Link Road, Sector 3 Curve', 4, 82, 'High', 'assets/demo_streetlight.jpg', 'pending', 'Electrical & Public Lighting', 2, 4),
(3, 'SC-2026-1003', 1, 'waterlogging', 'Severe waterlogging after brief showers', 'Drainage grate blocked by construction debris causing ankle-deep water logging covering half the roadway.', 12.98100000, 77.60500000, 'Near Brigade Avenue Metro Pillar 142', 3, 65, 'Medium', 'assets/demo_waterlogging.jpg', 'in_progress', 'Stormwater & Drainage', 2, 2),
(4, 'SC-2026-1004', 1, 'garbage', 'Garbage accumulation obstructing pedestrian sidewalk', 'Overflowing community waste container spilling onto the pedestrian walking path and causing foul odor.', 12.97600000, 77.59800000, 'MG Road North Market Square', 2, 45, 'Low', 'assets/demo_garbage.jpg', 'fixed', 'Solid Waste Management', 2, 1),
(5, 'SC-2026-1005', 1, 'damaged_footpath', 'Broken paver blocks and exposed rebar on pedestrian walkway', 'Dislodged curb stones and broken tiles posing trip risk to elderly pedestrians and commuters.', 12.98350000, 77.60750000, 'Brigade Avenue Walkway North', 3, 60, 'Medium', 'assets/demo_footpath.jpg', 'in_progress', 'Roads & Infrastructure', 2, 2),
(6, 'SC-2026-1006', 1, 'drainage', 'Missing stormwater inspection chamber cover', 'Open chamber dangerous for night commuters and pedestrians. Urgent barricading and cover replacement required.', 12.97850000, 77.61300000, 'Canal Side Lane near Culvert 2', 5, 95, 'Critical', 'assets/demo_drainage.jpg', 'pending', 'Stormwater & Drainage', 2, 5);

-- Complaint Status History
INSERT INTO `complaint_status_history` (`id`, `complaint_id`, `changed_by_user_id`, `from_status`, `to_status`, `note`, `is_public`) VALUES
(1, 1, 1, 'submitted', 'pending', 'Complaint submitted via citizen portal with geotagged photo.', 1),
(2, 2, 1, 'submitted', 'pending', 'Complaint submitted via citizen portal.', 1),
(3, 3, 2, 'pending', 'in_progress', 'Assigned to Stormwater Maintenance Crew #4 for de-silting and debris clearing.', 1),
(4, 4, 2, 'pending', 'in_progress', 'Waste clearing truck dispatched.', 1),
(5, 4, 2, 'in_progress', 'fixed', 'Sanitation team cleared waste and sanitized the container area. Verified by Ward Inspector.', 1),
(6, 5, 2, 'pending', 'in_progress', 'Paver replacement work scheduled with civil engineering division.', 1),
(7, 6, 1, 'submitted', 'pending', 'Critical severity flagged due to open stormwater chamber.', 1);

-- Safe Places (Verified Help Points)
INSERT INTO `safe_places` (`id`, `name`, `type`, `latitude`, `longitude`, `address`, `phone`, `open_hours`, `verified`) VALUES
(1, 'Central Police Station', 'police', 12.97500000, 77.59900000, 'Cubbon Park Road, Sector 1', '080-22942222', '24/7', 1),
(2, 'City General Hospital & Trauma Center', 'hospital', 12.97900000, 77.60400000, 'Victoria Road, Central Ward', '080-22945000', '24/7', 1),
(3, 'Women Safety Assistance Kiosk (Pink Police)', 'women_help', 12.98200000, 77.60900000, 'Brigade Road Junction Help Booth', '1091 / 080-22942111', '24/7', 1),
(4, 'Metro Transit Emergency Help Desk', 'emergency_kiosk', 12.98600000, 77.61200000, 'MG Road Station Concourse Level 1', '080-25595959', '05:00 - 23:30', 1),
(5, 'Central Fire & Disaster Response Station', 'fire_station', 12.97200000, 77.59200000, 'Kasturba Road Fire HQ', '101 / 080-22971500', '24/7', 1),
(6, 'St. Mary 24/7 Emergency Care', 'hospital', 12.98900000, 77.61600000, 'Residency Cross Road', '080-22271234', '24/7', 1);

-- Road Ratings
INSERT INTO `road_ratings` (`id`, `user_id`, `road_name`, `latitude`, `longitude`, `rating`, `lighting_rating`, `pavement_rating`, `review`) VALUES
(1, 1, 'MG Road North', 12.97500000, 77.59800000, 5, 5, 4, 'Very well lit throughout the night with active security personnel from nearby commercial banks and shops.'),
(2, 1, 'Brigade Avenue', 12.98100000, 77.60500000, 4, 4, 4, 'Good visibility and plenty of pedestrian traffic until late evening. Safe feel.'),
(3, 1, 'Industrial Link Road', 12.97300000, 77.60400000, 2, 2, 1, 'Dark after 8 PM due to broken street lights. Potholes make two-wheeler riding risky.');

-- Community Reports
INSERT INTO `community_reports` (`id`, `user_id`, `category`, `title`, `description`, `latitude`, `longitude`, `address`, `status`, `reviewed_by`, `reviewed_at`) VALUES
(1, 1, 'poor_lighting', 'Dark corridor behind old factory wall', 'Poor visibility due to non-working street lamps and tall unpruned trees.', 12.97450000, 77.60600000, 'Industrial Link Road Bend', 'approved', 2, CURRENT_TIMESTAMP),
(2, 1, 'isolated_area', 'Unlit canal service road with dead ends', 'No commercial establishments or security guards past 8 PM.', 12.97900000, 77.61400000, 'Canal Side Lane North', 'approved', 2, CURRENT_TIMESTAMP);

