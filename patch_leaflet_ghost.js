const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

// 1. Leaflet Invalidate Size
// Add invalidateSize() right after hud is unhidden in toggleTracking
html = html.replace(/hud\.classList\.add\('flex'\);/g, `hud.classList.add('flex');\n        if (typeof map !== 'undefined' && map) setTimeout(() => { map.invalidateSize(); }, 150);`);
html = html.replace(/document\.getElementById\('active-workout-screen'\)\.classList\.add\('flex'\);/g, `document.getElementById('active-workout-screen').classList.add('flex');\n        if (typeof map !== 'undefined' && map) setTimeout(() => { map.invalidateSize(); }, 150);`);

// 2. Exact uppercase Ghost ON / OFF
html = html.replace(/Ghost: On/g, 'Ghost: ON');
html = html.replace(/Ghost: Off/g, 'Ghost: OFF');
html = html.replace(/<span id="ghost-mode-text">Ghost: OFF<\/span>/, '<span id="ghost-mode-text">Ghost: OFF</span>'); // verify replacement

fs.writeFileSync('index.html', html, 'utf-8');
