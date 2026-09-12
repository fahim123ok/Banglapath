# Technical Design Document

## Overview

This design document provides the technical architecture for implementing the three missing animation functions (`buildSweep()`, `playSweep()`, and `launch()`) in the BanglaPath authentication page. These functions currently exist in `script.js` but need to be properly integrated into `home.js` to support the leaf sweep animation transition from the authentication screen to the main application.

## Current State Analysis

### Existing Implementation in script.js

The functions are currently implemented in `script.js` with the following structure:

- **`buildSweep()`**: Loads branch images and paints them onto canvas elements
- **`playSweep()`**: Animates the canvas elements to create a sweeping transition effect
- **`launch(fast)`**: Orchestrates the entire launch sequence, including screen hiding, data capture, and animation triggering

### Problem

The requirements document specifies these functions should be in the `Home_Module` (home.js), but they are currently in the `Script_Module` (script.js). This creates a module boundary issue where script.js dispatches a `bp-launch` custom event expecting these functions to exist globally or in home.js.

## Architecture Design

### Module Organization

```
┌─────────────────────────────────────────────────────────────┐
│                        script.js                             │
│  (Intro Flow Controller - Carousel & Auth Screens)          │
│                                                              │
│  • Manages video carousel navigation                         │
│  • Handles auth screen transitions                           │
│  • Tab switching (Sign Up / Log In)                          │
│  • Dispatches 'bp-launch' custom event                       │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       │ Custom Event: 'bp-launch'
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                        home.js                               │
│  (Main Application & Animation Controller)                   │
│                                                              │
│  • BanglaPath.buildSweep()  - Canvas preparation             │
│  • BanglaPath.playSweep()   - Animation execution            │
│  • BanglaPath.launch(fast)  - Launch orchestration           │
└─────────────────────────────────────────────────────────────┘
```

### Solution Strategy

**Move the animation functions to home.js** and expose them as methods of the `BanglaPath` module. This approach:

1. Keeps the animation logic with the main application module
2. Maintains clean separation: script.js handles intro flow, home.js handles app launch
3. Allows script.js to call these functions via the global `BanglaPath` object
4. Ensures functions are available when the `bp-launch` event fires

## Component Design

### 1. buildSweep() Function

**Purpose**: Pre-render the leaf branch imagery onto canvas elements before animation starts.

**Location**: `home.js` inside the `BanglaPath` module

**Interface**:
```javascript
BanglaPath.buildSweep = function() {
  // Returns: void
  // Side effects: Paints canvas elements, caches loaded images
}
```

**Algorithm**:

```
1. Call loadBranchImages() to asynchronously load all branch images
2. Wait for all image promises to resolve
3. Store loaded images in branchCache Map
4. For each canvas element with class 'sweep-side':
   a. Determine if it's left or right side (mirrored)
   b. Call paintSide(canvas, branchCache)
5. Set up resize listener (if not already set) to repaint on viewport changes
```

**Key Data Structures**:

```javascript
// Configuration array defining branch layout
const LEAF_LAYOUT = [
  { src: 'images/branch-b-soft.png', w: 78, top: -14, off: -12, rot: -6 },
  { src: 'images/branch-b-soft.png', w: 70, top: 10, off: 4, rot: 8 },
  // ... 10 more branches
];

// Cache for loaded images
let branchCache = null; // Map<string, HTMLImageElement>

// Launch state flag
let launched = false;
```

**Helper Functions**:

```javascript
function loadBranchImages() {
  // Returns: Promise<Map<string, HTMLImageElement>>
  // Creates Image objects for each unique src in LEAF_LAYOUT
  // Resolves when all images load (or error)
}

function paintSide(sideElement, imageCache) {
  // Renders all branches onto one canvas element
  // Parameters:
  //   sideElement: DOM element with class 'sweep-side'
  //   imageCache: Map of loaded images
  // Side effects: Modifies canvas 2D context
}
```

**paintSide() Rendering Logic**:

1. Detect if canvas is left or right side (`sweep-right` class = mirrored)
2. Calculate canvas dimensions:
   - Width = 82% of window inner width × DPR (clamped to 1.25)
   - Height = 100% of window inner height × DPR (clamped to 1.25)
