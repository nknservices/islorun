const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

// 1. Fix the hanging payment request timeout
const paymentFix = `
      let isDone = false;
      let fbTimeout = setTimeout(() => {
          if(isDone) return;
          el.innerText = "Transaction queued! It will upload when network stabilizes.";
          setTimeout(() => { closeUpgradeModal(); }, 3000);
      }, 5000);

      if (db && state.userSession) {
         db.collection('payments').add({
             uid: state.userSession.uid,
             email: state.userSession.email,
             trxId: trx,
             status: 'pending',
             timestamp: firebase.firestore.FieldValue.serverTimestamp()
         }).then(() => {
             isDone = true;
             clearTimeout(fbTimeout);
             el.innerText = "Payment Received! Please allow 1-12 hours for manual verification.";
             setTimeout(() => { closeUpgradeModal(); }, 4000);
         }).catch(err => {
             isDone = true;
             clearTimeout(fbTimeout);
             alert("Error saving transaction: " + err.message);
             closeUpgradeModal();
         });
      } else {
`;

// Replace the old payment logic
html = html.replace(/let fbTimeout = setTimeout\(\(\) => \{[\s\S]*?\} else \{/, paymentFix);


// 2. Add BLE Sync Card and Add to Home Screen Button to Profile Tab
const additionalCardsHtml = `
        <!-- Add to Home Screen Button -->
        <button onclick="if(typeof triggerPWAInstall === 'function') triggerPWAInstall()" class="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 select-none">
          <i data-lucide="download-cloud" class="w-4 h-4"></i>
          Install App to Home Screen
        </button>

        <!-- BLE Sync Card -->
        <div class="bg-brandCard border border-zinc-900 rounded-3xl p-5 flex flex-col gap-3 select-none">
          <div class="flex items-center gap-2 mb-1">
            <i data-lucide="bluetooth" class="w-4 h-4 text-blue-500"></i>
            <span class="font-extrabold text-sm tracking-wider text-white">Device Sync</span>
          </div>
          <p class="text-[10px] text-zinc-500 leading-relaxed">Connect a compatible Smart Watch or BLE Heart Rate Monitor to log your live BPM data.</p>
          <button onclick="if(typeof connectBluetoothWatch === 'function') { connectBluetoothWatch() } else { alert('Bluetooth Web API not supported on this browser/device.') }" class="mt-2 w-full py-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/30 font-black text-xs uppercase hover:bg-blue-500/20 transition-colors">
            Connect BLE Watch
          </button>
        </div>

        <!-- Pro Upgrade paywall card -->`;

html = html.replace(/<!-- Pro Upgrade paywall card -->/, additionalCardsHtml);


fs.writeFileSync('index.html', html, 'utf-8');
