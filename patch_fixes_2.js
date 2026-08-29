const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf-8');

// 1. Completely rewrite the JS auth and apple button removal safely
html = html.replace(/<button onclick="signInWithApple\(\)"[\s\S]*?<\/button>/, "");
html = html.replace(/function signInWithApple\(\) \{[\s\S]*?\}\s*window\.saveOnboardingProfile/, "window.saveOnboardingProfile");

const googleSignInLogic = `
    function signInWithGoogle() {
        if (!auth) return alert("Firebase not initialized.");
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider).then((result) => {
            const user = result.user;
            const profile = {
                name: user.displayName || "Runner",
                age: 25,
                gender: "other",
                height: 170,
                weight: 70
            };
            localStorage.setItem('islorun_profile', JSON.stringify(profile));
            document.getElementById('onboarding-modal').close();
            checkOnboarding();
        }).catch(err => alert("Google Login Error: " + err.message));
    }
`;
html = html.replace(/function signInWithGoogle\(\) \{[\s\S]*?\}\s*window\.saveOnboardingProfile/, googleSignInLogic + "\n    window.saveOnboardingProfile");

// 2. Fix the switchTab and maps. Wait, why would switchTab fail?
// In switchTab(tabId), it calls drawTrackCanvas().
// If L is undefined, drawTrackCanvas() throws!
// Let's wrap drawTrackCanvas body in try/catch!
html = html.replace(/function drawTrackCanvas\(\) \{/, `function drawTrackCanvas() {
      try {`);
html = html.replace(/function old_drawTrackCanvas\(\) \{/, `} catch(err) { console.error("Map Error:", err); }
    function old_drawTrackCanvas() {`);

// 3. Wrap window.onload try/catch properly (I might have unbalanced brackets!)
html = html.replace(/window\.onload = function\(\) \{\s*try \{\s*lucide\.createIcons\(\);/, `window.onload = function() {
      try {
      if (typeof lucide !== 'undefined') lucide.createIcons();`);

fs.writeFileSync('index.html', html, 'utf-8');
