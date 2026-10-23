/**
 * SafeCity AI - Central Leaflet Map Engine
 * Manages tiles, custom SVG markers, popups, and route polylines
 */

const SafeMap = {
  create(elementId, center = [12.9750, 77.6050], zoom = 14) {
    if (typeof L === 'undefined') {
      console.error('Leaflet.js is not loaded.');
      return null;
    }

    const map = L.map(elementId, {
      zoomControl: true,
      scrollWheelZoom: true
    }).setView(center, zoom);

    // High quality OpenStreetMap tiles with standard attribution
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors | SafeCity AI'
    }).addTo(map);

    return map;
  },

  createMarkerIcon(color = '#06b6d4', iconClass = 'fa-location-dot') {
    return L.divIcon({
      className: 'custom-map-marker',
      html: `
        <div style="
          width: 34px; height: 34px;
          border-radius: 50% 50% 50% 0;
          background: ${color};
          transform: rotate(-45deg);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 12px ${color}88, 0 3px 6px rgba(0,0,0,0.4);
          border: 2px solid #ffffff;
        ">
          <i class="fa-solid ${iconClass}" style="transform: rotate(45deg); color: #ffffff; font-size: 13px;"></i>
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 34],
      popupAnchor: [0, -34]
    });
  },

  getCategoryColor(category) {
    const colors = {
      pothole: '#f97316',
      broken_streetlight: '#eab308',
      garbage: '#84cc16',
      waterlogging: '#06b6d4',
      damaged_footpath: '#f59e0b',
      drainage: '#ef4444',
      other: '#6366f1'
    };
    return colors[category] || '#3b82f6';
  },

  getCategoryIcon(category) {
    const icons = {
      pothole: 'fa-road',
      broken_streetlight: 'fa-lightbulb',
      garbage: 'fa-trash-can',
      waterlogging: 'fa-water',
      damaged_footpath: 'fa-shoe-prints',
      drainage: 'fa-triangle-exclamation',
      other: 'fa-circle-exclamation'
    };
    return icons[category] || 'fa-location-dot';
  },

  getPlaceColor(type) {
    const colors = {
      police: '#3b82f6',
      hospital: '#ef4444',
      women_help: '#ec4899',
      fire_station: '#f97316',
      emergency_kiosk: '#10b981'
    };
    return colors[type] || '#06b6d4';
  },

  getPlaceIcon(type) {
    const icons = {
      police: 'fa-shield-halved',
      hospital: 'fa-hospital',
      women_help: 'fa-person-shelter',
      fire_station: 'fa-fire-extinguisher',
      emergency_kiosk: 'fa-phone-volume'
    };
    return icons[type] || 'fa-building';
  },

  getUserLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser.'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy
          });
        },
        (err) => {
          reject(err);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  }
};

