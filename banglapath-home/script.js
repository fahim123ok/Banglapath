/* ============================================================
   INTRO FLOW — no scroll, screen-to-screen transitions
   Carousel → Tiger+Auth → Leaf sweep → App
   ============================================================ */
(function IntroFlow() {
  var sc  = document.getElementById('screen-carousel');
  var sa  = document.getElementById('screen-auth');
  if (!sc) return;

  /* ---- carousel ---- */
  var vids  = sc.querySelectorAll('.carousel-video');
  var cdots = sc.querySelectorAll('.cdot');
  var cur   = 0;
  var tmr   = null;

  vids.forEach(function(v) {
    v.muted = true;
    v.playsInline = true;
    v.setAttribute('playsinline', '');
    v.setAttribute('muted', '');
    try { v.play().catch(function(){}); } catch(e) {}
  });

  function jumpTo(idx) {
    var nextIdx = (idx + vids.length) % vids.length;
    if (cur === nextIdx && vids[cur].classList.contains('is-active')) return;

    vids[cur].classList.remove('is-active');
    cdots[cur].classList.remove('is-active');
    cur = nextIdx;
    
    var nextVid = vids[cur];
    nextVid.classList.add('is-active');
    cdots[cur].classList.add('is-active');

    try {
      if (nextVid.paused) {
        var p = nextVid.play();
        if (p) p.catch(function(){});
      }
      // ✅ PRELOAD NEXT VIDEO to eliminate lag
      var nextNextIdx = (cur + 1) % vids.length;
      vids[nextNextIdx].load();
    } catch(e) {}
  }

  function startTimer() {
    clearInterval(tmr);
    tmr = setInterval(function() { jumpTo(cur + 1); }, 3500);
  }

  cdots.forEach(function(d, i) {
    d.addEventListener('click', function() { jumpTo(i); startTimer(); });
  });

  jumpTo(0);
  startTimer();

  /* ---- Get Started → tiger auth (no leaf animation) ---- */
  function goToAuth() {
    clearInterval(tmr);
    sc.style.transition = 'opacity 0.4s ease';
    sc.style.opacity = '0';
    setTimeout(function() {
      sc.classList.add('is-hidden');
      if (sa) {
        sa.classList.remove('is-hidden');
        sa.style.opacity = '0';
        sa.style.transition = 'opacity 0.5s ease';
        requestAnimationFrame(function() { sa.style.opacity = '1'; });
        // start tiger video
        var tv = sa.querySelector('.tiger-bg-video');
        if (tv) tv.play().catch(function(){});
      }
    }, 400);
  }

  var gsBtn = document.getElementById('btn-get-started');
  if (gsBtn) {
    gsBtn.addEventListener('click', goToAuth);
    gsBtn.addEventListener('touchend', function(e) {
      e.preventDefault();
      goToAuth();
    });
  }

  /* ---- Skip → straight to app ---- */
  var skipBtn = document.getElementById('btn-skip-to-app');
  if (skipBtn) {
    skipBtn.addEventListener('click', function() {
      clearInterval(tmr);
      sc.classList.add('is-hidden');
      if (sa) sa.classList.add('is-hidden');
      launch(true);
    });
  }

  /* ---- Back button ---- */
  var backBtn = document.getElementById('btn-auth-back');
  if (backBtn) {
    backBtn.addEventListener('click', function() {
      if (sa) {
        sa.style.opacity = '0';
        setTimeout(function() {
          sa.classList.add('is-hidden');
          sc.classList.remove('is-hidden');
          sc.style.opacity = '1';
          jumpTo(0); startTimer();
        }, 400);
      }
    });
  }

  /* ---- Google / Apple → leaf wipe → app ---- */
  ['btn-google-signin','btn-apple-signin'].forEach(function(id) {
    var btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', function() {
      window.dispatchEvent(new CustomEvent('bp-launch'));
    });
  });
})();

