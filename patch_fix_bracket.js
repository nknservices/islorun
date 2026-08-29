const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

// The file currently has:
//     function checkLegalConsent() {
//        ...
//     }
// 
//     }
//
//     function acceptLegalConsent() {

// Fix it:
html = html.replace(/    \}\r?\n\r?\n    \}\r?\n\r?\n    function acceptLegalConsent/g, 
`    }

    function acceptLegalConsent`);

html = html.replace(/    \}\n\n    \}\n\n    function acceptLegalConsent/g, 
`    }

    function acceptLegalConsent`);

fs.writeFileSync('index.html', html, 'utf-8');
