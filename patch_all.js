const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf-8');

// 1. Boot Sequence & Auth
const onboardingHtml = `
    <!-- Onboarding Dialog -->
    <dialog id="onboarding-modal" class="modal bg-transparent p-0 w-full max-w-sm rounded-[30px] overflow-hidden outline-none border-none z-[1100]">
      <div class="bg-brandCard border border-zinc-800 rounded-[30px] p-6 shadow-2xl flex flex-col gap-4 text-white relative">
        <h2 class="text-xl font-black text-brandAccent text-center">Welcome to islorun</h2>
        <p class="text-[10px] text-zinc-400 text-center">Sign in to sync your stats securely across devices.</p>
        
        <div class="flex flex-col gap-2.5 mt-2">
            <button onclick="signInWithGoogle()" class="w-full py-3 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-2">
               <svg class="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
               Google
            </button>
            <button onclick="signInWithApple()" class="w-full py-3 rounded-2xl bg-black border border-zinc-700 text-white font-black text-xs uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-2">
               <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12c0-5.523-4.477-10-10-10z"/></svg>
               Apple
            </button>
        </div>

        <div class="flex items-center gap-2 my-2">
            <div class="h-px bg-zinc-800 flex-1"></div>
            <span class="text-[10px] text-zinc-500 font-bold">OR</span>
            <div class="h-px bg-zinc-800 flex-1"></div>
        </div>
        
        <form id="onboarding-form" onsubmit="saveOnboardingProfile(event)" class="flex flex-col gap-3">
          <input type="text" id="ob-name" placeholder="Name" required class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brandAccent">
          
          <div class="grid grid-cols-2 gap-3">
            <input type="number" id="ob-age" placeholder="Age" required class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brandAccent">
            <select id="ob-gender" required class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brandAccent appearance-none">
              <option value="" disabled selected>Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div class="grid grid-cols-2 gap-3">
            <input type="number" id="ob-height" placeholder="Height (cm)" required class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brandAccent">
            <input type="number" id="ob-weight" placeholder="Weight (kg)" required class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brandAccent">
          </div>
          
          <button type="submit" class="w-full mt-2 py-3.5 rounded-2xl bg-zinc-800 text-white font-black text-xs uppercase tracking-widest shadow-lg hover:brightness-110 active:scale-98 transition-all">
            Continue Offline
          </button>
        </form>
      </div>
    </dialog>
`;
html = html.replace(/<dialog id="onboarding-modal"[\s\S]*?<\/dialog>/, onboardingHtml);

// Fix Boot Sequence JS
const bootLogic = `
    function checkLegalConsent() {
      if (localStorage.getItem('islorun_consent_accepted') === 'true') {
        document.getElementById('legal-consent-overlay').classList.add('hidden');
        checkOnboarding();
      }
    }

    function acceptLegalConsent() {
      localStorage.setItem('islorun_consent_accepted', 'true');
      document.getElementById('legal-consent-overlay').classList.add('hidden');
      checkOnboarding();
    }
`;
html = html.replace(/function checkLegalConsent\(\) \{[\s\S]*?function acceptLegalConsent\(\) \{[\s\S]*?document\.getElementById\('legal-consent-overlay'\)\.classList\.add\('hidden'\);\s*\}/, bootLogic);
// Remove the checkOnboarding call from onload, checkLegalConsent will handle it
html = html.replace("checkLegalConsent(); checkOnboarding(); // check profile", "checkLegalConsent();");

// Add Firebase Auth Providers logic
const authProvidersJs = `
    function signInWithGoogle() {
        if (!auth) return alert("Firebase not initialized.");
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider).then(() => {
            document.getElementById('onboarding-modal').close();
        }).catch(err => alert(err.message));
    }
    function signInWithApple() {
        if (!auth) return alert("Firebase not initialized.");
        const provider = new firebase.auth.OAuthProvider('apple.com');
        auth.signInWithPopup(provider).then(() => {
            document.getElementById('onboarding-modal').close();
        }).catch(err => alert("Apple Login requires a paid Apple Developer Account to be configured in Firebase.\\nError: " + err.message));
    }
`;
html = html.replace("function saveOnboardingProfile(e) {", authProvidersJs + "\n    function saveOnboardingProfile(e) {");

// 2. Maps (Leaflet Light mode and Apple Blue line)
html = html.replace("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png");
html = html.replace(/color:\s*'#ec4899',\s*weight:\s*5/, "color: '#007AFF', weight: 6");

// 3. Studio UI
html = html.replace(
  /<div id="studio-canvas" class="w-full aspect-\[9\/16\] bg-\[#141418\] rounded-2xl relative overflow-hidden shadow-lg select-none">/,
  `<div id="studio-canvas" class="h-[60vh] max-h-[600px] w-auto aspect-[9/16] bg-[#141418] rounded-2xl relative overflow-hidden shadow-lg select-none mx-auto shrink-0">`
);

// 4. Easypaisa Fix
html = html.replace(
  /<input type="text" id="ep-trx-id" placeholder="Enter Easypaisa TRX Reference" class="w-full bg-zinc-905 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brandAccent">/,
  `<input type="text" id="ep-trx-id" placeholder="Enter Easypaisa TRX Reference" class="w-full bg-white border-2 border-zinc-300 rounded-xl px-3 py-2 text-sm text-black font-black placeholder-zinc-400 focus:outline-none focus:border-[#1da846]">`
);

fs.writeFileSync('index.html', html, 'utf-8');
