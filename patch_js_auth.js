const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

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

html = html.replace("window.saveOnboardingProfile = function(e) {", authProvidersJs + "\n    window.saveOnboardingProfile = function(e) {");

fs.writeFileSync('index.html', html, 'utf-8');
