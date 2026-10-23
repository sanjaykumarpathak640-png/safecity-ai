/**
 * SafeCity AI - Citizen & Officer Dashboards Logic
 */

let officerMap = null;
let officerMarkers = [];
let categoryChart = null;

// Initialize Citizen Dashboard
async function initCitizenDashboard() {
  await Auth.init();
  if (!Auth.requireAuth()) return;

  loadCitizenStatsAndReports();
}

async function loadCitizenStatsAndReports() {
  const tableBody = document.getElementById('citizen-complaints-tbody');
  const emptyState = document.getElementById('citizen-empty-state');

  try {
    const res = await API.get('php/get_complaints.php', { user_only: 1, limit: 50 });
    const complaints = res.data.complaints;

    let pendingCount = 0;
    let inProgressCount = 0;
    let fixedCount = 0;

    complaints.forEach(c => {
      if (c.status === 'pending') pendingCount++;
      else if (c.status === 'in_progress') inProgressCount++;
      else if (c.status === 'fixed') fixedCount++;
    });

    const elTotal = document.getElementById('stat-user-total');
    const elPending = document.getElementById('stat-user-pending');
    const elProgress = document.getElementById('stat-user-progress');
    const elFixed = document.getElementById('stat-user-fixed');

    if (elTotal) elTotal.textContent = complaints.length;
    if (elPending) elPending.textContent = pendingCount;
    if (elProgress) elProgress.textContent = inProgressCount;
    if (elFixed) elFixed.textContent = fixedCount;

    if (complaints.length === 0) {
      if (emptyState) emptyState.style.display = 'block';
      if (tableBody) tableBody.innerHTML = '';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    let rowsHtml = '';
    complaints.forEach(c => {
      rowsHtml += `
        <tr>
          <td><strong style="font-family: var(--font-mono); color: var(--accent-cyan);">${c.complaint_code}</strong></td>
          <td>${SafeCity.getCategoryLabel(c.category)}</td>
          <td>
            <div style="font-weight: 600; max-width: 280px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${SafeCity.escape(c.title)}
            </div>
            <div style="font-size: 0.775rem; color: var(--text-muted);">${SafeCity.escape(c.address || '')}</div>
          </td>
          <td>${SafeCity.getPriorityBadge(c.priority_level)}</td>
          <td>${SafeCity.getStatusBadge(c.status)}</td>
          <td style="font-size: 0.825rem; color: var(--text-muted);">${SafeCity.formatDate(c.created_at)}</td>
          <td>
            <a href="track.html?code=${c.complaint_code}" class="btn btn-sm btn-outline">
              <i class="fa-solid fa-eye"></i> Track
            </a>
          </td>
        </tr>
      `;
    });

    if (tableBody) tableBody.innerHTML = rowsHtml;

  } catch (err) {
    SafeCity.showToast('Failed to load personal complaints: ' + err.message, 'error');
  }
}

// Initialize Officer Dashboard
async function initOfficerDashboard() {
  await Auth.init();
  if (!Auth.requireAuth('officer')) return;

  initOfficerMap();
  loadOfficerStats();
  loadOfficerComplaints();
  initOfficerFilters();
}

function initOfficerMap() {
  const mapEl = document.getElementById('officer-map');
  if (!mapEl) return;

  officerMap = SafeMap.create('officer-map', [12.9750, 77.6050], 13);
}

async function loadOfficerStats() {
  try {
    const res = await API.get('php/get_dashboard_stats.php');
    const m = res.data.metrics;
    const cats = res.data.categories;

    const elTotal = document.getElementById('stat-total');
    const elPending = document.getElementById('stat-pending');
    const elProgress = document.getElementById('stat-progress');
    const elFixed = document.getElementById('stat-fixed');
    const elHigh = document.getElementById('stat-high-sev');
    const elRate = document.getElementById('stat-resolution-rate');

    if (elTotal) elTotal.textContent = m.total_complaints;
    if (elPending) elPending.textContent = m.pending_complaints;
    if (elProgress) elProgress.textContent = m.in_progress;
    if (elFixed) elFixed.textContent = m.fixed_complaints;
    if (elHigh) elHigh.textContent = m.high_severity;
    if (elRate) elRate.textContent = `${m.resolution_rate}%`;

    // Render Chart.js
    renderCategoryChart(cats);

  } catch (err) {
    console.error('Stats error:', err);
  }
}

function renderCategoryChart(categories) {
  const chartCanvas = document.getElementById('category-chart');
  if (!chartCanvas || typeof Chart === 'undefined') return;

  const labels = categories.map(c => c.label);
  const data = categories.map(c => c.count);
  const colors = [
    '#f97316', '#eab308', '#06b6d4', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6'
  ];

  if (categoryChart) {
    categoryChart.destroy();
  }

  categoryChart = new Chart(chartCanvas, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors,
        borderColor: '#111827',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: '#94a3b8',
            font: { family: 'Inter', size: 12 },
            boxWidth: 14
          }
        }
      }
    }
  });
}

