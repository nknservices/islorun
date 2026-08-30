const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

// Lower the pedometer threshold from 11.8 to 10.8 to be more sensitive to walking
html = html.replace(/if \(magnitude > 11\.8 && \(Date\.now\(\) - lastStepTime > 320\)\) \{/, 'if (magnitude > 10.8 && (Date.now() - lastStepTime > 320)) {');

// Fallback to acceleration if accelerationIncludingGravity is missing
html = html.replace(/const acc = event\.accelerationIncludingGravity \|\| event\.acceleration;/, `const acc = event.accelerationIncludingGravity || event.acceleration;`);

fs.writeFileSync('index.html', html, 'utf-8');
