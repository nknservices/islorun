const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

// 1. Studio tab: first 5 templates free (change pro: true to pro: false for templates 3,4,5)
html = html.replace(/name: 'Template 3',\n\s*label: 'Monochrome Racer',\n\s*pro: true/, "name: 'Template 3',\n        label: 'Monochrome Racer',\n        pro: false");
html = html.replace(/name: 'Template 4',\n\s*label: 'Minimalist Typo',\n\s*pro: true/, "name: 'Template 4',\n        label: 'Minimalist Typo',\n        pro: false");
html = html.replace(/name: 'Template 5',\n\s*label: 'Analytics Dashboard',\n\s*pro: true/, "name: 'Template 5',\n        label: 'Analytics Dashboard',\n        pro: false");

// 2. Default to Template 1 when opening Studio
html = html.replace(/if \(tabId === 'track'\) \{/, `if (tabId === 'studio' && typeof state.selectedTemplate === 'undefined') {
        selectTemplate(0);
      }
      if (tabId === 'track') {`);

// 3. Remove Local Bypass for Pro, require Firebase verification
const newCatch = `
         }).catch(err => {
             isDone = true;
             clearTimeout(fbTimeout);
             if (err.message.includes('Missing or insufficient permissions')) {
                 el.innerText = "Transaction pending. It will activate when verified in Firebase.";
                 setTimeout(() => { closeUpgradeModal(); }, 4000);
             } else {
                 alert("Error saving transaction: " + err.message);
                 closeUpgradeModal();
             }
         });
`;
html = html.replace(/\}\)\.catch\(err => \{[\s\S]*?closeUpgradeModal\(\);\n\s*\}\);/, newCatch);


// 4. Snap Map Radar

// Replace radar canvas with snap map div
html = html.replace(/<canvas id="radar-canvas"[^>]*><\/canvas>/, '<div id="snap-radar-map" class="w-full h-full z-0"></div>');

// Remove animation toggle button
html = html.replace(/<!-- Anim Toggle -->[\s\S]*?<!-- Ghost Mode Toggle -->/, '<!-- Ghost Mode Toggle -->');

// Replace switchTab('radar') logic
const snapRadarLogic = `
      if (tabId === 'radar') {
        state.radarScanning = true;
        const overlay = document.getElementById('radar-searching-overlay');
        if (overlay) {
          overlay.classList.remove('hidden');
          overlay.style.opacity = '1';
          
          if(typeof snapMarkers !== 'undefined') {
              snapMarkers.forEach(m => snapMap.removeLayer(m));
              snapMarkers = [];
          }
          
          setTimeout(() => {
            overlay.style.opacity = '0';
            setTimeout(() => { overlay.classList.add('hidden'); }, 1000);
            state.radarScanning = false;
            
            if (typeof initSnapMap === 'function') initSnapMap();
          }, 2500);
        }
      }
`;
html = html.replace(/if \(tabId === 'radar'\) \{[\s\S]*?if \(typeof initRadarLoop === 'function'\) initRadarLoop\(\);\n\s*\}, 2500\);\n\s*\}\n\s*\}/, snapRadarLogic.trim());

// Add Snap Map Engine
const snapMapScript = `
    let snapMap = null;
    let snapMarkers = [];

    function initSnapMap() {
        if (!snapMap) {
            snapMap = L.map('snap-radar-map', { zoomControl: false, attributionControl: false });
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
              maxZoom: 19
            }).addTo(snapMap);
        }
        
        let center = [33.7294, 73.0931]; // Default Islamabad
        if(state.currentWorkout && state.currentWorkout.path && state.currentWorkout.path.length > 0) {
            const last = state.currentWorkout.path[state.currentWorkout.path.length-1];
            center = [last.lat, last.lng];
        } else if (typeof map !== 'undefined' && map) {
            center = map.getCenter();
        }
        
        snapMap.setView(center, 15);
        snapMap.invalidateSize();
        
        spawnSnapMarkers(center);
    }
    
    function openRunnerProfileById(id) {
       const runner = mockRunners.find(r => r.id === id);
       if(runner) openRunnerProfile(runner);
    }

    function spawnSnapMarkers(center) {
        if(state.ghostMode) return;
        
        // Add user marker
        const userImg = document.getElementById('profile-user-img');
        const userSrc = userImg ? userImg.src : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80';
        
        const userIcon = L.divIcon({
          className: 'snap-marker-user',
          html: \`<div class="w-12 h-12 rounded-full border-[3px] border-green-500 overflow-hidden shadow-[0_0_20px_rgba(34,197,94,0.6)] bg-zinc-900"><img src="\${userSrc}" class="w-full h-full object-cover"></div><div class="text-[9px] font-black text-center mt-1 text-green-400 drop-shadow-md">YOU</div>\`,
          iconSize: [48, 60],
          iconAnchor: [24, 24]
        });
        snapMarkers.push(L.marker(center, {icon: userIcon, zIndexOffset: 1000}).addTo(snapMap));

        // Add dummy runners around the center
        mockRunners.forEach(r => {
           const latOffset = (Math.random() - 0.5) * 0.015;
           const lngOffset = (Math.random() - 0.5) * 0.015;
           
           const icon = L.divIcon({
              className: 'snap-marker-bot',
              html: \`<div class="w-10 h-10 rounded-full border-[3px] border-brandAccent overflow-hidden shadow-[0_0_15px_rgba(236,72,153,0.5)] cursor-pointer bg-zinc-900 hover:scale-110 transition-transform pointer-events-auto" onclick="openRunnerProfileById(\${r.id})"><img src="\${r.avatar}" class="w-full h-full object-cover"></div><div class="text-[9px] font-black text-center mt-1 text-white drop-shadow-md">\${r.name}</div>\`,
              iconSize: [40, 60],
              iconAnchor: [20, 20]
           });
           
           snapMarkers.push(L.marker([center[0] + latOffset, center[1] + lngOffset], {icon: icon}).addTo(snapMap));
        });
    }
`;

// Remove the old canvas animation code securely
html = html.replace(/function initRadarLoop\(\) \{[\s\S]*?function toggleGhostMode\(\) \{/, snapMapScript + '\\n    function toggleGhostMode() {');

// Ghost mode toggle should re-spawn or clear snap markers instead of drawing canvas
html = html.replace(/drawRadarCanvas\(\);/, \`if(state.activeTab === 'radar') {
        snapMarkers.forEach(m => snapMap.removeLayer(m));
        snapMarkers = [];
        if(!state.ghostMode && snapMap) {
           spawnSnapMarkers([snapMap.getCenter().lat, snapMap.getCenter().lng]);
        }
      }\`);

fs.writeFileSync('index.html', html, 'utf-8');