3. For each branch in LEAF_LAYOUT:
   - Calculate scaled dimensions (w, h) using viewport units
   - Calculate position based on `top` and `off` values
   - Save canvas context state
   - Translate to branch center point
   - Rotate by `rot` degrees (negated if mirrored)
   - Scale horizontally by -1 if mirrored (creates mirror effect)
   - Draw image centered at origin
   - Restore canvas context state
4. Apply linear gradient fade from 66% width to edge
   - Use `destination-out` composite operation for transparency
   - Prevents visible seam where left and right canvases overlap

**Device Pixel Ratio Handling**:
```javascript
const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
// Prevents excessive memory usage on high-DPI displays
// while maintaining quality on standard and Retina displays
```

### 2. playSweep() Function

**Purpose**: Execute the animated leaf sweep transition across the viewport.

**Location**: `home.js` inside the `BanglaPath` module

**Interface**:
```javascript
BanglaPath.playSweep = function() {
  // Returns: void
  // Side effects: Adds 'is-active' class, triggers Web Animations API
}
```

**Algorithm**:

```
1. Select the sweep container element
2. Add 'is-active' class to make it visible
3. For each sweep-side canvas element:
   a. Determine direction (left=-1, right=1)
   b. Create animation keyframes:
      - Start: Off-screen (118% in direction with rotation)
      - 34%: Swing past center (-3% opposite direction)
      - 46%: Settle at center (0%, 0°)
      - 60%: Slight bounce (0%, small rotation)
      - 100%: Sweep off-screen (118% in direction)
   c. Apply animation with timing:
      - Duration: 3600ms
      - Delay: 90ms for right side, 0ms for left side
      - Fill: 'forwards' (maintains final state)
   d. On animation finish: Remove 'is-active' class
```

**Animation Keyframe Structure**:

```javascript
[
  {
    transform: `translate3d(${dir * 118}%, -4%, 0) rotate(${dir * 5}deg)`,
    offset: 0,
    easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)'  // Ease in with weight
  },
  {
    transform: `translate3d(${dir * -3}%, 1%, 0) rotate(${dir * -1.2}deg)`,
    offset: 0.34,
    easing: 'cubic-bezier(0.4, 0, 0.5, 1)'  // Decelerate into settle
  },
  {
    transform: 'translate3d(0, 0, 0) rotate(0deg)',
    offset: 0.46,
    easing: 'ease-in-out'  // Hold at center
  },
  {
    transform: `translate3d(0, -1%, 0) rotate(${dir * 0.8}deg)`,
    offset: 0.6,
    easing: 'cubic-bezier(0.5, 0, 0.75, 0.35)'  // Slight bounce
  },
  {
    transform: `translate3d(${dir * 118}%, 2%, 0) rotate(${dir * 6}deg)`,
    offset: 1  // Sweep out
  }
]
```

**Timing Details**:
- Left canvas starts immediately (delay: 0)
- Right canvas starts 90ms later (creates staggered effect)
- Total animation duration: 3600ms
- Peak coverage occurs around 1800-2000ms mark

### 3. launch() Function

**Purpose**: Orchestrate the complete launch sequence from authentication to application.

**Location**: `home.js` inside the `BanglaPath` module

**Interface**:
```javascript
BanglaPath.launch = function(fast = false) {
  // Parameters:
  //   fast: boolean - If true, skip animation
  // Returns: void
  // Side effects: Multiple DOM manipulations, state changes, localStorage writes
}
```

**Algorithm**:

```
1. Guard clause: If already launched, return immediately
2. Set launched = true flag
3. Cancel any auto-scroll animations
4. Hide intro screens:
   - Add 'is-hidden' class to screen-carousel
   - Add 'is-hidden' class to screen-auth
5. Capture user profile data:
   - Read name and email input values
   - If values exist:
     a. Parse existing profile from localStorage
     b. Update with new name/email
     c. Generate handle from name (lowercase, alphanumeric only)
     d. Save to localStorage as 'banglapath_user_profile'
6. Set localStorage 'bp_launched' = 'true'
7. Hide authentication UI:
   - Add 'is-dismissed' class to auth element
   - Set aria-hidden='true' on auth element
8. Determine execution path:
   IF (fast === true OR window.innerWidth <= 768):
     Execute MOBILE PATH
   ELSE:
     Execute DESKTOP PATH
```

