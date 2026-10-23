/**
 * SafeCity AI - SOS Emergency Interface & Countdown Flow
 */

let countdownTimer = null;
let secondsRemaining = 10;
let userCoords = null;

document.addEventListener('DOMContentLoaded', () => {
  initSosFlow();
  tryAcquireLocation();
});

async function tryAcquireLocation() {
  try {
    userCoords = await SafeMap.getUserLocation();
    const locText = document.getElementById('sos-location-text');
    if (locText) {
      locText.innerHTML = `<i class="fa-solid fa-location-dot" style="color: var(--color-safe);"></i> Location Geocoded: ${userCoords.lat.toFixed(4)}, ${userCoords.lng.toFixed(4)}`;
    }
  } catch (e) {
    const locText = document.getElementById('sos-location-text');
    if (locText) {
      locText.innerHTML = `<i class="fa-solid fa-triangle-exclamation" style="color: var(--color-caution);"></i> Location access not granted. Alert will use fallback municipal sector coordinates.`;
    }
  }
}

function initSosFlow() {
  const giantBtn = document.getElementById('sos-trigger-btn');
  const cancelBtn = document.getElementById('sos-cancel-btn');
  const initialView = document.getElementById('sos-initial-view');
  const countdownView = document.getElementById('sos-countdown-view');
  const completedView = document.getElementById('sos-completed-view');

  if (giantBtn) {
    giantBtn.addEventListener('click', () => {
      startCountdown();
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      cancelSos();
    });
  }
}

function playBeep(freq = 440, duration = 0.15) {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {
    // AudioContext blocked or unsupported
  }
}

function startCountdown() {
  const initialView = document.getElementById('sos-initial-view');
  const countdownView = document.getElementById('sos-countdown-view');
  const display = document.getElementById('countdown-number');

  if (initialView) initialView.style.display = 'none';
  if (countdownView) countdownView.style.display = 'flex';

  secondsRemaining = 10;
  if (display) display.textContent = secondsRemaining;
  playBeep(880, 0.2);

  countdownTimer = setInterval(() => {
    secondsRemaining--;
    if (display) display.textContent = secondsRemaining;
    playBeep(secondsRemaining <= 3 ? 1200 : 660, 0.15);

    if (secondsRemaining <= 0) {
      clearInterval(countdownTimer);
      submitSosAlert();
    }
  }, 1000);
}

function cancelSos() {
  if (countdownTimer) {
    clearInterval(countdownTimer);
  }

  const initialView = document.getElementById('sos-initial-view');
  const countdownView = document.getElementById('sos-countdown-view');

  if (countdownView) countdownView.style.display = 'none';
  if (initialView) initialView.style.display = 'flex';

  SafeCity.showToast('SOS countdown cancelled. Your safety has been confirmed.', 'info');

  // Record cancellation on backend
  const formData = new FormData();
  formData.append('status', 'cancelled');
  if (userCoords) {
    formData.append('latitude', userCoords.lat);
    formData.append('longitude', userCoords.lng);
  }
  API.post('php/save_sos.php', formData).catch(e => console.warn('Cancel log notice:', e));
}

async function submitSosAlert() {
  const countdownView = document.getElementById('sos-countdown-view');
  const completedView = document.getElementById('sos-completed-view');

  if (countdownView) countdownView.style.display = 'none';
  if (completedView) completedView.style.display = 'block';

  const formData = new FormData();
  formData.append('status', 'triggered');
  formData.append('demo_mode', '1');
  if (userCoords) {
    formData.append('latitude', userCoords.lat);
    formData.append('longitude', userCoords.lng);
  }

  try {
    const res = await API.post('php/save_sos.php', formData);
    const data = res.data;

    const alertIdEl = document.getElementById('sos-alert-id');
    const timeEl = document.getElementById('sos-timestamp');

    if (alertIdEl) alertIdEl.textContent = `ALERT #${data.alert_id}`;
    if (timeEl) timeEl.textContent = new Date().toLocaleTimeString();

    SafeCity.showToast('SOS Alert recorded in SafeCity database (Demonstration Mode).', 'warning', 6000);

  } catch (err) {
    SafeCity.showToast('Error persisting SOS alert: ' + err.message, 'error');
  }
}

