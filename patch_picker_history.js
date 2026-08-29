const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

const historyHtml = `
          <!-- Previous Records -->
          <div class="mt-4 shrink-0">
            <h3 class="text-sm font-black tracking-tight mb-3">Previous Records</h3>
            <div id="picker-history-list" class="flex flex-col gap-2 max-h-[150px] overflow-y-auto pr-1">
              <!-- History items injected here -->
            </div>
          </div>
`;

html = html.replace(/(<!-- Bottom Actions -->)/, historyHtml + '\n          $1');

const renderPickerHistory = `
    function renderPickerHistory() {
      const list = document.getElementById('picker-history-list');
      if (!list) return;
      if (!state.workouts || state.workouts.length === 0) {
        list.innerHTML = '<div class="text-xs text-zinc-500 text-center py-4 bg-zinc-900/50 rounded-xl">No previous records found.</div>';
        return;
      }
      list.innerHTML = state.workouts.map(w => \`
        <div class="bg-brandCard border border-zinc-800 rounded-xl p-3 flex justify-between items-center cursor-pointer hover:border-brandAccent transition-colors" onclick="loadStudioFromHistory(\${w.id})">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400">
              <i data-lucide="\${w.mode === 'cycling' ? 'bike' : w.mode === 'walking' ? 'accessibility' : w.mode === 'hiking' ? 'mountain' : 'footprints'}" class="w-4 h-4"></i>
            </div>
            <div class="flex flex-col">
              <span class="text-xs font-bold capitalize">\${w.mode} • \${w.date}</span>
              <span class="text-[10px] text-zinc-500">\${w.distance} km in \${w.time}</span>
            </div>
          </div>
          <i data-lucide="chevron-right" class="w-4 h-4 text-zinc-600"></i>
        </div>
      \`).join('');
      lucide.createIcons();
    }

    function loadStudioFromHistory(id) {
      const w = state.workouts.find(x => x.id === id);
      if (w) {
        state.activeStudioWorkout = w;
        switchTab('studio');
      }
    }
`;

html = html.replace(/\/\/ --- UTILITIES ---/, renderPickerHistory + '\n    // --- UTILITIES ---');

// Hook it into saveWorkouts and init load
html = html.replace(/localStorage\.setItem\('islorun_workouts', JSON\.stringify\(state\.workouts\)\);/g, "localStorage.setItem('islorun_workouts', JSON.stringify(state.workouts));\n      if(typeof renderPickerHistory !== 'undefined') renderPickerHistory();");

// Add initial call to renderPickerHistory in window.onload or init
html = html.replace(/if \(savedWorkouts\) \{[\s\S]*?\}/, `if (savedWorkouts) {
        state.workouts = JSON.parse(savedWorkouts);
      }
      if(typeof renderPickerHistory !== 'undefined') renderPickerHistory();`);

fs.writeFileSync('index.html', html, 'utf-8');
