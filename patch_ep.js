const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf-8');

const easypaisaHtml = `
        <!-- Easypaisa Form -->
        <div class="flex flex-col gap-4 select-none" id="payment-stage-easypaisa">
          <div class="flex justify-between items-center">
            <span class="text-xs font-bold text-zinc-405 flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-[#1da846]"></span> Easypaisa Gateway
            </span>
          </div>
          
          <div class="bg-[#1da846]/10 border border-[#1da846]/30 p-4 rounded-xl text-center flex flex-col gap-2">
             <span class="text-[10px] font-bold text-zinc-400 uppercase">Send Rs. 500 to:</span>
             <span class="text-xl font-black text-[#1da846]">03365005815</span>
             <span class="text-sm font-bold text-zinc-200">Naseem khan</span>
          </div>

          <div class="flex flex-col gap-3">
            <div class="flex flex-col gap-1">
              <label class="text-[9px] font-bold text-zinc-555 uppercase">Transaction ID (TRX ID)</label>
              <input type="text" id="ep-trx-id" placeholder="Enter Easypaisa TRX Reference" class="w-full bg-zinc-905 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brandAccent">
            </div>
          </div>

          <button onclick="submitEasypaisaPayment()" class="w-full py-3 rounded-xl bg-[#1da846] hover:bg-[#158735] text-white font-black text-xs uppercase tracking-wider shadow-lg transition-all">
            Submit TRX for Verification
          </button>
        </div>
`;

// Find the modal content and replace it
html = html.replace(/<div class="flex flex-col gap-3 select-none" id="payment-stage-selection">[\s\S]*?<!-- Processing Simulation -->/, easypaisaHtml + '\n        <!-- Processing Simulation -->');

const jsLogic = `
    function openUpgradeModal() {
      document.getElementById('payment-stage-easypaisa').classList.remove('hidden');
      document.getElementById('payment-stage-processing').classList.add('hidden');
      document.getElementById('payment-stage-success').classList.add('hidden');
      document.getElementById('upgrade-modal').showModal();
    }

    function submitEasypaisaPayment() {
      const trx = document.getElementById('ep-trx-id').value.trim();
      if (trx.length < 5) return alert("Enter a valid Easypaisa Transaction reference ID.");
      
      document.getElementById('payment-stage-easypaisa').classList.add('hidden');
      document.getElementById('payment-stage-processing').classList.remove('hidden');
      
      const el = document.getElementById('processing-timer');
      el.innerText = "Sending TRX to database for verification...";

      if (db && state.userSession) {
         db.collection('payments').add({
             uid: state.userSession.uid,
             email: state.userSession.email,
             trxId: trx,
             status: 'pending',
             timestamp: firebase.firestore.FieldValue.serverTimestamp()
         }).then(() => {
             el.innerText = "Payment Received! Please allow a few hours for our team to verify your transaction.";
             setTimeout(() => { closeUpgradeModal(); }, 4000);
         }).catch(err => {
             alert("Error saving transaction: " + err.message);
             closeUpgradeModal();
         });
      } else {
         el.innerText = "You must be logged in to upgrade!";
         setTimeout(() => { closeUpgradeModal(); }, 2000);
      }
    }
`;

// Replace the old simulate logic
html = html.replace(/function openUpgradeModal\(\) \{[\s\S]*?applySuccessfulPro\(\);\s*\}\s*\}, 1200\);\s*\}/, jsLogic);

fs.writeFileSync('index.html', html, 'utf-8');
