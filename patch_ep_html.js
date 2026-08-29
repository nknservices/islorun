const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf-8');

const easypaisaHtml = `
    <!-- PRO Upgrade Dialog -->
    <dialog id="upgrade-modal" class="modal bg-transparent p-0 w-full max-w-sm rounded-[30px] overflow-hidden outline-none border-none z-[1100]">
      <div class="bg-brandCard border border-zinc-800 rounded-[30px] p-6 shadow-2xl flex flex-col gap-5 text-white relative">
        <!-- Header -->
        <div class="flex justify-between items-start">
          <div class="flex flex-col gap-1">
            <h2 class="text-xl font-black text-brandAccent uppercase tracking-widest flex items-center gap-1.5">
              <i data-lucide="crown" class="w-5 h-5"></i>
              islorun PRO
            </h2>
            <p class="text-xs text-zinc-400">Unlock private tracking & advanced studio templates.</p>
          </div>
          <button onclick="closeUpgradeModal()" class="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-all">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

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
        
        <!-- Processing Simulation -->
        <div class="hidden flex-col items-center justify-center py-8 gap-4 select-none" id="payment-stage-processing">
          <i data-lucide="loader-2" class="w-8 h-8 text-brandAccent animate-spin"></i>
          <span class="text-xs font-bold text-zinc-300 tracking-wider text-center" id="processing-timer">Processing Transaction...</span>
        </div>
      </div>
    </dialog>
`;

html = html.replace(/<dialog id="upgrade-modal"[\s\S]*?<\/dialog>/, easypaisaHtml);

fs.writeFileSync('index.html', html, 'utf-8');
