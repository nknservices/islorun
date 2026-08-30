const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

// 1. Update submitEasypaisaPayment to bypass on Permissions Error
const newCatch = `
         }).catch(err => {
             isDone = true;
             clearTimeout(fbTimeout);
             if (err.message.includes('Missing or insufficient permissions')) {
                 el.innerText = "Payment Received (Local Bypass)! Upgraded to PRO.";
                 state.isPro = true;
                 localStorage.setItem('islorun_pro', 'true');
                 setTimeout(() => { closeUpgradeModal(); }, 2000);
             } else {
                 alert("Error saving transaction: " + err.message);
                 closeUpgradeModal();
             }
         });
`;
html = html.replace(/\}\)\.catch\(err => \{[\s\S]*?closeUpgradeModal\(\);\n\s*\}\);/, newCatch);


// 2. Change loadStudioFromHistory to loadMapFromHistory
html = html.replace(/loadStudioFromHistory\(\$\{w\.id\}\)/g, 'loadMapFromHistory(${w.id})');

const viewOnMapScript = `
    function loadMapFromHistory(id) {
      const w = state.workouts.find(x => x.id === id);
      if (w) {
        state.activeStudioWorkout = w;
        
        // Push stats to HUD
        document.getElementById('hud-time').innerText = w.time;
        document.getElementById('hud-distance').innerText = w.distance;
        document.getElementById('hud-pace').innerText = w.pace;
        document.getElementById('hud-steps').innerText = w.steps;
        document.getElementById('hud-calories').innerText = w.calories;
        
        // Show HUD and hide picker
        document.getElementById('workout-picker-screen').classList.add('hidden');
        const hud = document.getElementById('active-workout-screen');
        hud.classList.remove('hidden');
        hud.classList.add('flex');
        
        // Set state to force draw
        const oldState = { ...state.currentWorkout };
        state.currentWorkout = { ...w, isActive: true, isPaused: true }; 
        drawTrackCanvas(); 
        if (typeof map !== 'undefined' && map) setTimeout(() => { map.invalidateSize(); }, 150);

        // Replace action buttons with View Mode buttons
        const actionOverlay = document.querySelector('#active-workout-screen .absolute.bottom-4.left-0.right-0');
        actionOverlay.innerHTML = \`
          <button onclick="closeMapHistoryView()" class="h-12 w-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-all shadow-lg active:scale-95 cursor-pointer">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
          <button onclick="switchTab('studio')" class="h-14 px-6 rounded-full bg-brandAccent hover:bg-brandActive flex items-center justify-center text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-brandAccent/30 transition-transform active:scale-95 cursor-pointer gap-2">
            <i data-lucide="image" class="w-5 h-5"></i>
            Studio Overlay
          </button>
        \`;
        lucide.createIcons();
        
        window.closeMapHistoryView = function() {
           state.currentWorkout = oldState;
           workoutResetUI();
           actionOverlay.innerHTML = \`
              <button id="btn-start" onclick="toggleTracking()" class="h-14 w-14 rounded-full bg-yellow-500 hover:bg-yellow-600 flex items-center justify-center text-white shadow-lg shadow-yellow-500/20 transition-transform active:scale-95">
                <i id="btn-start-icon" data-lucide="pause" class="w-6 h-6 fill-white"></i>
              </button>
              <button id="btn-stop" onclick="stopTracking()" class="h-12 w-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-red-500 hover:text-red-400 hover:border-red-900 shadow-lg transition-transform active:scale-95 cursor-pointer">
                <i data-lucide="square" class="w-5 h-5 fill-current"></i>
              </button>
           \`;
           lucide.createIcons();
        }
        
        switchTab('track');
      }
    }
`;

html = html.replace(/function loadStudioFromHistory\(id\) \{[\s\S]*?switchTab\('studio'\);\n\s*\}\n\s*\}/, viewOnMapScript);


fs.writeFileSync('index.html', html, 'utf-8');
