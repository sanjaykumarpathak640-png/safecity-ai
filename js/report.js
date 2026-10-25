/**
 * SafeCity AI - Civic Complaint Reporting Script
 */

let reportMap = null;
let reportMarker = null;
let reverseGeocodeTimer = null;

document.addEventListener('DOMContentLoaded', () => {
  initSeverityPicker();
  initReportMap();
  initReportSearch();
  initDropzone();
  initAiAssist();
  initFormSubmit();
});

function initSeverityPicker() {
  const buttons = document.querySelectorAll('.severity-btn');
  const hiddenInput = document.getElementById('complaint-severity');

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const val = btn.getAttribute('data-level');
      if (hiddenInput) hiddenInput.value = val;

      const descBox = document.getElementById('severity-desc-box');
      if (descBox) {
        const descs = {
          '1': 'Level 1: Minor cosmetic civic issue with negligible traffic or pedestrian impact.',
          '2': 'Level 2: Low concern; requires routine maintenance during scheduled ward cycles.',
          '3': 'Level 3: Moderate impediment; affects sidewalk or roadway flow.',
          '4': 'Level 4: High safety concern; severe pothole or dark unlit street causing active risk.',
          '5': 'Level 5: Critical emergency hazard; open manhole, fallen live wire, or road cave-in.'
        };
        descBox.textContent = descs[val] || '';
      }
    });
  });
}

function initReportMap() {
  const mapEl = document.getElementById('report-map');
  if (!mapEl) return;

  const defaultCoords = [12.9738, 77.6055];
  reportMap = SafeMap.create('report-map', defaultCoords, 14);

  const markerIcon = SafeMap.createMarkerIcon('#ef4444', 'fa-triangle-exclamation');
  reportMarker = L.marker(defaultCoords, {
    draggable: true,
    icon: markerIcon
  }).addTo(reportMap);

  updateCoordinates(defaultCoords[0], defaultCoords[1]);

  reportMarker.on('dragend', (e) => {
    const latlng = e.target.getLatLng();
    updateCoordinates(latlng.lat, latlng.lng);
  });

  reportMap.on('click', (e) => {
    reportMarker.setLatLng(e.latlng);
    updateCoordinates(e.latlng.lat, e.latlng.lng);
  });

  const locBtn = document.getElementById('btn-use-location');
  if (locBtn) {
    locBtn.addEventListener('click', async () => {
      locBtn.disabled = true;
      locBtn.innerHTML = '<span class="spinner" style="width:14px; height:14px;"></span> Locating...';
      try {
        const pos = await SafeMap.getUserLocation();
        reportMap.setView([pos.lat, pos.lng], 16);
        reportMarker.setLatLng([pos.lat, pos.lng]);
        updateCoordinates(pos.lat, pos.lng);
        SafeCity.showToast('Location updated with GPS coordinates.', 'success');
      } catch (err) {
        SafeCity.showToast(err.message || 'Location permission denied or unavailable.', 'error');
      } finally {
        locBtn.disabled = false;
        locBtn.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i> Use Current Location';
      }
    });
  }
}

function updateCoordinates(lat, lng) {
  const latInput = document.getElementById('complaint-lat');
  const lngInput = document.getElementById('complaint-lng');
  const coordDisplay = document.getElementById('coord-display');

  if (latInput) latInput.value = lat.toFixed(6);
  if (lngInput) lngInput.value = lng.toFixed(6);
  if (coordDisplay) coordDisplay.textContent = `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`;

  reverseGeocodeReport(lat, lng);
}

function reverseGeocodeReport(lat, lng) {
  clearTimeout(reverseGeocodeTimer);
  const addrInput = document.getElementById('complaint-address');
  const hint = document.getElementById('address-resolved-hint');
  if (!addrInput) return;

  if (hint) hint.innerHTML = '<span class="spinner" style="width:10px; height:10px;"></span> Geocoding...';

  reverseGeocodeTimer = setTimeout(async () => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
        headers: { 'Accept-Language': 'en' }
      });
      if (!res.ok) throw new Error('Geocoding rate limit');
      const data = await res.json();
      if (data && data.display_name) {
        addrInput.value = data.display_name;
        if (hint) hint.innerHTML = '<i class="fa-solid fa-circle-check" style="color:var(--color-safe);"></i> Location resolved';
      }
    } catch (e) {
      if (hint) hint.textContent = 'Auto-geocoded';
    }
  }, 400);
}

