const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

const pwaInstallScript = `
    // --- PWA INSTALLATION ---
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
    });

    function triggerPWAInstall() {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
          deferredPrompt = null;
        });
      } else {
        const isIos = () => {
          const userAgent = window.navigator.userAgent.toLowerCase();
          return /iphone|ipad|ipod/.test(userAgent);
        };
        const isInStandaloneMode = () => ('standalone' in window.navigator) && (window.navigator.standalone);
        
        if (isIos() && !isInStandaloneMode()) {
          alert("To install the app on iOS:\\nTap the Share icon at the bottom of Safari, then tap 'Add to Home Screen'.");
        }
      }
    }
`;

html = html.replace(/\/\/ --- UTILITIES ---/, pwaInstallScript + '\n    // --- UTILITIES ---');

fs.writeFileSync('index.html', html, 'utf-8');