/* ---- Auth tab switching (Sign Up / Log In) ---- */
document.querySelectorAll('.auth-tab-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.auth-tab-btn').forEach(function(b) { b.classList.remove('is-active'); });
    btn.classList.add('is-active');
    var tab = btn.getAttribute('data-tab');
    var signupForm = document.getElementById('form-signup');
    var loginForm  = document.getElementById('form-login');
    if (signupForm && loginForm) {
      if (tab === 'signup') {
        signupForm.classList.remove('is-hidden');
        loginForm.classList.add('is-hidden');
      } else {
        loginForm.classList.remove('is-hidden');
        signupForm.classList.add('is-hidden');
      }
    }
  });
});

/* ---- Email form submit -> launch with leaf sweep ---- */
['form-signup','form-login'].forEach(function(id) {
  var form = document.getElementById(id);
  if (form) form.addEventListener('submit', function(e) {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('bp-launch'));
  });
});

/* Bridge: bp-launch -> launch with leaf sweep */
window.addEventListener('bp-launch', function() {
  if (typeof launch !== 'function') return;
  if (typeof buildSweep === 'function') {
    try { 
      buildSweep();
    } catch(e) {
      if (typeof DEV_MODE !== 'undefined' && DEV_MODE) console.error('buildSweep error:', e);
    }
  }
  setTimeout(function() {
    launch(false); // false = use sweep animation
  }, 50);
});

const track = document.querySelector('.scroll-track');
const tigerLayer = document.querySelector('.tiger-layer');
const deerLayer = document.querySelector('.deer-layer');
const vignette = document.querySelector('.vignette');
const intro = document.querySelector('.caption-intro');
const outro = document.querySelector('.caption-outro');
const auth = document.querySelector('.auth');
const cta = document.querySelector('.cta');
const googleBtn = document.querySelector('.google-btn');
const authTitle = document.querySelector('.auth-title');
const authSub = document.querySelector('.auth-sub');
const authSubmit = document.querySelector('.auth-submit');

const tigerVideo = document.querySelector('video.tiger');
const deerVideo = document.querySelector('video.deer');

const MAX_ZOOM = 70;
const SOURCE_ASPECT = 16 / 9;
// Normalized position of the pupil the camera pushes through.
const TIGER_EYE = { x: 0.406, y: 0.323 };

const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
const range = (v, a, b) => clamp((v - a) / (b - a));
const lerp = (a, b, t) => a + (b - a) * t;
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

let progress = 0;
let ticking = false;
let launched = false;
let lockedAt = 0;

// A reload should always open on the wide tiger shot, never halfway down the
// dive where the browser left the scroll position.
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);
window.addEventListener('load', () => window.scrollTo(0, 0));

// object-fit: cover crops the video, so a point's position inside the
// element box shifts with the viewport aspect ratio.
function coverOrigin(point) {
  const viewAspect = window.innerWidth / window.innerHeight;
  let ox = point.x;
  let oy = point.y;
  if (viewAspect > SOURCE_ASPECT) {
    const visible = SOURCE_ASPECT / viewAspect; // visible fraction of height
    oy = (point.y - (1 - visible) / 2) / visible;
  } else {
    const visible = viewAspect / SOURCE_ASPECT; // visible fraction of width
    ox = (point.x - (1 - visible) / 2) / visible;
  }
  return `${clamp(ox) * 100}% ${clamp(oy) * 100}%`;
}

function setOrigin() {
  if (!tigerLayer) return;
  tigerLayer.style.transformOrigin = coverOrigin(TIGER_EYE);
}

function readProgress() {
  if (!track) { progress = 0; return; }
  const scrollable = track.offsetHeight - window.innerHeight;
  progress = scrollable > 0 ? clamp(window.scrollY / scrollable) : 0;
}

function setPlaying(video, shouldPlay) {
  if (shouldPlay && video.paused) {
    const p = video.play();
    if (p) p.catch(() => {});
  } else if (!shouldPlay && !video.paused) {
    video.pause();
  }
}

