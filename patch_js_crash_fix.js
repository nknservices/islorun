const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

// Remove loadFirebaseConfig from onload
html = html.replace("loadFirebaseConfig();", "");

// Add hardcoded firebase config before closing script
const fbConfig = `
const hardcodedFirebaseConfig = {
  apiKey: "AIzaSyA4rapUeGlauZQltLmpBE6GKN_QAAgWU-g",
  authDomain: "islorun007.firebaseapp.com",
  projectId: "islorun007",
  storageBucket: "islorun007.firebasestorage.app",
  messagingSenderId: "762771642859",
  appId: "1:762771642859:web:f9f8e0cfe781e4e1c8e1ae",
  measurementId: "G-8CPEVSWRC5"
};
initFirebase(JSON.stringify(hardcodedFirebaseConfig));
`;

html = html.replace(/<\/script>\s*<\/body>\s*<\/html>/i, fbConfig + "\n</script>\n</body>\n</html>");

fs.writeFileSync('index.html', html, 'utf-8');
