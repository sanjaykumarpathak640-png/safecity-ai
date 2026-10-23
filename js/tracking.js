/**
 * SafeCity AI - Public Complaint Tracking Script
 */

let trackingMap = null;

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const codeParam = urlParams.get('code');

  if (codeParam) {
    const input = document.getElementById('track-input');
    if (input) input.value = codeParam;
    lookupComplaint(codeParam);
  }

  const trackForm = document.getElementById('track-form');
  if (trackForm) {
    trackForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const code = document.getElementById('track-input').value.trim();
      if (!code) {
        SafeCity.showToast('Please enter a Complaint Code (e.g. SC-2026-1001).', 'warning');
        return;
      }
      lookupComplaint(code);
    });
  }
});

async function lookupComplaint(code) {
  const container = document.getElementById('tracking-results');
  const btn = document.getElementById('btn-track');

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner" style="width:14px; height:14px;"></span> Searching...';
  }

  if (container) {
    container.innerHTML = `
      <div class="card" style="text-align: center; padding: 3rem;">
        <span class="spinner" style="width:36px; height:36px; margin-bottom: 1rem;"></span>
        <div style="color: var(--text-secondary);">Querying municipal records for <strong>${SafeCity.escape(code)}</strong>...</div>
      </div>
    `;
  }

  try {
    const res = await API.get('php/get_status.php', { code });
    const c = res.data;

    renderComplaintTracking(c);

  } catch (err) {
    if (container) {
      container.innerHTML = `
        <div class="card" style="text-align: center; padding: 3rem 1.5rem;">
          <div style="font-size: 3rem; color: var(--color-danger); margin-bottom: 1rem;">
            <i class="fa-solid fa-triangle-exclamation"></i>
          </div>
          <h3 style="font-size: 1.35rem; margin-bottom: 0.5rem;">Complaint Record Not Found</h3>
          <p style="color: var(--text-secondary); max-width: 480px; margin: 0 auto 1.5rem;">
            ${SafeCity.escape(err.message || 'No civic record matches this reference number. Please check the ID or try a demo complaint code like SC-2026-1001.')}
          </p>
          <div style="display: flex; justify-content: center; gap: 0.5rem;">
            <button onclick="lookupComplaint('SC-2026-1001')" class="btn btn-outline btn-sm">Try SC-2026-1001 (Pothole)</button>
            <button onclick="lookupComplaint('SC-2026-1002')" class="btn btn-outline btn-sm">Try SC-2026-1002 (Streetlight)</button>
            <button onclick="lookupComplaint('SC-2026-1004')" class="btn btn-outline btn-sm">Try SC-2026-1004 (Fixed)</button>
          </div>
        </div>
      `;
    }
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-magnifying-glass"></i> Track Issue';
    }
  }
}

