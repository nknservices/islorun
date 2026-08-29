const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

// 1. Move Splash Screen hiding to the very bottom outside of window.onload so it ALWAYS runs
const splashHider = `
    // Failsafe: Hide Splash screen after 2.5 seconds regardless of window.onload
    setTimeout(() => {
      const splash = document.getElementById('splash-screen');
      if (splash) {
        splash.classList.add('opacity-0');
        setTimeout(() => splash.remove(), 500);
      }
    }, 2500);
`;
// Remove from window.onload
html = html.replace(/\/\/ Hide Splash screen after 2\.2 seconds[\s\S]*?\}, 2200\);/, "");
// Append to the bottom
html = html.replace(/<\/script>\s*<\/body>\s*<\/html>/i, splashHider + "\n</script>\n</body>\n</html>");

// 2. Wrap window.onload in try-catch to prevent freezes
html = html.replace(/window\.onload = function\(\) \{/, `window.onload = function() {
      try {`);
html = html.replace(/navigator\.serviceWorker\.register\('\.\/sw\.js'\)\.catch\(err => console\.log\('SW registration failed:', err\)\);\s*\}/, `navigator.serviceWorker.register('./sw.js').catch(err => console.log('SW registration failed:', err));
      }
      } catch(e) { console.error("Onload error:", e); }`);

// 3. Remove Apple Button
html = html.replace(/<button onclick="signInWithApple\(\)"[\s\S]*?<\/button>/, "");
html = html.replace(/function signInWithApple\(\) \{[\s\S]*?\}\s*function saveOnboardingProfile/, "function saveOnboardingProfile");

// 4. Improve Google Sign-in to automatically set the profile name
const googleSignInLogic = `
    function signInWithGoogle() {
        if (!auth) return alert("Firebase not initialized.");
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider).then((result) => {
            const user = result.user;
            // Auto-fill profile from Google
            const profile = {
                name: user.displayName || "Runner",
                age: 25,
                gender: "other",
                height: 170,
                weight: 70
            };
            localStorage.setItem('islorun_profile', JSON.stringify(profile));
            
            document.getElementById('onboarding-modal').close();
            checkOnboarding(); // Update UI
        }).catch(err => alert(err.message));
    }
`;
html = html.replace(/function signInWithGoogle\(\) \{[\s\S]*?\}\s*function saveOnboardingProfile/, googleSignInLogic + "\n    function saveOnboardingProfile");

fs.writeFileSync('index.html', html, 'utf-8');
