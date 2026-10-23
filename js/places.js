/**
 * SafeCity AI - Nearby Safe Places (Police, Hospitals, Help Points) Script
 */

let placesMap = null;
let placesMarkers = [];
let userLocation = null;

document.addEventListener('DOMContentLoaded', () => {
  initPlacesMap();
  initPlacesFilter();
  loadSafePlaces('all');
});

function initPlacesMap() {
  const mapEl = document.getElementById('places-map');
  if (!mapEl) return;

  placesMap = SafeMap.create('places-map', [12.9790, 77.6040], 14);

  const locBtn = document.getElementById('btn-places-loc');
  if (locBtn) {
    locBtn.addEventListener('click', async () => {
      locBtn.disabled = true;
      try {
        const pos = await SafeMap.getUserLocation();
        userLocation = pos;

        // Add user marker
        const userIcon = SafeMap.createMarkerIcon('#10b981', 'fa-person');
        L.marker([pos.lat, pos.lng], { icon: userIcon })
          .addTo(placesMap)
          .bindPopup('<strong>Your Location</strong>')
          .openPopup();

        placesMap.setView([pos.lat, pos.lng], 15);
        SafeCity.showToast('Location updated. Distances recalculated.', 'success');
        
        const currentType = document.querySelector('.filter-place-btn.active')?.getAttribute('data-type') || 'all';
        loadSafePlaces(currentType);

      } catch (e) {
        SafeCity.showToast('Could not acquire location.', 'error');
      } finally {
        locBtn.disabled = false;
      }
    });
  }
}

function initPlacesFilter() {
  const buttons = document.querySelectorAll('.filter-place-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const type = btn.getAttribute('data-type');
      loadSafePlaces(type);
    });
  });
}

async function loadSafePlaces(type = 'all') {
  const listContainer = document.getElementById('places-list');

  try {
    const params = { type };
    if (userLocation) {
      params.lat = userLocation.lat;
      params.lng = userLocation.lng;
    }

    const res = await API.get('php/get_places.php', params);
    const places = res.data.places;

    // Clear old map markers
    placesMarkers.forEach(m => m.remove());
    placesMarkers = [];

    if (!listContainer) return;

    if (places.length === 0) {
      listContainer.innerHTML = '<div style="color: var(--text-muted); padding: 2rem; text-align: center;">No safe locations found for this category.</div>';
      return;
    }

    let listHtml = '';
    places.forEach(p => {
      // Add marker to map
      if (placesMap && p.latitude && p.longitude) {
        const icon = SafeMap.createMarkerIcon(SafeMap.getPlaceColor(p.type), SafeMap.getPlaceIcon(p.type));
        const marker = L.marker([p.latitude, p.longitude], { icon })
          .addTo(placesMap)
          .bindPopup(`
            <div style="font-family: var(--font-sans); font-size: 13px; color: #0a0f1d;">
              <strong>${SafeCity.escape(p.name)}</strong><br>
              ${SafeCity.escape(p.address)}<br>
              ${p.phone ? `<a href="tel:${p.phone}" style="color: #06b6d4; font-weight:600;"><i class="fa-solid fa-phone"></i> ${p.phone}</a>` : ''}
            </div>
          `);
        placesMarkers.push(marker);
      }

      listHtml += `
        <div class="card" style="margin-bottom: 0.85rem; padding: 1rem 1.25rem;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.75rem;">
            <div style="display: flex; gap: 0.75rem; align-items: flex-start;">
              <div style="width: 40px; height: 40px; border-radius: var(--radius-md); background: ${SafeMap.getPlaceColor(p.type)}22; color: ${SafeMap.getPlaceColor(p.type)}; display: flex; align-items: center; justify-content: center; font-size: 1.15rem; flex-shrink: 0; border: 1px solid ${SafeMap.getPlaceColor(p.type)}44;">
                <i class="fa-solid ${SafeMap.getPlaceIcon(p.type)}"></i>
              </div>
              <div>
                <h4 style="font-size: 1rem; font-weight: 700;">${SafeCity.escape(p.name)}</h4>
                <div style="font-size: 0.825rem; color: var(--text-secondary); margin-top: 0.2rem;">
                  <i class="fa-solid fa-location-dot"></i> ${SafeCity.escape(p.address)}
                </div>
                <div style="display: flex; gap: 1rem; font-size: 0.775rem; color: var(--text-muted); margin-top: 0.4rem;">
                  <span><i class="fa-solid fa-clock"></i> Hours: ${p.open_hours}</span>
                  ${p.verified ? '<span style="color: var(--color-safe);"><i class="fa-solid fa-certificate"></i> Verified Help Point</span>' : ''}
                </div>
              </div>
            </div>

            <div style="text-align: right; flex-shrink: 0;">
              ${p.distance_km !== null ? `
                <div style="font-family: var(--font-mono); font-size: 1rem; font-weight: 800; color: var(--accent-cyan);">
                  ${p.distance_km} km
                </div>
                <div style="font-size: 0.7rem; color: var(--text-muted);">from you</div>
              ` : ''}
              ${p.phone ? `
                <a href="tel:${p.phone}" class="btn btn-sm btn-outline" style="margin-top: 0.5rem;">
                  <i class="fa-solid fa-phone"></i> Call
                </a>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    });

    listContainer.innerHTML = listHtml;

  } catch (err) {
    console.error('Failed to load places:', err);
  }
}