**Mobile Path** (Fast Launch):
```
1. Add 'is-launched' class to document.body immediately
2. Pause all intro videos (tiger, deer)
3. Reveal mobile bottom navigation bar
4. Call BanglaPath.enterHome() to initialize main app
5. Return
```

**Desktop Path** (Full Animation):
```
1. Lock scroll position:
   a. Store current scrollY in lockedAt variable
   b. Add 'is-launching' class to document.body
   c. Attach wheel and touchmove event listeners with preventDefault
2. Schedule animation sequence:
   At T+300ms:
     - Call playSweep() to start leaf animation
   At T+1900ms:
     - Add 'is-launched' class to document.body
     - Pause all intro videos
     - Reveal mobile bottom navigation bar
     - IF BanglaPath.enterHome exists:
         Call BanglaPath.enterHome()
       ELSE:
         Show app container (remove hidden attribute)
     - Remove scroll prevention event listeners
3. Return
```

**Timing Rationale**:
- 300ms delay before playSweep: Allows DOM updates to flush
- 1900ms delay for content swap: Occurs when leaves fully cover viewport
- Total sequence: ~3600ms (matches animation duration)

**Error Handling**:
```javascript
// localStorage operations wrapped in try-catch
try {
  localStorage.setItem('bp_launched', 'true');
} catch (err) {
  // Fail silently - don't block launch for storage errors
}
```

### 4. Integration with script.js

**Current script.js Event Handler**:
```javascript
window.addEventListener('bp-launch', function() {
  if (typeof launch !== 'function') return;
  
  // Ensure buildSweep has run
  if (typeof buildSweep === 'function') {
    try { 
      buildSweep();
    } catch(e) {
      console.error('buildSweep error:', e);
    }
  }
  
  // Give canvas time to paint
  setTimeout(function() {
    launch(false); // Use sweep animation on desktop
  }, 100);
});
```

**Updated Integration** (after moving to home.js):
```javascript
window.addEventListener('bp-launch', function() {
  if (!window.BanglaPath || typeof window.BanglaPath.launch !== 'function') {
    console.error('BanglaPath.launch not available');
    return;
  }
  
  // Ensure buildSweep has run
  if (typeof window.BanglaPath.buildSweep === 'function') {
    try { 
      window.BanglaPath.buildSweep();
    } catch(e) {
      console.error('buildSweep error:', e);
    }
  }
  
  // Give canvas time to paint
  setTimeout(function() {
    window.BanglaPath.launch(false);
  }, 100);
});
```

## HTML Structure Requirements

**Canvas Elements** (already present in index.html):
```html
<div class="sweep" aria-hidden="true">
  <canvas class="sweep-side sweep-left"></canvas>
  <canvas class="sweep-side sweep-right"></canvas>
</div>
```

**Screen Elements**:
```html
<div id="screen-carousel" class="intro-screen">...</div>
<div id="screen-auth" class="intro-screen is-hidden">...</div>
<div id="app" class="main-app" hidden>...</div>
```

## CSS Requirements

**Existing Styles** (in style.css):
```css
.sweep {
  position: fixed;
  inset: 0;
  z-index: 9999;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.sweep.is-active {
  opacity: 1;
}

.sweep-side {
  position: absolute;
  width: 82%; /* SIDE_WIDTH constant */
  height: 100%;
  overflow: hidden;
}

.sweep-left {
  left: 0;
  transform: translate3d(-115%, 0, 0);
}

.sweep-right {
  right: 0;
  transform: translate3d(115%, 0, 0);
}

.sweep-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
```

**Launch State Styles**:
```css
body.is-launching {
  /* Scroll lock active */
  overflow: hidden;
}

body.is-launched #screen-carousel,
body.is-launched #screen-auth {
  display: none;
}

body.is-launched #app {
  display: block;
}

.is-hidden {
  display: none !important;
}

.is-dismissed {
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.4s ease;
}
```

## Data Flow