async function loadOfficerComplaints() {
  const tableBody = document.getElementById('officer-complaints-tbody');
  const statusFilter = document.getElementById('filter-status')?.value || '';
  const catFilter = document.getElementById('filter-category')?.value || '';
  const sevFilter = document.getElementById('filter-severity')?.value || '';

  try {
    const params = { limit: 100 };
    if (statusFilter) params.status = statusFilter;
    if (catFilter) params.category = catFilter;
    if (sevFilter) params.severity = sevFilter;

    const res = await API.get('php/get_complaints.php', params);
    const complaints = res.data.complaints;

    // Clear old map markers
    officerMarkers.forEach(m => m.remove());
    officerMarkers = [];

    if (!complaints.length) {
      if (tableBody) tableBody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 2rem; color: var(--text-muted);">No complaints match the selected filter criteria.</td></tr>';
      return;
    }

    let rowsHtml = '';
    complaints.forEach(c => {
      // Add marker to map
      if (officerMap && c.latitude && c.longitude) {
        const icon = SafeMap.createMarkerIcon(SafeMap.getCategoryColor(c.category), SafeMap.getCategoryIcon(c.category));
        const marker = L.marker([c.latitude, c.longitude], { icon })
          .addTo(officerMap)
          .bindPopup(`
            <div style="font-family: var(--font-sans); font-size: 13px; color: #0a0f1d;">
              <strong>${SafeCity.escape(c.title)}</strong><br>
              ID: ${c.complaint_code} &bull; ${c.status}<br>
              <button onclick="openOfficerModal(${c.id})" style="margin-top: 6px; padding: 4px 8px; background: #06b6d4; color: #fff; border: none; border-radius: 4px; cursor: pointer;">
                Inspect & Update
              </button>
            </div>
          `);
        officerMarkers.push(marker);
      }

      rowsHtml += `
        <tr>
          <td><strong style="font-family: var(--font-mono); color: var(--accent-cyan);">${c.complaint_code}</strong></td>
          <td>${SafeCity.getCategoryLabel(c.category)}</td>
          <td>
            <div style="font-weight: 600; max-width: 240px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${SafeCity.escape(c.title)}
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${SafeCity.escape(c.address || '')}</div>
          </td>
          <td>
            <span class="badge ${c.severity >= 4 ? 'badge-critical' : 'badge-low'}">
              Level ${c.severity}
            </span>
          </td>
          <td>${SafeCity.getPriorityBadge(c.priority_level)}</td>
          <td>${SafeCity.getStatusBadge(c.status)}</td>
          <td style="font-size: 0.8rem; color: var(--text-muted);">${c.reporter_name}</td>
          <td>
            <button onclick="openOfficerModal(${c.id})" class="btn btn-sm btn-primary">
              <i class="fa-solid fa-pen-to-square"></i> Review
            </button>
          </td>
        </tr>
      `;
    });

    if (tableBody) tableBody.innerHTML = rowsHtml;

  } catch (err) {
    SafeCity.showToast('Failed to load complaints: ' + err.message, 'error');
  }
}

function initOfficerFilters() {
  ['filter-status', 'filter-category', 'filter-severity'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('change', () => {
        loadOfficerComplaints();
      });
    }
  });

  const resetBtn = document.getElementById('btn-reset-filters');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      document.getElementById('filter-status').value = '';
      document.getElementById('filter-category').value = '';
      document.getElementById('filter-severity').value = '';
      loadOfficerComplaints();
    });
  }
}

