const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf-8');

const replacementAuth = `
        // Listen for real Firebase auth states
        auth.onAuthStateChanged((user) => {
          if (user) {
            const session = { email: user.email, name: user.displayName || user.email.split('@')[0], uid: user.uid };
            localStorage.setItem('islorun_user', JSON.stringify(session));
            state.userSession = session;
            
            // Fetch PRO status from DB
            db.collection('users').doc(user.uid).get().then(doc => {
               if (doc.exists && doc.data().isPro === true) {
                   localStorage.setItem('islorun_pro', 'true');
               } else {
                   localStorage.removeItem('islorun_pro');
               }
               loadProStatus();
            });

          } else {
            localStorage.removeItem('islorun_user');
            localStorage.removeItem('islorun_pro');
            state.userSession = null;
            loadProStatus();
          }
          checkAuthStatus();
        });
`;

html = html.replace(/auth\.onAuthStateChanged\(\(user\) => \{[\s\S]*?checkAuthStatus\(\);\s*\}\);/, replacementAuth);

fs.writeFileSync('index.html', html, 'utf-8');
