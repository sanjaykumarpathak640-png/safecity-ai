/**
 * SafeCity AI - Safe Journey Monitor & Shared Link Logic
 */

let journeyInterval = null;
let currentJourney = null;

// Initialize Active Journey View
async function initJourneyMonitor() {
  await Auth.init();
  if (!Auth.requireAuth()) return;

  const urlParams = new URLSearchParams(window.location.search);
  const routeParam = urlParams.get('route') || 'Route A';
  const scoreParam = parseFloat(urlParams.get('score')) || 85.8;

  // Retrieve pending journey info if stored
  let origin = 'Metro Central Station';
  let dest = 'Tech Innovation Hub';
  const pending = sessionStorage.getItem('pending_journey');
  if (pending) {
    try {
      const p = JSON.parse(pending);
      origin = p.origin || origin;
      dest = p.destination || dest;
    } catch (e) {}
  }

  // Populate view
  document.getElementById('jrn-origin').textContent = origin;
  document.getElementById('jrn-destination').textContent = dest;
  document.getElementById('jrn-route').textContent = routeParam;
  document.getElementById('jrn-score').textContent = `${scoreParam} / 100`;

  // Start journey on backend
  try {
    const formData = new FormData();
    formData.append('start_location', origin);
    formData.append('destination_location', dest);
    formData.append('selected_route', routeParam);
    formData.append('route_safety_score', scoreParam);

    const res = await API.post('php/save_journey.php', formData);
    currentJourney = res.data;

    document.getElementById('jrn-code').textContent = currentJourney.journey_code;
    
    // Set share link
    const fullShareUrl = `${window.location.origin}${window.location.pathname.replace('journey.html', '')}${currentJourney.share_url}`;
    const shareInput = document.getElementById('share-link-input');
    if (shareInput) shareInput.value = fullShareUrl;

    // Start timer
    startJourneyTimer(new Date());

    SafeCity.showToast('Safe Journey active. Share link generated for your trusted contacts.', 'success');

  } catch (err) {
    SafeCity.showToast('Failed to initialize journey: ' + err.message, 'error');
  }

  // Copy share link button
  const copyBtn = document.getElementById('btn-copy-share');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const shareInput = document.getElementById('share-link-input');
      if (shareInput) {
        shareInput.select();
        navigator.clipboard.writeText(shareInput.value);
        SafeCity.showToast('Secure tracking link copied to clipboard!', 'info');
      }
    });
  }

  // Revoke share link button
  const revokeBtn = document.getElementById('btn-revoke-share');
  if (revokeBtn) {
    revokeBtn.addEventListener('click', async () => {
      if (!currentJourney) return;
      if (!confirm('Are you sure you want to revoke this tracking link? Your contacts will no longer be able to view this journey.')) return;

      const formData = new FormData();
      formData.append('journey_id', currentJourney.journey_id);

      try {
        await API.post('php/revoke_journey_share.php', formData);
        document.getElementById('share-link-input').value = '[Link Revoked by User]';
        revokeBtn.disabled = true;
        SafeCity.showToast('Share link revoked successfully.', 'warning');
      } catch (e) {
        SafeCity.showToast('Failed to revoke link: ' + e.message, 'error');
      }
    });
  }

  // End journey button
  const endBtn = document.getElementById('btn-end-journey');
  if (endBtn) {
    endBtn.addEventListener('click', async () => {
      if (!currentJourney) return;

      endBtn.disabled = true;
      endBtn.innerHTML = '<span class="spinner" style="width:14px; height:14px;"></span> Ending Journey...';

      const formData = new FormData();
      formData.append('journey_id', currentJourney.journey_id);
      formData.append('status', 'completed');

      try {
        await API.post('php/update_journey.php', formData);
        clearInterval(journeyInterval);
        sessionStorage.removeItem('pending_journey');
        
        SafeCity.showToast('Journey marked as safely completed. Great job!', 'success');
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 1500);

      } catch (e) {
        SafeCity.showToast('Failed to complete journey: ' + e.message, 'error');
        endBtn.disabled = false;
        endBtn.innerHTML = '<i class="fa-solid fa-flag-checkered"></i> I Have Arrived (End Journey)';
      }
    });
  }
}

