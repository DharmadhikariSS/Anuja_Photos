/**
 * Anuja Photography — 3D Camera Rotation & Scroll Engine
 * Pure CSS 3D Transforms driven by GPU hardware acceleration & spring physics.
 */

(function () {
  const GALLERY_DATA = (typeof window !== 'undefined' && window.GALLERY_DATA) ? window.GALLERY_DATA : [];
  const CAMERA_WAYPOINTS = (typeof window !== 'undefined' && window.CAMERA_WAYPOINTS) ? window.CAMERA_WAYPOINTS : [];

class SpatialCameraApp {
  constructor() {
    // DOM Elements
    this.viewport = document.getElementById('viewport');
    this.cameraRig = document.getElementById('camera-rig');
    this.cameraRot = document.getElementById('camera-rot');
    this.cameraPos = document.getElementById('camera-pos');
    this.world = document.getElementById('world');
    this.scrollContainer = document.getElementById('scroll-container');
    
    // HUD Elements
    this.trackFill = document.getElementById('track-fill');
    this.progressPct = document.getElementById('progress-pct');
    this.activeChapterName = document.getElementById('active-chapter-name');
    this.activeChapterSub = document.getElementById('active-chapter-sub');
    this.coordReadout = document.getElementById('coord-readout');
    this.waypointPills = document.querySelectorAll('.waypoint-pill-btn');
    this.btnTour = document.getElementById('btn-tour');
    this.btnOrbitMode = document.getElementById('btn-orbit-mode');
    this.btnAudio = document.getElementById('btn-audio');
    this.orbitBanner = document.getElementById('orbit-banner');
    this.radarCone = document.getElementById('radar-cone');
    this.radarDeg = document.getElementById('radar-deg');
    this.focalBtns = document.querySelectorAll('.focal-btn');

    // 2D Editorial Placard Elements (Studio Service Showcase)
    this.placard = document.getElementById('editorial-placard');
    this.placardBadge = document.getElementById('placard-badge');
    this.placardSeries = document.getElementById('placard-series');
    this.placardLocation = document.getElementById('placard-location');
    this.placardMarathi = document.getElementById('placard-marathi');
    this.placardTitle = document.getElementById('placard-title');
    this.placardDesc = document.getElementById('placard-desc');
    this.placardQuote = document.getElementById('placard-quote');
    this.placardClient = document.getElementById('placard-client');
    this.placardDeliverables = document.getElementById('placard-deliverables');
    this.placardWaBtn = document.getElementById('placard-wa-btn');
    this.placardExpandBtn = document.getElementById('placard-expand-btn');

    // Expandable Service Detail Drawer Elements
    this.placardToggleArea = document.getElementById('placard-toggle-area');
    this.placardDetailDrawer = document.getElementById('placard-detail-drawer');
    this.detailBadge = document.getElementById('detail-badge');
    this.detailCloseBtn = document.getElementById('detail-close-btn');
    this.detailMarathi = document.getElementById('detail-marathi');
    this.detailTitle = document.getElementById('detail-title');
    this.detailDesc = document.getElementById('detail-desc');
    this.detailQuote = document.getElementById('detail-quote');
    this.detailClient = document.getElementById('detail-client');
    this.detailDeliverables = document.getElementById('detail-deliverables');
    this.detailWaBtn = document.getElementById('detail-wa-btn');
    this.detailInspectBtn = document.getElementById('detail-inspect-btn');
    this.lastPlacardIndex = -1;

    // Date Availability & Booking Modal Elements
    this.bookingModal = document.getElementById('booking-modal');
    this.btnOpenBooking = document.getElementById('btn-open-booking');
    this.modalCloseBtn = document.getElementById('modal-close');
    this.bookingBackdrop = document.getElementById('booking-backdrop');
    this.bookingForm = document.getElementById('booking-form');

    this.focusedPlateIndex = -1;
    this.photoSnapScrolls = [];
    this.snapCooldown = 0;

    // Lightbox Elements
    this.lightbox = document.getElementById('lightbox-modal');
    this.lbStage = document.getElementById('lb-stage');
    this.lbLoupe = document.getElementById('lb-loupe');
    this.lbPalette = document.getElementById('lb-palette');
    this.lightboxImg = document.getElementById('lb-img');
    this.lbTitle = document.getElementById('lb-title');
    this.lbSeries = document.getElementById('lb-series');
    this.lbDesc = document.getElementById('lb-desc');
    this.lbCamera = document.getElementById('lb-camera');
    this.lbLens = document.getElementById('lb-lens');
    this.lbDeliverables = document.getElementById('lb-deliverables');
    this.lbLocation = document.getElementById('lb-location');
    this.lbWaBtn = document.getElementById('lb-wa-btn');
    this.lbClose = document.getElementById('lb-close');
    this.lbPrev = document.getElementById('lb-prev');
    this.lbNext = document.getElementById('lb-next');

    // Physics & State
    this.targetScroll = 0;
    this.currentScroll = 0;
    this.maxScroll = 1;
    this.scrollProgress = 0; // 0.0 to 1.0
    this.velocity = 0;
    this.basePerspective = 1150;
    this.targetPerspective = 1150;
    this.currentPerspective = 1150;

    // Mouse Parallax (Apple Spring Physics)
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    
    // Free Orbit Mode State
    this.isOrbitMode = false;
    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };
    this.orbitAngles = { yaw: 0, pitch: 0, targetYaw: 0, targetPitch: 0 };

    // Autoplay Flythrough
    this.isTouring = false;
    this.tourSpeed = 0.0006;

    // Active Card & Lightbox State
    this.activeCardIndex = -1;

    // Audio Engine
    this.audioContext = null;
    this.isAudioEnabled = false;
    this.droneGain = null;
    this.whooshGain = null;
    this.whooshFilter = null;

    // Animation Loop
    this.rafId = null;

    this.init();
  }

  init() {
    this.calculateMaxScroll();
    this.calculatePhotoSnapPoints();
    this.renderWorldContent();
    this.cacheSpatialElements();
    this.bindEvents();
    this.startLoop();
  }

  calculatePhotoSnapPoints() {
    this.photoSnapScrolls = [];
    for (let p = 0; p < GALLERY_DATA.length; p++) {
      const targetZ = GALLERY_DATA[p].transform.z + 620;
      let bestT = 0;
      let minDiff = Infinity;
      for (let t = 0; t <= 1; t += 0.002) {
        const cam = this.getCameraTransformAt(t);
        const diff = Math.abs(cam.pos.z - targetZ);
        if (diff < minDiff) {
          minDiff = diff;
          bestT = t;
        }
      }
      this.photoSnapScrolls.push(bestT * this.maxScroll);
    }
  }

  cacheSpatialElements() {
    this.heroTitle = document.querySelector('.hero-spatial-title');
    this.heroCamera = document.getElementById('hero-spatial-camera');
    this.cameraLensCylinder = document.getElementById('camera-lens-cylinder');
    this.lensFocusRibs = document.getElementById('lens-focus-ribs');
    this.apertureBladesGroup = document.getElementById('aperture-blades-group');
    this.apertureIrisHole = document.getElementById('aperture-iris-hole');
    this.epiloguePanel = document.querySelector('.epilogue-3d-panel');
    this.photoCardEls = Array.from(document.querySelectorAll('.photo-card-3d')).map((el, i) => ({
      el,
      reviewChip: el.querySelector('.spatial-chip-review'),
      deliverablesChip: el.querySelector('.spatial-chip-deliverables'),
      photoFrame: el.querySelector('.photo-inner-frame'),
      x: GALLERY_DATA[i].transform.x,
      y: GALLERY_DATA[i].transform.y,
      z: GALLERY_DATA[i].transform.z,
      rx: GALLERY_DATA[i].transform.rx || 0,
      ry: GALLERY_DATA[i].transform.ry || 0,
      rz: GALLERY_DATA[i].transform.rz || 0
    }));
  }

  calculateMaxScroll() {
    this.maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  }

  /* ==========================================================================
     POPULATE 3D WORLD WITH PHOTOS & ATMOSPHERE
     ========================================================================== */
  renderWorldContent() {
    // 1. Render Atmospheric 3D Dust Motes
    const motesFragment = document.createDocumentFragment();
    for (let i = 0; i < 40; i++) {
      const mote = document.createElement('div');
      mote.className = 'spatial-mote';
      const size = Math.random() * 2.5 + 1;
      const x = (Math.random() - 0.5) * 2000;
      const y = (Math.random() - 0.5) * 1200;
      const z = Math.random() * -4800 + 800;
      const opacity = Math.random() * 0.35 + 0.08;
      
      mote.style.width = `${size}px`;
      mote.style.height = `${size}px`;
      mote.style.opacity = opacity;
      mote.style.transform = `translate3d(${x}px, ${y}px, ${z}px)`;
      motesFragment.appendChild(mote);
    }
    this.world.appendChild(motesFragment);

    // 2. Render 3D Photo Plates (Pure Photographic Artwork, No 3D Text Clutter)
    GALLERY_DATA.forEach((photo, index) => {
      const card = document.createElement('div');
      card.className = `photo-card-3d ${photo.aspect}`;
      card.dataset.index = index;

      const { x, y, z, rx, ry, rz } = photo.transform;
      card.style.transform = `translate3d(${x}px, ${y}px, ${z}px) rotateY(${ry}deg) rotateX(${rx}deg) rotateZ(${rz}deg)`;

      card.innerHTML = `
        <!-- Floating 3D Review Chip (Top-Left) -->
        <div class="spatial-chip spatial-chip-review">
          <div class="chip-stars">★★★★★</div>
          <div class="chip-quote">“${photo.quote}”</div>
          <div class="chip-client">— ${photo.client}</div>
        </div>

        <!-- Main Photo Inner Frame -->
        <div class="photo-inner-frame">
          <div class="photo-img-wrap">
            <img class="photo-img" 
                 src="${photo.imgUrl}" 
                 alt="${photo.title}" 
                 loading="lazy" />
            <div class="photo-glare"></div>
          </div>
        </div>

        <!-- Floating 3D Deliverables Chip (Bottom-Right) -->
        <div class="spatial-chip spatial-chip-deliverables">
          <div class="chip-deliverables-header">
            <span class="chip-dot"></span>
            <span>PACKAGE INCLUSIONS</span>
          </div>
          <div class="chip-deliverables-text">${photo.deliverables}</div>
        </div>
      `;

      // Safe error listener to load generative SVG fallback if remote image fails
      const cardImg = card.querySelector('.photo-img');
      if (cardImg) {
        cardImg.addEventListener('error', () => {
          cardImg.src = this.generateFallbackSvg(photo);
        }, { once: true });
      }

      card.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openLightbox(index);
      });

      this.world.appendChild(card);
    });
  }

  generateFallbackSvg(photo) {
    const hue = photo.fallbackHue || '210';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000">
      <defs>
        <radialGradient id="g" cx="50%" cy="40%" r="70%">
          <stop offset="0%" stop-color="hsl(${hue}, 60%, 25%)"/>
          <stop offset="100%" stop-color="#0a0a0f"/>
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
      <circle cx="400" cy="450" r="180" fill="none" stroke="hsla(${hue}, 80%, 75%, 0.15)" stroke-width="2"/>
      <circle cx="400" cy="450" r="90" fill="none" stroke="hsla(${hue}, 80%, 75%, 0.25)" stroke-width="1.5"/>
      <text x="400" y="450" font-family="-apple-system, sans-serif" font-size="28" font-weight="300" fill="#ffffff" text-anchor="middle" dominant-baseline="middle" letter-spacing="4">${photo.title}</text>
      <text x="400" y="490" font-family="monospace" font-size="14" fill="hsla(${hue}, 80%, 75%, 0.6)" text-anchor="middle" letter-spacing="2">${photo.series}</text>
    </svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }

  /* ==========================================================================
     CAMERA SPLINE INTERPOLATION (HERMITE / SMOOTHSTEP)
     ========================================================================== */
  getCameraTransformAt(t) {
    const clampedT = Math.max(0, Math.min(1, t));
    const waypoints = CAMERA_WAYPOINTS;

    // Find the current bounding interval [i, i+1]
    let i = 0;
    while (i < waypoints.length - 1 && waypoints[i + 1].t < clampedT) {
      i++;
    }

    if (i >= waypoints.length - 1) {
      const last = waypoints[waypoints.length - 1];
      return { pos: { ...last.pos }, rot: { ...last.rot }, name: last.name, sub: last.subtitle, focal: last.focal };
    }

    const p0 = waypoints[i];
    const p1 = waypoints[i + 1];

    // Local segment fraction
    const segmentSpan = p1.t - p0.t;
    const localRatio = segmentSpan > 0 ? (clampedT - p0.t) / segmentSpan : 0;

    // Smoothstep interpolation (3 * t^2 - 2 * t^3) for zero velocity discontinuities
    const smooth = localRatio * localRatio * (3 - 2 * localRatio);

    const lerp = (a, b, factor) => a + (b - a) * factor;

    const pos = {
      x: lerp(p0.pos.x, p1.pos.x, smooth),
      y: lerp(p0.pos.y, p1.pos.y, smooth),
      z: lerp(p0.pos.z, p1.pos.z, smooth)
    };

    const rot = {
      x: lerp(p0.rot.x, p1.rot.x, smooth),
      y: lerp(p0.rot.y, p1.rot.y, smooth),
      z: lerp(p0.rot.z, p1.rot.z, smooth)
    };

    return {
      pos,
      rot,
      name: smooth < 0.5 ? p0.name : p1.name,
      sub: smooth < 0.5 ? p0.subtitle : p1.subtitle,
      focal: smooth < 0.5 ? p0.focal : p1.focal
    };
  }

  /* ==========================================================================
     PHYSICS TICK & RENDER FRAME
     ========================================================================== */
  startLoop() {
    const tick = () => {
      // 1. Tour mode auto-increment
      if (this.isTouring) {
        this.targetScroll += this.tourSpeed * this.maxScroll;
        if (this.targetScroll >= this.maxScroll) {
          this.targetScroll = 0; // Loop or reach end
        }
        window.scrollTo(0, this.targetScroll);
      }

      // 2. Critically Damped Spring Interpolation for Scroll (Silky Luxurious Momentum)
      const scrollDelta = this.targetScroll - this.currentScroll;
      this.currentScroll += scrollDelta * 0.048;
      this.velocity = scrollDelta / (window.innerHeight || 1000);

      // Dynamic Dolly Zoom (FOV motion warp)
      const speedWarp = Math.min(240, Math.abs(this.velocity) * 480);
      this.currentPerspective += (this.targetPerspective - speedWarp - this.currentPerspective) * 0.08;
      this.viewport.style.perspective = `${Math.round(this.currentPerspective)}px`;

      if (Math.abs(this.velocity) > 0.35) {
        this.viewport.classList.add('speed-warp');
      } else {
        this.viewport.classList.remove('speed-warp');
      }

      // Dynamic spatial whoosh sound
      if (this.whooshGain && this.isAudioEnabled && this.audioContext) {
        const whooshVol = Math.min(0.22, Math.abs(this.velocity) * 0.25);
        this.whooshGain.gain.setValueAtTime(whooshVol, this.audioContext.currentTime);
        if (this.whooshFilter) {
          this.whooshFilter.frequency.setValueAtTime(320 + Math.abs(this.velocity) * 1400, this.audioContext.currentTime);
        }
      }

      // Calculate normalized progress (0.0 to 1.0)
      this.scrollProgress = Math.max(0, Math.min(1, this.currentScroll / this.maxScroll));

      // 2b. Magnetic Plate Snapping (locks active photo when scrolling settles)
      if (Math.abs(scrollDelta) < 1.8 && !this.isDragging && !this.isTouring && !this.programmaticScroll) {
        this.snapCooldown++;
        if (this.snapCooldown > 18 && this.focusedPlateIndex >= 0 && this.photoSnapScrolls[this.focusedPlateIndex] !== undefined) {
          const targetSnap = this.photoSnapScrolls[this.focusedPlateIndex];
          const snapDist = targetSnap - this.targetScroll;
          if (Math.abs(snapDist) > 3) {
            this.targetScroll += snapDist * 0.05;
          }
        }
      } else {
        this.snapCooldown = 0;
      }

      // 3. Mouse Parallax Spring Smoothing
      this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.06;
      this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.06;

      // 4. Orbit Angles Smoothing
      this.orbitAngles.yaw += (this.orbitAngles.targetYaw - this.orbitAngles.yaw) * 0.1;
      this.orbitAngles.pitch += (this.orbitAngles.targetPitch - this.orbitAngles.pitch) * 0.1;

      // 5. Evaluate Camera Spline Position
      const cam = this.getCameraTransformAt(this.scrollProgress);

      // Compute Total Rotation:
      // Inverse of camera angle for CSS camera simulation + Mouse reactive gaze + Free orbit
      const totalYaw = cam.rot.y + (this.mouse.x * 5.5) + this.orbitAngles.yaw;
      const totalPitch = cam.rot.x + (-this.mouse.y * 3.5) + this.orbitAngles.pitch;
      const totalRoll = cam.rot.z + (this.mouse.x * 1.5);

      // Compute Total Position:
      // Subtle parallax offset
      const totalX = cam.pos.x + (this.mouse.x * 25);
      const totalY = cam.pos.y + (this.mouse.y * 18);
      const totalZ = cam.pos.z;

      // 6. APPLY TO 3D CSS CAMERA RIG
      // Rotation layer: rotate inverse of yaw, pitch, roll
      this.cameraRot.style.transform = `rotateZ(${-totalRoll}deg) rotateX(${-totalPitch}deg) rotateY(${-totalYaw}deg)`;
      
      // Position layer: translate inverse of world position
      this.cameraPos.style.transform = `translate3d(${-totalX}px, ${-totalY}px, ${-totalZ}px)`;

      // 7. Dynamic Depth Culling & Atmosphere Fog
      this.applyDepthCulling(totalZ, totalX, totalY, totalYaw, totalPitch, totalRoll);

      // 8. Update HUD Telemetry & Progress
      this.updateHUD(cam, totalX, totalY, totalZ, totalYaw, totalPitch);

      this.rafId = requestAnimationFrame(tick);
    };

    this.rafId = requestAnimationFrame(tick);
  }

  /* ==========================================================================
     DYNAMIC DEPTH CULLING & ATMOSPHERE FOG
     ========================================================================== */
  applyDepthCulling(camZ, camX, camY, yaw, pitch, roll) {
    // 1. Hero Title Culling (visible only during arrival zone camZ >= 920)
    if (this.heroTitle) {
      if (camZ < 920) {
        this.heroTitle.style.opacity = '0';
        this.heroTitle.style.pointerEvents = 'none';
        this.heroTitle.style.visibility = 'hidden';
      } else {
        const factor = Math.max(0, Math.min(1, (camZ - 920) / 250));
        this.heroTitle.style.visibility = 'visible';
        this.heroTitle.style.opacity = factor.toFixed(3);
        this.heroTitle.style.pointerEvents = factor > 0.4 ? 'auto' : 'none';
      }
    }

    // 1b. Hero 3D DSLR Camera & Optical Aperture Shutter (Arrival Dive-Through)
    if (this.heroCamera) {
      if (camZ < 720) {
        this.heroCamera.style.opacity = '0';
        this.heroCamera.style.pointerEvents = 'none';
        this.heroCamera.style.visibility = 'hidden';
      } else {
        this.heroCamera.style.visibility = 'visible';
        // Dive progress: 0.0 at camZ=1200 down to 1.0 at camZ=780
        const diveProgress = Math.max(0, Math.min(1, (1200 - camZ) / 420));
        
        // Gentle interactive mouse parallax tilt
        const camTiltY = (this.mouse.x || 0) * 10 * (1 - diveProgress);
        const camTiltX = -(this.mouse.y || 0) * 6 * (1 - diveProgress);
        
        // Rotational alignment to center lens
        const currRY = (yaw || 0) * diveProgress + camTiltY;
        const currRX = (pitch || 0) * diveProgress + camTiltX;
        
        // Rapid optical zoom-in dive: scales from 1.0x to 3.8x
        const zoomScale = 1.0 + (diveProgress * diveProgress * 2.8);
        const camOpacity = Math.max(0, 1.0 - Math.pow(diveProgress, 2.5));
        const camBlur = diveProgress > 0.4 ? (diveProgress - 0.4) * 8 : 0;
        
        this.heroCamera.style.transform = `translate3d(0, 10px, 640px) rotateY(${currRY.toFixed(1)}deg) rotateX(${currRX.toFixed(1)}deg) scale(${zoomScale.toFixed(2)})`;
        this.heroCamera.style.opacity = camOpacity.toFixed(3);
        this.heroCamera.style.filter = camBlur > 0 ? `blur(${camBlur.toFixed(1)}px)` : 'none';
        
        // Rotate Focus Ring
        if (this.lensFocusRibs) {
          this.lensFocusRibs.style.transform = `rotate(${diveProgress * 160}deg)`;
        }
        
        // Dilate Aperture Blades Iris
        if (this.apertureBladesGroup) {
          this.apertureBladesGroup.style.transform = `rotate(${diveProgress * 65}deg)`;
        }
        if (this.apertureIrisHole) {
          const irisR = 14 + (diveProgress * 78);
          this.apertureIrisHole.setAttribute('r', irisR.toFixed(1));
        }
      }
    }

    // 2. Photo Cards Depth Culling, Optical Rack Focus & Dynamic 3D-to-Flat Hero Expansion
    let nearestIndex = -1;
    let minFocusDist = Infinity;
    const SWEET_SPOT_Z = -620; // Optimal focal sweet-spot
    const FOCAL_WINDOW = 420; // Wide generous dwell window for flattening & expansion

    // In Arrival Cover (camZ > 920) or Epilogue (camZ < -2900), no card is in flat-focus
    const isExhibitionActive = (camZ <= 920 && camZ >= -2900);

    if (this.photoCardEls && isExhibitionActive) {
      // First pass: locate the active plate closest to the focal viewing sweet-spot
      for (let i = 0; i < this.photoCardEls.length; i++) {
        const item = this.photoCardEls[i];
        const relZ = item.z - camZ;
        if (relZ <= -60 && relZ >= -1600) {
          const focusDist = Math.abs(relZ - SWEET_SPOT_Z);
          if (focusDist < minFocusDist) {
            minFocusDist = focusDist;
            nearestIndex = i;
          }
        }
      }
    }

    this.focusedPlateIndex = nearestIndex;
    const isDesktop = window.innerWidth > 900;

    if (this.photoCardEls) {
      // Second pass: apply optical rack focus and 3D-to-flat hero expansion
      for (let i = 0; i < this.photoCardEls.length; i++) {
        const item = this.photoCardEls[i];
        const relX = (item.x || 0) - (camX || 0);
        const relZ = item.z - camZ; // In front if relZ < 0, behind if relZ > 0
        
        // Dynamic specular glare angle
        const shineX = Math.max(10, Math.min(90, 50 + (relX / 900) * 35 - ((yaw || 0) / 90) * 20));
        item.el.style.setProperty('--shine-x', `${shineX.toFixed(1)}%`);

        if (camZ < -2900) {
          // Camera reached Epilogue panel: fade out all photos completely so Studio card is 100% unobstructed
          item.el.style.opacity = '0';
          item.el.style.pointerEvents = 'none';
          item.el.style.visibility = 'hidden';
          item.el.classList.remove('is-focused');
          item.el.style.transform = `translate3d(${item.x}px, ${item.y}px, ${item.z}px) rotateY(${item.ry}deg) rotateX(${item.rx}deg) rotateZ(${item.rz}deg) scale(1)`;
          continue;
        }

        if (relZ > 80) {
          // Passed behind camera lens
          item.el.style.opacity = '0';
          item.el.style.pointerEvents = 'none';
          item.el.style.visibility = 'hidden';
          item.el.classList.remove('is-focused');
          item.el.style.transform = `translate3d(${item.x}px, ${item.y}px, ${item.z}px) rotateY(${item.ry}deg) rotateX(${item.rx}deg) rotateZ(${item.rz}deg) scale(1)`;
        } else if (relZ > -160 && i !== nearestIndex) {
          // Passing closely near the lens - fade out smoothly (for background cards)
          const factor = Math.max(0, (-relZ - 20) / 140);
          item.el.style.visibility = 'visible';
          item.el.style.opacity = factor.toFixed(3);
          item.el.style.filter = `blur(${(5 * (1 - factor)).toFixed(1)}px)`;
          item.el.style.pointerEvents = factor > 0.5 ? 'auto' : 'none';
          item.el.classList.remove('is-focused');
          item.el.style.transform = `translate3d(${item.x}px, ${item.y}px, ${item.z}px) rotateY(${item.ry}deg) rotateX(${item.rx}deg) rotateZ(${item.rz}deg) scale(1)`;
        } else if (relZ < -2800) {
          // Deep atmospheric fog
          item.el.style.opacity = '0';
          item.el.style.pointerEvents = 'none';
          item.el.style.visibility = 'hidden';
          item.el.classList.remove('is-focused');
          item.el.style.transform = `translate3d(${item.x}px, ${item.y}px, ${item.z}px) rotateY(${item.ry}deg) rotateX(${item.rx}deg) rotateZ(${item.rz}deg) scale(1)`;
        } else if (i === nearestIndex) {
          // =================================================================
          // THE ACTIVE HERO PLATE (IN FOCUS & DYNAMIC 3D-TO-FLAT EXPANSION)
          // =================================================================
          item.el.style.visibility = 'visible';
          item.el.style.pointerEvents = 'auto';
          item.el.classList.add('is-focused');

          // Proximity to focal sweet spot (0.0 to 1.0)
          const focusDist = Math.abs(relZ - SWEET_SPOT_Z);
          const proximity = Math.max(0, 1 - (focusDist / FOCAL_WINDOW));
          const flatFactor = proximity * proximity * (3 - 2 * proximity); // smoothstep

          // 1. Dynamic Rotation: Flatten dead-flat against camera lens
          const targetRY = yaw || 0;
          const targetRX = pitch || 0;
          const targetRZ = roll || 0;
          const currRY = item.ry + (targetRY - item.ry) * flatFactor;
          const currRX = item.rx + (targetRX - item.rx) * flatFactor;
          const currRZ = item.rz + (targetRZ - item.rz) * flatFactor;

          // 2. Dynamic Position: Center smoothly in camera viewport with vertical clearance
          const targetCenterX = camX || 0;
          const targetCenterY = (camY || 0) - 85; // Lift photo card so it never overlaps the bottom placard
          let currX = item.x + (targetCenterX - item.x) * flatFactor;
          let currY = item.y + (targetCenterY - item.y) * flatFactor;
          let currZ = item.z + (flatFactor * 100); // Forward optical elevation

          // 3. Dynamic Scale, Entrance Easing & Exit Fly-Through Zoom:
          // Entrance easing as photo glides into sweet spot from depth
          let enterProgress = 1.0;
          if (relZ < SWEET_SPOT_Z) {
            enterProgress = Math.max(0, Math.min(1, (relZ - (-1150)) / 530));
            const enterScale = 0.88 + (enterProgress * 0.12);
            const enterElevZ = (1 - enterProgress) * -60;
            currZ += enterElevZ;
          }

          // Departure occurs when relZ > -480 (card passing camera towards viewer)
          const exitProgress = Math.max(0, Math.min(1, (relZ - (-480)) / 480));
          const scaleBoost = isDesktop ? 0.08 : 0.04;
          let currScale = (1.0 + (flatFactor * scaleBoost)) * (relZ < SWEET_SPOT_Z ? (0.88 + enterProgress * 0.12) : 1.0);

          if (exitProgress > 0) {
            // Forward fly-through zoom past camera (1.0x to 1.42x)
            currScale = currScale * (1.0 + (exitProgress * 0.42));
            const exitBlur = exitProgress * 9.5;
            const exitOp = Math.max(0, 1.0 - Math.pow(exitProgress, 1.4));
            item.el.style.opacity = exitOp.toFixed(3);
            item.el.style.filter = `blur(${exitBlur.toFixed(1)}px) brightness(1.06) saturate(1.04)`;
          } else {
            item.el.style.opacity = '1';
            item.el.style.filter = 'blur(0px) brightness(1.06) saturate(1.04)';
          }

          item.el.style.transform = `translate3d(${currX.toFixed(1)}px, ${currY.toFixed(1)}px, ${currZ.toFixed(1)}px) rotateY(${currRY.toFixed(2)}deg) rotateX(${currRX.toFixed(2)}deg) rotateZ(${currRZ.toFixed(2)}deg) scale(${currScale.toFixed(3)})`;

          // 4. Spatial 3D Glass Chips: Dramatic Radial Parting Departure
          if (isDesktop) {
            if (item.reviewChip) {
              if (exitProgress > 0) {
                const dx = -exitProgress * 180;
                const dy = -exitProgress * 72;
                const dz = 42 + (exitProgress * 90);
                const rot = -exitProgress * 8;
                const op = Math.max(0, 1.0 - exitProgress * 1.5);
                item.reviewChip.style.transform = `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, ${dz.toFixed(1)}px) rotate(${rot.toFixed(1)}deg) scale(${(1.0 + exitProgress * 0.16).toFixed(2)})`;
                item.reviewChip.style.opacity = op.toFixed(3);
              } else if (relZ < SWEET_SPOT_Z) {
                // Staggered entrance
                const op = Math.min(1, enterProgress * 1.3);
                item.reviewChip.style.transform = '';
                item.reviewChip.style.opacity = op.toFixed(3);
              } else {
                item.reviewChip.style.transform = '';
                item.reviewChip.style.opacity = '';
              }
            }
            if (item.deliverablesChip) {
              if (exitProgress > 0) {
                const dx = exitProgress * 180;
                const dy = exitProgress * 72;
                const dz = 42 + (exitProgress * 90);
                const rot = exitProgress * 8;
                const op = Math.max(0, 1.0 - exitProgress * 1.5);
                item.deliverablesChip.style.transform = `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, ${dz.toFixed(1)}px) rotate(${rot.toFixed(1)}deg) scale(${(1.0 + exitProgress * 0.16).toFixed(2)})`;
                item.deliverablesChip.style.opacity = op.toFixed(3);
              } else if (relZ < SWEET_SPOT_Z) {
                // Staggered entrance (slightly delayed after review chip)
                const op = Math.max(0, (enterProgress - 0.2) * 1.4);
                item.deliverablesChip.style.transform = '';
                item.deliverablesChip.style.opacity = op.toFixed(3);
              } else {
                item.deliverablesChip.style.transform = '';
                item.deliverablesChip.style.opacity = '';
              }
            }
          }
        } else {
          // =================================================================
          // INACTIVE BACKGROUND PLATES: RACK FOCUS BLUR & DIMMING
          // =================================================================
          item.el.classList.remove('is-focused');
          if (item.reviewChip) {
            item.reviewChip.style.transform = '';
            item.reviewChip.style.opacity = '';
          }
          if (item.deliverablesChip) {
            item.deliverablesChip.style.transform = '';
            item.deliverablesChip.style.opacity = '';
          }

          const delta = Math.abs(relZ - SWEET_SPOT_Z);
          const blurPx = Math.min(14, (delta / 120) * 4.5);
          const dimRatio = Math.max(0.14, 1 - (delta / 240) * 0.82);
          const opRatio = Math.max(0.10, 1 - (delta / 320) * 0.82);

          item.el.style.visibility = 'visible';
          item.el.style.filter = `blur(${blurPx.toFixed(1)}px) brightness(${dimRatio.toFixed(2)}) saturate(0.3)`;
          item.el.style.opacity = opRatio.toFixed(3);
          item.el.style.pointerEvents = 'none';

          // Reset to natural 3D world angle
          item.el.style.transform = `translate3d(${item.x}px, ${item.y}px, ${item.z}px) rotateY(${item.ry}deg) rotateX(${item.rx}deg) rotateZ(${item.rz}deg) scale(1)`;
        }
      }
    }

    // 2b. Update the 2D Decoupled Editorial Placard
    this.updatePlacard(camZ);

    // 3. Epilogue Panel Culling (at z = -3700)
    if (this.epiloguePanel) {
      if (camZ > -2850) {
        this.epiloguePanel.style.opacity = '0';
        this.epiloguePanel.style.pointerEvents = 'none';
        this.epiloguePanel.style.visibility = 'hidden';
      } else {
        const factor = Math.max(0, Math.min(1, (-camZ - 2850) / 220));
        this.epiloguePanel.style.visibility = 'visible';
        this.epiloguePanel.style.opacity = factor.toFixed(3);
        this.epiloguePanel.style.pointerEvents = factor > 0.5 ? 'auto' : 'none';
      }
    }
  }

  /* ==========================================================================
     HUD UPDATES & CARD DEPTH OF FIELD
     ========================================================================== */
  updateHUD(cam, x, y, z, yaw, pitch) {
    // Progress fill & percentage
    const pct = Math.round(this.scrollProgress * 100);
    if (this.trackFill) this.trackFill.style.height = `${pct}%`;
    if (this.progressPct) {
      const curChamber = Math.min(GALLERY_DATA.length, Math.max(1, Math.round(this.scrollProgress * (GALLERY_DATA.length - 1)) + 1));
      this.progressPct.textContent = `0${curChamber}/0${GALLERY_DATA.length}`;
    }

    // Active Chapter Title (if present)
    if (this.activeChapterName && this.activeChapterName.textContent !== cam.name) {
      this.activeChapterName.textContent = cam.name;
      if (this.activeChapterSub) this.activeChapterSub.textContent = cam.sub;
    }
    this.updateActiveWaypointPill(cam.name);
  }

  updateActiveWaypointPill(activeName) {
    if (!this.waypointPills) return;

    // During hero arrival (scrollProgress < 0.08 or activeName 'Studio Arrival') or epilogue (> 0.95), no chamber is active
    if (this.scrollProgress < 0.08 || this.scrollProgress > 0.95 || activeName === 'Studio Arrival' || activeName === 'Epilogue') {
      this.waypointPills.forEach(pill => pill.classList.remove('active'));
      return;
    }

    // Determine target chamber index (0 to 4) based on focusedPlateIndex or scrollProgress
    let targetIdx = -1;
    if (this.focusedPlateIndex >= 0) {
      targetIdx = this.focusedPlateIndex;
    } else {
      const chamberTargets = [0.18, 0.36, 0.54, 0.72, 0.90];
      let minDiff = Infinity;
      chamberTargets.forEach((target, idx) => {
        const diff = Math.abs(this.scrollProgress - target);
        if (diff < minDiff && diff < 0.12) {
          minDiff = diff;
          targetIdx = idx;
        }
      });
    }

    this.waypointPills.forEach((pill, idx) => {
      pill.classList.toggle('active', idx === targetIdx);
    });
  }

  /* ==========================================================================
     2D EDITORIAL PLACARD SYNCHRONIZATION
     ========================================================================== */
  updatePlacard(camZ) {
    if (!this.placard) return;

    // Hide during intro / arrival (camZ > 920) or at epilogue (camZ < -2900) or if no focused plate
    if (camZ > 920 || camZ < -2900 || this.focusedPlateIndex === -1) {
      this.placard.classList.remove('is-active');
      this.closeDetailDrawer();
      return;
    }

    const photo = GALLERY_DATA[this.focusedPlateIndex];
    if (!photo) {
      this.placard.classList.remove('is-active');
      this.closeDetailDrawer();
      return;
    }

    this.placard.classList.add('is-active');
    
    // Only update content when focused plate changes to allow smooth crossfade
    if (this.lastPlacardIndex !== this.focusedPlateIndex) {
      this.lastPlacardIndex = this.focusedPlateIndex;
      
      this.placard.classList.add('is-updating');
      setTimeout(() => {
        const badgeText = `0${this.focusedPlateIndex + 1} / 0${GALLERY_DATA.length}`;
        if (this.placardBadge) this.placardBadge.textContent = badgeText;
        if (this.placardMarathi) this.placardMarathi.textContent = photo.marathiTitle || '';
        if (this.placardTitle) this.placardTitle.textContent = photo.title;

        // Dynamic WhatsApp Quote link for ambient pill
        if (this.placardWaBtn && photo.whatsappText) {
          const encodedText = encodeURIComponent(photo.whatsappText);
          this.placardWaBtn.href = `https://wa.me/919881224724?text=${encodedText}`;
        }

        // Sync expandable detail drawer
        if (this.detailBadge) this.detailBadge.textContent = `CHAMBER 0${this.focusedPlateIndex + 1} / 0${GALLERY_DATA.length}`;
        if (this.detailMarathi) this.detailMarathi.textContent = photo.marathiTitle || '';
        if (this.detailTitle) this.detailTitle.textContent = photo.title;
        if (this.detailDesc) this.detailDesc.textContent = photo.desc;
        if (this.detailQuote) this.detailQuote.textContent = photo.quote ? `“${photo.quote}”` : '';
        if (this.detailClient) this.detailClient.textContent = photo.client ? `— ${photo.client}` : '';
        if (this.detailWaBtn && photo.whatsappText) {
          const encodedText = encodeURIComponent(photo.whatsappText);
          this.detailWaBtn.href = `https://wa.me/919881224724?text=${encodedText}`;
        }
        if (this.detailDeliverables && photo.deliverables) {
          const items = photo.deliverables.split('•').map(s => s.trim()).filter(Boolean);
          this.detailDeliverables.innerHTML = items.map(it => `<span class="detail-pill">${it}</span>`).join('');
        }

        this.placard.classList.remove('is-updating');
      }, 100);
    }
  }

  /* ==========================================================================
     EVENT LISTENERS & USER INPUT
     ========================================================================== */
  bindEvents() {
    // 1. Native Window Scroll
    window.addEventListener('scroll', () => {
      this.snapCooldown = 0;
      this.targetScroll = window.scrollY || window.pageYOffset;
      if (this.isTouring && !this.programmaticScroll) {
        this.stopTour();
      }
    }, { passive: true });

    window.addEventListener('wheel', () => {
      this.snapCooldown = 0;
    }, { passive: true });

    // 2. Resize recalculation
    window.addEventListener('resize', () => {
      this.calculateMaxScroll();
    });

    // 3. Mouse Parallax Gaze
    window.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        // Free Orbit Dragging
        const deltaX = e.clientX - this.dragStart.x;
        const deltaY = e.clientY - this.dragStart.y;
        this.orbitAngles.targetYaw += deltaX * 0.25;
        this.orbitAngles.targetPitch -= deltaY * 0.25;
        // Clamp pitch to prevent somersault
        this.orbitAngles.targetPitch = Math.max(-60, Math.min(60, this.orbitAngles.targetPitch));
        this.dragStart = { x: e.clientX, y: e.clientY };
      } else {
        // Parallax offset [-1, 1]
        this.mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
        this.mouse.targetY = (e.clientY / window.innerHeight) * 2 - 1;
      }
    });

    // 4. Orbit Drag Pointer Down/Up
    this.viewport.addEventListener('mousedown', (e) => {
      if (e.target.closest('.photo-card-3d') || e.target.closest('.hero-spatial-action') || e.target.closest('.epilogue-action-group')) {
        return;
      }
      this.isDragging = true;
      this.dragStart = { x: e.clientX, y: e.clientY };
      this.viewport.classList.add('is-dragging');
    });

    window.addEventListener('mouseup', () => {
      if (this.isDragging) {
        this.isDragging = false;
        this.viewport.classList.remove('is-dragging');
        // Auto-settle orbit back to track if not in persistent orbit mode
        if (!this.isOrbitMode) {
          this.orbitAngles.targetYaw = 0;
          this.orbitAngles.targetPitch = 0;
        }
      }
    });

    // Touch Support for Mobile Drag Parallax / Orbit / Scroll
    let touchStartY = 0;
    this.viewport.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1 && !e.target.closest('.photo-card-3d') && !e.target.closest('.hero-spatial-action') && !e.target.closest('.btn-secondary') && !e.target.closest('.btn-primary')) {
        touchStartY = e.touches[0].clientY;
        if (this.isOrbitMode) {
          this.isDragging = true;
          this.dragStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
      }
    }, { passive: true });

    this.viewport.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1) {
        if (this.isOrbitMode && this.isDragging) {
          const deltaX = e.touches[0].clientX - this.dragStart.x;
          const deltaY = e.touches[0].clientY - this.dragStart.y;
          this.orbitAngles.targetYaw += deltaX * 0.3;
          this.orbitAngles.targetPitch -= deltaY * 0.3;
          this.dragStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        } else if (!this.isOrbitMode) {
          const diffY = touchStartY - e.touches[0].clientY;
          window.scrollBy(0, diffY * 1.25);
          touchStartY = e.touches[0].clientY;
        }
      }
    }, { passive: true });

    window.addEventListener('touchend', () => {
      this.isDragging = false;
      if (!this.isOrbitMode) {
        this.orbitAngles.targetYaw = 0;
        this.orbitAngles.targetPitch = 0;
      }
    });

    // 5. Waypoint Navigation Buttons
    this.waypointPills.forEach(pill => {
      pill.addEventListener('click', () => {
        const targetProgress = parseFloat(pill.dataset.target);
        this.scrollToProgress(targetProgress);
        this.playTactileClick();
      });
    });

    // 6. Hero Dive Action
    const heroAction = document.getElementById('hero-dive-action');
    if (heroAction) {
      heroAction.addEventListener('click', () => {
        this.scrollToProgress(0.18);
        this.playTactileClick();
      });
    }

    // 7. Epilogue Buttons
    const btnReplay = document.getElementById('btn-replay');
    if (btnReplay) {
      btnReplay.addEventListener('click', () => {
        this.scrollToProgress(0.0);
        this.playTactileClick();
      });
    }

    const btnStartTour = document.getElementById('btn-start-tour');
    if (btnStartTour) {
      btnStartTour.addEventListener('click', () => {
        this.scrollToProgress(0.0);
        setTimeout(() => this.startTour(), 600);
      });
    }

    // 8. Booking Modal Event Handlers
    if (this.btnOpenBooking) {
      this.btnOpenBooking.addEventListener('click', () => this.openBookingModal());
    }
    if (this.modalCloseBtn) {
      this.modalCloseBtn.addEventListener('click', () => this.closeBookingModal());
    }
    if (this.bookingBackdrop) {
      this.bookingBackdrop.addEventListener('click', () => this.closeBookingModal());
    }

    if (this.bookingForm) {
      this.bookingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const service = document.getElementById('shoot-service').value;
        const date = document.getElementById('shoot-date').value;
        const venue = document.getElementById('shoot-venue').value;
        const name = document.getElementById('shoot-name').value;
        const phone = document.getElementById('shoot-phone').value;
        const notes = document.getElementById('shoot-notes').value;

        const text = `Hello Anuja Photos Latur,%0A%0AI would like to check availability & packages:%0A• Service: ${encodeURIComponent(service)}%0A• Date: ${encodeURIComponent(date)}%0A• Location/Venue: ${encodeURIComponent(venue)}%0A• Name: ${encodeURIComponent(name)}%0A• WhatsApp Phone: ${encodeURIComponent(phone)}${notes ? `%0A• Notes: ${encodeURIComponent(notes)}` : ''}`;

        window.open(`https://wa.me/919881224724?text=${text}`, '_blank');
        this.closeBookingModal();
      });
    }

    // 9. Autoplay Flythrough Tour Button
    if (this.btnTour) {
      this.btnTour.addEventListener('click', () => {
        if (this.isTouring) {
          this.stopTour();
        } else {
          this.startTour();
        }
        this.playTactileClick();
      });
    }

    // 10. Free Orbit Mode Toggle
    if (this.btnOrbitMode) {
      this.btnOrbitMode.addEventListener('click', () => {
        this.isOrbitMode = !this.isOrbitMode;
        this.btnOrbitMode.classList.toggle('active', this.isOrbitMode);
        if (this.orbitBanner) {
          this.orbitBanner.classList.toggle('active', this.isOrbitMode);
        }
        if (!this.isOrbitMode) {
          this.orbitAngles.targetYaw = 0;
          this.orbitAngles.targetPitch = 0;
        }
        this.playTactileClick();
      });
    }

    // 11. Web Audio Ambience & Shutter
    if (this.btnAudio) {
      this.btnAudio.addEventListener('click', () => {
        this.toggleAudio();
      });
    }

    // 11b. Optical Lens / Perspective Selector
    if (this.focalBtns) {
      this.focalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          this.focalBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.targetPerspective = parseFloat(btn.dataset.persp) || 1150;
          this.playTactileClick();
        });
      });
    }

    // 11c. Lightbox Loupe Magnifier Tracking
    if (this.lbStage && this.lbLoupe) {
      this.lbStage.addEventListener('mousemove', (e) => {
        const rect = this.lbStage.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (x < 0 || x > rect.width || y < 0 || y > rect.height) {
          this.lbLoupe.classList.remove('is-active');
          return;
        }

        this.lbLoupe.classList.add('is-active');
        this.lbLoupe.style.left = `${x - 75}px`;
        this.lbLoupe.style.top = `${y - 75}px`;

        const bgWidth = rect.width * 2.5;
        const bgHeight = rect.height * 2.5;
        const bgX = -(x * 2.5 - 75);
        const bgY = -(y * 2.5 - 75);

        this.lbLoupe.style.backgroundSize = `${bgWidth}px ${bgHeight}px`;
        this.lbLoupe.style.backgroundPosition = `${bgX}px ${bgY}px`;
      });

      this.lbStage.addEventListener('mouseleave', () => {
        this.lbLoupe.classList.remove('is-active');
      });
    }

    // 12. Lightbox Navigation
    this.lbClose.addEventListener('click', () => this.closeLightbox());
    this.lightbox.querySelector('.lightbox-backdrop').addEventListener('click', () => this.closeLightbox());
    this.lbPrev.addEventListener('click', () => this.navigateLightbox(-1));
    this.lbNext.addEventListener('click', () => this.navigateLightbox(1));

    // 12b. Editorial Placard & Detail Drawer Interactions
    if (this.placardToggleArea) {
      this.placardToggleArea.addEventListener('click', (e) => {
        // If clicking directly on WhatsApp link, let it open WhatsApp without toggle
        if (e.target.closest('.placard-wa-btn')) {
          return;
        }
        this.toggleDetailDrawer();
      });
    }

    if (this.detailCloseBtn) {
      this.detailCloseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeDetailDrawer();
      });
    }

    if (this.detailInspectBtn) {
      this.detailInspectBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeDetailDrawer();
        if (this.focusedPlateIndex >= 0) {
          this.openLightbox(this.focusedPlateIndex);
        }
      });
    }

    if (this.placardExpandBtn) {
      this.placardExpandBtn.addEventListener('click', () => {
        if (this.focusedPlateIndex >= 0) {
          this.openLightbox(this.focusedPlateIndex);
        }
      });
    }

    // Close detail drawer on clicks outside
    document.addEventListener('click', (e) => {
      if (this.placardDetailDrawer && this.placardDetailDrawer.classList.contains('is-open')) {
        if (!e.target.closest('#editorial-placard')) {
          this.closeDetailDrawer();
        }
      }
    });

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if (this.placardDetailDrawer && this.placardDetailDrawer.classList.contains('is-open')) {
        if (e.key === 'Escape') {
          this.closeDetailDrawer();
          return;
        }
      }

      if (this.bookingModal && this.bookingModal.classList.contains('is-active')) {
        if (e.key === 'Escape') this.closeBookingModal();
        return;
      }

      if (this.lightbox.classList.contains('is-active')) {
        if (e.key === 'Escape') this.closeLightbox();
        if (e.key === 'ArrowLeft') this.navigateLightbox(-1);
        if (e.key === 'ArrowRight') this.navigateLightbox(1);
        return;
      }

      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        if (this.isTouring) this.stopTour();
        else this.startTour();
      } else if (e.key >= '1' && e.key <= '5') {
        const chamberTargets = [0.18, 0.36, 0.54, 0.72, 0.90];
        const index = parseInt(e.key) - 1;
        if (chamberTargets[index] !== undefined) {
          this.scrollToProgress(chamberTargets[index]);
          this.playTactileClick();
        }
      }
    });
  }

  openDetailDrawer() {
    if (this.placardDetailDrawer) {
      this.placardDetailDrawer.classList.add('is-open');
      this.playTactileClick();
    }
  }

  closeDetailDrawer() {
    if (this.placardDetailDrawer) {
      this.placardDetailDrawer.classList.remove('is-open');
    }
  }

  toggleDetailDrawer() {
    if (this.placardDetailDrawer) {
      const isOpen = this.placardDetailDrawer.classList.toggle('is-open');
      if (isOpen) this.playTactileClick();
    }
  }

  openBookingModal() {
    if (this.bookingModal) {
      this.bookingModal.classList.add('is-active');
      this.playTactileClick();
    }
  }

  closeBookingModal() {
    if (this.bookingModal) {
      this.bookingModal.classList.remove('is-active');
    }
  }

  scrollToProgress(progress) {
    this.stopTour();
    const targetY = progress * this.maxScroll;
    this.programmaticScroll = true;
    window.scrollTo({
      top: targetY,
      behavior: 'smooth'
    });
    setTimeout(() => {
      this.programmaticScroll = false;
    }, 800);
  }

  startTour() {
    this.isTouring = true;
    if (this.btnTour) {
      this.btnTour.classList.add('active');
      this.btnTour.querySelector('.btn-label').textContent = 'Pause Tour';
    }
  }

  stopTour() {
    this.isTouring = false;
    if (this.btnTour) {
      this.btnTour.classList.remove('active');
      this.btnTour.querySelector('.btn-label').textContent = 'Flythrough';
    }
  }

  /* ==========================================================================
     LIGHTBOX / PHOTO INSPECTION
     ========================================================================== */
  openLightbox(index) {
    const photo = GALLERY_DATA[index];
    if (!photo) return;
    this.activeCardIndex = index;

    this.lightboxImg.src = photo.imgUrl;
    this.lightboxImg.onerror = () => {
      this.lightboxImg.src = this.generateFallbackSvg(photo);
    };

    // Update Loupe background
    if (this.lbLoupe) {
      this.lbLoupe.style.backgroundImage = `url("${photo.imgUrl}")`;
      this.lbLoupe.classList.remove('is-active');
    }

    // Dynamic color palette swatches
    if (this.lbPalette) {
      const hue = parseInt(photo.fallbackHue || '210', 10);
      this.lbPalette.innerHTML = `
        <span class="palette-swatch" style="background: hsl(${hue}, 20%, 10%);" title="Deep Shadow"></span>
        <span class="palette-swatch" style="background: hsl(${hue}, 35%, 26%);" title="Tonal Dark"></span>
        <span class="palette-swatch" style="background: hsl(${hue}, 40%, 48%);" title="Midtone Accent"></span>
        <span class="palette-swatch" style="background: hsl(${hue}, 65%, 72%);" title="Optical Highlight"></span>
        <span class="palette-swatch" style="background: hsl(${hue}, 15%, 94%);" title="White Light"></span>
      `;
    }

    if (this.lbTitle) this.lbTitle.textContent = photo.title;
    if (this.lbSeries) this.lbSeries.textContent = photo.series;
    if (this.lbDesc) this.lbDesc.textContent = photo.desc;
    if (this.lbCamera) this.lbCamera.textContent = photo.camera || 'Sony Alpha Series';
    if (this.lbLens) this.lbLens.textContent = photo.lens || 'G-Master Optics';
    if (this.lbDeliverables) this.lbDeliverables.textContent = photo.deliverables || 'Full HD & 4K Coverage';
    if (this.lbLocation) this.lbLocation.textContent = photo.location || 'Latur Studio & Venues';
    if (this.lbWaBtn && photo.whatsappText) {
      this.lbWaBtn.href = `https://wa.me/919881224724?text=${encodeURIComponent(photo.whatsappText)}`;
    }

    this.lightbox.classList.add('is-active');
    this.playShutterSound();
  }

  closeLightbox() {
    this.lightbox.classList.remove('is-active');
    this.activeCardIndex = -1;
  }

  navigateLightbox(direction) {
    if (this.activeCardIndex === -1) return;
    let nextIndex = this.activeCardIndex + direction;
    if (nextIndex < 0) nextIndex = GALLERY_DATA.length - 1;
    if (nextIndex >= GALLERY_DATA.length) nextIndex = 0;
    this.openLightbox(nextIndex);
  }

  /* ==========================================================================
     WEB AUDIO ENGINE (SHUTTER CLICK & AMBIENT DRONE)
     ========================================================================== */
  initAudio() {
    if (!this.audioContext) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioCtx();
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  toggleAudio() {
    this.initAudio();
    this.isAudioEnabled = !this.isAudioEnabled;
    this.btnAudio.classList.toggle('active', this.isAudioEnabled);

    if (this.isAudioEnabled) {
      this.startAmbientDrone();
      this.btnAudio.querySelector('.audio-label').textContent = 'Audio On';
    } else {
      this.stopAmbientDrone();
      this.btnAudio.querySelector('.audio-label').textContent = 'Audio Off';
    }
  }

  startAmbientDrone() {
    if (!this.audioContext) return;
    const ctx = this.audioContext;

    // Harmonic low frequency drone
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    this.droneGain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(55, ctx.currentTime); // A1 note

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(110.2, ctx.currentTime); // Slight detuned octave

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(180, ctx.currentTime);

    this.droneGain.gain.setValueAtTime(0.001, ctx.currentTime);
    this.droneGain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 3);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(this.droneGain);
    this.droneGain.connect(ctx.destination);

    osc1.start();
    osc2.start();

    // Spatial velocity whoosh synthesizer (modulated white noise)
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noiseNode = ctx.createBufferSource();
    noiseNode.buffer = noiseBuffer;
    noiseNode.loop = true;

    this.whooshFilter = ctx.createBiquadFilter();
    this.whooshFilter.type = 'bandpass';
    this.whooshFilter.frequency.setValueAtTime(350, ctx.currentTime);
    this.whooshFilter.Q.setValueAtTime(2.5, ctx.currentTime);

    this.whooshGain = ctx.createGain();
    this.whooshGain.gain.setValueAtTime(0.0001, ctx.currentTime);

    noiseNode.connect(this.whooshFilter);
    this.whooshFilter.connect(this.whooshGain);
    this.whooshGain.connect(ctx.destination);
    noiseNode.start();
  }

  stopAmbientDrone() {
    if (this.droneGain && this.audioContext) {
      this.droneGain.gain.setValueAtTime(this.droneGain.gain.value, this.audioContext.currentTime);
      this.droneGain.gain.exponentialRampToValueAtTime(0.0001, this.audioContext.currentTime + 0.8);
    }
    if (this.whooshGain && this.audioContext) {
      this.whooshGain.gain.setValueAtTime(this.whooshGain.gain.value, this.audioContext.currentTime);
      this.whooshGain.gain.exponentialRampToValueAtTime(0.0001, this.audioContext.currentTime + 0.4);
    }
  }

  playTactileClick() {
    if (!this.audioContext) return;
    const ctx = this.audioContext;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.03);

    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.04);
  }

  playShutterSound() {
    if (!this.audioContext) return;
    const ctx = this.audioContext;

    // Dual-stage mechanical shutter click
    const now = ctx.currentTime;
    
    // Front curtain click
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(1800, now);
    osc1.frequency.exponentialRampToValueAtTime(300, now + 0.04);
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.05);

    // Rear curtain click
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(900, now + 0.06);
    osc2.frequency.exponentialRampToValueAtTime(150, now + 0.11);
    gain2.gain.setValueAtTime(0.08, now + 0.06);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.06);
    osc2.stop(now + 0.13);
  }
}

  // Instantiate on DOM load or immediately if already loaded
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', () => {
      new SpatialCameraApp();
    });
  } else {
    new SpatialCameraApp();
  }
})();