// Modal inspection & status update workflow
async function openOfficerModal(complaintId) {
  try {
    const res = await API.get('php/get_complaint.php', { id: complaintId });
    const c = res.data.complaint;
    const history = res.data.history;

    document.getElementById('modal-complaint-id').value = c.id;
    document.getElementById('modal-code-title').textContent = `${c.complaint_code} — ${c.title}`;
    document.getElementById('modal-category-label').textContent = SafeCity.getCategoryLabel(c.category);
    document.getElementById('modal-desc').textContent = c.description;
    document.getElementById('modal-address').textContent = c.address || 'Geocoded Address';
    document.getElementById('modal-reporter').textContent = `${c.reporter_name || 'Citizen'} (${c.reporter_phone || 'No phone'})`;
    document.getElementById('modal-status-select').value = c.status;
    document.getElementById('modal-notes').value = c.repair_notes || '';

    // Route segment linkage indicator
    const segInfo = document.getElementById('modal-linked-segment');
    if (segInfo) {
      if (c.associated_segment_id) {
        segInfo.innerHTML = `
          <div style="background: rgba(6, 182, 212, 0.1); border: 1px solid var(--border-highlight); padding: 0.75rem; border-radius: var(--radius-md); font-size: 0.85rem; color: var(--accent-cyan-light); margin-bottom: 1rem;">
            <i class="fa-solid fa-link"></i> <strong>Linked to Safety Route Corridor:</strong> ${c.route_name || 'Corridor'} (${c.segment_name || 'Road Segment'}).
            <br><span style="font-size: 0.8rem; color: var(--text-secondary);">Marking this complaint Fixed with verified evidence will trigger an automated recalculation of this road segment's safety score!</span>
          </div>
        `;
      } else {
        segInfo.innerHTML = '';
      }
    }

    // Photo preview
    const photoContainer = document.getElementById('modal-photos-preview');
    if (photoContainer) {
      photoContainer.innerHTML = '';
      if (c.photo_path) {
        photoContainer.innerHTML += `
          <div>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.25rem;">Citizen Problem Photo</div>
            <img src="${c.photo_path}" style="max-width: 140px; height: 100px; object-fit: cover; border-radius: var(--radius-sm); border: 1px solid var(--border-color); cursor: pointer;" onclick="window.open('${c.photo_path}', '_blank')">
          </div>
        `;
      }
      if (c.repair_evidence_photo) {
        photoContainer.innerHTML += `
          <div>
            <div style="font-size: 0.75rem; color: var(--color-safe); margin-bottom: 0.25rem;">Verified Repair Photo</div>
            <img src="${c.repair_evidence_photo}" style="max-width: 140px; height: 100px; object-fit: cover; border-radius: var(--radius-sm); border: 1px solid var(--color-safe); cursor: pointer;" onclick="window.open('${c.repair_evidence_photo}', '_blank')">
          </div>
        `;
      }
    }

    SafeCity.openModal('officer-action-modal');

  } catch (err) {
    SafeCity.showToast('Failed to load complaint details: ' + err.message, 'error');
  }
}

// Submit officer status update form
document.addEventListener('DOMContentLoaded', () => {
  const updateForm = document.getElementById('officer-update-form');
  if (updateForm) {
    updateForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const btn = document.getElementById('btn-save-officer-update');
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner" style="width:14px; height:14px;"></span> Updating & Recalculating...';

      const formData = new FormData(updateForm);

      try {
        const res = await API.post('php/update_status.php', formData);
        const data = res.data;

        SafeCity.closeModal('officer-action-modal');
        SafeCity.showToast(res.message, 'success');

        // If recalculation occurred, show transparent alert
        if (data.recalculation && data.recalculation.recalculated) {
          const r = data.recalculation;
          setTimeout(() => {
            SafeCity.showToast(`✨ Signature Connected Feature Triggered: ${r.reason}`, 'info', 7000);
          }, 600);
        }

        // Refresh stats and table
        loadOfficerStats();
        loadOfficerComplaints();

      } catch (err) {
        SafeCity.showToast(err.message || 'Failed to update complaint status.', 'error');
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save & Recalculate Road Safety';
      }
    });
  }
});

