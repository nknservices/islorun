const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

// 1. Legal page only first time (prevent flash)
html = html.replace(/<div id="legal-consent-overlay" class="fixed/g, '<div id="legal-consent-overlay" class="hidden fixed');
const legalLogic = `
    function checkLegalConsent() {
      if (localStorage.getItem('islorun_consent_accepted') !== 'true') {
        document.getElementById('legal-consent-overlay').classList.remove('hidden');
      } else {
        const splash = document.getElementById('splash-screen');
        if (splash) splash.remove();
        checkOnboarding();
      }
    }
`;
html = html.replace(/function checkLegalConsent\(\) \{[\s\S]*?checkOnboarding\(\);\s*\}/, legalLogic);

// 2. Pro for 3 days
const trialLogic = `
    function loadProStatus() {
      let isTrial = false;
      const trialEnd = localStorage.getItem('islorun_trial_end');
      if (trialEnd && Date.now() < parseInt(trialEnd)) {
         isTrial = true;
      }
      state.isPro = (localStorage.getItem('islorun_pro') === 'true') || isTrial;
`;
html = html.replace(/function loadProStatus\(\) \{\s*state\.isPro = localStorage\.getItem\('islorun_pro'\) === 'true';/, trialLogic);

// Set trial in saveOnboardingProfile
html = html.replace(/localStorage\.setItem\('islorun_profile', JSON\.stringify\(profile\)\);/, `
        localStorage.setItem('islorun_profile', JSON.stringify(profile));
        if (!localStorage.getItem('islorun_trial_end')) {
            localStorage.setItem('islorun_trial_end', Date.now() + 3*24*60*60*1000);
        }
        setTimeout(triggerPWAInstall, 1000);`);

// Set trial in Google Login
html = html.replace(/localStorage\.setItem\('islorun_profile', JSON\.stringify\(profile\)\);/, `
            localStorage.setItem('islorun_profile', JSON.stringify(profile));
            if (!localStorage.getItem('islorun_trial_end')) {
                localStorage.setItem('islorun_trial_end', Date.now() + 3*24*60*60*1000);
            }
            setTimeout(triggerPWAInstall, 1000);`);

// 3. Stop workout routes back to track picker
html = html.replace(/workoutResetUI\(\);\s*switchTab\('studio'\);/, `workoutResetUI();\n        switchTab('track');`);

// 4. Add to home screen PWA Logic
const pwaLogic = `
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
    });
    function triggerPWAInstall() {
      if (deferredPrompt) {
         deferredPrompt.prompt();
         deferredPrompt.userChoice.then(() => { deferredPrompt = null; });
      }
    }
`;
html = html.replace(/const state = \{/, pwaLogic + '\n    const state = {');

// 5. Easypaisa Firebase timeout and error handling
html = html.replace(/const el = document\.getElementById\('processing-timer'\);\s*el\.innerText = "Sending TRX to database for verification\.\.\.";\s*if \(db && state\.userSession\) \{/, `
      const el = document.getElementById('processing-timer');
      el.innerText = "Sending TRX to database for verification...";

      let fbTimeout = setTimeout(() => {
          el.innerText = "Network slow... still trying...";
      }, 5000);

      if (db && state.userSession) {`);

html = html.replace(/\}\)\.then\(\(\) => \{\s*el\.innerText = "Payment Received!/, `}).then(() => {
             clearTimeout(fbTimeout);
             el.innerText = "Payment Received!`);

html = html.replace(/\}\)\.catch\(err => \{\s*alert\("Error saving transaction: " \+ err\.message\);/, `}).catch(err => {
             clearTimeout(fbTimeout);
             alert("Error saving transaction: " + err.message);`);

// 6. Dummy people in Radar and Radar on by default
// Radar on by default in state
html = html.replace(/ghostMode: false,/, 'ghostMode: true,');
html = html.replace(/<input type="checkbox" id="radar-toggle"/, '<input type="checkbox" id="radar-toggle" checked');

// Inject dummy people in Radar Tab HTML
html = html.replace(/<div class="absolute w-3 h-3 bg-white rounded-full"><\/div>\s*<div class="absolute w-3 h-3 bg-white rounded-full animate-ping"><\/div>/, `
            <div class="absolute w-3 h-3 bg-white rounded-full"></div>
            <div class="absolute w-3 h-3 bg-white rounded-full animate-ping"></div>
            <!-- DUMMY PEOPLE -->
            <div class="absolute w-2 h-2 bg-brandAccent rounded-full top-[20%] left-[30%] shadow-[0_0_10px_#ec4899]"></div>
            <div class="absolute w-2 h-2 bg-brandAccent rounded-full top-[70%] left-[60%] shadow-[0_0_10px_#ec4899]"></div>
            <div class="absolute w-2 h-2 bg-brandAccent rounded-full top-[40%] right-[20%] shadow-[0_0_10px_#ec4899]"></div>
            <div class="absolute w-2 h-2 bg-brandAccent rounded-full bottom-[15%] right-[40%] shadow-[0_0_10px_#ec4899]"></div>
`);

fs.writeFileSync('index.html', html, 'utf-8');
