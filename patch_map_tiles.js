const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf-8');

// The current tile is:
// L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
// Let's replace it with OpenStreetMap standard
html = html.replace(/https:\/\/{s}\.basemaps\.cartocdn\.com\/light_all\/{z}\/{x}\/{y}{r}\.png/, "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png");

fs.writeFileSync('index.html', html, 'utf-8');