function render() {
  ticking = false;
  if (launched) return;
  if (!tigerLayer) return; // new screen-based intro - no scroll animation needed

  // Phase 1 (0 -> 0.7): push through the tiger's pupil.
  const zoomT = easeInOutCubic(range(progress, 0, 0.7));
  tigerLayer.style.transform = `scale(${Math.pow(MAX_ZOOM, zoomT)})`;
  // Darken as the pupil fills the frame; also hides upscaling softness.
  const dark = range(progress, 0.4, 0.66);
  tigerLayer.style.filter = `brightness(${lerp(1, 0.05, dark)}) saturate(${lerp(1, 0.4, dark)})`;
  tigerLayer.style.opacity = `${1 - range(progress, 0.62, 0.74)}`;

  // Phase 2 (0.66 -> 1): the deer scene opens up on the other side.
  const revealT = easeInOutCubic(range(progress, 0.66, 1));
  deerLayer.style.opacity = `${range(progress, 0.66, 0.82)}`;
  deerLayer.style.transform = `scale(${lerp(1.6, 1, revealT)})`;
  deerLayer.style.filter = `brightness(${lerp(0.25, 1, range(progress, 0.68, 0.9))})`;

  // Only the visible clip plays.
  setPlaying(tigerVideo, progress < 0.72);
  setPlaying(deerVideo, progress > 0.6);

  vignette.style.opacity = `${lerp(0.55, 0.2, revealT)}`;

  const introOpacity = 1 - range(progress, 0, 0.12);
  intro.style.opacity = `${introOpacity}`;
  intro.style.visibility = introOpacity > 0.01 ? 'visible' : 'hidden';

  // The outro line hands over to the sign-up card.
  outro.style.opacity = `${range(progress, 0.8, 0.88) * (1 - range(progress, 0.88, 0.94))}`;
  if (auth) { auth.classList.toggle('is-visible', progress > 0.92); auth.setAttribute('aria-hidden', progress > 0.92 ? 'false' : 'true'); }
}

function blockScroll(e) {
  e.preventDefault();
}

function onScroll() {
  if (launched) {
    window.scrollTo(0, lockedAt);
    return;
  }
  setOrigin();
  readProgress();
  if (!ticking) {
    ticking = true;
    requestAnimationFrame(render);
  }
}

// Sign up / log in toggle.
document.querySelectorAll('.auth-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    const isLogin = tab.dataset.mode === 'login';
    document.querySelectorAll('.auth-tab').forEach((t) => t.classList.toggle('is-active', t === tab));
    if (auth) auth.classList.toggle('is-login', isLogin);
    if (authTitle) authTitle.textContent = isLogin ? 'Welcome back' : 'Create your account';
    if (authSub) authSub.textContent = isLogin
      ? 'Pick up where you left off.'
      : 'Start exploring Bangladesh, one wild place at a time.';
    if (authSubmit) authSubmit.textContent = isLogin ? 'Log in' : 'Create account';
  });
});

document.querySelector('.auth-form')?.addEventListener('submit', (e) => {
  e.preventDefault();
  launch();
});

// A hand-rolled scroll animation: the browser's smooth scroll is too quick
// and too even for a cinematic push through the eye.
let autoScroll = null;

function cancelAutoScroll() {
  autoScroll = null;
}

function startAutoScroll(to, duration) {
  const from = window.scrollY;
  const distance = to - from;
  if (Math.abs(distance) < 2) return;

  const run = { start: performance.now() };
  autoScroll = run;

  const step = (now) => {
    if (autoScroll !== run) return; // cancelled by the user
    const t = clamp((now - run.start) / duration);
    // Ease slowly out of the wide shot, accelerate through the pupil,
    // then settle gently into the deer scene.
    const eased = t < 0.5
      ? 4 * Math.pow(t, 3.2)
      : 1 - Math.pow(-2 * t + 2, 2.6) / 2;
    window.scrollTo(0, from + distance * eased);
    if (t < 1) requestAnimationFrame(step);
    else cancelAutoScroll();
  };

  requestAnimationFrame(step);
}

