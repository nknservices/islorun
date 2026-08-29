const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

html = html.replace(/renderWorkoutHistory\(\);/g, '');

fs.writeFileSync('index.html', html, 'utf-8');
