const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf-8');

// The best way is to find the exact index of "function old_drawTrackCanvas" and work backwards.

const searchString = `    } catch(err) { console.error("Map Error:", err); }
    function old_drawTrackCanvas() {`;

const searchStringWindows = `    } catch(err) { console.error("Map Error:", err); }\r\n    function old_drawTrackCanvas() {`;

let replaced = html.replace(searchString, `    } catch(err) { console.error("Map Error:", err); }\n    }\n\n    function old_drawTrackCanvas() {`);
replaced = replaced.replace(searchStringWindows, `    } catch(err) { console.error("Map Error:", err); }\n    }\n\n    function old_drawTrackCanvas() {`);

// Also need to remove the extra closing brace from BEFORE the catch block.
// Original buggy:
//      }
//    }
//    
//    } catch(err)
replaced = replaced.replace(/      \}\r?\n    \}\r?\n\r?\n    \} catch\(err\)/, `      }\n    } catch(err)`);
replaced = replaced.replace(/      \}\n    \}\n\n    \} catch\(err\)/, `      }\n    } catch(err)`);

fs.writeFileSync('index.html', replaced, 'utf-8');
