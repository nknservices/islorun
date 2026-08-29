const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf-8');

// 1. Fix switchTab logic to use .active class instead of .hidden
html = html.replace(/const tabs = \['track', 'radar', 'leaderboard', 'studio', 'settings'\];\r?\n\s*tabs\.forEach\(t => \{\r?\n\s*const el = document\.getElementById\('tab-' \+ t\);\r?\n\s*if \(el\) el\.classList\.add\('hidden'\);\r?\n\s*\}\);\r?\n\s*\r?\n\s*\/\/ Show active tab\r?\n\s*const activeTab = document\.getElementById\('tab-' \+ tabId\);\r?\n\s*if \(activeTab\) activeTab\.classList\.remove\('hidden'\);/,
`const tabs = ['track', 'radar', 'leaderboard', 'studio', 'settings'];
      tabs.forEach(t => {
        const el = document.getElementById('tab-' + t);
        if (el) {
          el.classList.remove('active');
          el.classList.add('hidden'); // fail safe
        }
      });
      
      // Show active tab
      const activeTab = document.getElementById('tab-' + tabId);
      if (activeTab) {
        activeTab.classList.add('active');
        activeTab.classList.remove('hidden');
      }`);

// 2. Fix Map invalidation so Leaflet isn't distorted
// Look for `if (tabId === 'track') drawTrackCanvas();`
html = html.replace(/if \(tabId === 'track'\) drawTrackCanvas\(\);/,
`if (tabId === 'track') {
        drawTrackCanvas();
        if (typeof map !== 'undefined' && map) {
          setTimeout(() => { map.invalidateSize(); }, 100);
        }
      }`);

fs.writeFileSync('index.html', html, 'utf-8');