function initReportSearch() {
  const searchInput = document.getElementById('report-search-loc');
  const dropdown = document.getElementById('report-search-dropdown');
  if (!searchInput || !dropdown) return;

  let debounceTimer = null;

  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    const query = searchInput.value.trim();

    if (query.length < 3) {
      dropdown.style.display = 'none';
      return;
    }

    debounceTimer = setTimeout(async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`;
        const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
        if (!res.ok) throw new Error('Geocoding error');
        const items = await res.json();

        if (items.length === 0) {
          dropdown.innerHTML = '<div style="padding: 0.75rem 1rem; color: var(--text-muted); font-size: 0.85rem;">No matching locations found</div>';
          dropdown.style.display = 'block';
          return;
        }

        dropdown.innerHTML = items.map(item => `
          <div class="autocomplete-item" data-lat="${item.lat}" data-lon="${item.lon}">
            <i class="fa-solid fa-map-pin" style="color: var(--accent-cyan); font-size: 0.9rem;"></i>
            <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${item.display_name}</span>
          </div>
        `).join('');

        dropdown.style.display = 'block';

        dropdown.querySelectorAll('.autocomplete-item').forEach((el, idx) => {
          el.addEventListener('click', () => {
            const item = items[idx];
            const lat = parseFloat(item.lat);
            const lng = parseFloat(item.lon);

            if (reportMap && reportMarker) {
              reportMap.setView([lat, lng], 16);
              reportMarker.setLatLng([lat, lng]);
            }
            updateCoordinates(lat, lng);
            searchInput.value = item.display_name;
            dropdown.style.display = 'none';
            SafeCity.showToast('Map centered to ' + (item.name || 'selected place'), 'info');
          });
        });
      } catch (e) {
        dropdown.style.display = 'none';
      }
    }, 350);
  });

  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.style.display = 'none';
    }
  });
}

function initDropzone() {
  const dropzone = document.getElementById('upload-dropzone');
  const fileInput = document.getElementById('complaint-photo');
  const preview = document.getElementById('photo-preview');
  const previewImg = document.getElementById('preview-image');
  const previewName = document.getElementById('preview-name');

  if (!dropzone || !fileInput) return;

  dropzone.addEventListener('click', () => fileInput.click());

  ['dragenter', 'dragover'].forEach(name => {
    dropzone.addEventListener(name, (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(name => {
    dropzone.addEventListener(name, (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
    });
  });

  dropzone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      fileInput.files = files;
      showPreview(files[0]);
    }
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
      showPreview(fileInput.files[0]);
    }
  });

  function showPreview(file) {
    if (!file.type.startsWith('image/')) {
      SafeCity.showToast('Please select a valid image file (JPG, PNG, WebP).', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (previewImg) previewImg.src = e.target.result;
      if (previewName) previewName.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
      if (preview) preview.style.display = 'flex';
      if (dropzone) dropzone.style.display = 'none';
    };
    reader.readAsDataURL(file);
  }

  const removeBtn = document.getElementById('btn-remove-photo');
  if (removeBtn) {
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      fileInput.value = '';
      if (preview) preview.style.display = 'none';
      if (dropzone) dropzone.style.display = 'block';
    });
  }
}

function initAiAssist() {
  const aiBtn = document.getElementById('btn-ai-assist');
  if (!aiBtn) return;

  aiBtn.addEventListener('click', async () => {
    const descField = document.getElementById('complaint-desc');
    const photoInput = document.getElementById('complaint-photo');
    const descText = descField ? descField.value.trim() : '';

    if (!descText && (!photoInput || !photoInput.files.length)) {
      SafeCity.showToast('Please enter a brief note or upload an issue photo for the assistant to review.', 'warning');
      return;
    }

    aiBtn.disabled = true;
    aiBtn.innerHTML = '<span class="spinner" style="width:14px; height:14px;"></span> Analyzing Civic Signals...';

    const formData = new FormData();
    formData.append('description', descText);
    formData.append('action', 'analyze');
    if (photoInput && photoInput.files[0]) {
      formData.append('photo', photoInput.files[0]);
    }

    try {
      const res = await API.post('php/ai_assist.php', formData);
      const data = res.data;

      const modal = document.getElementById('ai-assist-modal');
      const engineBadge = document.getElementById('ai-engine-badge');
      const suggestedCat = document.getElementById('ai-suggested-cat');
      const suggestedSev = document.getElementById('ai-suggested-sev');
      const suggestedTitle = document.getElementById('ai-suggested-title');
      const suggestedDesc = document.getElementById('ai-suggested-desc');
      const explanationText = document.getElementById('ai-explanation');

      if (engineBadge) {
        engineBadge.textContent = data.is_ai_model ? 'Live Vision AI Model' : 'Rule-Based Civic Heuristics';
        engineBadge.className = data.is_ai_model ? 'badge badge-progress' : 'badge badge-medium';
      }
      if (suggestedCat) suggestedCat.textContent = SafeCity.getCategoryLabel(data.suggested_category);
      if (suggestedSev) suggestedSev.textContent = `Severity Level ${data.suggested_severity} / 5`;
      if (suggestedTitle) suggestedTitle.textContent = data.suggested_title;
      if (suggestedDesc) suggestedDesc.textContent = data.refined_description;
      if (explanationText) explanationText.textContent = data.explanation;

      // Store suggested values on apply button
      const applyBtn = document.getElementById('btn-apply-ai');
      if (applyBtn) {
        applyBtn.onclick = () => {
          const catSelect = document.getElementById('complaint-category');
          const titleInput = document.getElementById('complaint-title');

          if (catSelect) catSelect.value = data.suggested_category;
          if (titleInput) titleInput.value = data.suggested_title;
          if (descField) descField.value = data.refined_description;

          // Update severity
          const sevBtn = document.querySelector(`.severity-btn[data-level="${data.suggested_severity}"]`);
          if (sevBtn) sevBtn.click();

          SafeCity.closeModal('ai-assist-modal');
          SafeCity.showToast('Suggestions applied! Please review before submitting.', 'info');
        };
      }

      SafeCity.openModal('ai-assist-modal');

    } catch (err) {
      SafeCity.showToast('Civic assistant notice: ' + (err.message || 'Failed to complete analysis.'), 'error');
    } finally {
      aiBtn.disabled = false;
      aiBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> AI Assistant';
    }
  });
}

function initFormSubmit() {
  const form = document.getElementById('complaint-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = document.getElementById('btn-submit-complaint');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner" style="width:16px; height:16px;"></span> Registering Complaint...';

    const formData = new FormData(form);

    try {
      const res = await API.post('php/save_complaint.php', formData);
      const data = res.data;

      // Extract field values for instant client-side dashboard sync
      const catVal = form.elements['category']?.value || 'other';
      const titleVal = form.elements['title']?.value || 'Civic Issue';
      const descVal = form.elements['description']?.value || '';
      const latVal = parseFloat(form.elements['latitude']?.value || '12.9738');
      const lngVal = parseFloat(form.elements['longitude']?.value || '77.6055');
      const addrVal = form.elements['address']?.value || 'Reported Location';
      const sevVal = parseInt(form.elements['severity']?.value || '3', 10);

      const newRecord = {
        id: data.complaint_id || Date.now(),
        complaint_code: data.complaint_code,
        category: catVal,
        title: titleVal,
        description: descVal,
        latitude: latVal,
        longitude: lngVal,
        address: addrVal,
        severity: sevVal,
        priority_score: data.priority_score || (sevVal * 18),
        priority_level: data.priority_level || (sevVal >= 4 ? 'High' : (sevVal === 3 ? 'Medium' : 'Low')),
        status: 'pending',
        department: data.department || 'Roads & Infrastructure',
        created_at: new Date().toISOString()
      };

      // 1. Mirror into safecity_my_complaints (for Citizen Dashboard)
      try {
        const myComplaints = JSON.parse(localStorage.getItem('safecity_my_complaints') || '[]');
        myComplaints.unshift(newRecord);
        localStorage.setItem('safecity_my_complaints', JSON.stringify(myComplaints));
      } catch (err) {
        console.warn('Local storage mirror error:', err);
      }

      // 2. Mirror into safecity_complaints (for Heatmap and Officer feeds)
      try {
        const allComplaints = JSON.parse(localStorage.getItem('safecity_complaints') || '[]');
        allComplaints.unshift(newRecord);
        localStorage.setItem('safecity_complaints', JSON.stringify(allComplaints));
      } catch (err) {
        console.warn('Local storage all complaints error:', err);
      }

      // Render success screen with tracking link
      const container = document.getElementById('report-container');
      if (container) {
        container.innerHTML = `
          <div class="card" style="text-align: center; padding: 3rem 2rem;">
            <div style="width: 72px; height: 72px; border-radius: 50%; background: var(--color-safe-bg); color: var(--color-safe); display: flex; align-items: center; justify-content: center; font-size: 2.25rem; margin: 0 auto 1.5rem; border: 2px solid var(--color-safe);">
              <i class="fa-solid fa-check"></i>
            </div>
            <h2 style="font-size: 1.75rem; margin-bottom: 0.5rem;">Complaint Successfully Registered!</h2>
            <p style="color: var(--text-secondary); max-width: 520px; margin: 0 auto 1.5rem;">
              Your report has been logged into the municipal database and prioritized for verification.
            </p>
            <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1.25rem; max-width: 420px; margin: 0 auto 2rem;">
              <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em;">Your Tracking Code</div>
              <div style="font-size: 2rem; font-family: var(--font-mono); font-weight: 800; color: var(--accent-cyan); letter-spacing: 0.05em; margin: 0.25rem 0;">
                ${data.complaint_code}
              </div>
              <div style="display: flex; justify-content: center; gap: 0.5rem; margin-top: 0.5rem;">
                <span class="badge badge-pending">Status: Pending</span>
                <span class="badge badge-medium">Priority: ${data.priority_score || 55}/100</span>
              </div>
            </div>
            <div style="display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap;">
              <a href="dashboard.html" class="btn btn-primary btn-lg">
                <i class="fa-solid fa-gauge"></i> View on My Dashboard
              </a>
              <a href="track.html?code=${data.complaint_code}" class="btn btn-secondary btn-lg">
                <i class="fa-solid fa-magnifying-glass-location"></i> Track Status
              </a>
              <a href="report.html" class="btn btn-outline btn-lg">
                <i class="fa-solid fa-plus"></i> Report Another Issue
              </a>
            </div>
          </div>
        `;
      }
      SafeCity.showToast(`Complaint ${data.complaint_code} filed successfully!`, 'success');

    } catch (err) {
      SafeCity.showToast(err.message || 'Submission failed. Please verify the form fields.', 'error');
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Submit Complaint';
    }
  });
}

