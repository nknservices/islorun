const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

const pedometerScript = `
    // --- PEDOMETER / SENSORS ---
    let lastStepTime = 0;
    function handleMotion(event) {
      if (!state.currentWorkout || !state.currentWorkout.isActive || state.currentWorkout.isPaused || state.isGPSSimulation) return;
      if (state.workoutMode === 'cycling') return;
      
      const acc = event.accelerationIncludingGravity || event.acceleration;
      if (!acc || acc.x === null) return;
      
      const magnitude = Math.sqrt(acc.x*acc.x + acc.y*acc.y + acc.z*acc.z);
      if (magnitude > 11.8 && (Date.now() - lastStepTime > 320)) {
        state.currentWorkout.steps++;
        document.getElementById('hud-steps').innerText = state.currentWorkout.steps;
        lastStepTime = Date.now();
      }
    }

    function requestSensorPermissions() {
      if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
        DeviceMotionEvent.requestPermission().then(permissionState => {
          if (permissionState === 'granted') {
            window.addEventListener('devicemotion', handleMotion);
          }
        }).catch(console.error);
      } else {
        window.addEventListener('devicemotion', handleMotion);
      }
    }
`;

html = html.replace(/\/\/ --- UTILITIES ---/, pedometerScript + '\n    // --- UTILITIES ---');

// Hook requestSensorPermissions into toggleTracking
html = html.replace(/w\.isActive = true;/g, `w.isActive = true;\n        requestSensorPermissions();`);

fs.writeFileSync('index.html', html, 'utf-8');
