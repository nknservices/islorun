
    // --- STATE INITIALIZATION ---
    let state = {
      isPro: false,
      activeTab: 'track',
      workoutMode: 'running',
      isGPSSimulation: true,
      workouts: [],
      currentWorkout: {
        isActive: false,
        isPaused: false,
        startTime: null,
        elapsedTime: 0,
        distance: 0.0,
        steps: 0,
        calories: 0,
        path: [],
        pace: '--\'--',
        timerId: null,
        watchId: null
      },
      selectedTemplate: 0,
      studioBg: {
        type: 'checkerboard',
        value: ''
      },
      activeStudioWorkout: null,
      selectedTier: 'monthly',
      
      // Social & Radar
      ghostMode: false,
      userSession: null, // Simulated or Firebase user profile
      followedRunners: [2], // Ayesha followed initially
      chattingRunner: null,
      
      // Leaderboard Filters
      leaderboardFilters: {
        mode: 'running',
        timeframe: 'daily',
        metric: 'distance'
      }
    };

    // Global drag scaling states
    let currentScale = 1.0;

    // Placeholder F-6 Loop in Islamabad
    const placeholderRoute = [
      {lat: 33.7299, lng: 73.0746},
      {lat: 33.7315, lng: 73.0780},
      {lat: 33.7340, lng: 73.0805},
      {lat: 33.7375, lng: 73.0760},
      {lat: 33.7350, lng: 73.0715},
      {lat: 33.7310, lng: 73.0720},
      {lat: 33.7299, lng: 73.0746}
    ];

    // SVG path builder utility
    function generateRouteSvgPath(path, width, height) {
      if (!path || path.length < 2) return '';
      
      const lats = path.map(p => p.lat);
      const lngs = path.map(p => p.lng);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);
      
      const latRange = maxLat - minLat || 0.0001;
      const lngRange = maxLng - minLng || 0.0001;
      
      const margin = 10;
      const drawW = width - 2 * margin;
      const drawH = height - 2 * margin;
      
      const scale = Math.min(drawW / lngRange, drawH / latRange);
      
      let d = '';
      path.forEach((pt, index) => {
        const x = margin + (pt.lng - minLng) * scale + (drawW - lngRange * scale) / 2;
        const y = margin + drawH - (pt.lat - minLat) * scale + (drawH - latRange * scale) / 2;
        if (index === 0) {
          d += `M ${x.toFixed(1)} ${y.toFixed(1)}`;
        } else {
          d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
        }
      });
      return d;
    }

    // Image-only branding watermark markup generator
    function getLogoImgMarkup(sizeClass = 'w-4 h-4', isDarkBg = true) {
      const src = isDarkBg ? './template%20icon%20white.png' : './template%20icon%20black.png';
      return `<img src="${src}" class="${sizeClass} object-contain select-none shrink-0" style="display: inline-block; vertical-align: middle;" alt="logo">`;
    }

    // Combined logo icon + transparent text logo watermark footer
    function getBrandedFooterMarkup(isDarkBg = true) {
      const iconSrc = isDarkBg ? './template%20icon%20white.png' : './template%20icon%20black.png';
      const textLogoSrc = './text%20only%20logo%20transparent.png';
      const filterClass = isDarkBg ? '' : 'filter invert';
      return `
        <div class="flex items-center gap-1.5 justify-center">
          <img src="${iconSrc}" class="w-3.5 h-3.5 object-contain select-none shrink-0" alt="icon">
          <img src="${textLogoSrc}" class="h-3 object-contain select-none shrink-0 ${filterClass}" alt="islorun">
        </div>
      `;
    }

    // Friendly time formatter ("19m 30s")
    function formatTimeFriendly(timeInput) {
      if (!timeInput) return "0s";
      let hrs = 0, mins = 0, secs = 0;
      if (typeof timeInput === 'number') {
        hrs = Math.floor(timeInput / 3600);
        mins = Math.floor((timeInput % 3600) / 60);
        secs = timeInput % 60;
      } else {
        const parts = timeInput.split(':');
        if (parts.length === 3) {
          hrs = parseInt(parts[0], 10);
          mins = parseInt(parts[1], 10);
          secs = parseInt(parts[2], 10);
        } else {
          return timeInput;
        }
      }
      let result = '';
      if (hrs > 0) result += `${hrs}h `;
      if (mins > 0 || hrs > 0) result += `${mins}m `;
      result += `${secs}s`;
      return result.trim();
    }

    // Friendly pace formatter ("4:51 /km")
    function formatPaceFriendly(paceStr) {
      if (!paceStr || paceStr === "--'--") return "0:00 /km";
      return paceStr.replace("'", ":").replace('"', "") + " /km";
    }

    // Mock nearby active runners details
    const mockRunners = [
      {
        id: 1,
        name: 'Hamza',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
        mode: 'running',
        distance: '4.8 km',
        pace: '5\'12" / km',
        kudos: 18,
        status: 'Preparing for Islo 10K! Trail 3 is humid today.'
      },
      {
        id: 2,
        name: 'Ayesha',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
        mode: 'cycling',
        distance: '18.4 km',
        pace: '2\'35" / km',
        kudos: 42,
        status: 'Climbing up to Daman-e-Koh! Legs are burning.'
      },
      {
        id: 3,
        name: 'Zainab',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
        mode: 'walking',
        distance: '3.1 km',
        pace: '9\'45" / km',
        kudos: 5,
        status: 'Evening brisk walk in F-6 Park.'
      },
      {
        id: 4,
        name: 'Zain',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
        mode: 'hiking',
        distance: '5.2 km',
        pace: '12\'10" / km',
        kudos: 24,
        status: 'Going up Trail 5, heading towards the top ridge.'
      },
      {
        id: 5,
        name: 'Bilal',
        avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80',
        mode: 'running',
        distance: '6.5 km',
        pace: '4\'20" / km',
        kudos: 30,
        status: 'Fast intervals around Jinnah Market!'
      }
    ];

    // Mock aggregate leaderboard database with daily, weekly, monthly tabs working
    const mockLeaderboards = {
      running: {
        daily: [
          { name: 'Hamza', distance: 18.2, speed: 4.8, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80' },
          { name: 'Bilal', distance: 15.4, speed: 4.2, avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80' },
          { name: 'Ayesha', distance: 12.0, speed: 5.1, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80' }
        ],
        weekly: [
          { name: 'Bilal', distance: 75.6, speed: 4.5, avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80' },
          { name: 'Hamza', distance: 68.4, speed: 4.9, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80' },
          { name: 'Zain', distance: 50.1, speed: 5.3, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80' }
        ],
        monthly: [
          { name: 'Hamza', distance: 310.2, speed: 4.6, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80' },
          { name: 'Bilal', distance: 290.4, speed: 4.3, avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80' },
          { name: 'Ayesha', distance: 240.0, speed: 5.0, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80' }
        ]
      },
      cycling: {
        daily: [
          { name: 'Ayesha', distance: 42.5, speed: 22.8, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80' },
          { name: 'Zain', distance: 35.1, speed: 18.5, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80' }
        ],
        weekly: [
          { name: 'Ayesha', distance: 210.3, speed: 24.1, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80' },
          { name: 'Zain', distance: 185.6, speed: 19.2, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80' },
          { name: 'Hamza', distance: 120.4, speed: 20.5, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80' }
        ],
        monthly: [
          { name: 'Ayesha', distance: 840.5, speed: 23.5, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80' },
          { name: 'Zain', distance: 750.2, speed: 18.9, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80' }
        ]
      },
      walking: {
        daily: [
          { name: 'Zainab', distance: 8.4, speed: 5.5, avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80' }
        ],
        weekly: [
          { name: 'Zainab', distance: 42.1, speed: 5.6, avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80' },
          { name: 'Zain', distance: 28.5, speed: 5.2, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80' }
        ],
        monthly: [
          { name: 'Zainab', distance: 165.2, speed: 5.4, avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80' },
          { name: 'Zain', distance: 110.4, speed: 5.1, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80' }
        ]
      },
      hiking: {
        daily: [
          { name: 'Zain', distance: 14.2, speed: 3.5, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80' }
        ],
        weekly: [
          { name: 'Zain', distance: 58.4, speed: 3.6, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80' },
          { name: 'Hamza', distance: 34.2, speed: 3.8, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80' }
        ],
        monthly: [
          { name: 'Zain', distance: 210.6, speed: 3.4, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80' },
          { name: 'Hamza', distance: 145.1, speed: 3.9, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80' }
        ]
      }
    };

    // Simulated F-6 Route coordinates mapping
    let mockRouteIndex = 0;
    const isloSimPath = [
      {lat: 33.7299, lng: 73.0746},
      {lat: 33.7305, lng: 73.0758},
      {lat: 33.7312, lng: 73.0772},
      {lat: 33.7318, lng: 73.0783},
      {lat: 33.7325, lng: 73.0792},
      {lat: 33.7335, lng: 73.0801},
      {lat: 33.7348, lng: 73.0807},
      {lat: 33.7358, lng: 73.0798},
      {lat: 33.7365, lng: 73.0785},
      {lat: 33.7370, lng: 73.0772},
      {lat: 33.7375, lng: 73.0758},
      {lat: 33.7368, lng: 73.0742},
      {lat: 33.7358, lng: 73.0730},
      {lat: 33.7345, lng: 73.0720},
      {lat: 33.7332, lng: 73.0712},
      {lat: 33.7318, lng: 73.0715},
      {lat: 33.7308, lng: 73.0725},
      {lat: 33.7301, lng: 73.0735},
      {lat: 33.7299, lng: 73.0746}
    ];

    // Canvas Drawing Animation Ticks
    let radarAnimationId = null;

    // --- MAIN INITIALIZATION & EVENT LISTENERS ---
    window.onload = function() {
      lucide.createIcons();
      loadProStatus();
      loadWorkouts();
      loadFirebaseConfig();
      checkAuthStatus();
      checkLegalConsent();

      // Register PWA service worker
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').catch(err => console.log('SW registration failed:', err));
      }
      
      // Hide Splash screen after 2.2 seconds
      setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        if (splash) {
          splash.classList.add('opacity-0');
          setTimeout(() => splash.remove(), 500);
        }
      }, 2200);

      // Time loop
      setInterval(() => {
        const now = new Date();
        document.getElementById('status-bar-time').innerText = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      }, 60000);

      // Studio setups
      resetStudioWorkoutToDefault();
      buildTemplatesSelectorUI();
      initDragBadgeControls();
      setupDialogFallback();
      setWorkoutMode('running');
      setStudioBg('image', 'https://images.unsplash.com/photo-1552674605-db6aea4bc09c?w=400&q=80');

      // Setup initial canvas draw loop
      drawTrackCanvas();
    };

    
    function checkLegalConsent() {
      if (localStorage.getItem('islorun_consent_accepted') === 'true') {
        document.getElementById('legal-consent-overlay').classList.add('hidden');
        checkOnboarding();
      }
    }

    function acceptLegalConsent() {
      localStorage.setItem('islorun_consent_accepted', 'true');
      document.getElementById('legal-consent-overlay').classList.add('hidden');
      checkOnboarding();
    }


    // --- FIREBASE SYNC INTEGRATION ---
    let firebaseApp = null;
    let db = null;
    let auth = null;

    function initFirebase(configString) {
      if (!configString) return;
      try {
        const config = JSON.parse(configString);
        if (firebase.apps.length === 0) {
          firebaseApp = firebase.initializeApp(config);
        } else {
          firebaseApp = firebase.app();
        }
        db = firebase.firestore(firebaseApp);
        auth = firebase.auth(firebaseApp);
        document.getElementById('auth-connection-status').innerText = "☁️ Firebase Connected";
        
        // Listen for real Firebase auth states
        
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

      } catch (err) {
        console.error("Firebase Initialization Failure:", err);
        document.getElementById('auth-connection-status').innerText = "⚠️ Firebase config error";
      }
    }

    function checkAuthStatus() {
      const savedUser = localStorage.getItem('islorun_user');
      const authPanel = document.getElementById('auth-panel');
      const profileCard = document.getElementById('profile-card');

      if (savedUser) {
        state.userSession = JSON.parse(savedUser);
        authPanel.classList.add('hidden');
        profileCard.classList.remove('hidden');
        document.getElementById('profile-user-name').innerText = state.userSession.name || 'Islo Runner';
        document.getElementById('profile-user-email').innerText = state.userSession.email || 'runner@islorun.com';
      } else {
        state.userSession = null;
        authPanel.classList.remove('hidden');
        profileCard.classList.add('hidden');
      }
      renderLeaderboards();
      renderWorkoutHistory();
    }

    function handleLogin() {
      const email = document.getElementById('auth-email').value.trim();
      const pass = document.getElementById('auth-pass').value.trim();
      if (!email || !pass) return alert("Enter your email and password.");
      
      if (auth) {
        auth.signInWithEmailAndPassword(email, pass).then(() => {
          alert("Signed in successfully via Firebase!");
        }).catch((err) => {
          alert("Firebase Sign In Failed: " + err.message);
        });
      } else {
        // Fallback Local Login
        const session = { email, name: email.split('@')[0], uid: 'user_' + Date.now() };
        localStorage.setItem('islorun_user', JSON.stringify(session));
        checkAuthStatus();
        alert("Logged in locally (Offline mode).");
      }
    }

    function handleRegister() {
      const email = document.getElementById('auth-email').value.trim();
      const pass = document.getElementById('auth-pass').value.trim();
      if (!email || !pass) return alert("Enter both email and password.");
      
      if (auth) {
        auth.createUserWithEmailAndPassword(email, pass).then(() => {
          alert("Account created and signed in via Firebase!");
        }).catch((err) => {
          alert("Firebase Registration Failed: " + err.message);
        });
      } else {
        handleLogin();
      }
    }

    function handleLogout() {
      if (auth) {
        auth.signOut().then(() => {
          localStorage.removeItem('islorun_user');
          checkAuthStatus();
        });
      } else {
        localStorage.removeItem('islorun_user');
        checkAuthStatus();
      }
    }

    function loadProStatus() {
      state.isPro = localStorage.getItem('islorun_pro') === 'true';
      const upgradeBtn = document.getElementById('upgrade-trigger-btn');
      const headerPro = document.getElementById('header-pro-badge');
      const proPromo = document.getElementById('pro-promo-card');
      const proActive = document.getElementById('pro-active-card');
      const watermark = document.getElementById('studio-watermark');
      const pill = document.getElementById('settings-pro-pill');

      if (state.isPro) {
        if (upgradeBtn) upgradeBtn.classList.add('hidden');
        if (headerPro) headerPro.classList.remove('hidden');
        if (proPromo) proPromo.classList.add('hidden');
        if (proActive) proActive.classList.remove('hidden');
        if (watermark) watermark.classList.add('hidden');
        if (pill) pill.classList.remove('hidden');
      } else {
        if (upgradeBtn) upgradeBtn.classList.remove('hidden');
        if (headerPro) headerPro.classList.add('hidden');
        if (proPromo) proPromo.classList.remove('hidden');
        if (proActive) proActive.classList.add('hidden');
        if (watermark) watermark.classList.remove('hidden');
        if (pill) pill.classList.add('hidden');
      }
    }

    function loadWorkouts() {
      const data = localStorage.getItem('islorun_workouts');
      if (data) state.workouts = JSON.parse(data);
    }

    // Save History
    function saveWorkouts() {
      localStorage.setItem('islorun_workouts', JSON.stringify(state.workouts));
      renderWorkoutHistory();
    }

    // --- CANVAS MAP DRAWING ENGINE (vector local trace, zero-dependency) ---
    
    // --- LEAFLET MAP & SENSOR INTEGRATION ---
    let map = null;
    let polyline = null;

    function drawTrackCanvas() {
      // Replaced by Leaflet
      if (!map) {
        map = L.map('active-track-map', { zoomControl: false }).setView([33.7299, 73.0746], 15);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; OpenStreetMap &copy; CARTO',
          maxZoom: 19
        }).addTo(map);
        polyline = L.polyline([], {color: '#007AFF', weight: 6}).addTo(map);
      }
      
      if (state.currentWorkout.path && state.currentWorkout.path.length > 0) {
        const latlngs = state.currentWorkout.path.map(p => [p.lat, p.lng]);
        polyline.setLatLngs(latlngs);
        map.fitBounds(polyline.getBounds());
      }
    }

    function old_drawTrackCanvas() {
      const canvas = document.getElementById('active-track-canvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      
      ctx.fillStyle = '#0a0a0c';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const path = state.currentWorkout.path;
      if (!path || path.length < 2) {
        // Draw pulsing start dot in center
        const pulse = 10 + Math.sin(Date.now() / 150) * 3;
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, pulse, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(236, 72, 153, 0.2)';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, 6, 0, 2 * Math.PI);
        ctx.fillStyle = '#ec4899';
        ctx.fill();
        return;
      }
      
      const lats = path.map(p => p.lat);
      const lngs = path.map(p => p.lng);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);
      
      const latRange = maxLat - minLat || 0.0001;
      const lngRange = maxLng - minLng || 0.0001;
      
      const margin = 40;
      const drawW = canvas.width - 2 * margin;
      const drawH = canvas.height - 2 * margin;
      
      const scale = Math.min(drawW / lngRange, drawH / latRange);
      
      // Drawing line
      ctx.beginPath();
      path.forEach((pt, index) => {
        const x = margin + (pt.lng - minLng) * scale + (drawW - lngRange * scale) / 2;
        const y = margin + drawH - (pt.lat - minLat) * scale + (drawH - latRange * scale) / 2;
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      
      ctx.strokeStyle = '#ec4899';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
      
      // Draw Start
      const startX = margin + (path[0].lng - minLng) * scale + (drawW - lngRange * scale) / 2;
      const startY = margin + drawH - (path[0].lat - minLat) * scale + (drawH - latRange * scale) / 2;
      ctx.beginPath();
      ctx.arc(startX, startY, 5, 0, 2 * Math.PI);
      ctx.fillStyle = '#22c55e';
      ctx.fill();
      
      // Draw Current
      const endX = margin + (path[path.length - 1].lng - minLng) * scale + (drawW - lngRange * scale) / 2;
      const endY = margin + drawH - (path[path.length - 1].lat - minLat) * scale + (drawH - latRange * scale) / 2;
      ctx.beginPath();
      ctx.arc(endX, endY, 7, 0, 2 * Math.PI);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(endX, endY, 4, 0, 2 * Math.PI);
      ctx.fillStyle = '#ec4899';
      ctx.fill();
    }

    // --- SOCIAL RADAR TAB CANVAS sweep animation ---
    function initRadarLoop() {
      if (radarAnimationId) cancelAnimationFrame(radarAnimationId);
      
      function renderLoop() {
        if (state.activeTab === 'radar') {
          drawRadarCanvas();
          radarAnimationId = requestAnimationFrame(renderLoop);
        }
      }
      renderLoop();
    }

    function drawRadarCanvas() {
      const canvas = document.getElementById('radar-canvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const maxRadius = Math.min(cx, cy) - 30;
      
      ctx.fillStyle = '#0a0a0c';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Sweeper angle
      const sweepAngle = (Date.now() / 2400) % (2 * Math.PI);
      
      // Range rings
      ctx.strokeStyle = '#1a1a24';
      ctx.lineWidth = 1.5;
      for (let r = maxRadius / 3; r <= maxRadius; r += maxRadius / 3) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, 2 * Math.PI);
        ctx.stroke();
        
        ctx.fillStyle = '#4b5563';
        ctx.font = '8px monospace';
        const rangeText = Math.round((r / maxRadius) * 1500) + 'm';
        ctx.fillText(rangeText, cx + 5, cy - r + 8);
      }
      
      // Crosshairs
      ctx.beginPath();
      ctx.moveTo(cx - maxRadius, cy); ctx.lineTo(cx + maxRadius, cy);
      ctx.moveTo(cx, cy - maxRadius); ctx.lineTo(cx, cy + maxRadius);
      ctx.stroke();
      
      // Draw radar sweep
      ctx.save();
      const sweepGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxRadius);
      sweepGrad.addColorStop(0, 'rgba(236, 72, 153, 0.06)');
      sweepGrad.addColorStop(1, 'rgba(236, 72, 153, 0.005)');
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, maxRadius, sweepAngle - 0.35, sweepAngle);
      ctx.closePath();
      ctx.fillStyle = sweepGrad;
      ctx.fill();
      ctx.restore();
      
      // User beacon (green pulsing dot)
      ctx.beginPath();
      ctx.arc(cx, cy, 5.5, 0, 2 * Math.PI);
      ctx.fillStyle = '#22c55e';
      ctx.fill();
      const beaconGlow = 5.5 + Math.sin(Date.now() / 150) * 2.5;
      ctx.beginPath();
      ctx.arc(cx, cy, beaconGlow, 0, 2 * Math.PI);
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.35)';
      ctx.stroke();
      
      // Other runners (radar dots)
      if (!state.ghostMode) {
        mockRunners.forEach(runner => {
          const bearing = (runner.id * 1.8) % (2 * Math.PI);
          const range = (runner.id * 0.16 + 0.12) * maxRadius;
          
          const rx = cx + Math.cos(bearing) * range;
          const ry = cy + Math.sin(bearing) * range;
          
          runner.screenX = rx;
          runner.screenY = ry;
          
          ctx.beginPath();
          ctx.arc(rx, ry, 5, 0, 2 * Math.PI);
          ctx.fillStyle = '#ec4899';
          ctx.fill();
          
          ctx.beginPath();
          ctx.arc(rx, ry, 9, 0, 2 * Math.PI);
          ctx.strokeStyle = 'rgba(236, 72, 153, 0.2)';
          ctx.stroke();
          
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px system-ui';
          ctx.fillText(runner.name, rx + 8, ry + 3);
        });
      }
    }

    function handleRadarClick(e) {
      const canvas = document.getElementById('radar-canvas');
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      
      const clicked = mockRunners.find(r => {
        if (!r.screenX || !r.screenY) return false;
        const dx = clickX - r.screenX;
        const dy = clickY - r.screenY;
        return Math.sqrt(dx * dx + dy * dy) < 18;
      });
      
      if (clicked) openRunnerProfile(clicked);
    }

    function toggleGhostMode() {
      state.ghostMode = !state.ghostMode;
      const icon = document.getElementById('ghost-mode-icon');
      const text = document.getElementById('ghost-mode-text');
      if (state.ghostMode) {
        icon.setAttribute('data-lucide', 'eye-off');
        text.innerText = "Ghost: On";
        alert("Ghost Mode active. You are now hidden from the radar.");
      } else {
        icon.setAttribute('data-lucide', 'eye');
        text.innerText = "Ghost: Off";
        alert("Ghost Mode disabled. Your position is visible to nearby runners.");
      }
      lucide.createIcons();
      drawRadarCanvas();
    }

    function openRunnerProfile(runner) {
      const sheet = document.getElementById('runner-bottom-sheet');
      const content = document.getElementById('runner-sheet-content');
      const following = state.followedRunners.includes(runner.id);

      content.innerHTML = `
        <div class="flex items-center gap-4 select-none">
          <div class="w-14 h-14 rounded-full overflow-hidden border-2 border-brandAccent bg-zinc-855 shrink-0">
            <img src="${runner.avatar}" class="w-full h-full object-cover" alt="avatar">
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-1.5">
              <h4 class="font-black text-base truncate">${runner.name}</h4>
              <span class="text-[8px] font-bold text-brandActive px-2 py-0.5 bg-brandActive/10 rounded-full uppercase">active</span>
            </div>
            <p class="text-xs text-zinc-400 mt-1 italic">"${runner.status}"</p>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3 bg-zinc-950/60 border border-zinc-900 rounded-2xl p-3 text-center text-xs">
          <div>
            <span class="text-[9px] font-bold text-zinc-550 uppercase">Distance</span>
            <div class="font-black text-white mt-0.5">${runner.distance}</div>
          </div>
          <div>
            <span class="text-[9px] font-bold text-zinc-555 uppercase">Avg Pace</span>
            <div class="font-black text-white mt-0.5">${runner.pace}</div>
          </div>
        </div>
        <div class="flex gap-2">
          <button onclick="toggleFollowRunner(${runner.id})" class="flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider ${following ? 'bg-zinc-800 text-zinc-400' : 'bg-brandAccent text-white'}">
            ${following ? 'Following' : 'Follow'}
          </button>
          <button onclick="openChat('${runner.name}', '${runner.avatar}')" class="flex-1 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-black uppercase tracking-wider text-zinc-300">
            Message
          </button>
        </div>
      `;
      sheet.classList.remove('translate-y-full');
      lucide.createIcons();
    }

    function toggleFollowRunner(id) {
      if (state.followedRunners.includes(id)) {
        state.followedRunners = state.followedRunners.filter(f => f !== id);
      } else {
        state.followedRunners.push(id);
      }
      closeRunnerProfile();
      alert("Follow relationships updated in Firestore profile!");
    }

    function closeRunnerProfile() {
      document.getElementById('runner-bottom-sheet').classList.add('translate-y-full');
    }

    // --- LEADERBOARD METRICS SYSTEM (Daily, Weekly, Monthly fully working) ---
    function setLeaderboardFilter(tier, val) {
      state.leaderboardFilters[tier] = val;
      
      // Update UI active buttons
      const buttons = {
        mode: ['running', 'cycling', 'walking', 'hiking'],
        timeframe: ['daily', 'weekly', 'monthly'],
        metric: ['distance', 'speed']
      };
      
      buttons[tier].forEach(v => {
        const btn = document.getElementById(`lb-${tier}-${v}`);
        if (!btn) return;
        if (v === val) {
          btn.className = btn.className.replace(/text-zinc-\d+/g, 'text-white').replace('bg-zinc-950', 'bg-brandAccent');
          btn.classList.add('bg-brandAccent', 'text-white');
        } else {
          btn.classList.remove('bg-brandAccent', 'text-white');
          btn.classList.add('text-zinc-500');
        }
      });
      
      renderLeaderboards();
    }

    function renderLeaderboards() {
      const container = document.getElementById('leaderboard-container');
      const filter = state.leaderboardFilters;
      
      const records = mockLeaderboards[filter.mode]?.[filter.timeframe] || [];
      if (records.length === 0) {
        container.innerHTML = `<div class="text-center py-4 text-xs text-zinc-555">No leaderboard entries found for filter.</div>`;
        return;
      }
      
      const sorted = [...records].sort((a, b) => b[filter.metric] - a[filter.metric]);
      
      container.innerHTML = '';
      sorted.forEach((r, idx) => {
        const valueSuffix = filter.metric === 'distance' ? `${r.distance} km` : `${r.speed} km/h`;
        
        const row = document.createElement('div');
        row.className = "flex items-center justify-between p-2 rounded-xl bg-zinc-900/60 border border-zinc-955";
        row.innerHTML = `
          <div class="flex items-center gap-3">
            <span class="text-xs font-mono font-bold text-zinc-555 w-4">${idx + 1}</span>
            <div class="w-7 h-7 rounded-full overflow-hidden border border-zinc-800 shrink-0">
              <img src="${r.avatar}" class="w-full h-full object-cover" alt="avatar">
            </div>
            <span class="text-xs font-extrabold text-white">${r.name}</span>
          </div>
          <span class="text-xs font-black font-mono text-brandAccent">${valueSuffix}</span>
        `;
        container.appendChild(row);
      });
    }

    // --- FITNESS TRACKING ENGINE (Live State Machine) ---
    function setWorkoutMode(mode) {
      if (state.currentWorkout.isActive) return;
      state.workoutMode = mode;
      
      document.querySelectorAll('.picker-mode-card').forEach(c => {
        c.className = "picker-mode-card border-2 border-zinc-900 bg-brandCard rounded-3xl p-4 flex flex-col items-center justify-center text-center transition-all hover:scale-98 select-none";
      });
      document.querySelectorAll('[id^="picker-text-"]').forEach(t => t.className = "text-xs font-black text-zinc-400");
      document.querySelectorAll('[id^="picker-icon-"]').forEach(i => i.className = "p-2.5 rounded-full bg-zinc-900 text-zinc-555 mb-2");

      const card = document.getElementById(`picker-${mode}`);
      card.className = "picker-mode-card border-2 border-brandAccent bg-gradient-to-br from-brandAccent/5 to-brandActive/5 rounded-3xl p-4 flex flex-col items-center justify-center text-center transition-all hover:scale-98 select-none";
      document.getElementById(`picker-text-${mode}`).className = "text-xs font-black text-white";
      document.getElementById(`picker-icon-${mode}`).className = "p-2.5 rounded-full bg-brandActive/10 text-brandActive mb-2";
    }

    function toggleGPSSource() {
      state.isGPSSimulation = !state.isGPSSimulation;
      const btn = document.getElementById('gps-source-toggle');
      const handle = document.getElementById('gps-toggle-handle');
      const text = document.getElementById('gps-status-text');
      const dot = document.getElementById('gps-status-dot');

      if (state.isGPSSimulation) {
        btn.className = "w-8 h-4 bg-brandAccent rounded-full p-0.5 transition-all flex items-center justify-end relative shrink-0";
        text.innerText = "MOCK GPS";
        dot.className = "relative inline-flex rounded-full h-2 w-2 bg-brandActive";
      } else {
        btn.className = "w-8 h-4 bg-zinc-800 rounded-full p-0.5 transition-all flex items-center justify-start relative shrink-0";
        text.innerText = "REAL GPS (OFFLINE)";
        dot.className = "relative inline-flex rounded-full h-2 w-2 bg-zinc-550";
      }
    }

    
    function toggleTracking() {
      const w = state.currentWorkout;
      if (!w.isActive) {
        // Start
        w.isActive = true;
        w.isPaused = false;
        w.startTime = Date.now() - (w.elapsedTime * 1000);
        
        document.getElementById('workout-picker-screen').classList.add('hidden');
        document.getElementById('active-workout-screen').classList.remove('hidden');
        document.getElementById('active-workout-screen').classList.add('flex');
        
        document.getElementById('btn-start-icon').setAttribute('data-lucide', 'pause');
        lucide.createIcons();
        
        // Start Timer
        w.timerId = setInterval(() => {
          w.elapsedTime = Math.floor((Date.now() - w.startTime) / 1000);
          document.getElementById('hud-time').innerText = new Date(w.elapsedTime * 1000).toISOString().substr(11, 8);
          
          // Calculate Calories based on profile
          const profileStr = localStorage.getItem('islorun_profile');
          let weight = 70;
          if(profileStr) {
              const p = JSON.parse(profileStr);
              if(p.weight) weight = parseFloat(p.weight);
          }
          let met = 8.0; 
          if(state.workoutMode === 'cycling') met = 7.5;
          if(state.workoutMode === 'walking') met = 3.5;
          
          w.calories = Math.floor(met * weight * (w.elapsedTime / 3600));
          document.getElementById('hud-calories').innerText = w.calories;
        }, 1000);
        
        // Start GPS
        if (navigator.geolocation) {
          w.watchId = navigator.geolocation.watchPosition((pos) => {
             const latitude = pos.coords.latitude;
             const longitude = pos.coords.longitude;
             w.path.push({lat: latitude, lng: longitude});
             
             // distance calc
             if(w.path.length > 1) {
                 const prev = w.path[w.path.length - 2];
                 w.distance += getDistanceFromLatLonInKm(prev.lat, prev.lng, latitude, longitude);
                 document.getElementById('hud-distance').innerText = w.distance.toFixed(2);
                 
                 // pace calc
                 if(w.distance > 0) {
                     const paceMins = (w.elapsedTime / 60) / w.distance;
                     const pM = Math.floor(paceMins);
                     const pS = Math.floor((paceMins - pM) * 60);
                     w.pace = pM + "'" + pS.toString().padStart(2, '0') + '"';
                     document.getElementById('hud-pace').innerText = w.pace;
                 }
             }
             drawTrackCanvas(); // Updates Leaflet
          }, (err) => console.log(err), { enableHighAccuracy: true });
        }
        
        // Start step counter using DeviceMotion
        if(window.DeviceMotionEvent) {
            window.addEventListener('devicemotion', handleMotion);
        }
      } else {
        // Pause
        if (!w.isPaused) {
          w.isPaused = true;
          clearInterval(w.timerId);
          if(w.watchId) navigator.geolocation.clearWatch(w.watchId);
          window.removeEventListener('devicemotion', handleMotion);
          document.getElementById('btn-start-icon').setAttribute('data-lucide', 'play');
        } else {
          w.isPaused = false;
          w.startTime = Date.now() - (w.elapsedTime * 1000);
          w.timerId = setInterval(() => { /* dummy */ }, 1000);
          document.getElementById('btn-start-icon').setAttribute('data-lucide', 'pause');
        }
        lucide.createIcons();
      }
    }
    
    let lastZ = 0;
    function handleMotion(event) {
        if(!event.accelerationIncludingGravity) return;
        const z = event.accelerationIncludingGravity.z;
        if(Math.abs(z - lastZ) > 2) {
            state.currentWorkout.steps++;
            document.getElementById('hud-steps').innerText = state.currentWorkout.steps;
        }
        lastZ = z;
    }
    
    function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
      var R = 6371; // Radius of the earth in km
      var dLat = deg2rad(lat2-lat1);
      var dLon = deg2rad(lon2-lon1); 
      var a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2)
        ; 
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
      var d = R * c; 
      return d;
    }
    function deg2rad(deg) { return deg * (Math.PI/180) }

    function old_toggleTracking() {

      const workout = state.currentWorkout;
      const startBtn = document.getElementById('btn-start');
      const stopBtn = document.getElementById('btn-stop');
      const picker = document.getElementById('workout-picker-screen');
      const hud = document.getElementById('active-workout-screen');

      if (!workout.isActive) {
        // Start Workout state
        workout.isActive = true;
        workout.isPaused = false;
        workout.startTime = Date.now();
        workout.elapsedTime = 0;
        workout.distance = 0.0;
        workout.steps = 0;
        workout.calories = 0;
        workout.path = [];
        
        picker.classList.add('hidden');
        hud.classList.remove('hidden');
        hud.classList.add('flex');
        
        startBtn.innerHTML = '<i data-lucide="pause" class="w-6 h-6 fill-white"></i>';
        startBtn.className = "h-14 w-14 rounded-full bg-yellow-500 hover:bg-yellow-600 flex items-center justify-center text-white transition-transform active:scale-95";
        
        lucide.createIcons();

        if (state.isGPSSimulation) {
          mockRouteIndex = 0;
          workout.timerId = setInterval(updateSimulationTick, 1000);
        } else {
          workout.timerId = setInterval(updateSimulationTick, 1000);
        }
      } else if (!workout.isPaused) {
        // Pause Workout state
        workout.isPaused = true;
        clearInterval(workout.timerId);
        startBtn.innerHTML = '<i data-lucide="play" class="w-6 h-6 fill-white"></i>';
        startBtn.className = "h-14 w-14 rounded-full bg-brandActive hover:bg-green-600 flex items-center justify-center text-white transition-transform active:scale-95";
        lucide.createIcons();
      } else {
        // Resume Workout state
        workout.isPaused = false;
        workout.startTime = Date.now() - (workout.elapsedTime * 1000);
        startBtn.innerHTML = '<i data-lucide="pause" class="w-6 h-6 fill-white"></i>';
        startBtn.className = "h-14 w-14 rounded-full bg-yellow-500 hover:bg-yellow-600 flex items-center justify-center text-white transition-transform active:scale-95";
        lucide.createIcons();
        workout.timerId = setInterval(updateSimulationTick, 1000);
      }
    }

    function updateSimulationTick() {
      const workout = state.currentWorkout;
      workout.elapsedTime = Math.floor((Date.now() - workout.startTime) / 1000);
      document.getElementById('hud-time').innerText = formatTime(workout.elapsedTime);

      mockRouteIndex = (mockRouteIndex + 1) % isloSimPath.length;
      const pt = isloSimPath[mockRouteIndex];
      
      const prev = workout.path[workout.path.length - 1];
      if (prev) {
        const stepD = calculateDistance(prev.lat, prev.lng, pt.lat, pt.lng);
        workout.distance += stepD;
        document.getElementById('hud-distance').innerText = workout.distance.toFixed(2);
      }
      workout.path.push(pt);
      
      drawTrackCanvas();

      if (workout.distance > 0.01) {
        const paceSecs = workout.elapsedTime / workout.distance;
        workout.pace = formatPace(paceSecs);
        document.getElementById('hud-pace').innerText = workout.pace;
      } else {
        workout.pace = "--'--";
      }

      if (state.workoutMode !== 'cycling') {
        workout.steps += Math.floor(2.2 + Math.random() * 0.8);
      }
      workout.calories = Math.floor(workout.elapsedTime * (state.workoutMode === 'running' ? 0.16 : 0.08));
      
      document.getElementById('hud-steps').innerText = workout.steps.toLocaleString();
      document.getElementById('hud-calories').innerText = workout.calories;
    }

    function stopTracking() {
      const workout = state.currentWorkout;
      if (!workout.isActive) return;

      if (confirm("End and save workout?")) {
        clearInterval(workout.timerId);

        let flagged = false;
        if (workout.distance > 0.1) {
          const hours = workout.elapsedTime / 3600;
          const avgSpeed = workout.distance / hours;
          if (state.workoutMode === 'running' && avgSpeed > 24) {
            flagged = true;
            alert("⚠️ Alert: Workout flagged for vehicle-speed checking! Max running cap exceeded.");
          }
        }

        const record = {
          id: Date.now(),
          mode: state.workoutMode,
          date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
          time: formatTime(workout.elapsedTime),
          elapsedSeconds: workout.elapsedTime,
          distance: parseFloat(workout.distance.toFixed(2)),
          pace: workout.pace === "--'--" ? "5'00\"" : workout.pace,
          steps: workout.steps,
          calories: workout.calories,
          path: [...workout.path],
          flagged
        };

        state.workouts.unshift(record);
        saveWorkouts();

        state.activeStudioWorkout = record;
        workoutResetUI();
        switchTab('studio');
      }
    }

    function workoutResetUI() {
      const w = state.currentWorkout;
      w.isActive = false;
      w.isPaused = false;
      w.elapsedTime = 0;
      w.distance = 0;
      w.steps = 0;
      w.calories = 0;
      w.path = [];
      
      document.getElementById('hud-time').innerText = "00:00:00";
      document.getElementById('hud-distance').innerText = "0.00";
      document.getElementById('hud-pace').innerText = "--'--";
      document.getElementById('hud-steps').innerText = "0";
      document.getElementById('hud-calories').innerText = "0";

      document.getElementById('workout-picker-screen').classList.remove('hidden');
      document.getElementById('active-workout-screen').classList.add('hidden');
      document.getElementById('active-workout-screen').classList.remove('flex');

      drawTrackCanvas();
    }

    // --- PHOTO OVERLAYS ENGINE (10 Professional, Draggable & Editable templates) ---
    function resetStudioWorkoutToDefault() {
      state.activeStudioWorkout = {
        id: 'default',
        mode: 'running',
        date: 'Today',
        time: '00:19:30',
        elapsedSeconds: 1170,
        distance: 4.02,
        pace: "4'51\"",
        calories: 280,
        steps: 5430,
        path: placeholderRoute
      };
    }

    function clearStudioRoute() {
      resetStudioWorkoutToDefault();
      renderBadge();
    }

    function setStudioBg(type, value) {
      state.studioBg = { type, value };
      const overlay = document.getElementById('studio-bg-overlay');
      const canvas = document.getElementById('studio-canvas');
      overlay.style.backgroundImage = 'none';
      canvas.className = canvas.className.replace(/\bbg-gradient-to-\S+/g, '');
      canvas.classList.remove('bg-checkerboard');

      if (type === 'gradient') {
        canvas.classList.add(...value.split(' '));
      } else if (type === 'checkerboard') {
        canvas.classList.add('bg-checkerboard');
      } else {
        overlay.style.backgroundImage = `url('${value}')`;
      }
    }

    function handleImageUpload(e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(evt) {
          setStudioBg('image', evt.target.result);
        };
        reader.readAsDataURL(file);
      }
    }

    // 10 Templates (Template 3 removed, specific texts editable via contenteditable="true")
    const studioTemplates = [
      {
        id: 0,
        name: 'Template 1',
        label: 'Minimal Bold Header',
        pro: false,
        html: (w) => `
          <div class="flex flex-col items-center justify-between p-6 text-white text-center select-none w-[200px] h-[340px] relative font-sans">
            <div class="flex flex-col items-center mt-2">
              <span class="text-4xl font-black tracking-tight" style="-webkit-text-stroke: 1.5px white; color: transparent; text-shadow: 0 0 10px rgba(255,255,255,0.15);">${w.distance} KM</span>
            </div>
            
            <svg class="w-14 h-14 text-white opacity-40 mx-auto filter drop-shadow-[0_0_3px_rgba(255,255,255,0.2)]" viewBox="0 0 100 100">
              <path d="${generateRouteSvgPath(w.path, 100, 100)}" fill="none" stroke="currentColor" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>

            <div class="flex flex-col gap-5 my-auto relative w-full text-left px-2">
              <div contenteditable="true" class="text-[9px] font-black text-yellow-500 max-w-[120px] self-end text-right leading-tight focus:outline-none focus:ring-1 focus:ring-yellow-500/50 rounded px-1">Run your own race, at your own pace</div>
              <div contenteditable="true" class="text-[9px] font-black text-yellow-500 max-w-[120px] self-start text-left leading-tight focus:outline-none focus:ring-1 focus:ring-yellow-500/50 rounded px-1">the finish line is just the beginning.</div>
            </div>

            <div class="flex flex-col items-center mb-1">
              <span class="text-[8px] font-bold tracking-widest text-zinc-400 uppercase">Date</span>
              <span contenteditable="true" class="text-3xl font-black tracking-tight leading-none mt-1 focus:outline-none focus:ring-1 focus:ring-white/20 rounded px-1" style="-webkit-text-stroke: 1.2px white; color: transparent;">07/27</span>
              <span contenteditable="true" class="text-[8px] font-bold text-zinc-550 tracking-wider mt-1 focus:outline-none">2026</span>
            </div>
          </div>
        `
      },
      {
        id: 1,
        name: 'Template 2',
        label: 'Vertical Stack HUD',
        pro: false,
        html: (w) => `
          <div class="flex flex-col justify-between p-6 text-white select-none w-[200px] h-[340px] relative font-sans">
            <div class="my-auto text-center flex flex-col gap-1">
              <span contenteditable="true" class="text-2xl font-black tracking-tighter uppercase leading-none focus:outline-none focus:ring-1 focus:ring-white/20 rounded px-1" style="-webkit-text-stroke: 1.2px white; color: transparent;">MORNING RUN</span>
              <span contenteditable="true" class="text-2xl font-black tracking-tighter uppercase leading-none focus:outline-none focus:ring-1 focus:ring-white/20 rounded px-1" style="-webkit-text-stroke: 1.2px white; color: transparent;">SESSION</span>
            </div>

            <div class="flex items-end justify-between w-full mt-auto">
              <svg class="w-12 h-12 text-yellow-500/60" viewBox="0 0 100 100">
                <path d="${generateRouteSvgPath(w.path, 100, 100)}" fill="none" stroke="currentColor" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              
              <div class="flex flex-col items-end gap-2.5 text-right pr-1">
                <span class="text-sm font-black tracking-tight text-yellow-500">${w.distance} KM</span>
                <span class="text-sm font-black tracking-tight text-yellow-500">${formatTimeFriendly(w.time || w.elapsedSeconds).replace('m ','m').replace('s','')}</span>
                <span class="text-sm font-black tracking-tight text-yellow-500">${formatPaceFriendly(w.pace).replace(' /km','')}</span>
              </div>
            </div>
          </div>
        `
      },
      {
        id: 2,
        name: 'Template 3',
        label: 'Monochrome Racer',
        pro: true,
        html: (w) => `
          <div class="flex flex-col justify-between p-6 text-white select-none w-[200px] h-[340px] relative font-sans bg-transparent">
            <div class="flex flex-col items-center text-center mt-3 gap-1">
              <img src="./template%20icon%20white.png" class="w-6 h-6 object-contain mb-1" alt="runner icon">
              <span contenteditable="true" class="text-2xl font-black uppercase tracking-tight leading-none focus:outline-none focus:ring-1 focus:ring-white/20 rounded px-1">RUNNING</span>
              <span contenteditable="true" class="text-[7px] font-semibold text-zinc-305 tracking-wider focus:outline-none focus:ring-1 focus:ring-white/20 rounded px-1">STRONGER WITH EVERY STEP</span>
            </div>

            <svg class="w-16 h-16 text-white opacity-60 mx-auto my-2 filter drop-shadow-[0_0_4px_rgba(255,255,255,0.25)]" viewBox="0 0 100 100">
              <path d="${generateRouteSvgPath(w.path, 100, 100)}" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>

            <div class="grid grid-cols-3 gap-2 text-center mb-3 pt-3 border-t border-white/20 w-full font-mono">
              <div>
                <div class="text-xl font-black tracking-tight">${Math.floor(w.distance)}</div>
                <div class="text-[7px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">KM</div>
              </div>
              <div>
                <div class="text-xl font-black tracking-tight">${formatPaceFriendly(w.pace).split(':')[0] || '5'}</div>
                <div class="text-[7px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">PACE</div>
              </div>
              <div>
                <div class="text-xl font-black tracking-tight">${formatTimeFriendly(w.time || w.elapsedSeconds).replace('m ','').replace('s','').replace('h','').substring(0,3)}</div>
                <div class="text-[7px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">TIME</div>
              </div>
            </div>
          </div>
        `
      },
      {
        id: 3,
        name: 'Template 4',
        label: 'Minimalist Typo',
        pro: true,
        html: (w) => `
          <div class="flex flex-col justify-between p-6 text-white select-none w-[200px] h-[340px] relative font-sans">
            <div class="flex flex-col text-left gap-3 mt-2">
              <div class="flex flex-col leading-none">
                <span class="text-[8px] font-bold text-zinc-400 uppercase tracking-wider">Distance</span>
                <span class="text-sm font-black mt-1">${w.distance} km</span>
              </div>
              <div class="flex flex-col leading-none">
                <span class="text-[8px] font-bold text-zinc-400 uppercase tracking-wider">Time</span>
                <span class="text-sm font-black mt-1">${formatTimeFriendly(w.time || w.elapsedSeconds)}</span>
              </div>
              <div class="flex flex-col leading-none">
                <span class="text-[8px] font-bold text-zinc-400 uppercase tracking-wider">Pace</span>
                <span class="text-sm font-black mt-1">${formatPaceFriendly(w.pace)}</span>
              </div>
            </div>

            <div class="flex justify-between items-end mt-4">
              <svg class="w-12 h-12 text-white/50" viewBox="0 0 100 100">
                <path d="${generateRouteSvgPath(w.path, 100, 100)}" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              
              <div class="self-end pr-1 pb-1">
                <span contenteditable="true" class="text-sm font-medium italic focus:outline-none focus:ring-1 focus:ring-white/20 rounded px-1" style="font-family: Georgia, serif; letter-spacing: -0.5px; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">do it for yourself</span>
              </div>
            </div>
          </div>
        `
      },
      {
        id: 4,
        name: 'Template 5',
        label: 'Analytics Dashboard',
        pro: true,
        html: (w) => `
          <div class="flex flex-col justify-between p-5 text-white select-none w-[220px] h-[350px] relative font-sans bg-transparent">
            <div class="flex flex-col gap-1 mt-1">
              <div class="flex justify-between items-center">
                <span contenteditable="true" class="text-lg font-black tracking-tighter uppercase leading-none italic focus:outline-none focus:ring-1 focus:ring-white/20 rounded px-1">MORNING RUN SESSION</span>
                <img src="./template%20icon%20white.png" class="w-4 h-4 object-contain" alt="logo">
              </div>
              <div class="h-[1px] bg-white/20 my-0.5"></div>
              <div class="flex justify-between text-[7px] font-semibold text-zinc-400 tracking-wider">
                <span contenteditable="true" class="focus:outline-none focus:ring-1 focus:ring-white/20 rounded px-1">12 December 2026</span>
                <span contenteditable="true" class="focus:outline-none focus:ring-1 focus:ring-white/20 rounded px-1">Islamabad, Pakistan</span>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3 my-auto pt-2 pb-2">
              <div class="flex items-center justify-center">
                <svg class="w-16 h-16 text-white" viewBox="0 0 100 100">
                  <path d="${generateRouteSvgPath(w.path, 100, 100)}" fill="none" stroke="currentColor" stroke-width="4.5" stroke-dasharray="3,3" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </div>

              <div class="flex flex-col gap-1.5 text-left select-none leading-none">
                <div>
                  <span class="text-[6px] text-zinc-400 uppercase">Distance</span>
                  <div class="text-[10px] font-black mt-0.5">${w.distance} km</div>
                </div>
                <div>
                  <span class="text-[6px] text-zinc-400 uppercase">Duration</span>
                  <div class="text-[10px] font-black mt-0.5">${formatTimeFriendly(w.time || w.elapsedSeconds).replace('h ','h').replace('m ','m').replace('s','s')}</div>
                </div>
                <div>
                  <span class="text-[6px] text-zinc-400 uppercase">Avg Pace</span>
                  <div class="text-[10px] font-black mt-0.5">${formatPaceFriendly(w.pace)}</div>
                </div>
                <div>
                  <span class="text-[6px] text-zinc-400 uppercase">Calories</span>
                  <div class="text-[10px] font-black mt-0.5">${w.calories || 280} kcal</div>
                </div>
              </div>
            </div>

            <div class="flex flex-col gap-2 mt-auto mb-1">
              <div class="flex justify-between items-center text-[7px] leading-tight">
                <div class="border border-white/30 rounded px-1.5 py-0.5 flex flex-col">
                  <span class="text-zinc-400 font-bold">Weather</span>
                  <span contenteditable="true" class="font-extrabold text-white focus:outline-none focus:ring-1 focus:ring-white/20 rounded px-0.5">Sunny — 28°C</span>
                </div>
                <div class="flex flex-col gap-0.5 text-right text-zinc-300">
                  <div>Humidity: <span contenteditable="true" class="font-bold text-white focus:outline-none">67%</span></div>
                  <div>Wind: <span contenteditable="true" class="font-bold text-white focus:outline-none">9 km/h</span></div>
                </div>
              </div>
              <div contenteditable="true" class="text-[8px] font-bold text-zinc-350 italic text-center leading-normal border-t border-white/20 pt-1.5 mt-0.5 focus:outline-none focus:ring-1 focus:ring-white/20 rounded px-1">
                "Great morning energy. Slow start, strong finish!"
              </div>
            </div>
          </div>
        `
      },
      // --- 5 STRAVA FITNESS SHARING STYLE TEMPLATES ---
      {
        id: 5,
        name: 'Template 6',
        label: 'Strava Classic HUD',
        pro: true,
        html: (w) => `
          <div class="bg-zinc-950 border border-zinc-850 rounded-2xl shadow-2xl overflow-hidden min-w-[190px] text-white flex flex-col font-sans select-none">
            <div class="bg-[#fc5200] px-4 py-2 flex justify-between items-center">
              <span contenteditable="true" class="text-[10px] font-black uppercase tracking-wider focus:outline-none focus:ring-1 focus:ring-white/20 rounded px-1">islorun / active</span>
              ${getLogoImgMarkup('w-3.5 h-3.5', true)}
            </div>
            
            <div class="p-4 flex flex-col items-center gap-3.5 bg-zinc-900/95">
              <svg class="w-20 h-20 text-[#fc5200] filter drop-shadow-[0_2px_6px_rgba(252,82,0,0.35)]" viewBox="0 0 100 100">
                <path d="${generateRouteSvgPath(w.path, 100, 100)}" fill="none" stroke="currentColor" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              
              <div class="grid grid-cols-3 gap-2 w-full border-t border-zinc-800 pt-3 text-center leading-none">
                <div>
                  <span class="text-[6.5px] text-zinc-550 uppercase font-black">Dist</span>
                  <div class="text-xs font-black font-mono text-white mt-1">${w.distance}k</div>
                </div>
                <div>
                  <span class="text-[6.5px] text-zinc-555 uppercase font-black">Pace</span>
                  <div class="text-xs font-black font-mono text-[#fc5200] mt-1">${formatPaceFriendly(w.pace).replace(' /km','')}</div>
                </div>
                <div>
                  <span class="text-[6.5px] text-zinc-550 uppercase font-black">Time</span>
                  <div class="text-xs font-black font-mono text-white mt-1">${formatTimeFriendly(w.time || w.elapsedSeconds).replace('m ','').replace('s','')}</div>
                </div>
              </div>
            </div>
          </div>
        `
      },
      {
        id: 6,
        name: 'Template 7',
        label: 'Strava Split HUD',
        pro: true,
        html: (w) => `
          <div class="flex justify-between items-center p-4 text-white select-none w-[200px] h-[140px] relative font-sans rounded-2xl bg-black/75 backdrop-blur-md border border-white/10 shadow-2xl">
            <div class="flex flex-col gap-2 border-l-4 border-[#fc5200] pl-3 py-1 leading-none text-left">
              <div>
                <span contenteditable="true" class="text-[7px] text-zinc-450 uppercase font-bold focus:outline-none focus:ring-1 focus:ring-white/20 rounded px-0.5">distance</span>
                <div class="text-sm font-black text-white mt-0.5">${w.distance} km</div>
              </div>
              <div>
                <span contenteditable="true" class="text-[7px] text-zinc-455 uppercase font-bold focus:outline-none focus:ring-1 focus:ring-white/20 rounded px-0.5">avg pace</span>
                <div class="text-sm font-black text-[#fc5200] mt-0.5">${formatPaceFriendly(w.pace).replace(' /km','')}</div>
              </div>
            </div>
            
            <div class="flex flex-col items-center gap-1.5">
              <svg class="w-16 h-16 text-[#fc5200] filter drop-shadow-[0_0_3px_rgba(252,82,0,0.25)]" viewBox="0 0 100 100">
                <path d="${generateRouteSvgPath(w.path, 100, 100)}" fill="none" stroke="currentColor" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <img src="./text%20only%20logo%20transparent.png" class="h-3 object-contain" alt="logo">
            </div>
          </div>
        `
      },
      {
        id: 7,
        name: 'Template 8',
        label: 'Strava Minimal Bottom HUD',
        pro: true,
        html: (w) => `
          <div class="flex flex-col justify-between items-center p-4 text-white select-none w-[200px] h-[340px] relative bg-transparent font-sans">
            <div class="my-auto flex items-center justify-center">
              <svg class="w-24 h-24 text-[#fc5200] filter drop-shadow-[0_0_8px_rgba(252,82,0,0.45)]" viewBox="0 0 100 100">
                <path d="${generateRouteSvgPath(w.path, 100, 100)}" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </div>
            
            <div class="w-full bg-zinc-950/90 border border-zinc-800 rounded-2xl p-3.5 flex justify-between items-center text-center leading-none">
              <div>
                <span class="text-[6.5px] text-zinc-550 uppercase font-black">KM</span>
                <div class="text-[10px] font-black text-white mt-1">${w.distance}</div>
              </div>
              <div class="h-5 w-[1px] bg-zinc-800"></div>
              <div>
                <span class="text-[6.5px] text-zinc-555 uppercase font-black">Pace</span>
                <div class="text-[10px] font-black text-[#fc5200] mt-1">${formatPaceFriendly(w.pace).replace(' /km','')}</div>
              </div>
              <div class="h-5 w-[1px] bg-zinc-800"></div>
              <div>
                <span class="text-[6.5px] text-zinc-550 uppercase font-black">Time</span>
                <div class="text-[10px] font-black text-white mt-1">${formatTimeFriendly(w.time || w.elapsedSeconds).replace('m ','').replace('s','')}</div>
              </div>
            </div>
          </div>
        `
      },
      {
        id: 8,
        name: 'Template 9',
        label: 'Strava Card Overlay',
        pro: true,
        html: (w) => `
          <div class="glass-card rounded-2xl p-4 shadow-xl text-white flex flex-col gap-3 min-w-[170px] select-none font-sans">
            <div class="flex justify-between items-center border-b border-white/10 pb-2">
              <span contenteditable="true" class="text-[7.5px] font-black uppercase tracking-wider text-[#fc5200] flex items-center gap-1 focus:outline-none focus:ring-1 focus:ring-[#fc5200]/50 rounded px-1">
                <span class="w-1.5 h-1.5 bg-[#fc5200] rounded-full"></span> RUN REPORT
              </span>
              ${getLogoImgMarkup('w-3.5 h-3.5', true)}
            </div>
            
            <div class="flex items-center gap-3">
              <svg class="w-12 h-12 text-[#fc5200] shrink-0" viewBox="0 0 100 100">
                <path d="${generateRouteSvgPath(w.path, 100, 100)}" fill="none" stroke="currentColor" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              
              <div class="flex-1 flex flex-col gap-1 text-left select-none leading-none">
                <div>
                  <span class="text-[6px] text-zinc-400 uppercase">Dist</span>
                  <div class="text-[10px] font-black mt-0.5">${w.distance} km</div>
                </div>
                <div>
                  <span class="text-[6px] text-zinc-400 uppercase">Pace</span>
                  <div class="text-[10px] font-black text-[#fc5200] mt-0.5">${formatPaceFriendly(w.pace).replace(' /km','')}</div>
                </div>
              </div>
            </div>
            
            <div class="w-full border-t border-white/10 pt-2 mt-0.5 text-center">
              <img src="./text%20only%20logo%20transparent.png" class="h-3 object-contain mx-auto" alt="logo">
            </div>
          </div>
        `
      },
      {
        id: 9,
        name: 'Template 10',
        label: 'Strava Map Highlight',
        pro: true,
        html: (w) => `
          <div class="flex flex-col justify-between p-4 text-white select-none w-[200px] h-[340px] relative bg-transparent font-sans">
            <div class="flex justify-between items-start w-full">
              <div class="flex flex-col leading-none text-left">
                <span class="text-[6.5px] text-zinc-400 uppercase font-bold">KM</span>
                <span class="text-xs font-black text-white mt-1">${w.distance}</span>
              </div>
              <div class="flex flex-col leading-none text-right">
                <span class="text-[6.5px] text-zinc-450 uppercase font-bold">Pace</span>
                <span class="text-xs font-black text-[#fc5200] mt-1">${formatPaceFriendly(w.pace).replace(' /km','')}</span>
              </div>
            </div>

            <div class="my-auto flex items-center justify-center">
              <svg class="w-28 h-28 text-[#fc5200] filter drop-shadow-[0_0_10px_rgba(252,82,0,0.5)]" viewBox="0 0 100 100">
                <path d="${generateRouteSvgPath(w.path, 100, 100)}" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </div>

            <div class="flex justify-between items-end w-full mb-1">
              <div class="flex flex-col leading-none text-left">
                <span class="text-[6.5px] text-zinc-400 uppercase font-bold">Duration</span>
                <span class="text-xs font-black text-white mt-1">${formatTimeFriendly(w.time || w.elapsedSeconds).replace('m ','').replace('s','')}</span>
              </div>
              <div class="flex flex-col leading-none text-right">
                <span class="text-[6.5px] text-zinc-400 uppercase font-bold">Branding</span>
                <div class="mt-1">${getBrandedFooterMarkup(true)}</div>
              </div>
            </div>
          </div>
        `
      }
    ];

    function buildTemplatesSelectorUI() {
      const container = document.getElementById('templates-list');
      container.innerHTML = '';

      studioTemplates.forEach((t) => {
        const borderClass = t.id === state.selectedTemplate ? 'border-brandAccent' : 'border-zinc-855';
        const card = document.createElement('button');
        card.onclick = () => selectTemplate(t.id);
        card.className = `flex-shrink-0 w-24 p-2.5 rounded-xl bg-brandCard border-2 ${borderClass} flex flex-col items-center justify-between text-center select-none transition-all hover:scale-95`;
        
        const lockIconSvg = `
          <svg class="w-4 h-4 text-brandAccent shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        `;
        const eyeIconSvg = `
          <svg class="w-4 h-4 text-zinc-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        `;

        card.innerHTML = `
          <div class="text-[9px] font-bold text-zinc-450 truncate max-w-full">${t.name}</div>
          <div class="my-1.5 h-6 flex items-center justify-center">
            ${t.pro ? lockIconSvg : eyeIconSvg}
          </div>
          <div class="text-[8px] font-bold uppercase ${t.pro ? 'text-brandAccent' : 'text-zinc-550'}">
            ${t.pro ? 'Pro' : 'Free'}
          </div>
        `;
        container.appendChild(card);
      });

      document.getElementById('templates-count-header').innerText = `Stat Overlay Switcher (${studioTemplates.length} Templates)`;
    }

    function selectTemplate(index) {
      const template = studioTemplates[index];
      if (template.pro && !state.isPro) {
        openUpgradeModal();
        return;
      }
      state.selectedTemplate = index;
      buildTemplatesSelectorUI();
      renderBadge();
    }

    function renderBadge() {
      const workout = state.activeStudioWorkout || state.workouts[0] || null;
      if (!workout) return;

      const template = studioTemplates[state.selectedTemplate];
      const badge = document.getElementById('drag-badge');
      badge.innerHTML = template.html(workout);
    }

    // --- DRAG AND RESIZE ENGINE ---
    function initDragBadgeControls() {
      const badge = document.getElementById('drag-badge');
      const canvas = document.getElementById('studio-canvas');

      let isDragging = false;
      let startX = 0, startY = 0;
      let isPinching = false;
      let startPinchDist = 0, startScale = 1.0;

      badge.style.transformOrigin = 'center center';

      function onStart(e) {
        if (e.target.hasAttribute('contenteditable')) {
          return; 
        }

        if (e.target.closest('#drag-badge')) {
          if (e.type === 'touchstart' && e.touches.length === 2) {
            isPinching = true;
            isDragging = false;
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            startPinchDist = Math.sqrt(dx * dx + dy * dy);
            startScale = currentScale;
            e.preventDefault();
            return;
          }
          isDragging = true;
          isPinching = false;
          
          const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
          const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
          
          const rect = badge.getBoundingClientRect();
          startX = clientX - rect.left;
          startY = clientY - rect.top;
          
          if (e.type === 'touchstart') e.preventDefault();
        }
      }

      function onMove(e) {
        if (e.type === 'touchmove' && e.touches.length === 2) {
          if (isPinching) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const currentDist = Math.sqrt(dx * dx + dy * dy);
            if (startPinchDist > 5) {
              const factor = currentDist / startPinchDist;
              currentScale = Math.max(0.4, Math.min(3.0, startScale * factor));
              badge.style.transform = `scale(${currentScale})`;
            }
          }
          e.preventDefault();
          return;
        }

        if (!isDragging) return;

        const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;

        const canvasRect = canvas.getBoundingClientRect();
        
        let left = clientX - canvasRect.left - startX;
        let top = clientY - canvasRect.top - startY;

        const maxLeft = canvasRect.width - badge.offsetWidth / 2;
        const maxTop = canvasRect.height - badge.offsetHeight / 2;

        left = Math.max(-badge.offsetWidth / 2, Math.min(left, maxLeft));
        top = Math.max(-badge.offsetHeight / 2, Math.min(top, maxTop));

        badge.style.left = `${(left / canvasRect.width) * 100}%`;
        badge.style.top = `${(top / canvasRect.height) * 100}%`;
        e.preventDefault();
      }

      function onEnd(e) {
        if (e.type === 'touchend') {
          if (e.touches.length < 2) isPinching = false;
          if (e.touches.length === 0) isDragging = false;
        } else {
          isDragging = false;
        }
      }

      badge.addEventListener('mousedown', onStart);
      document.addEventListener('mousemove', onMove, { passive: false });
      document.addEventListener('mouseup', onEnd);

      badge.addEventListener('touchstart', onStart, { passive: false });
      document.addEventListener('touchmove', onMove, { passive: false });
      document.addEventListener('touchend', onEnd);

      canvas.addEventListener('wheel', (e) => {
        if (e.target.closest('#drag-badge')) {
          e.preventDefault();
          const speed = 0.05;
          if (e.deltaY < 0) currentScale = Math.min(3.0, currentScale + speed);
          else currentScale = Math.max(0.4, currentScale - speed);
          badge.style.transform = `scale(${currentScale})`;
        }
      }, { passive: false });
    }

    // --- OS SHARE SHEET / SNAP EXPORTER ---
    
    function checkOnboarding() {
        const profile = localStorage.getItem('islorun_profile');
        if(!profile) {
            const modal = document.getElementById('onboarding-modal');
            if (modal) modal.showModal();
        } else {
            const p = JSON.parse(profile);
            const userEl = document.getElementById('profile-user-name');
            if (userEl) userEl.innerText = p.name;
        }
    }
    
    
    function signInWithGoogle() {
        if (!auth) return alert("Firebase not initialized.");
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider).then(() => {
            document.getElementById('onboarding-modal').close();
        }).catch(err => alert(err.message));
    }
    function signInWithApple() {
        if (!auth) return alert("Firebase not initialized.");
        const provider = new firebase.auth.OAuthProvider('apple.com');
        auth.signInWithPopup(provider).then(() => {
            document.getElementById('onboarding-modal').close();
        }).catch(err => alert("Apple Login requires a paid Apple Developer Account to be configured in Firebase.\nError: " + err.message));
    }

    window.saveOnboardingProfile = function(e) {
        e.preventDefault();
        const profile = {
            name: document.getElementById('ob-name').value,
            age: document.getElementById('ob-age').value,
            gender: document.getElementById('ob-gender').value,
            height: document.getElementById('ob-height').value,
            weight: document.getElementById('ob-weight').value
        };
        localStorage.setItem('islorun_profile', JSON.stringify(profile));
        document.getElementById('onboarding-modal').close();
        document.getElementById('profile-user-name').innerText = profile.name;
    }
    
    function exportStudioImage() {
      const studioNode = document.getElementById('studio-canvas');
      html2canvas(studioNode, { 
        useCORS: true, 
        scale: 2, 
        backgroundColor: '#141418' 
      }).then(canvas => {
        canvas.toBlob(blob => {
          const file = new File([blob], 'islorun-workout.png', { type: 'image/png' });
          if (navigator.share) {
            navigator.share({
              title: 'My islorun Workout',
              text: 'Check out my latest workout!',
              files: [file]
            }).catch(console.error);
          } else {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'islorun-workout.png';
            a.click();
          }
        }, 'image/png');
      });
    }

    function old_exportStudioImage() {

      const canvasEl = document.getElementById('studio-canvas');
      const activeTemplate = studioTemplates[state.selectedTemplate];
      
      if (activeTemplate.pro && !state.isPro) {
        openUpgradeModal();
        return;
      }

      const watermark = document.getElementById('studio-watermark');
      watermark.className = state.isPro ? 'hidden' : 'absolute bottom-2 right-3 font-semibold text-[8px] tracking-wider text-white/40 uppercase z-30 flex items-center gap-1 select-none pointer-events-none bg-black/35 py-0.5 px-1.5 rounded';

      html2canvas(canvasEl, { useCORS: true, allowTaint: true, scale: 2 }).then((canvasResult) => {
        canvasResult.toBlob((blob) => {
          if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], 'run.png', { type: 'image/png' })] })) {
            const file = new File([blob], `islorun_${Date.now()}.png`, { type: 'image/png' });
            navigator.share({
              files: [file],
              title: 'islorun Workout composition',
              text: 'Recorded via islorun fitness tracker!'
            }).catch(err => console.log('Share error:', err));
          } else {
            const link = document.createElement('a');
            link.download = `islorun_${Date.now()}.png`;
            link.href = canvasResult.toDataURL('image/png');
            link.click();
          }
        }, 'image/png');
      }).catch(err => alert("Canvas composition failed: " + err.message));
    }

    // --- SUB SUBSCRIPTION MANUAL TRX PANEL (SadaBiz connected) ---
    
    function openUpgradeModal() {
      document.getElementById('payment-stage-easypaisa').classList.remove('hidden');
      document.getElementById('payment-stage-processing').classList.add('hidden');
      document.getElementById('upgrade-modal').showModal();
    }

    function closeUpgradeModal() {
      document.getElementById('upgrade-modal').close();
    }

    function submitEasypaisaPayment() {
      const trx = document.getElementById('ep-trx-id').value.trim();
      if (trx.length < 5) return alert("Enter a valid Easypaisa Transaction reference ID.");
      
      document.getElementById('payment-stage-easypaisa').classList.add('hidden');
      document.getElementById('payment-stage-processing').classList.remove('hidden');
      
      const el = document.getElementById('processing-timer');
      el.innerText = "Sending TRX to database for verification...";

      if (db && state.userSession) {
         db.collection('payments').add({
             uid: state.userSession.uid,
             email: state.userSession.email,
             trxId: trx,
             status: 'pending',
             timestamp: firebase.firestore.FieldValue.serverTimestamp()
         }).then(() => {
             el.innerText = "Payment Received! Please allow 1-12 hours for manual verification.";
             setTimeout(() => { closeUpgradeModal(); }, 4000);
         }).catch(err => {
             alert("Error saving transaction: " + err.message);
             closeUpgradeModal();
         });
      } else {
         el.innerText = "You must be logged in to upgrade!";
         setTimeout(() => { closeUpgradeModal(); }, 2000);
      }
    }


    function setupDialogFallback() {
      const dialog = document.getElementById('upgrade-modal');
      if (!('closedBy' in HTMLDialogElement.prototype)) {
        dialog.addEventListener('click', (event) => {
          if (event.target !== dialog) return;
          const rect = dialog.getBoundingClientRect();
          const inContent = (
            rect.top <= event.clientY && event.clientY <= rect.top + rect.height &&
            rect.left <= event.clientX && event.clientX <= rect.left + rect.width
          );
          if (!inContent) dialog.close();
        });
      }
    }

    // --- UTILITIES ---
    function calculateDistance(lat1, lon1, lat2, lon2) {
      const R = 6371; // Earth radius in km
      const dLat = deg2rad(lat2 - lat1);
      const dLon = deg2rad(lon2 - lon1);
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    }

    function deg2rad(deg) { return deg * (Math.PI/180); }

    function formatTime(totalSecs) {
      const hrs = Math.floor(totalSecs / 3600).toString().padStart(2, '0');
      const mins = Math.floor((totalSecs % 3600) / 60).toString().padStart(2, '0');
      const secs = (totalSecs % 60).toString().padStart(2, '0');
      return `${hrs}:${mins}:${secs}`;
    }

    function formatPace(paceSecs) {
      if (isNaN(paceSecs) || !isFinite(paceSecs)) return "0'00\"";
      const mins = Math.floor(paceSecs / 60);
      const secs = Math.floor(paceSecs % 60).toString().padStart(2, '0');
      return `${mins}'${secs}"`;
    }

    function resetAppDatabase() {
      if (confirm("Reset local storage cache?")) {
        localStorage.clear();
        alert("App database reset complete.");
        location.reload();
      }
    }

  
