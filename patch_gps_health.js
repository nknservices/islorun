const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

const oldWatch = `}, (err) => console.log(err), { enableHighAccuracy: true });`;
const newWatch = `}, (err) => {
              console.log(err);
              if(err.code === 1) {
                  alert("GPS Permission Denied. If you are on an iPhone and using the installed app, Apple restricts GPS access for privacy. Please go to your iPhone Settings > Privacy & Security > Location Services, and ensure Safari/Websites have location access enabled.");
              } else {
                  alert("GPS Error: " + err.message);
              }
          }, { enableHighAccuracy: true });`;

html = html.replace(oldWatch, newWatch);


const oldSettingsMenu = `<button onclick="window.open('https://github.com/nknservices/islorun', '_blank')" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between hover:border-zinc-700 transition-colors">
              <div class="flex items-center gap-3">
                <i data-lucide="github" class="w-5 h-5 text-zinc-400"></i>
                <span class="text-sm font-bold text-zinc-300">Open Source</span>
              </div>
              <i data-lucide="chevron-right" class="w-4 h-4 text-zinc-600"></i>
            </button>`;

const syncBtn = `<button onclick="alert('Web browsers (like Safari/Chrome) are strictly sandboxed by Apple and Google for your privacy, meaning Web Apps cannot directly read your Apple Health or Google Fit database.\\n\\nTo sync live fitness data, please use the \\'Connect BLE Watch\\' button above to link a Bluetooth Smartwatch, or wait for our native iOS/Android companion app release!')" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between hover:border-zinc-700 transition-colors">
              <div class="flex items-center gap-3">
                <i data-lucide="activity" class="w-5 h-5 text-zinc-400"></i>
                <span class="text-sm font-bold text-zinc-300">Sync Apple Health / Google Fit</span>
              </div>
              <i data-lucide="chevron-right" class="w-4 h-4 text-zinc-600"></i>
            </button>
            ` + oldSettingsMenu;

html = html.replace(oldSettingsMenu, syncBtn);


fs.writeFileSync('index.html', html, 'utf-8');
