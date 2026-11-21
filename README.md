# Anuja — 3D Camera Rotate & Scroll Photography Exhibition

An interactive, high-performance spatial photography exhibition website built with pure **CSS 3D Transforms**, hardware-accelerated GPU rendering, and fluid spring physics.

---

## 🌟 Key Features

1. **6-DOF CSS 3D Camera Rig**
   - Perspective projection (`perspective: 1100px`) with inverse rotational Euler matrices (`yaw`, `pitch`, `roll`) and world translations (`-x`, `-y`, `-z`).
   - Hardware accelerated with zero canvas/WebGL overhead (`transform-style: preserve-3d`, `will-change: transform`).

2. **Cubic Hermite Spline Flight Path**
   - Seamless $C^1$ continuous interpolation between 6 curated exhibition waypoints:
     - **01 Genesis**: Monolithic entrance with floating hero typography.
     - **02 Monoliths**: Concrete and angular shadow geometries banked at $-22^\circ$ yaw.
     - **03 Orbit Gallery**: Curving architectural horizons with radial card positioning.
     - **04 Spiral Descent**: Vertical descent with $+14^\circ$ pitch and $-25^\circ$ yaw.
     - **05 Deep Chasm**: Infinite corridor with luminous backlighting.
     - **06 Epilogue**: Curatorial monograph, statistics, and restart portal.

3. **Critically Damped Spring Physics**
   - Natural momentum matching Apple's Human Interface Guidelines.
   - Smooth delta tracking for wheel, trackpad, and touch swipe gestures.

4. **Dynamic Depth Culling & Atmosphere Fog**
   - Automatic near-plane culling when elements pass behind the camera lens.
   - Realistic distance fog falloff for deep spatial perception.

5. **Multi-Mode Camera Interaction**
   - **Cinematic Scroll Track**: Scroller drives camera flight along the spline path.
   - **Reactive Mouse Parallax**: Subtle gaze shifts responding to cursor position.
   - **Free 360° Orbit Mode**: Click and drag anywhere to freely rotate camera pitch and yaw.
   - **Autopilot Flythrough**: Automated cinematic glide through the entire gallery.

6. **Tactile Audio & Lightbox Inspection**
   - Synthesized mechanical shutter clicks and low-frequency harmonic drone via Web Audio API.
   - Apple-style fluid modal with full-resolution plate view, EXIF metadata (camera, lens, shutter, ISO, location), and keyboard navigation.

---

## 🚀 Quick Start

### Option 1: Direct File Open (Zero Setup)
Simply double-click `index.html` in Windows Explorer. It runs immediately in any browser (Chrome, Edge, Firefox, Safari) with zero installation required!

### Option 2: Local HTTP Server
If you prefer running via local server:
```bash
# Using Python
python -m http.server 3000

# Or using Node.js
npm start
```
Then visit `http://localhost:3000` in your browser.

---

## ⌨️ Controls & Shortcuts

| Action | Control |
| :--- | :--- |
| **Scroll / Fly** | Mouse Wheel / Trackpad / Touch Swipe |
| **Gaze Parallax** | Mouse Move |
| **Chapter Jump** | Number Keys `1` through `6` or Bottom Nav Dock |
| **Toggle Flythrough** | `Spacebar` or "Flythrough" button in HUD |
| **Toggle Free Orbit** | "Free Orbit" button in HUD |
| **Inspect Photo** | Click any 3D photo frame |
| **Close Lightbox** | `Escape` key or backdrop click |
