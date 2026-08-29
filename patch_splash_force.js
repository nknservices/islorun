const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

const bootLogic = `
    function checkLegalConsent() {
      if (localStorage.getItem('islorun_consent_accepted') === 'true') {
        document.getElementById('legal-consent-overlay').classList.add('hidden');
        const splash = document.getElementById('splash-screen');
        if (splash) splash.remove();
        checkOnboarding();
      }
    }

    function acceptLegalConsent() {
      localStorage.setItem('islorun_consent_accepted', 'true');
      document.getElementById('legal-consent-overlay').classList.add('hidden');
      const splash = document.getElementById('splash-screen');
      if (splash) splash.remove();
      checkOnboarding();
    }
`;
html = html.replace(/function checkLegalConsent\(\) \{[\s\S]*?function acceptLegalConsent\(\) \{[\s\S]*?checkOnboarding\(\);\s*\}/, bootLogic);

fs.writeFileSync('index.html', html, 'utf-8');
