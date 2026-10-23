/**
 * SafeCity AI - Safety Heatmap Script
 * Multi-layer Leaflet map displaying civic complaints, safe places, and road segments
 */

let heatmap = null;
let complaintLayerGroup = null;
let placesLayerGroup = null;
let roadSegmentsLayerGroup = null;

document.addEventListener('DOMContentLoaded', () => {
  initHeatmap();
  initHeatmapFilters();
  loadHeatmapData();
});

function initHeatmap() {
  const mapEl = document.getElementById('safety-heatmap');
  if (!mapEl) return;

  heatmap = SafeMap.create('safety-heatmap', [12.9780, 77.6070], 13);
  complaintLayerGroup = L.layerGroup().addTo(heatmap);
  placesLayerGroup = L.layerGroup().addTo(heatmap);
  roadSegmentsLayerGroup = L.layerGroup().addTo(heatmap);
}

function initHeatmapFilters() {
  const checkboxes = document.querySelectorAll('.heatmap-filter-checkbox');
  checkboxes.forEach(cb => {
    cb.addEventListener('change', () => {
      loadHeatmapData();
    });
  });
}

async function loadHeatmapData() {
  if (!heatmap) return;

  const showComplaints = document.getElementById('cb-complaints')?.checked ?? true;
  const showPlaces = document.getElementById('cb-places')?.checked ?? true;
  const showRoutes = document.getElementById('cb-routes')?.checked ?? true;

  complaintLayerGroup.clearLayers();
  placesLayerGroup.clearLayers();
  roadSegmentsLayerGroup.clearLayers();

  // 1. Load Complaints
  if (showComplaints) {
    try {
      const res = await API.get('php/get_complaints.php', { limit: 100 });
      res.data.complaints.forEach(c => {
        if (c.latitude && c.longitude) {
          const color = SafeMap.getCategoryColor(c.category);
          const icon = SafeMap.createMarkerIcon(color, SafeMap.getCategoryIcon(c.category));
          
          // Radius circle to represent area impact
          L.circle([c.latitude, c.longitude], {
            radius: 80 * c.severity,
            color: color,
            fillColor: color,
            fillOpacity: 0.15,
            weight: 1
          }).addTo(complaintLayerGroup);

          L.marker([c.latitude, c.longitude], { icon })
            .addTo(complaintLayerGroup)
            .bindPopup(`
              <div style="font-family: var(--font-sans); font-size: 13px; color: #0a0f1d;">
                <strong>${SafeCity.escape(c.title)}</strong><br>
                Category: <strong>${SafeCity.getCategoryLabel(c.category)}</strong><br>
                Severity: <strong>Level ${c.severity}/5</strong> &bull; Status: ${c.status}<br>
                <a href="track.html?code=${c.complaint_code}" style="color: #06b6d4; font-weight: 600;">Track Record</a>
              </div>
            `);
        }
      });
    } catch (e) {
      console.warn('Complaints layer error:', e);
    }
  }

  // 2. Load Safe Places
  if (showPlaces) {
    try {
      const res = await API.get('php/get_places.php', { type: 'all' });
      res.data.places.forEach(p => {
        if (p.latitude && p.longitude) {
          const color = SafeMap.getPlaceColor(p.type);
          const icon = SafeMap.createMarkerIcon(color, SafeMap.getPlaceIcon(p.type));
          L.marker([p.latitude, p.longitude], { icon })
            .addTo(placesLayerGroup)
            .bindPopup(`
              <div style="font-family: var(--font-sans); font-size: 13px; color: #0a0f1d;">
                <strong>${SafeCity.escape(p.name)}</strong><br>
                ${SafeCity.escape(p.address)}<br>
                Hours: ${p.open_hours} &bull; ${p.phone || '24/7 Desk'}
              </div>
            `);
        }
      });
    } catch (e) {
      console.warn('Places layer error:', e);
    }
  }

  // 3. Load Road Segments / Routes
  if (showRoutes) {
    try {
      const res = await API.get('php/get_routes.php');
      res.data.routes.forEach(r => {
        const color = (r.route_name === 'Route A') ? '#06b6d4' : '#f59e0b';
        L.polyline(r.coordinates, {
          color: color,
          weight: 6,
          opacity: 0.8
        }).addTo(roadSegmentsLayerGroup).bindPopup(`
          <strong>${r.route_name}: ${r.title}</strong><br>
          Safety Score: <strong>${r.safety_score}/100</strong>
        `);
      });
    } catch (e) {
      console.warn('Routes layer error:', e);
    }
  }
}