```
User Action (Auth Button Click/Form Submit)
  ↓
script.js: Hide auth screen
  ↓
script.js: Dispatch 'bp-launch' custom event
  ↓
Event Listener in script.js:
  ↓
home.js: BanglaPath.buildSweep() [if not already called]
  ↓
  └─ Load branch images (async)
  └─ Paint both canvas elements
  └─ Cache images for resize handling
  ↓
100ms delay
  ↓
home.js: BanglaPath.launch(false)
  ↓
  ├─ Capture user profile data → localStorage
  ├─ Set launched flag → localStorage
  ├─ Check viewport width
  │
  ├─ IF Mobile (≤768px):
  │   └─ Skip animation, immediate launch
  │
  └─ IF Desktop (>768px):
      ├─ Lock scroll position
      ├─ T+300ms: Call playSweep()
      │   └─ Animate canvases (3600ms)
      └─ T+1900ms: Reveal app, unlock scroll
```

## State Management

### Module-Level State Variables

```javascript
// Inside BanglaPath module in home.js
let branchCache = null;        // Map<string, HTMLImageElement>
let launched = false;          // Boolean flag
let lockedAt = 0;              // Number (scroll position)
let resizeHandlerAttached = false;  // Boolean flag
```

### localStorage State

```javascript
// User profile
{
  name: string,
  email: string,
  handle: string  // Lowercase alphanumeric version of name
}
// Key: 'banglapath_user_profile'

// Launch flag
"true"
// Key: 'bp_launched'
```

## Error Handling Strategy

### Image Loading Failures
```javascript
// In loadBranchImages():
img.onerror = () => {
  console.warn(`Failed to load branch image: ${src}`);
  resolve(); // Resolve anyway to not block other images
};
```

### localStorage Failures
```javascript
try {
  localStorage.setItem(key, value);
} catch (err) {
  console.warn('localStorage unavailable:', err);
  // Continue without throwing - don't block launch
}
```

### Missing DOM Elements
```javascript
const element = document.querySelector('.some-element');
if (!element) {
  console.warn('Expected element not found');
  return; // Graceful degradation
}
```

### Animation Not Supported
```javascript
if (!('animate' in HTMLElement.prototype)) {
  // Fallback: Skip animation, direct launch
  console.warn('Web Animations API not supported');
  // Proceed with fast launch
}
```

## Performance Considerations

### Canvas Rendering
- **Device Pixel Ratio Clamping**: Cap DPR at 1.25 to prevent excessive memory usage
  - 1x display: Use native 1x
  - 2x display (Retina): Use 1.25x (slight quality loss, major memory savings)
  - 3x display: Use 1.25x
  
- **Canvas Size Example**:
  - Viewport: 1920×1080
  - Canvas width: 1920 × 0.82 × 1.25 = 1968 pixels
  - Canvas height: 1080 × 1.25 = 1350 pixels
  - Per canvas: ~2.66 megapixels (~10MB memory per canvas at 32-bit RGBA)

### Image Caching
- Load all images once during buildSweep()
- Store in branchCache Map for reuse on resize
- No redundant network requests

### Animation Performance
- Use CSS transforms (translate3d, rotate) for GPU acceleration
- Use `will-change` implicitly via transform
- Avoid repaints during animation (no DOM class changes mid-animation)

### Mobile Optimization
- Skip animation entirely on viewports ≤768px
- Reduces CPU/GPU load on mobile devices
- Improves battery life
- Faster perceived performance

## Browser Compatibility

### Required APIs
- **Web Animations API**: `Element.animate()`
  - Support: Chrome 36+, Firefox 48+, Safari 13.1+
  - Fallback: Skip animation on unsupported browsers

- **Canvas 2D Context**: `HTMLCanvasElement.getContext('2d')`
  - Support: All modern browsers
  - No fallback needed (universally supported)

- **Promises**: `Promise.all()`
  - Support: All modern browsers
  - No fallback needed (universally supported)

- **localStorage**: `window.localStorage`
  - Support: All modern browsers
  - Error handling: Try-catch blocks

### Tested Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Viewport Responsiveness

### Breakpoints

**Mobile**: width ≤ 768px
- Skip animation
- Immediate launch
- Show mobile navigation

**Desktop**: width > 768px
- Full animation sequence
- Leaf sweep transition
- 3600ms total duration

### Resize Handling

