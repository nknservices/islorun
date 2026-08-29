const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

// 1. Modal Event Bubbling & Safe Area Insets
html = html.replace(/<nav class="([^"]+)"/, `<nav class="$1" style="padding-bottom: max(12px, env(safe-area-inset-bottom));"`);

html = html.replace(/<button onclick="closeUpgradeModal\(\)" class="([^"]+)">/g, `<button onclick="event.stopPropagation(); event.preventDefault(); closeUpgradeModal()" class="$1">`);

// 2. Simulator Step Counter
const simSteps = `
      // Sim steps
      let stepsPerKm = 1320;
      if (state.workoutMode === 'walking') stepsPerKm = 1400;
      if (state.workoutMode === 'hiking') stepsPerKm = 1450;
      if (state.workoutMode === 'cycling') stepsPerKm = 0;
      workout.steps = Math.floor(workout.distance * stepsPerKm);
      document.getElementById('hud-steps').innerText = workout.steps;
`;
html = html.replace(/workout\.pace = formatPace\(paceSecs\);/, `workout.pace = formatPace(paceSecs);\n      ${simSteps}`);

// 3. Pre-Action Auth Gating for Payment
const newEasypaisa = `
    function submitEasypaisaPayment() {
      if (!state.userSession) {
        alert("You must sign in to link your payment.");
        closeUpgradeModal();
        signInWithGoogle();
        return;
      }
      const trx = document.getElementById('ep-trx-id').value.trim();
`;
html = html.replace(/function submitEasypaisaPayment\(\) \{\n\s*const trx = document\.getElementById\('ep-trx-id'\)\.value\.trim\(\);/, newEasypaisa);

// 4. Firestore Offline Persistence
html = html.replace(/db = firebase\.firestore\(\);/, `db = firebase.firestore();\n          db.enablePersistence({ synchronizeTabs: true }).catch(err => console.warn("Persistence error:", err));`);

// 5. Screen Wake Lock & Haptics
const wakeLockScript = `
    let wakeLock = null;
    async function enableWakeLock() {
      try {
        if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen');
      } catch (err) { console.warn('Wake Lock error:', err); }
    }
    function releaseWakeLock() {
      if (wakeLock) { wakeLock.release(); wakeLock = null; }
    }
`;
html = html.replace(/\/\/ --- UTILITIES ---/, wakeLockScript + '\n    // --- UTILITIES ---');

html = html.replace(/workout\.timerId = setInterval\(updateSimulationTick, 1000\);/g, `workout.timerId = setInterval(updateSimulationTick, 1000);\n        enableWakeLock();\n        if(navigator.vibrate) navigator.vibrate([50]);`);
html = html.replace(/clearInterval\(workout\.timerId\);/g, `clearInterval(workout.timerId);\n        releaseWakeLock();\n        if(navigator.vibrate) navigator.vibrate([50]);`);

// 6. Tabular Stat Numbers
html = html.replace(/id="hud-time"/, `id="hud-time" style="font-variant-numeric: tabular-nums;"`);
html = html.replace(/id="hud-distance"/, `id="hud-distance" style="font-variant-numeric: tabular-nums;"`);
html = html.replace(/id="hud-pace"/, `id="hud-pace" style="font-variant-numeric: tabular-nums;"`);
html = html.replace(/id="hud-steps"/, `id="hud-steps" style="font-variant-numeric: tabular-nums;"`);

// 7. High-DPI Studio Canvas Export
html = html.replace(/scale: 2/, `scale: window.devicePixelRatio || 2`);

fs.writeFileSync('index.html', html, 'utf-8');
