import json

with open("index.html", "r", encoding="utf-8") as f:
    html = f.read()

firebase_config_str = """
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
"""

# Replace the old loadFirebaseConfig function or just append it before closing script tag
if "initFirebase(JSON.stringify(hardcodedFirebaseConfig));" not in html:
    html = html.replace("</script>\n  </body>\n</html>", firebase_config_str + "\n</script>\n  </body>\n</html>")

with open("index.html", "w", encoding="utf-8") as f:
    f.write(html)
