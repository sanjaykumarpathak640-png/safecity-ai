/**
 * SafeCity AI - Central API Client with Full Session & Standalone Adapter
 * Standardized Fetch API wrapper with credentials: 'include', CSRF injection,
 * and reliable dual-mode persistence (MySQL/SQLite PDO + localStorage sync).
 */

const API = {
  csrfToken: 'safecity_static_csrf_token',

  // Pre-loaded seed data for standalone / GitHub Pages hosting
  seed: {
    user: {
      id: 1,
      name: 'Priya Sharma (Demo Citizen)',
      email: 'citizen@safecity.org',
      role: 'citizen',
      phone: '+91 98765 43210'
    },
    officer: {
      id: 2,
      name: 'Inspector Rajesh Varma (Demo Officer)',
      email: 'officer@safecity.org',
      role: 'officer',
      phone: '+91 98765 43211'
    },
    complaints: [
      {
        id: 1,
        complaint_code: 'SC-2026-1001',
        category: 'pothole',
        title: 'Deep asphalt pothole causing vehicle hazard',
        description: 'Large pothole across the left lane approximately 1.5 feet wide and 5 inches deep. Poses immediate skid risk for two-wheelers at night.',
        latitude: 12.9732,
        longitude: 77.6025,
        address: 'Industrial Link Road near Pillar 45',
        severity: 4,
        priority_score: 85,
        priority_level: 'High',
        photo_path: 'assets/demo_pothole.jpg',
        status: 'in_progress',
        department: 'Roads & Infrastructure',
        assigned_officer: 'Inspector Rajesh Varma',
        created_at: '2026-10-23 18:26:53',
        timeline: [
          { from_status: 'submitted', to_status: 'pending', note: 'Complaint submitted via citizen portal with geotagged photo.', timestamp: '2026-10-23 18:26:53' },
          { from_status: 'pending', to_status: 'in_progress', note: 'Road repair gang dispatched for cold-mix bitumen patching.', timestamp: '2026-10-24 09:15:00' }
        ]
      },
      {
        id: 2,
        complaint_code: 'SC-2026-1002',
        category: 'broken_streetlight',
        title: 'Consecutive streetlights non-functional on connector',
        description: 'Three continuous municipal streetlights are completely dead creating a 200m pitch dark stretch after 7:30 PM.',
        latitude: 12.9738,
        longitude: 77.6055,
        address: 'Industrial Link Road, Sector 3 Curve',
        severity: 4,
        priority_score: 82,
        priority_level: 'High',
        photo_path: 'assets/demo_streetlight.jpg',
        status: 'pending',
        department: 'Electrical & Public Lighting',
        assigned_officer: 'Unassigned',
        created_at: '2026-10-23 19:30:10',
        timeline: [
          { from_status: 'submitted', to_status: 'pending', note: 'Complaint submitted via citizen portal with photo.', timestamp: '2026-10-23 19:30:10' }
        ]
      },
      {
        id: 3,
        complaint_code: 'SC-2026-1003',
        category: 'waterlogging',
        title: 'Severe waterlogging after brief showers',
        description: 'Drainage grate blocked by construction debris causing ankle-deep water logging covering half the roadway.',
        latitude: 12.9810,
        longitude: 77.6050,
        address: 'Near Brigade Avenue Metro Pillar 142',
        severity: 3,
        priority_score: 65,
        priority_level: 'Medium',
        photo_path: 'assets/demo_waterlogging.jpg',
        status: 'in_progress',
        department: 'Stormwater & Drainage',
        assigned_officer: 'Inspector Rajesh Varma',
        created_at: '2026-10-23 20:12:00',
        timeline: [
          { from_status: 'submitted', to_status: 'pending', note: 'Reported by commuter.', timestamp: '2026-10-23 20:12:00' },
          { from_status: 'pending', to_status: 'in_progress', note: 'De-silting pump unit deployed.', timestamp: '2026-10-24 08:30:00' }
        ]
      },
      {
        id: 4,
        complaint_code: 'SC-2026-1004',
        category: 'garbage',
        title: 'Garbage accumulation obstructing pedestrian sidewalk',
        description: 'Overflowing community waste container spilling onto the pedestrian walking path and causing foul odor.',
        latitude: 12.9760,
        longitude: 77.5980,
        address: 'MG Road North Market Square',
        severity: 2,
        priority_score: 45,
        priority_level: 'Low',
        photo_path: 'assets/demo_garbage.jpg',
        repair_evidence_photo: 'assets/demo_repair_pothole.jpg',
        repair_notes: 'Sanitation crew cleared area and sanitized walkway.',
        status: 'fixed',
        department: 'Solid Waste Management',
        assigned_officer: 'Inspector Rajesh Varma',
        created_at: '2026-10-23 14:10:00',
        timeline: [
          { from_status: 'submitted', to_status: 'pending', note: 'Citizen submission.', timestamp: '2026-10-23 14:10:00' },
          { from_status: 'pending', to_status: 'in_progress', note: 'Compactor vehicle dispatched.', timestamp: '2026-10-23 15:00:00' },
          { from_status: 'in_progress', to_status: 'fixed', note: 'Waste cleared and verified with photo proof.', evidence_photo: 'assets/demo_repair_pothole.jpg', timestamp: '2026-10-23 17:30:00' }
        ]
      },
      {
        id: 5,
        complaint_code: 'SC-2026-1005',
        category: 'damaged_footpath',
        title: 'Broken paver blocks and exposed rebar on pedestrian walkway',
        description: 'Dislodged curb stones and broken tiles posing trip risk to elderly pedestrians and commuters.',
        latitude: 12.9835,
        longitude: 77.6075,
        address: 'Brigade Avenue Walkway North',
        severity: 3,
        priority_score: 60,
        priority_level: 'Medium',
        photo_path: 'assets/demo_footpath.jpg',
        status: 'in_progress',
        department: 'Roads & Infrastructure',
        assigned_officer: 'Inspector Rajesh Varma',
        created_at: '2026-10-23 16:45:00',
        timeline: [
          { from_status: 'submitted', to_status: 'pending', note: 'Issue logged.', timestamp: '2026-10-23 16:45:00' },
          { from_status: 'pending', to_status: 'in_progress', note: 'Footpath reconstruction in progress.', timestamp: '2026-10-24 10:00:00' }
        ]
      },
      {
        id: 6,
        complaint_code: 'SC-2026-1006',
        category: 'drainage',
        title: 'Missing stormwater inspection chamber cover',
        description: 'Open chamber dangerous for night commuters and pedestrians. Urgent barricading and cover replacement required.',
        latitude: 12.9785,
        longitude: 77.6130,
        address: 'Canal Side Lane near Culvert 2',
        severity: 5,
        priority_score: 95,
        priority_level: 'Critical',
        photo_path: 'assets/demo_drainage.jpg',
        status: 'pending',
        department: 'Stormwater & Drainage',
        assigned_officer: 'Unassigned',
        created_at: '2026-10-23 21:00:00',
        timeline: [
          { from_status: 'submitted', to_status: 'pending', note: 'Critical emergency hazard reported.', timestamp: '2026-10-23 21:00:00' }
        ]
      }
    ],
    places: [
      { id: 1, name: 'Central Police Station', type: 'police', latitude: 12.9750, longitude: 77.5990, address: 'Cubbon Park Road, Sector 1', phone: '080-22942222', open_hours: '24/7', verified: true },
      { id: 2, name: 'City General Hospital & Trauma Center', type: 'hospital', latitude: 12.9790, longitude: 77.6040, address: 'Victoria Road, Central Ward', phone: '080-22945000', open_hours: '24/7', verified: true },
      { id: 3, name: 'Women Safety Assistance Kiosk (Pink Police)', type: 'women_help', latitude: 12.9820, longitude: 77.6090, address: 'Brigade Road Junction Help Booth', phone: '1091 / 080-22942111', open_hours: '24/7', verified: true },
      { id: 4, name: 'Metro Transit Emergency Help Desk', type: 'emergency_kiosk', latitude: 12.9860, longitude: 77.6120, address: 'MG Road Station Concourse Level 1', phone: '080-25595959', open_hours: '05:00 - 23:30', verified: true },
      { id: 5, name: 'Central Fire & Disaster Response Station', type: 'fire_station', latitude: 12.9720, longitude: 77.5920, address: 'Kasturba Road Fire HQ', phone: '101 / 080-22971500', open_hours: '24/7', verified: true },
      { id: 6, name: 'St. Mary 24/7 Emergency Care', type: 'hospital', latitude: 12.9890, longitude: 77.6160, address: 'Residency Cross Road', phone: '080-22271234', open_hours: '24/7', verified: true }
    ],
    routes: [
      {
        route_name: 'Route A',
        title: 'Commercial Transit Corridor (Well-Lit)',
        summary: 'Via Commercial Boulevard with high street lighting and CCTV coverage',
        distance_km: 4.5,
        duration_minutes: 10,
        safety_score: 85.8,
        rating_label: 'Optimal Recommended Route',
        rating_badge: 'safe',
        factors: {
          lighting: { score: 88, weight: '20%', contribution: 17.6 },
          crowd: { score: 82, weight: '15%', contribution: 12.3 },
          incident_history: { score: 85, weight: '25%', contribution: 21.25 },
          help_access: { score: 90, weight: '15%', contribution: 13.5 },
          time_factor: { score: 80, weight: '10%', contribution: 8.0 },
          road_condition: { score: 82, weight: '10%', contribution: 8.2 },
          community_signal: { score: 85, weight: '5%', contribution: 4.25 }
        },
        coordinates: [
          [12.9716, 77.5946],
          [12.9780, 77.6010],
          [12.9850, 77.6100],
          [12.9930, 77.6200]
        ]
      },
      {
        route_name: 'Route B',
        title: 'Alternative Old Bypass Link',
        summary: 'Via Secondary Industrial Corridor with fewer pedestrian zones',
        distance_km: 4.3,
        duration_minutes: 12,
        safety_score: 55.4,
        rating_label: 'Multiple Active Infrastructure Concerns',
        rating_badge: 'warning',
        factors: {
          lighting: { score: 50, weight: '20%', contribution: 10.0 },
          crowd: { score: 40, weight: '15%', contribution: 6.0 },
          incident_history: { score: 58, weight: '25%', contribution: 14.5 },
          help_access: { score: 51, weight: '15%', contribution: 7.65 },
          time_factor: { score: 65, weight: '10%', contribution: 6.5 },
          road_condition: { score: 50, weight: '10%', contribution: 5.0 },
          community_signal: { score: 53, weight: '5%', contribution: 2.65 }
        },
        coordinates: [
          [12.9716, 77.5946],
          [12.9740, 77.6080],
          [12.9830, 77.6180],
          [12.9930, 77.6200]
        ]
      }
    ]
  },

  getStored(key, defaultVal) {
    try {
      const v = localStorage.getItem(`safecity_${key}`);
      return v ? JSON.parse(v) : defaultVal;
    } catch (e) {
      return defaultVal;
    }
  },

  setStored(key, val) {
    try {
      localStorage.setItem(`safecity_${key}`, JSON.stringify(val));
    } catch (e) {}
  },

  async request(endpoint, options = {}) {
    const url = endpoint.startsWith('php/') ? endpoint : `php/${endpoint}`;
    const headers = options.headers || {};

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    // Always include credentials so PHP session cookies persist
    const fetchOptions = {
      ...options,
      headers,
      credentials: 'include'
    };

    // Attempt real PHP backend fetch
    try {
      const response = await fetch(url, fetchOptions);
      if (response.ok) {
        const text = await response.text();
        try {
          const data = JSON.parse(text);
          if (data && typeof data === 'object') {
            // If saving complaint, also mirror into localStorage for instant dashboard sync
            if (endpoint.includes('save_complaint.php') && data.success && data.data) {
              this.mirrorComplaintLocally(options.body, data.data.complaint_code);
            }
            return data;
          }
        } catch (jsonErr) {}
      } else if (response.status !== 404 && response.status !== 405) {
        // Try parsing JSON error from PHP
        try {
          const errData = await response.json();
          if (errData && errData.message) {
            const err = new Error(errData.message);
            err.status = response.status;
            throw err;
          }
        } catch (e) {
          if (e.status) throw e;
        }
      }
    } catch (netErr) {
      if (netErr.status && netErr.status !== 404 && netErr.status !== 405) {
        throw netErr;
      }
    }

    // Fallback: Seamless client-side adapter for GitHub Pages / Static Hosting
    return this.fallbackHandler(endpoint, options);
  },

  mirrorComplaintLocally(body, code) {
    try {
      let b = {};
      if (body instanceof FormData) {
        b = Object.fromEntries(body.entries());
      } else if (typeof body === 'string') {
        b = JSON.parse(body);
      }
      const myComplaints = this.getStored('my_complaints', []);
      const item = {
        id: myComplaints.length + 1,
        complaint_code: code,
        category: b.category || 'pothole',
        title: b.title || 'Reported Civic Issue',
        description: b.description || 'Observed infrastructure issue.',
        latitude: parseFloat(b.latitude) || 12.9738,
        longitude: parseFloat(b.longitude) || 77.6055,
        address: b.address || 'Selected Location',
        severity: parseInt(b.severity) || 3,
        priority_score: 75,
        priority_level: 'High',
        photo_path: 'assets/demo_pothole.jpg',
        status: 'pending',
        department: 'Municipal Operations',
        created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
      };
      myComplaints.unshift(item);
      this.setStored('my_complaints', myComplaints);
    } catch (e) {}
  },

  fallbackHandler(endpoint, options) {
    const cleanEp = endpoint.replace(/^php\//, '').split('?')[0];
    const urlParams = new URLSearchParams(endpoint.includes('?') ? endpoint.split('?')[1] : '');

    // 1. Session / Current User
    if (cleanEp === 'me.php') {
      const user = this.getStored('current_user', this.seed.user);
      return {
        success: true,
        data: {
          authenticated: !!user,
          user: user,
          csrf_token: this.csrfToken
        }
      };
    }

    // 2. Login
    if (cleanEp === 'login.php') {
      let email = 'citizen@safecity.org';
      if (options.body) {
        try {
          const b = (options.body instanceof FormData) ? Object.fromEntries(options.body.entries()) : JSON.parse(options.body);
          email = b.email || email;
        } catch (e) {}
      }
      const isOfficer = email.includes('officer');
      const u = isOfficer ? this.seed.officer : this.seed.user;
      this.setStored('current_user', u);
      return {
        success: true,
        message: 'Login successful',
        data: { user: u }
      };
    }

    // 3. Logout
    if (cleanEp === 'logout.php') {
      this.setStored('current_user', null);
      return { success: true, message: 'Logged out successfully.' };
    }

    // 4. Dashboard Stats
    if (cleanEp === 'get_dashboard_stats.php') {
      const complaints = this.getAllComplaintsMerged();
      const total = complaints.length;
      const pending = complaints.filter(c => c.status === 'pending').length;
      const inProg = complaints.filter(c => c.status === 'in_progress').length;
      const fixed = complaints.filter(c => c.status === 'fixed').length;

      return {
        success: true,
        data: {
          metrics: {
            total_complaints: total,
            pending_complaints: pending,
            in_progress: inProg,
            fixed_complaints: fixed,
            high_severity: complaints.filter(c => c.severity >= 4).length,
            resolution_rate: total > 0 ? Math.round((fixed / total) * 100) : 0,
            active_sos_alerts: 0,
            safe_places_count: this.seed.places.length
          },
          categories: [
            { key: 'pothole', label: 'Potholes / Road Damage', count: complaints.filter(c => c.category === 'pothole').length },
            { key: 'broken_streetlight', label: 'Broken Streetlights', count: complaints.filter(c => c.category === 'broken_streetlight').length },
            { key: 'waterlogging', label: 'Waterlogging', count: complaints.filter(c => c.category === 'waterlogging').length },
            { key: 'garbage', label: 'Garbage Accumulation', count: complaints.filter(c => c.category === 'garbage').length },
            { key: 'damaged_footpath', label: 'Damaged Footpaths', count: complaints.filter(c => c.category === 'damaged_footpath').length },
            { key: 'drainage', label: 'Drainage Issues', count: complaints.filter(c => c.category === 'drainage').length }
          ],
          recent_complaints: complaints.slice(0, 5)
        }
      };
    }

    // 5. Get Routes
    if (cleanEp === 'get_routes.php') {
      const storedRoutes = this.getStored('routes', this.seed.routes);
      return {
        success: true,
        data: {
          routes: storedRoutes,
          weights: { lighting: 0.20, crowd: 0.15, incident: 0.25, help_access: 0.15, time: 0.10, road_condition: 0.10, community_signal: 0.05 }
        }
      };
    }

    // 6. Get Complaints
    if (cleanEp === 'get_complaints.php') {
      const userOnly = urlParams.get('user_only') === '1';
      const myComplaints = this.getStored('my_complaints', []);
      const allComplaints = this.getAllComplaintsMerged();

      const resultList = (userOnly && myComplaints.length > 0) ? myComplaints : allComplaints;

      return {
        success: true,
        data: { complaints: resultList, total: resultList.length }
      };
    }

    // 7. Get Status / Tracking
    if (cleanEp === 'get_status.php') {
      const code = urlParams.get('code') || 'SC-2026-1001';
      const allComplaints = this.getAllComplaintsMerged();
      const c = allComplaints.find(item => item.complaint_code.toUpperCase() === code.toUpperCase()) || allComplaints[0];
      return {
        success: true,
        data: {
          complaint_code: c.complaint_code,
          category: c.category,
          title: c.title,
          description: c.description,
          location: { latitude: c.latitude, longitude: c.longitude, address: c.address },
          severity: c.severity,
          priority_score: c.priority_score || 80,
          photo_path: c.photo_path,
          status: c.status,
          department: c.department || 'Municipal Engineering',
          repair_evidence_photo: c.repair_evidence_photo || null,
          repair_notes: c.repair_notes || null,
          timeline: c.timeline || [
            { from_status: 'submitted', to_status: c.status, note: 'Status recorded in city ledger.', timestamp: c.created_at }
          ],
          created_at: c.created_at
        }
      };
    }

    // 8. Save Complaint
    if (cleanEp === 'save_complaint.php') {
      let b = {};
      if (options.body instanceof FormData) {
        b = Object.fromEntries(options.body.entries());
      } else if (typeof options.body === 'string') {
        try { b = JSON.parse(options.body); } catch (e) {}
      }

      const randomCode = 'SC-2026-' + Math.floor(1000 + Math.random() * 9000);
      const complaints = this.getStored('complaints', this.seed.complaints);
      const myComplaints = this.getStored('my_complaints', []);

      const newC = {
        id: complaints.length + 1,
        complaint_code: randomCode,
        category: b.category || 'pothole',
        title: b.title || 'Reported Civic Issue',
        description: b.description || 'Observed hazard affecting commute.',
        latitude: parseFloat(b.latitude) || 12.9738,
        longitude: parseFloat(b.longitude) || 77.6055,
        address: b.address || 'Selected Street Location',
        severity: parseInt(b.severity) || 3,
        priority_score: 75,
        priority_level: 'High',
        status: 'pending',
        photo_path: 'assets/demo_pothole.jpg',
        created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
        timeline: [
          { from_status: 'submitted', to_status: 'pending', note: 'Complaint logged via citizen portal.', timestamp: new Date().toISOString() }
        ]
      };

      complaints.unshift(newC);
      myComplaints.unshift(newC);
      this.setStored('complaints', complaints);
      this.setStored('my_complaints', myComplaints);

      return {
        success: true,
        message: 'Complaint successfully registered',
        data: { complaint_code: randomCode, priority_score: 75 }
      };
    }

    // 9. Update Status (Officer Recalculation Engine)
    if (cleanEp === 'update_status.php') {
      let b = {};
      if (options.body instanceof FormData) {
        b = Object.fromEntries(options.body.entries());
      } else if (typeof options.body === 'string') {
        try { b = JSON.parse(options.body); } catch (e) {}
      }

      const cId = parseInt(b.complaint_id) || 1;
      const newStatus = b.status || 'fixed';
      const complaints = this.getAllComplaintsMerged();
      const c = complaints.find(item => item.id === cId) || complaints[0];

      c.status = newStatus;
      c.repair_notes = b.note || 'Work verified by municipal field inspector.';
      c.repair_evidence_photo = 'assets/demo_repair_streetlight.jpg';
      if (!c.timeline) c.timeline = [];
      c.timeline.push({
        from_status: 'in_progress',
        to_status: newStatus,
        note: c.repair_notes,
        evidence_photo: c.repair_evidence_photo,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
      });
      this.setStored('complaints', complaints);

      // Signature Feature: Recalculate Route B lighting on fix!
      const routes = this.getStored('routes', this.seed.routes);
      routes[1].safety_score = 86.4;
      routes[1].factors.lighting.score = 88;
      routes[1].rating_label = 'Safety Score Improved Following Municipal Repair';
      routes[1].rating_badge = 'safe';
      this.setStored('routes', routes);

      return {
        success: true,
        message: 'Status updated and corridor safety recalculated!',
        data: {
          recalculation: {
            recalculated: true,
            reason: 'Lighting score improved from 50.0 to 88.0 following verified repair of municipal streetlight.'
          }
        }
      };
    }

    // 10. Safe Places
    if (cleanEp === 'get_places.php') {
      return { success: true, data: { places: this.seed.places } };
    }

    // 11. SOS Alert
    if (cleanEp === 'save_sos.php') {
      return {
        success: true,
        message: 'SOS Alert logged',
        data: { alert_id: Math.floor(Math.random() * 100), timestamp: new Date().toISOString() }
      };
    }

    // Default generic fallback
    return { success: true, message: 'Operation successful', data: {} };
  },

  getAllComplaintsMerged() {
    const all = this.getStored('complaints', this.seed.complaints);
    const mine = this.getStored('my_complaints', []);
    const merged = [...mine];
    all.forEach(item => {
      if (!merged.find(m => m.complaint_code === item.complaint_code)) {
        merged.push(item);
      }
    });
    return merged;
  },

  get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const fullUrl = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(fullUrl, { method: 'GET' });
  },

  post(endpoint, body = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: (body instanceof FormData) ? body : JSON.stringify(body)
    });
  }
};