['wheel', 'touchstart', 'keydown'].forEach((evt) =>
  window.addEventListener(evt, cancelAutoScroll, { passive: true })
);

// Foliage that swings in from both edges to wipe between scenes.
const LEAF_LAYOUT = [
  { src: 'images/branch-b-soft.png', w: 78, top: -14, off: -12, rot: -6 },
  { src: 'images/branch-b-soft.png', w: 70, top: 10, off: 4, rot: 8 },
  { src: 'images/branch-a-soft.png', w: 52, top: 2, off: 26, rot: 16 },
  { src: 'images/branch-b-soft.png', w: 72, top: 30, off: -8, rot: 174 },
  { src: 'images/branch-a-soft.png', w: 50, top: 24, off: 30, rot: -14 },
  { src: 'images/branch-b-soft.png', w: 66, top: 50, off: 6, rot: 188 },
  { src: 'images/branch-a-soft.png', w: 56, top: 44, off: 28, rot: 196 },
  { src: 'images/branch-b-soft.png', w: 74, top: 66, off: -6, rot: 168 },
  { src: 'images/branch-a-soft.png', w: 48, top: 62, off: 32, rot: -18 },
  { src: 'images/branch-b-soft.png', w: 68, top: 78, off: 12, rot: 184 },
  { src: 'images/branch-b-soft.png', w: 64, top: 14, off: -14, rot: 178 },
  { src: 'images/branch-a-soft.png', w: 54, top: 40, off: -10, rot: 22 }
];

const SIDE_WIDTH = 0.82; // keep in sync with .sweep-side width

function loadBranchImages() {
  const cache = new Map();
  return Promise.all(
    [...new Set(LEAF_LAYOUT.map((l) => l.src))].map(
      (src) =>
        new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            cache.set(src, img);
            resolve();
          };
          img.onerror = resolve;
          img.src = src;
        })
    )
  ).then(() => cache);
}

// Every branch is baked into one canvas per side, so the sweep composites
// two flat textures instead of two dozen overlapping alpha layers.
function paintSide(side, cache) {
  const mirrored = side.classList.contains('sweep-right');
  const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
  const vw = window.innerWidth / 100;
  const vh = window.innerHeight / 100;
  const width = SIDE_WIDTH * window.innerWidth;
  const height = window.innerHeight;

  const canvas = side.querySelector('canvas') || document.createElement('canvas');
  canvas.className = 'sweep-canvas';
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  if (!canvas.parentNode) side.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  LEAF_LAYOUT.forEach((leaf) => {
    const img = cache.get(leaf.src);
    if (!img) return;

    const w = leaf.w * vw;
    const h = (w * img.naturalHeight) / img.naturalWidth;
    const left = mirrored ? width - leaf.off * vw - w : leaf.off * vw;
    const top = leaf.top * vh;

    ctx.save();
    ctx.translate(left + w / 2, top + h / 2);
    ctx.rotate((((mirrored ? -1 : 1) * leaf.rot) * Math.PI) / 180);
    ctx.scale(mirrored ? -1 : 1, 1);
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();
  });

  // The two sides overlap in the middle; fade each one out towards its inner
  // edge so the seam and the doubled-up foliage never read as a rectangle.
  const fade = ctx.createLinearGradient(
    mirrored ? width * 0.34 : width * 0.66,
    0,
    mirrored ? 0 : width,
    0
  );
  fade.addColorStop(0, 'rgba(0, 0, 0, 0)');
  fade.addColorStop(1, 'rgba(0, 0, 0, 1)');
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = 'source-over';
}

let branchCache = null;

function buildSweep() {
  loadBranchImages().then((cache) => {
    branchCache = cache;
    document.querySelectorAll('.sweep-side').forEach((side) => paintSide(side, cache));
  });
}

window.addEventListener('resize', () => {
  if (!branchCache || launched) return;
  document.querySelectorAll('.sweep-side').forEach((side) => paintSide(side, branchCache));
});

