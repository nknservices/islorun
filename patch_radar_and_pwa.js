const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

// 1. Fix the radar crash by removing generateNearbyRunners and using state.radarScanning
html = html.replace(/const oldRunners = \[\.\.\.nearbyRunners\];\s*nearbyRunners = \[\];/, 'state.radarScanning = true;');

html = html.replace(/\/\/ Spawn 5 dummy bots instantly\s*generateNearbyRunners\(5\);/, 'state.radarScanning = false;');

html = html.replace(/if \(!state\.ghostMode\) \{/, 'if (!state.ghostMode && !state.radarScanning) {');


// 2. Add PWA Install trigger to fire on app load (instead of just login)
const pwaOnloadTrigger = `
      // Check for standalone mode (PWA installed)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || ('standalone' in window.navigator && window.navigator.standalone);
      if (!isStandalone) {
        setTimeout(() => {
          if (typeof triggerPWAInstall === 'function') {
            triggerPWAInstall();
          }
        }, 3000); // Prompt 3 seconds after opening app
      }
`;

// Insert into init function
html = html.replace(/function init\(\) \{/, 'function init() {\n' + pwaOnloadTrigger);


fs.writeFileSync('index.html', html, 'utf-8');
