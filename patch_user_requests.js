const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

// --- 1. EDITABLE PROFILE (Name & Pic) ---
const editableProfileHtml = `
          <div class="flex items-center gap-4 w-full">
            <div class="w-12 h-12 rounded-full border border-brandAccent/30 overflow-hidden bg-zinc-850 shrink-0 relative cursor-pointer group" onclick="document.getElementById('profile-pic-upload').click()">
              <img id="profile-user-img" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80" class="w-full h-full object-cover" alt="avatar">
              <div class="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center">
                <i data-lucide="camera" class="w-4 h-4 text-white"></i>
              </div>
            </div>
            <input type="file" id="profile-pic-upload" hidden accept="image/*" onchange="handleProfilePicChange(event)">
            
            <div class="flex-1 min-w-0 flex flex-col">
              <div class="flex items-center gap-2">
                <input type="text" id="profile-user-name" class="font-extrabold text-sm truncate bg-transparent border-b border-dashed border-zinc-700 outline-none w-full max-w-[120px] text-white focus:border-brandAccent" value="Islo Runner" onblur="saveProfileEdits()">
                <span id="settings-pro-pill" class="hidden px-2 py-0.5 rounded-full bg-gradient-to-r from-brandAccent to-brandActive text-[8px] font-black uppercase text-black">PRO</span>
              </div>
              <p class="text-[10px] text-zinc-550 truncate mt-1" id="profile-user-email">runner@islorun.com</p>
            </div>
          </div>
`;

// Replace the inner HTML of the profile-card's first child
html = html.replace(/<div class="flex items-center gap-4">[\s\S]*?<\/div>\s*<\/div>\s*<button onclick="handleLogout\(\)"/, editableProfileHtml + '\n          <button onclick="handleLogout()"');


const editableProfileScript = `
    function handleProfilePicChange(e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(evt) {
          document.getElementById('profile-user-img').src = evt.target.result;
          saveProfileEdits();
        }
        reader.readAsDataURL(file);
      }
    }

    function saveProfileEdits() {
      const name = document.getElementById('profile-user-name').value.trim() || "Islo Runner";
      const img = document.getElementById('profile-user-img').src;
      
      const profileData = { name, img };
      localStorage.setItem('islorun_user_edits', JSON.stringify(profileData));
      
      // If signed into firebase, we would ideally sync here
      if (state.userSession && db) {
         db.collection('users').doc(state.userSession.uid).set({
           displayName: name,
           photoURL: img
         }, {merge: true}).catch(e => console.log("Silent error syncing profile", e));
      }
    }
    
    function loadProfileEdits() {
      const saved = localStorage.getItem('islorun_user_edits');
      if (saved) {
        const data = JSON.parse(saved);
        if (data.name) document.getElementById('profile-user-name').value = data.name;
        if (data.img) document.getElementById('profile-user-img').src = data.img;
      }
    }
`;
html = html.replace(/\/\/ --- UTILITIES ---/, editableProfileScript + '\n    // --- UTILITIES ---');

// load edits on init
html = html.replace(/if \(savedWorkouts\) \{/, `loadProfileEdits();\n      if (savedWorkouts) {`);


// --- 2. RADAR SEARCHING OVERLAY & DUMMY BOTS ---
const radarOverlayHtml = `
          <!-- Radar Canvas viewport showing relative bearings -->
          <canvas id="radar-canvas" class="w-full h-full bg-[#0a0a0c]" onclick="handleRadarClick(event)"></canvas>

          <!-- Searching Overlay -->
          <div id="radar-searching-overlay" class="absolute inset-0 z-[45] bg-[#0a0a0c]/80 backdrop-blur-sm flex flex-col items-center justify-center transition-opacity duration-1000 pointer-events-none">
            <div class="relative flex items-center justify-center w-24 h-24 mb-4">
              <span class="absolute inline-flex h-full w-full rounded-full bg-brandAccent opacity-20 animate-ping" style="animation-duration: 2s;"></span>
              <span class="absolute inline-flex h-16 w-16 rounded-full bg-brandAccent opacity-40 animate-ping" style="animation-duration: 1.5s;"></span>
              <i data-lucide="radar" class="w-8 h-8 text-brandAccent animate-pulse"></i>
            </div>
            <span class="text-brandAccent font-bold text-sm tracking-widest animate-pulse uppercase">Searching Nearby...</span>
            <span class="text-zinc-500 text-[10px] mt-2">Locating dummy bots and active runners</span>
          </div>
`;
html = html.replace(/<!-- Radar Canvas viewport showing relative bearings -->\s*<canvas id="radar-canvas" [^>]*><\/canvas>/, radarOverlayHtml);

// Trigger searching in switchTab when opening radar
const radarSearchScript = `
      if (tabId === 'radar') {
        const overlay = document.getElementById('radar-searching-overlay');
        if (overlay) {
          overlay.classList.remove('hidden');
          overlay.style.opacity = '1';
          
          // Clear current dummy bots temporarily
          const oldRunners = [...nearbyRunners];
          nearbyRunners = [];
          
          setTimeout(() => {
            overlay.style.opacity = '0';
            setTimeout(() => { overlay.classList.add('hidden'); }, 1000);
            // Spawn 3 dummy bots instantly
            generateNearbyRunners(3);
          }, 2500);
        }
      }
`;
html = html.replace(/tabs\.forEach\(t => \{[\s\S]*?el\.classList\.add\('active'\);\n\s*\}/, `tabs.forEach(t => {
        const el = document.getElementById('tab-' + t);
        if (t === tabId) {
          el.classList.add('active');
          ${radarSearchScript}
        } else {
          el.classList.remove('active');
        }
      });`);


// --- 3. BLUETOOTH BUTTON UI ---
const bluetoothBtnHtml = `
        <!-- BLE Sync Card -->
        <div class="bg-brandCard border border-zinc-900 rounded-3xl p-5 flex flex-col gap-3 select-none">
          <div class="flex items-center gap-2 mb-1">
            <i data-lucide="bluetooth" class="w-4 h-4 text-blue-500"></i>
            <span class="font-extrabold text-sm tracking-wider">Device Sync</span>
          </div>
          <p class="text-[10px] text-zinc-500 leading-relaxed">Connect a compatible Smart Watch or BLE Heart Rate Monitor to log your live BPM data.</p>
          <button onclick="connectBluetoothWatch()" class="mt-2 w-full py-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/30 font-black text-xs uppercase hover:bg-blue-500/20 transition-colors">
            Connect BLE Watch
          </button>
        </div>

        <!-- Pro Features Upgrade Header -->
`;

html = html.replace(/<!-- Pro Features Upgrade Header -->/, bluetoothBtnHtml);

fs.writeFileSync('index.html', html, 'utf-8');