function playSweep() {
  const sweep = document.querySelector('.sweep');
  sweep.classList.add('is-active');

  document.querySelectorAll('.sweep-side').forEach((side) => {
    const dir = side.classList.contains('sweep-right') ? 1 : -1;
    const out = (y, r) =>
      `translate3d(${dir * 118}%, ${y}%, 0) rotate(${dir * r}deg)`;

    // Swing in with weight, settle past centre, hold, then sweep back out.
    side.animate(
      [
        { transform: out(-4, 5), offset: 0, easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)' },
        { transform: `translate3d(${dir * -8}%, 1%, 0) rotate(${dir * -1.2}deg)`, offset: 0.34, easing: 'cubic-bezier(0.4, 0, 0.5, 1)' },
        { transform: `translate3d(${dir * -5}%, 0, 0) rotate(0deg)`, offset: 0.46, easing: 'ease-in-out' },
        { transform: `translate3d(${dir * -5}%, -1%, 0) rotate(${dir * 0.8}deg)`, offset: 0.6, easing: 'cubic-bezier(0.5, 0, 0.75, 0.35)' },
        { transform: out(2, 6), offset: 1 }
      ],
      {
        duration: 3600,
        delay: dir === 1 ? 90 : 0,
        fill: 'forwards'
      }
    ).onfinish = () => sweep.classList.remove('is-active');
  });
}

// Reliable helper for instant touch and click execution on mobile & desktop
function bindTapOrClick(el, handler) {
  if (!el) return;
  let executed = false;
  const trigger = (e) => {
    if (executed) return;
    executed = true;
    if (e) {
      if (typeof e.stopPropagation === 'function') e.stopPropagation();
    }
    handler();
    setTimeout(() => { executed = false; }, 350);
  };

  el.addEventListener('click', trigger);
  el.addEventListener('touchend', (e) => {
    e.preventDefault();
    trigger(e);
  }, { passive: false });
  el.addEventListener('pointerup', (e) => {
    if (e.pointerType === 'touch' || e.pointerType === 'pen') {
      trigger(e);
    }
  });
}

// Signing in is a demo hook: it dissolves the card and wipes to the home
// screen with foliage instead of running a real OAuth flow.
function launch(fast = false) {
  if (launched) return;
  launched = true;
  cancelAutoScroll();

  // Capture user name / email if provided
  const nameVal = document.querySelector('input[name="name"]')?.value.trim();
  const emailVal = document.querySelector('input[name="email"]')?.value.trim();
  if (nameVal || emailVal) {
    try {
      const existing = JSON.parse(localStorage.getItem('banglapath_user_profile') || '{}');
      if (nameVal) {
        existing.name = nameVal;
        existing.handle = nameVal.toLowerCase().replace(/[^a-z0-9]/g, '');
      }
      if (emailVal) existing.email = emailVal;
      localStorage.setItem('banglapath_user_profile', JSON.stringify(existing));
    } catch (err) {}
  }
  try {
    localStorage.setItem('bp_launched', 'true');
  } catch (err) {}

  if(auth) auth.classList.add('is-dismissed');
  if(auth) auth.setAttribute('aria-hidden','true');

  const revealMobileNav = () => {
    const mobileNav = document.querySelector('.mh-bottom-nav');
    if (mobileNav) {
      mobileNav.style.removeProperty('display');
      mobileNav.classList.remove('is-hidden');
    }
  };

  /**
   * FIX: Always call enterHome() — poll until window.BanglaPath is ready.
   * This eliminates the white screen caused by a race condition where
   * home.js hadn't finished evaluating yet when launch() was called,
   * causing the fallback to skip enterHome() entirely, leaving a
   * blank/white app shell with no content rendered.
   */
  function doEnterHome() {
    const appEl = document.getElementById('app');
    if (appEl) {
      appEl.hidden = false;
      appEl.classList.add('is-open');
      appEl.style.opacity = '1';
    }
    const mobileHome = document.getElementById('mobile-home');
    if (mobileHome) {
      mobileHome.hidden = false;
      mobileHome.classList.add('is-open');
      mobileHome.style.opacity = '1';
    }

    if (window.BanglaPath && typeof window.BanglaPath.enterHome === 'function') {
      window.BanglaPath.enterHome();
    } else {
      let attempts = 0;
      const poll = setInterval(() => {
        attempts++;
        if (window.BanglaPath && typeof window.BanglaPath.enterHome === 'function') {
          clearInterval(poll);
          window.BanglaPath.enterHome();
        } else if (attempts > 100) {
          clearInterval(poll);
        }
      }, 30);
    }
  }

  if (fast) {
    document.getElementById('screen-carousel')?.classList.add('is-hidden');
    document.getElementById('screen-auth')?.classList.add('is-hidden');
    document.body.classList.add('is-launched');
    tigerVideo?.pause();
    deerVideo?.pause();
    revealMobileNav();
    doEnterHome();
    return;
  }

  lockedAt = window.scrollY;
  document.body.classList.add('is-launching');
  window.addEventListener('wheel', blockScroll, { passive: false });
  window.addEventListener('touchmove', blockScroll, { passive: false });

  // Play the leaf sweep animation immediately
  playSweep();
  
  // Swap the scene underneath while the leaves cover the screen (~600ms)
  setTimeout(() => {
    document.getElementById('screen-carousel')?.classList.add('is-hidden');
    document.getElementById('screen-auth')?.classList.add('is-hidden');
    document.body.classList.add('is-launched');
    tigerVideo?.pause();
    deerVideo?.pause();
    revealMobileNav();
    doEnterHome();
    window.removeEventListener('wheel', blockScroll);
    window.removeEventListener('touchmove', blockScroll);
  }, 600);
}