**Before Launch**:
```javascript
window.addEventListener('resize', () => {
  if (!branchCache || launched) return;
  // Repaint canvases with cached images
  document.querySelectorAll('.sweep-side').forEach((side) => {
    paintSide(side, branchCache);
  });
});
```

**After Launch**:
- Resize events ignored
- Canvas no longer visible
- No repainting needed

## Accessibility

### ARIA Attributes
```html
<div class="sweep" aria-hidden="true">
  <!-- Animation is decorative, hidden from screen readers -->
</div>

<div class="auth" aria-hidden="false">
  <!-- Toggled to "true" when dismissed -->
</div>
```

### Keyboard Navigation
- No keyboard interaction during animation
- Focus management handled by BanglaPath.enterHome()

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  .sweep {
    transition: none !important;
  }
  
  .sweep-side {
    animation: none !important;
  }
}
```

**JavaScript Detection**:
```javascript
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (prefersReducedMotion) {
  // Force fast launch even on desktop
  BanglaPath.launch(true);
}
```

## Testing Strategy

### Unit Tests
- Test buildSweep() loads and caches images
- Test paintSide() renders to canvas context
- Test launch() captures profile data correctly
- Test launch() respects fast parameter and viewport width
- Test playSweep() creates animation instances

### Integration Tests
- Test bp-launch event triggers launch sequence
- Test carousel → auth → app flow
- Test skip button bypasses animation
- Test tab switching between Sign Up and Log In

### Visual Regression Tests
- Screenshot comparison before/after animation
- Verify canvas rendering on different viewport sizes
- Check mobile vs desktop UI differences

### Manual Testing Checklist
- [ ] Desktop: Full animation plays smoothly
- [ ] Desktop: Content swap occurs while leaves cover screen
- [ ] Mobile: Immediate launch without animation
- [ ] Resize during intro repaints canvases
- [ ] Resize after launch does nothing
- [ ] Skip button works from carousel
- [ ] Skip button works from auth screen
- [ ] Google/Apple buttons trigger animation
- [ ] Email form submission triggers animation
- [ ] Name/email captured to localStorage
- [ ] Launch flag persists in localStorage

## Implementation Plan

### Step 1: Prepare home.js
1. Add LEAF_LAYOUT constant array
2. Add module-level state variables
3. Create loadBranchImages() helper function
4. Create paintSide() helper function

### Step 2: Implement buildSweep()
1. Move buildSweep logic from script.js to home.js
2. Expose as BanglaPath.buildSweep
3. Call during module initialization
4. Set up resize event listener

### Step 3: Implement playSweep()
1. Move playSweep logic from script.js to home.js
2. Expose as BanglaPath.playSweep
3. Use Web Animations API
4. Handle animation completion callback

### Step 4: Implement launch()
1. Move launch logic from script.js to home.js
2. Expose as BanglaPath.launch
3. Implement mobile/desktop path branching
4. Add profile capture logic
5. Add localStorage persistence
6. Implement animation timing coordination

### Step 5: Update script.js
1. Modify bp-launch event handler to call BanglaPath methods
2. Update button click handlers to use BanglaPath.launch
3. Remove old buildSweep/playSweep/launch definitions
4. Add error logging for missing methods

### Step 6: Test Integration
1. Test all authentication flows
2. Verify animation plays correctly
3. Check mobile/desktop paths
4. Validate localStorage data
5. Test error scenarios

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Image Loading Completeness

*For any* branch configuration in LEAF_LAYOUT, when buildSweep() completes, all unique image sources SHALL be loaded and stored in branchCache.

**Validates: Requirements 1.4**

### Property 2: Canvas Rendering Consistency

*For any* canvas element with class 'sweep-side', when buildSweep() executes, that canvas SHALL receive painted content with dimensions matching the viewport.

**Validates: Requirements 1.5**

### Property 3: Animation Viewport Adaptation

*For any* viewport dimensions at the time playSweep() is called, the animation SHALL execute using those dimensions without layout thrashing or reflows.

**Validates: Requirements 1.8**

### Property 4: Mobile Launch Fast Path

*For any* viewport width ≤768 pixels OR when fast parameter is true, launch() SHALL skip the Leaf_Sweep animation and immediately reveal the application.

**Validates: Requirements 2.1, 2.2**

### Property 5: Desktop Launch Animation Path

*For any* viewport width >768 pixels when fast parameter is false, launch() SHALL execute the full animation sequence including playSweep() and timed content swap.

**Validates: Requirements 3.1**

### Property 6: Profile Data Round-Trip

*For any* valid name and email input values, when launch() executes, querying localStorage for 'banglapath_user_profile' SHALL return an object containing those values with the handle derived from the name.

**Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**

### Property 7: Resize Responsiveness Pre-Launch

*For any* resize event that occurs before launch() is called, when branchCache is populated, both canvas elements SHALL be repainted with the cached images using updated viewport dimensions.

**Validates: Requirements 4.4**

### Property 8: Device Pixel Ratio Clamping

*For any* device pixel ratio value, the canvas rendering SHALL use the minimum of that ratio and 1.25 for calculating canvas dimensions.

**Validates: Requirements 4.5**

### Property 9: Canvas Dimension Calculation

*For any* viewport dimensions, the paintSide() function SHALL calculate canvas width as 82% of window inner width and canvas height as 100% of window inner height, multiplied by the clamped device pixel ratio.

**Validates: Requirements 8.2, 8.3**

### Property 10: Launch Idempotency

*For any* state where launched flag is true, calling launch() again SHALL return immediately without re-executing the launch sequence.

**Validates: Requirements 7.5**

## Security Considerations

### XSS Prevention
- All user input (name, email) sanitized before localStorage storage
- No innerHTML usage with user data
- Handle generation strips non-alphanumeric characters

### CSRF Protection
- No actual authentication occurs (OAuth is mocked)
- Real implementation would require CSRF tokens
- Current implementation is presentation-only

### Content Security Policy
- Images loaded from same origin (/images/)
- No external script dependencies for animation
- No eval() or Function() constructor usage

## Future Enhancements

### Potential Improvements
1. **Progressive Image Loading**: Load low-res placeholders first, upgrade to high-res
2. **Preload Hints**: Add `<link rel="preload">` for branch images
3. **Web Workers**: Offload image loading to background thread
4. **OffscreenCanvas**: Render canvases off main thread (when supported)
5. **Animation Cancellation**: Allow user to skip mid-animation
6. **Customizable Timing**: Make animation duration configurable
7. **Alternative Animations**: Add fade/slide options for variety
8. **Analytics Integration**: Track launch success/failure rates

### Accessibility Improvements
1. Add screen reader announcements for state changes
2. Provide skip animation button for vestibular disorders
3. Respect prefers-reduced-motion system preference
4. Add focus management during transitions

## Maintenance Notes

### Code Ownership
- **script.js**: Intro flow, carousel, auth screen transitions
- **home.js**: Main app, animation functions, launch orchestration
- **style.css**: All visual styling for intro and animation

### Debugging Tips
1. Check browser console for `buildSweep error:` messages
2. Inspect branchCache in devtools after buildSweep() runs
3. Use timeline/performance panel to profile animation
4. Add `console.log` statements to track timing sequence
5. Check localStorage in Application panel for profile data

### Common Issues
- **Canvases not rendering**: Check LEAF_LAYOUT paths, verify images load
- **Animation not playing**: Check Web Animations API support, viewport width
- **Profile not saving**: Check localStorage quota, privacy mode disabled
- **Scroll locked**: Check for uncaught errors in launch sequence

### Performance Monitoring
```javascript
// Add timing marks
performance.mark('launch-start');
BanglaPath.launch(false);
performance.mark('launch-end');
performance.measure('launch-duration', 'launch-start', 'launch-end');
console.log(performance.getEntriesByName('launch-duration')[0].duration);
```

## Conclusion

This design provides a complete technical specification for implementing the three missing animation functions. By moving `buildSweep()`, `playSweep()`, and `launch()` to home.js as methods of the BanglaPath module, we achieve:

- Clean module separation
- Maintainable code organization  
- Proper encapsulation
- Responsive animation behavior
- Robust error handling
- Accessibility compliance
- Performance optimization

The implementation follows modern web development best practices and ensures a smooth, cinematic transition from authentication to the main BanglaPath application.
