/**
 * SafeCity AI - Road and Area Ratings Script
 */

let ratingMap = null;
let ratingMarker = null;

document.addEventListener('DOMContentLoaded', () => {
  initRatingMap();
  initStarInputs();
  initRatingForm();
  loadRoadRatings();
});

function initRatingMap() {
  const mapEl = document.getElementById('rating-map');
  if (!mapEl) return;

  const defaultCoords = [12.9750, 77.5980];
  ratingMap = SafeMap.create('rating-map', defaultCoords, 14);

  const icon = SafeMap.createMarkerIcon('#eab308', 'fa-star');
  ratingMarker = L.marker(defaultCoords, { draggable: true, icon }).addTo(ratingMap);

  updateRatingCoords(defaultCoords[0], defaultCoords[1]);

  ratingMarker.on('dragend', (e) => {
    const latlng = e.target.getLatLng();
    updateRatingCoords(latlng.lat, latlng.lng);
  });

  ratingMap.on('click', (e) => {
    ratingMarker.setLatLng(e.latlng);
    updateRatingCoords(e.latlng.lat, e.latlng.lng);
  });
}

function updateRatingCoords(lat, lng) {
  const latInput = document.getElementById('rate-lat');
  const lngInput = document.getElementById('rate-lng');
  if (latInput) latInput.value = lat.toFixed(6);
  if (lngInput) lngInput.value = lng.toFixed(6);
}

function initStarInputs() {
  document.querySelectorAll('.star-rating-widget').forEach(widget => {
    const hidden = widget.querySelector('input[type="hidden"]');
    const stars = widget.querySelectorAll('.star-btn');

    stars.forEach(star => {
      star.addEventListener('click', () => {
        const val = parseInt(star.getAttribute('data-value'));
        if (hidden) hidden.value = val;

        stars.forEach(s => {
          const sVal = parseInt(s.getAttribute('data-value'));
          if (sVal <= val) {
            s.style.color = '#eab308';
          } else {
            s.style.color = 'var(--text-muted)';
          }
        });
      });
    });
  });
}

function initRatingForm() {
  const form = document.getElementById('road-rating-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!Auth.isAuthenticated) {
      SafeCity.showToast('Please sign in to submit a road rating.', 'warning');
      setTimeout(() => {
        window.location.href = 'login.html?redirect=rate.html';
      }, 1000);
      return;
    }

    const btn = document.getElementById('btn-submit-rating');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner" style="width:14px; height:14px;"></span> Submitting...';

    const formData = new FormData(form);

    try {
      const res = await API.post('php/save_rating.php', formData);
      SafeCity.showToast(res.message, 'success');
      form.reset();
      loadRoadRatings();
    } catch (err) {
      SafeCity.showToast(err.message || 'Failed to submit rating.', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-star"></i> Submit Civic Rating';
    }
  });
}

async function loadRoadRatings() {
  const container = document.getElementById('ratings-list');
  const avgDisplay = document.getElementById('aggregate-rating-score');
  const countDisplay = document.getElementById('aggregate-review-count');

  try {
    const res = await API.get('php/get_ratings.php');
    const stats = res.data.stats;
    const reviews = res.data.reviews;

    if (avgDisplay) avgDisplay.textContent = stats.avg_rating || '4.0';
    if (countDisplay) countDisplay.textContent = `Based on ${stats.total_reviews} community assessments`;

    if (!container) return;

    if (reviews.length === 0) {
      container.innerHTML = '<div style="color: var(--text-muted); padding: 1.5rem; text-align: center;">No ratings recorded yet. Be the first to rate a road!</div>';
      return;
    }

    let html = '';
    reviews.forEach(r => {
      let starsHtml = '';
      for (let i = 1; i <= 5; i++) {
        starsHtml += (i <= r.rating)
          ? '<i class="fa-solid fa-star" style="color: #eab308; font-size: 0.85rem;"></i>'
          : '<i class="fa-regular fa-star" style="color: var(--text-muted); font-size: 0.85rem;"></i>';
      }

      html += `
        <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1rem; margin-bottom: 0.75rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
            <strong>${SafeCity.escape(r.road_name)}</strong>
            <div style="display: flex; gap: 0.2rem;">${starsHtml}</div>
          </div>
          <p style="font-size: 0.875rem; color: var(--text-secondary); line-height: 1.5;">
            ${SafeCity.escape(r.review || 'No written commentary provided.')}
          </p>
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.5rem; display: flex; justify-content: space-between;">
            <span>By ${SafeCity.escape(r.reviewer_name)}</span>
            <span>${SafeCity.formatDate(r.created_at)}</span>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;

  } catch (err) {
    console.error('Failed to load ratings:', err);
  }
}

