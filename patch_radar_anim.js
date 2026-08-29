const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

// 1. Change dummy text to just say "Locating active runners..."
html = html.replace(/Locating dummy bots and active runners/, 'Locating active runners...');

// 2. Increase dummy bots from 3 to 5
html = html.replace(/generateNearbyRunners\(3\)/, 'generateNearbyRunners(5)');

// 3. Add initRadarLoop() to the switchTab logic so the animation actually runs
const radarStartScript = `
            // Spawn 5 dummy bots instantly
            generateNearbyRunners(5);
            if (typeof initRadarLoop === 'function') initRadarLoop();
`;
html = html.replace(/\/\/ Spawn 3 dummy bots instantly\s*generateNearbyRunners\(3\);/, radarStartScript);

// Add the on/off button for animation in the UI
const animToggleHtml = `
            <div class="flex items-center gap-2 pointer-events-auto">
              <!-- Anim Toggle -->
              <button id="radar-anim-toggle" onclick="toggleRadarAnim()" class="px-2.5 py-1 rounded-lg border border-zinc-800 bg-zinc-900 text-[10px] font-bold text-zinc-400 hover:text-white transition-all flex items-center gap-1">
                <i data-lucide="radio" class="w-3 h-3" id="radar-anim-icon"></i>
                <span id="radar-anim-text">Sweep: ON</span>
              </button>
              <!-- Ghost Mode Toggle -->
              <button id="ghost-mode-toggle" onclick="toggleGhostMode()" class="px-2.5 py-1 rounded-lg border border-zinc-800 bg-zinc-900 text-[10px] font-bold text-zinc-400 hover:text-white transition-all flex items-center gap-1">
`;

// Find the ghost mode toggle and replace it to include the new button wrapping
html = html.replace(/<!-- Ghost Mode Toggle -->\s*<button id="ghost-mode-toggle"[^>]*>[\s\S]*?<\/button>/, animToggleHtml + '\n                <i data-lucide="eye" class="w-3 h-3" id="ghost-mode-icon"></i>\n                <span id="ghost-mode-text">Ghost: OFF</span>\n              </button>\n            </div>');

// Remove the standalone ghost mode toggle div if it was wrapped differently
html = html.replace(/<div class="bg-brandCard\/90 backdrop-blur-md px-4 py-2\.5 rounded-xl border border-zinc-800 flex justify-between items-center shadow-lg pointer-events-auto">\s*<div class="flex items-center gap-2">\s*<span class="flex h-2\.5 w-2\.5 relative">[\s\S]*?<\/span>\s*<span class="text-xs font-bold">Social Radar \(Nearby\)<\/span>\s*<\/div>\s*<div class="flex items-center gap-2 pointer-events-auto">/, `<div class="bg-brandCard/90 backdrop-blur-md px-4 py-2.5 rounded-xl border border-zinc-800 flex justify-between items-center shadow-lg pointer-events-auto">
            <div class="flex items-center gap-2">
              <span class="flex h-2.5 w-2.5 relative">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-brandAccent opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-brandAccent"></span>
              </span>
              <span class="text-xs font-bold">Social Radar (Nearby)</span>
            </div>
            <div class="flex items-center gap-2 pointer-events-auto">`);


// Add toggleRadarAnim function and state
const animToggleScript = `
    let radarAnimEnabled = true;
    function toggleRadarAnim() {
      radarAnimEnabled = !radarAnimEnabled;
      const icon = document.getElementById('radar-anim-icon');
      const text = document.getElementById('radar-anim-text');
      
      if (radarAnimEnabled) {
        icon.setAttribute('data-lucide', 'radio');
        text.innerText = 'Sweep: ON';
        initRadarLoop();
      } else {
        icon.setAttribute('data-lucide', 'circle-off');
        text.innerText = 'Sweep: OFF';
        if (radarAnimationId) {
          cancelAnimationFrame(radarAnimationId);
          radarAnimationId = null;
        }
      }
      lucide.createIcons();
    }
`;
html = html.replace(/\/\/ --- UTILITIES ---/, animToggleScript + '\n    // --- UTILITIES ---');

// Modify renderLoop to respect radarAnimEnabled
html = html.replace(/if \(state\.activeTab === 'radar'\) \{/g, `if (state.activeTab === 'radar' && radarAnimEnabled) {`);

fs.writeFileSync('index.html', html, 'utf-8');
