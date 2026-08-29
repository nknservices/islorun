const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

const switchTabStr = `
    function switchTab(tabId) {
      if(state.isTracking && tabId !== 'track') {
        alert("Please pause or end your workout first!");
        return;
      }
      
      // Update nav buttons
      document.querySelectorAll('.nav-item').forEach(b => {
        b.classList.remove('text-brandAccent');
        b.classList.add('text-zinc-500');
      });
      const activeBtn = document.getElementById('nav-' + tabId);
      if (activeBtn) {
        activeBtn.classList.remove('text-zinc-500');
        activeBtn.classList.add('text-brandAccent');
      }
      
      // Hide all tabs
      const tabs = ['track', 'radar', 'leaderboard', 'studio', 'settings'];
      tabs.forEach(t => {
        const el = document.getElementById('tab-' + t);
        if (el) el.classList.add('hidden');
      });
      
      // Show active tab
      const activeTab = document.getElementById('tab-' + tabId);
      if (activeTab) activeTab.classList.remove('hidden');
      
      if (tabId === 'track') drawTrackCanvas();
    }
`;

// Insert it right after saveWorkouts
html = html.replace(/function saveWorkouts\(\) \{[\s\S]*?\}\r?\n/, `$&` + switchTabStr);

fs.writeFileSync('index.html', html, 'utf-8');
