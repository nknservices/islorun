const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

// 1. Redirect stopTracking to 'track'
html = html.replace(/workoutResetUI\(\);\n\s*switchTab\('studio'\);/g, "workoutResetUI();\n        switchTab('track');");

// 2. Replace Auth Panel with Google-only Sign In
const googleBtnHtml = `
        <div id="auth-panel" class="bg-brandCard border border-zinc-900 rounded-3xl p-5 flex flex-col gap-4 select-none">
          <div class="flex justify-between items-center border-b border-zinc-800 pb-3">
            <span class="font-extrabold text-sm uppercase text-brandAccent tracking-wider flex items-center gap-1.5">
              <i data-lucide="shield-check" class="w-4 h-4"></i> Sign In to Sync
            </span>
            <span class="text-[9px] text-zinc-555 font-mono font-bold" id="auth-connection-status">⚡ Local Mode</span>
          </div>

          <div class="flex flex-col gap-3 text-center">
            <p class="text-[10px] text-zinc-400">Sign in with Google to sync your stats across devices and claim your PRO trial.</p>
            <button onclick="signInWithGoogle()" class="w-full py-3 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-2">
               <svg class="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
               Sign in with Google
            </button>
          </div>
        </div>
`;
html = html.replace(/<div id="auth-panel"[\s\S]*?<!-- Authenticated Profile Card -->/, googleBtnHtml + '\n        <!-- Authenticated Profile Card -->');

// 3. Add Bluetooth button to Profile Card
const bleBtnHtml = `
            <button onclick="connectBluetoothWatch()" class="w-full py-2.5 rounded-xl bg-blue-500/20 border border-blue-500/50 text-[10px] font-black uppercase tracking-wider text-blue-400 hover:bg-blue-500 hover:text-white transition-all flex justify-center items-center gap-2">
              <i data-lucide="watch" class="w-3.5 h-3.5"></i> Connect BLE Watch
            </button>
`;
html = html.replace(/(<button onclick="openUpgradeModal\(\)".*?<\/button>)/, `$1\n${bleBtnHtml}`);

// 4. Add BPM to HUD
const bpmHtml = `
              <!-- BPM -->
              <div class="bg-brandDark/80 backdrop-blur-md rounded-2xl p-3 border border-zinc-800/50 flex flex-col items-center">
                <i data-lucide="heart-pulse" class="w-4 h-4 text-red-500 mb-1"></i>
                <span class="text-lg font-black tracking-tighter" id="hud-bpm">--</span>
                <span class="text-[8px] uppercase tracking-wider text-zinc-500">BPM</span>
              </div>
`;
html = html.replace(/(<!-- Calories -->[\s\S]*?<\/div>)/, `$1\n${bpmHtml}`);

// 5. Add Bluetooth Logic
const bleScript = `
    // --- BLUETOOTH HEART RATE SENSOR ---
    let bleDevice = null;
    let bleServer = null;
    let hrCharacteristic = null;

    async function connectBluetoothWatch() {
      if (!navigator.bluetooth) {
        alert("Web Bluetooth API is not supported in this browser. Please use Chrome on Android/Desktop.");
        return;
      }
      try {
        const device = await navigator.bluetooth.requestDevice({
          filters: [{ services: ['heart_rate'] }],
          optionalServices: ['battery_service']
        });
        bleDevice = device;
        device.addEventListener('gattserverdisconnected', onDisconnected);
        const server = await device.gatt.connect();
        bleServer = server;
        const service = await server.getPrimaryService('heart_rate');
        hrCharacteristic = await service.getCharacteristic('heart_rate_measurement');
        await hrCharacteristic.startNotifications();
        hrCharacteristic.addEventListener('characteristicvaluechanged', handleHRMeasurement);
        alert("Successfully connected to " + device.name + "! Live BPM active.");
      } catch(error) {
        console.log(error);
        if (error.name !== 'NotFoundError') {
          alert("Bluetooth connection failed: " + error.message);
        }
      }
    }

    function onDisconnected(event) {
      alert("Watch disconnected! Please reconnect.");
      document.getElementById('hud-bpm').innerText = "--";
    }

    function handleHRMeasurement(event) {
      const value = event.target.value;
      const flags = value.getUint8(0);
      const rate16Bits = flags & 0x1;
      let heartRate;
      if (rate16Bits) {
        heartRate = value.getUint16(1, true);
      } else {
        heartRate = value.getUint8(1);
      }
      document.getElementById('hud-bpm').innerText = heartRate;
    }
`;
html = html.replace(/\/\/ --- UTILITIES ---/, bleScript + '\n    // --- UTILITIES ---');

fs.writeFileSync('index.html', html, 'utf-8');