// Wire CTA & Skip buttons for instant mobile tap + desktop click
bindTapOrClick(cta, () => launch(false));
bindTapOrClick(document.getElementById('btn-skip-intro'), () => launch(true));
bindTapOrClick(document.getElementById('btn-quick-skip'), () => launch(true));

/* ============================================================
   SERVICE WORKER REGISTRATION FOR PWA OFFLINE SUPPORT
   ============================================================ */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        if (typeof DEV_MODE !== 'undefined' && DEV_MODE) console.log('[SW] Service Worker registered:', registration.scope);
      })
      .catch((error) => {
        if (typeof DEV_MODE !== 'undefined' && DEV_MODE) console.log('[SW] Service Worker registration failed:', error);
      });
  });
}

// Universal fallback delegation for touchscreens and mobile viewports
['click', 'touchend'].forEach((evtType) => {
  document.addEventListener(evtType, (e) => {
    if (launched) return;
    const target = e.target && e.target.closest && e.target.closest('#btn-skip-intro, #btn-quick-skip, .cta, .cta-skip, .corner-skip-btn');
    if (target) {
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();
      const isQuick = target.id === 'btn-skip-intro' || target.id === 'btn-quick-skip' || target.classList.contains('cta-skip') || target.classList.contains('corner-skip-btn');
      launch(isQuick);
    }
  }, { passive: false });
});

// Wire auth modal buttons
const googleBtnEl = document.getElementById('btn-google-signin');
const appleBtnEl = document.getElementById('btn-apple-signin');
if (googleBtnEl) bindTapOrClick(googleBtnEl, () => launch(false));
if (appleBtnEl) bindTapOrClick(appleBtnEl, () => launch(false));

document.querySelectorAll('.auth-submit-btn, .auth-submit').forEach(btn => {
  bindTapOrClick(btn, () => launch(false));
});

buildSweep();

// Some browsers block autoplay until the user interacts with the page.
['pointerdown', 'keydown', 'touchstart', 'wheel'].forEach((evt) =>
  window.addEventListener(evt, () => render(), { once: true, passive: true })
);

window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll);
setOrigin();
readProgress();
render();

if (location.hash === '#home') {
  launch(true);
}

// Deep links such as ?view=place must not leave the real app hidden behind
// the intro screen after a browser refresh.
if (new URL(location.href).searchParams.has('view')) {
  launch(true);
}
