function renderComplaintTracking(c) {
  const container = document.getElementById('tracking-results');
  if (!container) return;

  // Determine active step index
  const statusSteps = ['pending', 'in_progress', 'fixed'];
  const curIdx = statusSteps.indexOf(c.status);

  // Timeline items
  let timelineHtml = '';
  if (c.timeline && c.timeline.length > 0) {
    c.timeline.forEach(item => {
      const isFixed = item.to_status === 'fixed';
      timelineHtml += `
        <div class="timeline-item">
          <div class="timeline-dot ${isFixed ? 'fixed' : 'active'}"></div>
          <div class="timeline-content">
            <div style="display: flex; justify-content: space-between; align-items: baseline;">
              <strong>Status: ${SafeCity.getStatusBadge(item.to_status)}</strong>
              <span class="timeline-date">${SafeCity.formatDate(item.timestamp)}</span>
            </div>
            <p style="font-size: 0.875rem; color: var(--text-secondary); margin-top: 0.4rem;">
              ${SafeCity.escape(item.note || 'Status updated by municipal system.')}
            </p>
            ${item.evidence_photo ? `
              <div style="margin-top: 0.75rem;">
                <div style="font-size: 0.75rem; color: var(--color-safe); font-weight: 600; margin-bottom: 0.25rem;">
                  <i class="fa-solid fa-camera"></i> Verified Repair Evidence Attached:
                </div>
                <img src="${item.evidence_photo}" alt="Repair Evidence" style="max-width: 200px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); cursor: pointer;" onclick="window.open('${item.evidence_photo}', '_blank')">
              </div>
            ` : ''}
          </div>
        </div>
      `;
    });
  }

  container.innerHTML = `
    <div class="card" style="margin-bottom: 1.5rem;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem;">
        <div>
          <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.25rem;">
            <span style="font-family: var(--font-mono); font-size: 1.5rem; font-weight: 800; color: var(--accent-cyan);">
              ${c.complaint_code}
            </span>
            ${SafeCity.getStatusBadge(c.status)}
            ${SafeCity.getPriorityBadge(c.priority_level)}
          </div>
          <h2 style="font-size: 1.25rem; font-weight: 700; margin-top: 0.25rem;">${SafeCity.escape(c.title)}</h2>
          <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.25rem;">
            <i class="fa-solid fa-location-dot"></i> ${SafeCity.escape(c.location.address || 'Geocoded Location')} &bull;
            Department: <strong>${SafeCity.escape(c.department)}</strong>
          </div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 0.8rem; color: var(--text-muted);">Filed On</div>
          <div style="font-weight: 600; font-size: 0.9rem;">${SafeCity.formatDate(c.created_at)}</div>
          <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem;">Last Updated</div>
          <div style="font-weight: 600; font-size: 0.9rem;">${SafeCity.formatDate(c.updated_at)}</div>
        </div>
      </div>

      <!-- Step Indicator -->
      <div style="display: flex; justify-content: space-between; position: relative; margin: 2rem 0; padding: 0 1.5rem;">
        <div style="position: absolute; top: 18px; left: 2rem; right: 2rem; height: 3px; background: var(--border-color); z-index: 1;"></div>
        
        <div style="position: relative; z-index: 2; text-align: center;">
          <div style="width: 36px; height: 36px; border-radius: 50%; background: ${curIdx >= 0 ? 'var(--accent-cyan)' : 'var(--bg-surface)'}; color: #fff; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.5rem; border: 2px solid var(--border-color);">
            <i class="fa-solid fa-file-lines"></i>
          </div>
          <span style="font-size: 0.8rem; font-weight: 600; color: ${curIdx >= 0 ? 'var(--text-primary)' : 'var(--text-muted)'};">1. Submitted</span>
        </div>

        <div style="position: relative; z-index: 2; text-align: center;">
          <div style="width: 36px; height: 36px; border-radius: 50%; background: ${curIdx >= 1 ? 'var(--accent-blue)' : 'var(--bg-surface)'}; color: #fff; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.5rem; border: 2px solid var(--border-color);">
            <i class="fa-solid fa-screwdriver-wrench"></i>
          </div>
          <span style="font-size: 0.8rem; font-weight: 600; color: ${curIdx >= 1 ? 'var(--text-primary)' : 'var(--text-muted)'};">2. In Progress</span>
        </div>

        <div style="position: relative; z-index: 2; text-align: center;">
          <div style="width: 36px; height: 36px; border-radius: 50%; background: ${curIdx >= 2 ? 'var(--color-safe)' : 'var(--bg-surface)'}; color: #fff; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.5rem; border: 2px solid var(--border-color);">
            <i class="fa-solid fa-circle-check"></i>
          </div>
          <span style="font-size: 0.8rem; font-weight: 600; color: ${curIdx >= 2 ? 'var(--text-primary)' : 'var(--text-muted)'};">3. Fixed & Verified</span>
        </div>
      </div>

      <!-- Detail Grid -->
      <div class="grid-2" style="margin-top: 2rem;">
        <div>
          <h4 style="font-size: 1rem; margin-bottom: 0.75rem;"><i class="fa-solid fa-circle-info"></i> Issue Description</h4>
          <p style="color: var(--text-secondary); font-size: 0.925rem; line-height: 1.6; background: var(--bg-surface); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
            ${SafeCity.escape(c.description)}
          </p>

          ${c.associated_route ? `
            <div style="margin-top: 1rem; padding: 0.85rem 1rem; background: rgba(6, 182, 212, 0.08); border: 1px solid var(--border-highlight); border-radius: var(--radius-md);">
              <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--accent-cyan); font-weight: 700;">
                <i class="fa-solid fa-route"></i> Linked Corridor Impact
              </div>
              <div style="font-size: 0.9rem; margin-top: 0.2rem;">
                Connected to <strong>${SafeCity.escape(c.associated_route)}</strong>.
                ${c.recalculated_at ? '<span style="color: var(--color-safe); font-weight: 600;"><br>&bull; Road condition data updated following an officer-reviewed repair record.</span>' : '<span style="color: var(--text-muted);"><br>&bull; Pending repair review before recalculating route safety factors.</span>'}
              </div>
            </div>
          ` : ''}

          ${c.photo_path ? `
            <div style="margin-top: 1.25rem;">
              <h4 style="font-size: 0.95rem; margin-bottom: 0.5rem;"><i class="fa-solid fa-camera"></i> Submitted Problem Photograph</h4>
              <img src="${c.photo_path}" alt="Issue Photograph" style="max-width: 100%; height: auto; max-height: 260px; border-radius: var(--radius-md); border: 1px solid var(--border-color); object-fit: cover;">
            </div>
          ` : ''}
        </div>

        <div>
          <h4 style="font-size: 1rem; margin-bottom: 0.75rem;"><i class="fa-solid fa-map-pin"></i> Issue Location Map</h4>
          <div id="tracking-map" style="width: 100%; height: 260px; border-radius: var(--radius-md); border: 1px solid var(--border-color); overflow: hidden;"></div>

          <h4 style="font-size: 1rem; margin-top: 1.5rem; margin-bottom: 0.75rem;"><i class="fa-solid fa-clock-rotate-left"></i> Status Audit History</h4>
          <div class="timeline" style="margin-top: 0.5rem;">
            ${timelineHtml}
          </div>
        </div>
      </div>
    </div>
  `;

  // Render tracking map
  setTimeout(() => {
    if (c.location && c.location.latitude && c.location.longitude) {
      if (trackingMap) {
        trackingMap.remove();
      }
      trackingMap = SafeMap.create('tracking-map', [c.location.latitude, c.location.longitude], 15);
      const icon = SafeMap.createMarkerIcon(SafeMap.getCategoryColor(c.category), SafeMap.getCategoryIcon(c.category));
      L.marker([c.location.latitude, c.location.longitude], { icon })
        .addTo(trackingMap)
        .bindPopup(`<strong>${SafeCity.escape(c.title)}</strong><br>${SafeCity.escape(c.location.address)}`)
        .openPopup();
    }
  }, 100);
}

