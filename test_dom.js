const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const html = fs.readFileSync('index.html', 'utf-8');

const dom = new JSDOM(html, { runScripts: "dangerously", resources: "usable" });

dom.window.addEventListener("error", (event) => {
  console.error("Uncaught JS error in DOM:", event.error);
  process.exit(1);
});

setTimeout(() => {
    console.log("No errors caught in 3 seconds.");
    process.exit(0);
}, 3000);