function startJourneyTimer(startTime) {
  const timerDisplay = document.getElementById('journey-timer');
  if (!timerDisplay) return;

  journeyInterval = setInterval(() => {
    const elapsedMs = new Date() - startTime;
    const totalSecs = Math.floor(elapsedMs / 1000);
    const hrs = String(Math.floor(totalSecs / 3600)).padStart(2, '0');
    const mins = String(Math.floor((totalSecs % 3600) / 60)).padStart(2, '0');
    const secs = String(totalSecs % 60).padStart(2, '0');

    timerDisplay.textContent = `${hrs}:${mins}:${secs}`;
  }, 1000);
}

// Initialize Shared Journey View for Trusted Contacts (shared-journey.html)
async function initSharedJourneyView() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const container = document.getElementById('shared-journey-container');

  if (!token) {
    if (container) {
      container.innerHTML = `
        <div class="card" style="text-align: center; padding: 3rem;">
          <div style="font-size: 3rem; color: var(--color-danger); margin-bottom: 1rem;"><i class="fa-solid fa-link-slash"></i></div>
          <h3>Missing or Invalid Link</h3>
          <p style="color: var(--text-secondary); margin-top: 0.5rem;">No journey security token provided in this URL.</p>
        </div>
      `;
    }
    return;
  }

  try {
    const res = await API.get('php/get_shared_journey.php', { token });
    const j = res.data;

    if (container) {
      const isCompleted = j.status === 'completed';
      const statusBadge = isCompleted
        ? '<span class="badge badge-fixed"><i class="fa-solid fa-circle-check"></i> Safely Arrived</span>'
        : '<span class="badge badge-progress"><i class="fa-solid fa-person-walking"></i> Journey Active</span>';

      container.innerHTML = `
        <div class="card" style="max-width: 600px; margin: 2rem auto; padding: 2rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-color); padding-bottom: 1rem;">
            <div>
              <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase;">Trusted Contact Live View</div>
              <h2 style="font-size: 1.5rem; font-weight: 800;">${j.traveler_name}'s Journey</h2>
            </div>
            ${statusBadge}
          </div>

          <div style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem;">
            <div style="display: flex; gap: 0.75rem; align-items: center;">
              <i class="fa-solid fa-circle-dot" style="color: var(--accent-cyan); font-size: 1.25rem;"></i>
              <div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">Departed From</div>
                <div style="font-weight: 600;">${SafeCity.escape(j.start_location)}</div>
              </div>
            </div>

            <div style="display: flex; gap: 0.75rem; align-items: center;">
              <i class="fa-solid fa-location-dot" style="color: var(--color-safe); font-size: 1.25rem;"></i>
              <div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">Destination</div>
                <div style="font-weight: 600;">${SafeCity.escape(j.destination_location)}</div>
              </div>
            </div>

            <div style="display: flex; gap: 1.5rem; background: var(--bg-surface); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color); margin-top: 0.5rem;">
              <div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">Route Taken</div>
                <div style="font-weight: 700; color: var(--accent-cyan);">${j.selected_route}</div>
              </div>
              <div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">Safety Score</div>
                <div style="font-weight: 700; color: var(--color-safe);">${j.route_safety_score}/100</div>
              </div>
              <div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">Elapsed Time</div>
                <div style="font-weight: 700;">${j.elapsed_minutes} mins</div>
              </div>
            </div>
          </div>

          <div class="demo-disclaimer-box" style="margin-top: 1rem;">
            <i class="fa-solid fa-shield-halved" style="font-size: 1.25rem; flex-shrink: 0;"></i>
            <div>
              <strong>Privacy-Preserving Tracking:</strong>
              ${j.disclaimer}
            </div>
          </div>
        </div>
      `;
    }

  } catch (err) {
    if (container) {
      container.innerHTML = `
        <div class="card" style="text-align: center; padding: 3rem; max-width: 500px; margin: 2rem auto;">
          <div style="font-size: 3rem; color: var(--color-caution); margin-bottom: 1rem;">
            <i class="fa-solid fa-clock"></i>
          </div>
          <h3>Tracking Link Unavailable</h3>
          <p style="color: var(--text-secondary); margin-top: 0.5rem;">
            ${SafeCity.escape(err.message || 'This journey link has either expired or been revoked by the traveler.')}
          </p>
        </div>
      `;
    }
  }
}

