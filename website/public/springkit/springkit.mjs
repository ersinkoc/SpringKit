// src/core/config.ts
var defaultConfig = {
  stiffness: 100,
  damping: 10,
  mass: 1,
  velocity: 0,
  restSpeed: 0.01,
  restDelta: 0.01,
  clamp: false
};
var springPresets = {
  default: { stiffness: 100, damping: 10 },
  gentle: { stiffness: 120, damping: 14 },
  wobbly: { stiffness: 180, damping: 12 },
  stiff: { stiffness: 210, damping: 20 },
  slow: { stiffness: 280, damping: 60 },
  molasses: { stiffness: 280, damping: 120 },
  bounce: { stiffness: 200, damping: 8 },
  noWobble: { stiffness: 170, damping: 26 }
};
var physicsPresets = {
  // ---- UI Interactions ----
  /** Button press/release - snappy response */
  button: { stiffness: 400, damping: 30, mass: 1 },
  /** Toggle switch - quick but smooth */
  toggle: { stiffness: 500, damping: 35, mass: 0.8 },
  /** Checkbox/Radio - instant feedback */
  checkbox: { stiffness: 600, damping: 40, mass: 0.5 },
  /** Hover state - subtle and responsive */
  hover: { stiffness: 300, damping: 25, mass: 0.8 },
  /** Focus ring - gentle attention */
  focus: { stiffness: 200, damping: 20, mass: 1 },
  // ---- Layout & Navigation ----
  /** Page transitions - smooth and professional */
  pageTransition: { stiffness: 100, damping: 20, mass: 1.5 },
  /** Modal/Dialog entry - dramatic but controlled */
  modalEnter: { stiffness: 300, damping: 25, mass: 1 },
  /** Modal/Dialog exit - quick departure */
  modalExit: { stiffness: 400, damping: 35, mass: 0.8 },
  /** Sidebar slide - smooth glide */
  sidebar: { stiffness: 200, damping: 28, mass: 1.2 },
  /** Dropdown menu - snappy reveal */
  dropdown: { stiffness: 400, damping: 30, mass: 0.8 },
  /** Toast notification - attention-grabbing */
  toast: { stiffness: 350, damping: 25, mass: 0.9 },
  /** Tooltip - quick and subtle */
  tooltip: { stiffness: 500, damping: 40, mass: 0.6 },
  // ---- Gestures & Drag ----
  /** Drag release - momentum with settle */
  dragRelease: { stiffness: 150, damping: 20, mass: 1 },
  /** Swipe action - decisive movement */
  swipe: { stiffness: 250, damping: 22, mass: 0.9 },
  /** Pull to refresh - elastic and responsive */
  pullToRefresh: { stiffness: 180, damping: 18, mass: 1.2 },
  /** Snap to position - magnetic feel */
  snap: { stiffness: 400, damping: 35, mass: 0.8 },
  /** Rubber band - iOS-style overscroll */
  rubberBand: { stiffness: 300, damping: 15, mass: 0.8 },
  // ---- Cards & Items ----
  /** Card flip - dramatic reveal */
  cardFlip: { stiffness: 150, damping: 18, mass: 1.5 },
  /** Card hover lift - subtle elevation */
  cardHover: { stiffness: 400, damping: 30, mass: 0.7 },
  /** List item enter - staggered animation */
  listItem: { stiffness: 300, damping: 28, mass: 0.9 },
  /** Accordion expand - smooth reveal */
  accordion: { stiffness: 200, damping: 25, mass: 1.1 },
  // ---- Loading & Progress ----
  /** Skeleton shimmer - continuous flow */
  skeleton: { stiffness: 80, damping: 15, mass: 2 },
  /** Progress bar - steady advancement */
  progress: { stiffness: 150, damping: 25, mass: 1 },
  /** Spinner rotation - smooth continuous */
  spinner: { stiffness: 100, damping: 12, mass: 1.5 },
  // ---- Emphasis & Attention ----
  /** Pulse effect - gentle attention */
  pulse: { stiffness: 120, damping: 10, mass: 1.2 },
  /** Shake effect - error emphasis */
  shake: { stiffness: 500, damping: 15, mass: 0.6 },
  /** Bounce effect - playful emphasis */
  bounceAttention: { stiffness: 400, damping: 10, mass: 0.7 },
  /** Pop effect - sudden appearance */
  pop: { stiffness: 500, damping: 20, mass: 0.6 },
  /** Wiggle effect - playful motion */
  wiggle: { stiffness: 300, damping: 8, mass: 0.8 },
  // ---- Mobile-Specific ----
  /** iOS spring - Apple-like feel */
  ios: { stiffness: 300, damping: 20, mass: 1 },
  /** Android spring - Material Design feel */
  android: { stiffness: 350, damping: 25, mass: 0.9 },
  /** Haptic feedback - quick micro-interaction */
  haptic: { stiffness: 600, damping: 45, mass: 0.4 },
  // ---- Natural Physics ----
  /** Pendulum - gravity-like swing */
  pendulum: { stiffness: 50, damping: 5, mass: 2 },
  /** Jelly - soft and wobbly */
  jelly: { stiffness: 150, damping: 8, mass: 1.5 },
  /** Elastic - stretchy rubber */
  elastic: { stiffness: 200, damping: 10, mass: 1.2 },
  /** Heavy - weighted and deliberate */
  heavy: { stiffness: 150, damping: 30, mass: 3 },
  /** Light - airy and quick */
  light: { stiffness: 400, damping: 25, mass: 0.5 },
  /** Liquid - fluid motion */
  liquid: { stiffness: 100, damping: 20, mass: 2 }
};
function getPhysicsPreset(name) {
  return { ...physicsPresets[name] };
}
function createFeeling(feeling) {
  switch (feeling) {
    case "snappy":
      return { stiffness: 400, damping: 30, mass: 0.8 };
    case "smooth":
      return { stiffness: 150, damping: 25, mass: 1.2 };
    case "bouncy":
      return { stiffness: 300, damping: 12, mass: 1 };
    case "heavy":
      return { stiffness: 100, damping: 30, mass: 2.5 };
    case "light":
      return { stiffness: 400, damping: 25, mass: 0.5 };
    case "elastic":
      return { stiffness: 200, damping: 10, mass: 1.2 };
    default:
      return { stiffness: 100, damping: 10, mass: 1 };
  }
}
function adjustSpeed(preset, speed) {
  const safeSpeed = Number.isFinite(speed) && speed > 0 ? speed : 1;
  const stiffness = (preset.stiffness ?? 100) * safeSpeed;
  const damping = (preset.damping ?? 10) * Math.sqrt(safeSpeed);
  return { ...preset, stiffness, damping };
}
function adjustBounce(preset, bounce) {
  const minDamping = 5;
  const maxDamping = 40;
  const safeBounce = Number.isFinite(bounce) ? bounce : 0;
  const damping = maxDamping - safeBounce * (maxDamping - minDamping);
  return { ...preset, damping: Math.max(minDamping, Math.min(maxDamping, damping)) };
}
function perceptualSpringConfig(durationMs, bounce = 0, mass = 1) {
  const seconds = (Number.isFinite(durationMs) && durationMs > 0 ? durationMs : 500) / 1e3;
  const safeBounce = Math.min(1, Math.max(-1, Number.isFinite(bounce) ? bounce : 0));
  const safeMass = Number.isFinite(mass) && mass > 0 ? mass : 1;
  const zeta = safeBounce >= 0 ? 1 - safeBounce : 1 / Math.max(1e-3, 1 + safeBounce);
  const stiffness = Math.pow(2 * Math.PI / seconds, 2) * safeMass;
  const damping = 4 * Math.PI * zeta * safeMass / seconds;
  return { stiffness, damping, mass: safeMass };
}
function configFromDuration(ms) {
  return perceptualSpringConfig(ms, 0);
}
function configFromBounce(bounce) {
  return perceptualSpringConfig(500, bounce);
}

// src/core/physics.ts
var FIXED_TIME_STEP = 1 / 60;
function simulateSpring(position, velocity, target, config, timeStep = FIXED_TIME_STEP) {
  const {
    stiffness = 100,
    damping = 10,
    mass = 1,
    restSpeed = 0.01,
    restDelta = 0.01
  } = config;
  const displacement = target - position;
  const absDisplacement = Math.abs(displacement);
  const absVelocity = Math.abs(velocity);
  if (absDisplacement <= restDelta && absVelocity <= restSpeed) {
    return {
      position: target,
      // Snap to exact target
      velocity: 0,
      isRest: true
    };
  }
  const dt = Number.isFinite(timeStep) && timeStep >= 0 ? timeStep : FIXED_TIME_STEP;
  const springForce = stiffness * displacement;
  const dampingForce = absVelocity > 1e-4 ? damping * velocity : 0;
  const safeMass = mass === 0 ? 1e-3 : mass;
  const acceleration = (springForce - dampingForce) / safeMass;
  const newVelocity = velocity + acceleration * dt;
  const newPosition = position + newVelocity * dt;
  const newDisplacement = Math.abs(target - newPosition);
  const isRest = newDisplacement <= restDelta && Math.abs(newVelocity) <= restSpeed;
  return {
    position: newPosition,
    velocity: newVelocity,
    isRest
  };
}
var coefficientCache = [];
var COEFFICIENT_CACHE_SIZE = 32;
function springCoefficients(config) {
  const stiffness = positiveOr(config.stiffness, 100);
  const mass = positiveOr(config.mass, 1);
  const damping = typeof config.damping === "number" && Number.isFinite(config.damping) && config.damping >= 0 ? config.damping : 10;
  for (let i = coefficientCache.length - 1; i >= 0; i--) {
    const c2 = coefficientCache[i];
    if (c2.stiffness === stiffness && Object.is(c2.damping, damping) && c2.mass === mass) return c2;
  }
  const c = createCoefficients(stiffness, damping, mass);
  if (coefficientCache.length >= COEFFICIENT_CACHE_SIZE) coefficientCache.shift();
  coefficientCache.push(c);
  return c;
}
function createCoefficients(stiffness, damping, mass) {
  const omega0 = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));
  const zw = zeta * omega0;
  let regime;
  let omegaD = 0;
  let r1 = 0;
  let r2 = 0;
  if (Math.abs(zeta - 1) < 1e-6) {
    regime = 0;
  } else if (zeta < 1) {
    regime = 1;
    omegaD = omega0 * Math.sqrt(1 - zeta * zeta);
  } else {
    regime = 2;
    const root = omega0 * Math.sqrt(zeta * zeta - 1);
    r1 = -zw + root;
    r2 = -zw - root;
  }
  return {
    regime,
    stiffness,
    damping,
    mass,
    omega0,
    zeta,
    zw,
    omegaD,
    r1,
    r2,
    dr: r2 - r1,
    t: NaN,
    e1: 0,
    e2: 0,
    e3: 0
  };
}
function evalSpringMotion(c, x0, v0, t, out) {
  if (c.regime === 1) {
    const zw = c.zw;
    const omegaD = c.omegaD;
    if (t !== c.t) {
      c.e1 = Math.exp(-zw * t);
      c.e2 = Math.cos(omegaD * t);
      c.e3 = Math.sin(omegaD * t);
      c.t = t;
    }
    const envelope = c.e1;
    const cos = c.e2;
    const sin = c.e3;
    const b = (v0 + zw * x0) / omegaD;
    out.position = envelope * (x0 * cos + b * sin);
    out.velocity = envelope * ((b * omegaD - zw * x0) * cos - (x0 * omegaD + zw * b) * sin);
    return out;
  }
  if (c.regime === 0) {
    const omega0 = c.omega0;
    if (t !== c.t) {
      c.e1 = Math.exp(-omega0 * t);
      c.t = t;
    }
    const envelope = c.e1;
    const b = v0 + omega0 * x0;
    out.position = envelope * (x0 + b * t);
    out.velocity = envelope * (b - omega0 * (x0 + b * t));
    return out;
  }
  const r1 = c.r1;
  const r2 = c.r2;
  if (t !== c.t) {
    c.e1 = Math.exp(r1 * t);
    c.e2 = Math.exp(r2 * t);
    c.t = t;
  }
  const e1 = c.e1;
  const e2 = c.e2;
  const c2 = (v0 - r1 * x0) / c.dr;
  const c1 = x0 - c2;
  out.position = c1 * e1 + c2 * e2;
  out.velocity = c1 * r1 * e1 + c2 * r2 * e2;
  return out;
}
function springMotion(config, x0, v0) {
  const c = springCoefficients(config);
  const omega0 = c.omega0;
  const zw = c.zw;
  if (c.regime === 0) {
    const b = v0 + omega0 * x0;
    return (t) => {
      const envelope = Math.exp(-omega0 * t);
      return {
        position: envelope * (x0 + b * t),
        velocity: envelope * (b - omega0 * (x0 + b * t))
      };
    };
  }
  if (c.regime === 1) {
    const omegaD = c.omegaD;
    const b = (v0 + zw * x0) / omegaD;
    return (t) => {
      const envelope = Math.exp(-zw * t);
      const cos = Math.cos(omegaD * t);
      const sin = Math.sin(omegaD * t);
      return {
        position: envelope * (x0 * cos + b * sin),
        velocity: envelope * ((b * omegaD - zw * x0) * cos - (x0 * omegaD + zw * b) * sin)
      };
    };
  }
  const r1 = c.r1;
  const r2 = c.r2;
  const c2 = (v0 - r1 * x0) / c.dr;
  const c1 = x0 - c2;
  return (t) => {
    const e1 = Math.exp(r1 * t);
    const e2 = Math.exp(r2 * t);
    return {
      position: c1 * e1 + c2 * e2,
      velocity: c1 * r1 * e1 + c2 * r2 * e2
    };
  };
}
function stepSpring(position, velocity, target, config, dt) {
  return stepSpringInto(
    { position: 0, velocity: 0, isRest: false },
    position,
    velocity,
    target,
    springCoefficients(config),
    config.restSpeed ?? 0.01,
    config.restDelta ?? 0.01,
    dt
  );
}
function stepSpringInto(out, position, velocity, target, c, restSpeed, restDelta, dt) {
  if (Math.abs(target - position) <= restDelta && Math.abs(velocity) <= restSpeed) {
    out.position = target;
    out.velocity = 0;
    out.isRest = true;
    return out;
  }
  if (!(dt > 0)) {
    out.position = position;
    out.velocity = velocity;
    out.isRest = false;
    return out;
  }
  evalSpringMotion(c, position - target, velocity, dt, out);
  const displacement = out.position;
  out.position = target + displacement;
  out.isRest = Math.abs(displacement) <= restDelta && Math.abs(out.velocity) <= restSpeed;
  return out;
}
function positiveOr(value, fallback) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : fallback;
}
function calculatePeriod(stiffness, mass) {
  const safeStiffness = stiffness <= 0 ? 1e-3 : stiffness;
  return 2 * Math.PI * Math.sqrt(mass / safeStiffness);
}
function calculateDampingRatio(damping, stiffness, mass) {
  const safeStiffness = stiffness <= 0 ? 1e-3 : stiffness;
  const safeMass = mass <= 0 ? 1e-3 : mass;
  return damping / (2 * Math.sqrt(safeStiffness * safeMass));
}
function isUnderdamped(config) {
  const { stiffness = 100, damping = 10, mass = 1 } = config;
  const ratio = calculateDampingRatio(damping, stiffness, mass);
  return ratio < 1;
}
function isCriticallyDamped(config) {
  const { stiffness = 100, damping = 10, mass = 1 } = config;
  const ratio = calculateDampingRatio(damping, stiffness, mass);
  return Math.abs(ratio - 1) < 1e-3;
}
function isOverdamped(config) {
  const { stiffness = 100, damping = 10, mass = 1 } = config;
  const ratio = calculateDampingRatio(damping, stiffness, mass);
  return ratio > 1;
}

// src/utils/warnings.ts
var isDev = typeof process !== "undefined" && process.env?.NODE_ENV !== "production";
var warnedMessages = /* @__PURE__ */ new Set();
function warnOnce(message) {
  if (!isDev || warnedMessages.has(message)) return;
  warnedMessages.add(message);
  console.warn(`[SpringKit] ${message}`);
}
function errorOnce(message) {
  const key = `error:${message}`;
  if (!isDev || warnedMessages.has(key)) return;
  warnedMessages.add(key);
  console.error(`[SpringKit] ${message}`);
}
function validateSpringConfig(config) {
  if (!isDev) return;
  const { stiffness = 100, damping = 10, mass = 1 } = config;
  if (stiffness > 400 && damping < 10) {
    warnOnce(
      `High stiffness (${stiffness}) with low damping (${damping}) may cause excessive oscillation. Consider increasing damping to at least ${Math.round(stiffness / 20)} for smoother animation.`
    );
  }
  if (stiffness < 20) {
    warnOnce(
      `Very low stiffness (${stiffness}) will result in sluggish animation. Consider using stiffness >= 50 for more responsive feel.`
    );
  }
  if (damping > stiffness) {
    warnOnce(
      `Damping (${damping}) is higher than stiffness (${stiffness}), which removes the "springy" feel. Consider reducing damping for bouncier animation.`
    );
  }
  if (mass <= 0) {
    warnOnce(
      `Mass must be positive. Got ${mass}. Using default mass of 1.`
    );
  }
  if (mass > 10) {
    warnOnce(
      `High mass (${mass}) will make the animation very slow. Consider mass between 0.5 and 5 for typical use cases.`
    );
  }
}
function validateDragConfig(config) {
  if (!isDev) return;
  const { rubberBandFactor, bounds } = config;
  if (rubberBandFactor !== void 0 && (rubberBandFactor < 0 || rubberBandFactor > 1)) {
    warnOnce(
      `rubberBandFactor should be between 0 and 1. Got ${rubberBandFactor}. Values outside this range may cause unexpected behavior.`
    );
  }
  if (bounds) {
    if (bounds.left !== void 0 && bounds.right !== void 0 && bounds.left > bounds.right) {
      warnOnce(
        `Drag bounds are inverted: left (${bounds.left}) > right (${bounds.right}). This may cause unexpected behavior.`
      );
    }
    if (bounds.top !== void 0 && bounds.bottom !== void 0 && bounds.top > bounds.bottom) {
      warnOnce(
        `Drag bounds are inverted: top (${bounds.top}) > bottom (${bounds.bottom}). This may cause unexpected behavior.`
      );
    }
  }
}
function validateDecayConfig(config) {
  if (!isDev) return;
  const { velocity, deceleration = 0.998 } = config;
  if (velocity === 0) {
    warnOnce(
      `Decay animation started with zero velocity. The animation will complete immediately.`
    );
  }
  if (deceleration <= 0 || deceleration >= 1) {
    warnOnce(
      `Deceleration should be between 0 and 1 (exclusive). Got ${deceleration}. Typical values are 0.99 (fast) to 0.998 (normal), applied per millisecond.`
    );
  }
}
function validateAnimationValue(value, context) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    errorOnce(`Invalid animation value in ${context}: expected number, got ${value}`);
    return 0;
  }
  if (!Number.isFinite(value)) {
    errorOnce(`Invalid animation value in ${context}: Infinity is not supported`);
    return 0;
  }
  return value;
}
function clearWarnings() {
  warnedMessages.clear();
}

// src/animation/loop.ts
var AnimationState = /* @__PURE__ */ ((AnimationState2) => {
  AnimationState2["Idle"] = "idle";
  AnimationState2["Running"] = "running";
  AnimationState2["Paused"] = "paused";
  AnimationState2["Complete"] = "complete";
  return AnimationState2;
})(AnimationState || {});
var MAX_DELTA_TIME = 64;
var DELAY_EPSILON = 1e-6;
var AnimationLoop = class {
  constructor() {
    // Strong set: an animation must stay alive while it is running, otherwise
    // `spring(...).start()` without keeping the return value could be GC'd.
    this.animations = /* @__PURE__ */ new Set();
    this.rafId = null;
    // The scheduler the pending frame was requested with. If the global
    // requestAnimationFrame is swapped (e.g. a test clock is installed or
    // removed) the pending frame is moved to the new scheduler, otherwise the
    // loop would wait on a clock that is no longer driven.
    this.scheduledWith = null;
    /**
     * Callback passed to requestAnimationFrame. It is replaced whenever a
     * pending frame is abandoned (loop stopped, or moved to another clock), so
     * a request that could not be cancelled - e.g. one a test clock handed
     * over to the real clock on uninstall - is recognized as stale and ignored
     * instead of starting a second RAF chain.
     */
    this.frameCallback = this.createFrameCallback();
    this.isRunning = false;
    this.isTicking = false;
    this.lastTime = 0;
    this.nextId = 1;
    this.idMap = /* @__PURE__ */ new WeakMap();
    this.frameListeners = /* @__PURE__ */ new Set();
    /** Reusable per-frame snapshot of `animations` (see tick) */
    this.snapshot = [];
    this.snapshotInUse = false;
    /**
     * Animations removed from `animations` during the current tick and not
     * re-added since, so a snapshot entry is live iff it is not in here. While
     * it is empty (the common case) the tick skips a hash lookup per animation.
     */
    this.removedDuringTick = /* @__PURE__ */ new Set();
    this.timeScale = 1;
    this.timeScaleListeners = /* @__PURE__ */ new Set();
    /**
     * Clock that animations see. It advances by the real frame delta times
     * `timeScale`, so slow motion / pausing needs no support from animations.
     * Starts at a real timestamp so animations never see time 0.
     */
    this.animationTime = typeof performance !== "undefined" ? performance.now() : 0;
    // FinalizationRegistry for automatic cleanup notifications
    // Feature detection for older browsers (Safari < 14.1, IE11)
    this.registry = typeof FinalizationRegistry !== "undefined" ? new FinalizationRegistry((id) => {
      this.cleanupCallbacks.forEach((cb) => cb(id));
    }) : null;
    this.cleanupCallbacks = /* @__PURE__ */ new Set();
    this.registered = /* @__PURE__ */ new WeakSet();
    /** Pending delays (cancelled ones have a null callback until swept) */
    this.delays = [];
    /** Fires due delays; part of the loop while any delay is pending */
    this.delayRunner = {
      update: (now) => {
        const list = this.delays;
        const count = list.length;
        let kept = 0;
        for (let i = 0; i < count; i++) {
          const entry = list[i];
          const callback = entry.callback;
          if (callback === null) continue;
          if (entry.due <= now + DELAY_EPSILON && now > entry.start) {
            entry.callback = null;
            try {
              callback();
            } catch (e) {
              console.error("[SpringKit] Delay callback error:", e);
            }
          } else {
            list[kept++] = entry;
          }
        }
        for (let i = count; i < list.length; i++) list[kept++] = list[i];
        list.length = kept;
      },
      isComplete: () => this.delays.length === 0
    };
    /**
     * Single animation frame - optimized single-pass update + cleanup
     * Features:
     * - Delta time clamping for frame-drop resilience
     * - O(n) single-pass performance
     * - Frame listener notifications
     */
    this.tick = () => {
      const now = performance.now();
      this.rafId = null;
      this.isTicking = true;
      try {
        const rawDelta = now - this.lastTime;
        const clampedDelta = Math.min(Math.max(rawDelta, 0), MAX_DELTA_TIME);
        this.lastTime = now;
        const scaledDelta = clampedDelta * this.timeScale;
        this.animationTime += scaledDelta;
        if (clampedDelta > 0) {
          this.lastFrameDuration = clampedDelta;
        }
        for (const listener of this.frameListeners) {
          try {
            listener(clampedDelta);
          } catch (e) {
            console.error("[SpringKit] Frame listener error:", e);
          }
        }
        const reuse = !this.snapshotInUse;
        const current = reuse ? this.snapshot : [];
        let count = 0;
        for (const animation of this.animations) current[count++] = animation;
        this.snapshotInUse = true;
        const removed = this.removedDuringTick;
        try {
          for (let i = 0; i < count; i++) {
            const animation = current[i];
            if (removed.size !== 0 && removed.has(animation)) continue;
            try {
              animation.update(this.animationTime, scaledDelta);
            } catch (e) {
              console.error("[SpringKit] Animation update error:", e);
            }
            if (animation.isComplete() && this.animations.delete(animation)) {
              this.idMap.delete(animation);
              removed.add(animation);
            }
          }
        } finally {
          if (reuse) {
            current.fill(void 0, 0, count);
            removed.clear();
            this.snapshotInUse = false;
          }
        }
      } finally {
        this.isTicking = false;
      }
      if (this.animations.size > 0) {
        this.isRunning = true;
        this.scheduleFrame();
      } else {
        this.stop();
      }
    };
    this.lastFrameDuration = 16.67;
  }
  /**
   * Add an animation to the loop
   * The loop holds a strong reference while the animation is active and
   * releases it on completion or removal.
   * @returns Unique ID for this animation
   */
  add(animation) {
    const existingId = this.idMap.get(animation);
    if (existingId !== void 0 && this.animations.has(animation)) {
      this.rescheduleIfClockChanged();
      return existingId;
    }
    const id = existingId ?? this.nextId++;
    this.animations.add(animation);
    this.idMap.set(animation, id);
    if (this.snapshotInUse) this.removedDuringTick.delete(animation);
    if (this.registry && !this.registered.has(animation)) {
      this.registered.add(animation);
      this.registry.register(animation, id);
    }
    this.start();
    this.rescheduleIfClockChanged();
    return id;
  }
  /**
   * Remove an animation from the loop
   */
  remove(animation) {
    if (this.animations.delete(animation)) {
      this.idMap.delete(animation);
      if (this.snapshotInUse) this.removedDuringTick.add(animation);
    }
    if (this.animations.size === 0) {
      this.stop();
    }
  }
  /**
   * Register a callback for when animations are garbage collected
   * Useful for debugging memory leaks
   */
  onCleanup(callback) {
    this.cleanupCallbacks.add(callback);
    return () => this.cleanupCallbacks.delete(callback);
  }
  /**
   * Register a callback for each frame
   * Receives delta time in milliseconds
   */
  onFrame(callback) {
    this.frameListeners.add(callback);
    return () => this.frameListeners.delete(callback);
  }
  /**
   * Call `callback` once `ms` milliseconds of animation time have passed:
   * like `setTimeout`, but driven by the loop, so the delay follows
   * {@link setTimeScale} (slow motion stretches it, 0 freezes it) and the
   * test clock. The callback runs during the first frame at or after the
   * due time (never synchronously, even for `ms <= 0`).
   *
   * @returns A function that cancels the delay (no-op once it has fired)
   */
  delay(ms, callback) {
    const start = this.animationTime;
    const entry = {
      start,
      due: start + (Number.isFinite(ms) && ms > 0 ? ms : 0),
      callback
    };
    this.delays.push(entry);
    this.add(this.delayRunner);
    return () => {
      entry.callback = null;
    };
  }
  /**
   * Start the animation loop
   */
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    if (this.isTicking) return;
    this.tick();
  }
  createFrameCallback() {
    const callback = () => {
      if (callback === this.frameCallback) this.tick();
    };
    return callback;
  }
  scheduleFrame() {
    this.scheduledWith = {
      request: requestAnimationFrame,
      cancel: cancelAnimationFrame
    };
    this.rafId = requestAnimationFrame(this.frameCallback);
  }
  rescheduleIfClockChanged() {
    if (this.rafId === null || this.isTicking || this.scheduledWith === null || this.scheduledWith.request === requestAnimationFrame) {
      return;
    }
    try {
      this.scheduledWith.cancel(this.rafId);
    } catch {
    }
    this.rafId = null;
    this.frameCallback = this.createFrameCallback();
    this.lastTime = performance.now();
    this.scheduleFrame();
  }
  /**
   * Stop the animation loop
   */
  stop() {
    this.isRunning = false;
    if (this.rafId !== null) {
      (this.scheduledWith?.cancel ?? cancelAnimationFrame)(this.rafId);
      this.rafId = null;
      this.frameCallback = this.createFrameCallback();
    }
  }
  /**
   * Slow down, speed up or freeze every loop-driven animation (springs,
   * spring values, decay, MotionValues...) and every animation started with
   * `animateNative()`. 1 = normal speed, 0.1 = 10x slow motion, 0 = frozen.
   * Handy for inspecting motion while developing.
   *
   * Timelines and keyframes follow it too, and so do delays scheduled with
   * {@link delay} (`animate`, `stagger`, trail and timeline repeat delays).
   * Code that runs its own requestAnimationFrame loop can read
   * `getTimeScale()` to do the same; use `delay()` instead of `setTimeout`.
   *
   * Non-finite values are ignored (with a development warning); negative
   * values freeze like 0.
   */
  setTimeScale(scale) {
    if (!Number.isFinite(scale)) {
      warnOnce(`globalLoop.setTimeScale(${scale}) ignored: expected a finite number`);
      return;
    }
    const next = scale > 0 ? scale : 0;
    if (next === this.timeScale) return;
    this.timeScale = next;
    for (const listener of this.timeScaleListeners) {
      try {
        listener(next);
      } catch (e) {
        console.error("[SpringKit] Time scale listener error:", e);
      }
    }
  }
  /** Current time scale (see {@link setTimeScale}) */
  getTimeScale() {
    return this.timeScale;
  }
  /** Subscribe to time scale changes; returns an unsubscribe function */
  onTimeScaleChange(callback) {
    this.timeScaleListeners.add(callback);
    return () => this.timeScaleListeners.delete(callback);
  }
  /**
   * Get the number of active animations
   */
  get size() {
    return this.animations.size;
  }
  /**
   * Get count of alive (active) animations (for debugging/testing)
   */
  getAliveCount() {
    return this.animations.size;
  }
  // Default to ~60fps
  /**
   * Get current frame rate (based on actual frame duration)
   */
  getFPS() {
    return Math.round(1e3 / this.lastFrameDuration);
  }
};
var globalLoop = new AnimationLoop();
function delay(ms, callback) {
  return globalLoop.delay(ms, callback);
}

// src/utils/math.ts
function clamp(value, min, max) {
  const actualMin = Math.min(min, max);
  const actualMax = Math.max(min, max);
  return Math.max(actualMin, Math.min(actualMax, value));
}
function lerp(a, b, t) {
  return a + (b - a) * t;
}
function mapRange(value, inMin, inMax, outMin, outMax) {
  const inputRange = inMax - inMin;
  if (inputRange === 0) {
    return outMin;
  }
  return (value - inMin) * (outMax - outMin) / inputRange + outMin;
}
function degToRad(degrees) {
  return degrees * Math.PI / 180;
}
function radToDeg(radians) {
  return radians * 180 / Math.PI;
}

// src/core/spring.ts
function safeCall(fn, ...args) {
  if (!fn) return;
  try {
    fn(...args);
  } catch (e) {
    console.error("[SpringKit] Spring callback error:", e);
  }
}
var stepScratch = { position: 0, velocity: 0, isRest: false };
var SpringAnimationImpl = class {
  constructor(from, to, config = {}) {
    this.state = "idle" /* Idle */;
    this.resolveComplete = null;
    this.lastUpdateTime = 0;
    this.destroyed = false;
    // Bumped by every retarget (set, setWithVelocity, reverse), so update()
    // can tell that its onUpdate callback retargeted the spring
    this.retargets = 0;
    validateSpringConfig(config);
    this.from = validateAnimationValue(from, "spring.from");
    this.to = validateAnimationValue(to, "spring.to");
    this.clampedFrom = this.from;
    this.clampedTo = this.to;
    this.position = this.from;
    this.velocity = validateAnimationValue(config.velocity ?? 0, "spring.velocity");
    this.target = this.to;
    this.config = {
      ...defaultConfig,
      ...config,
      stiffness: config.stiffness ?? defaultConfig.stiffness,
      damping: config.damping ?? defaultConfig.damping,
      mass: config.mass ?? defaultConfig.mass,
      restSpeed: config.restSpeed ?? defaultConfig.restSpeed,
      restDelta: config.restDelta ?? defaultConfig.restDelta
    };
    this.coefficients = springCoefficients(this.config);
    this.restSpeed = this.config.restSpeed;
    this.restDelta = this.config.restDelta;
    this.resetFinished();
  }
  /** Create a new pending `finished` promise for the next run */
  resetFinished() {
    this.finished = new Promise((resolve) => {
      this.resolveComplete = resolve;
    });
  }
  /** Resolve the current `finished` promise (once) */
  settleFinished() {
    const resolve = this.resolveComplete;
    this.resolveComplete = null;
    resolve?.();
  }
  start() {
    if (this.destroyed) {
      warnOnce("spring.start() called after destroy(); ignored");
      return this;
    }
    if (this.state === "running" /* Running */) return this;
    if (this.resolveComplete === null && !this.destroyed) {
      this.resetFinished();
    }
    this.state = "running" /* Running */;
    this.lastUpdateTime = 0;
    safeCall(this.config.onStart);
    globalLoop.add(this);
    return this;
  }
  stop() {
    this.state = "idle" /* Idle */;
    globalLoop.remove(this);
    this.settleFinished();
  }
  pause() {
    if (this.state === "running" /* Running */) {
      this.state = "paused" /* Paused */;
      globalLoop.remove(this);
    }
  }
  resume() {
    if (this.state === "paused" /* Paused */) {
      this.state = "running" /* Running */;
      this.lastUpdateTime = 0;
      globalLoop.add(this);
    }
  }
  reverse() {
    const temp = this.from;
    this.from = this.to;
    this.to = temp;
    this.clampedFrom = this.from;
    this.clampedTo = this.to;
    this.target = this.to;
    this.retargets++;
    if (this.state === "running" /* Running */) {
      this.velocity = -this.velocity;
    }
  }
  set(to) {
    const validTo = validateAnimationValue(to, "spring.set");
    this.to = validTo;
    this.clampedTo = validTo;
    this.target = validTo;
    this.retargets++;
  }
  setWithVelocity(to, velocity) {
    const validTo = validateAnimationValue(to, "spring.setWithVelocity");
    this.from = this.position;
    this.clampedFrom = this.position;
    this.to = validTo;
    this.clampedTo = validTo;
    this.target = validTo;
    this.retargets++;
    if (velocity !== void 0) {
      this.velocity = validateAnimationValue(velocity, "spring.setWithVelocity.velocity");
    }
    if (this.state === "complete" /* Complete */) {
      this.state = "idle" /* Idle */;
    }
    if (this.state !== "running" /* Running */) {
      this.start();
    }
  }
  update(now, deltaTime) {
    if (this.state !== "running" /* Running */) return;
    const elapsedMs = this.lastUpdateTime === 0 ? deltaTime ?? 0 : now - this.lastUpdateTime;
    const elapsed = elapsedMs / 1e3;
    this.lastUpdateTime = now;
    const MAX_DELTA_TIME2 = 1 / 15;
    const safeElapsed = Math.min(Math.max(elapsed, 0), MAX_DELTA_TIME2);
    const result = stepSpringInto(
      stepScratch,
      this.position,
      this.velocity,
      this.target,
      this.coefficients,
      this.restSpeed,
      this.restDelta,
      safeElapsed
    );
    const isRest = result.isRest;
    this.position = result.position;
    this.velocity = result.velocity;
    if (this.config.clamp) {
      const min = Math.min(this.clampedFrom, this.clampedTo);
      const max = Math.max(this.clampedFrom, this.clampedTo);
      this.position = clamp(this.position, min, max);
    }
    const onUpdate = this.config.onUpdate;
    const retargets = this.retargets;
    if (onUpdate) {
      try {
        onUpdate(this.position);
      } catch (e) {
        console.error("[SpringKit] Spring callback error:", e);
      }
    }
    if (isRest && this.state === "running" /* Running */ && this.retargets === retargets) {
      this.state = "complete" /* Complete */;
      globalLoop.remove(this);
      this.position = this.target;
      this.velocity = 0;
      safeCall(this.config.onUpdate, this.position);
      safeCall(this.config.onComplete);
      safeCall(this.config.onRest);
      this.settleFinished();
    }
  }
  isAnimating() {
    return this.state === "running" /* Running */;
  }
  isPaused() {
    return this.state === "paused" /* Paused */;
  }
  isComplete() {
    return this.state === "complete" /* Complete */;
  }
  getValue() {
    return this.position;
  }
  getVelocity() {
    return this.velocity;
  }
  destroy() {
    this.destroyed = true;
    this.stop();
    this.config.onUpdate = void 0;
    this.config.onStart = void 0;
    this.config.onComplete = void 0;
    this.config.onRest = void 0;
  }
};
function spring(from, to, config) {
  return new SpringAnimationImpl(from, to, config);
}

// src/core/spring-value.ts
var SpringValueImpl = class {
  constructor(initial, config = {}) {
    this.currentAnimation = null;
    this.subscribers = /* @__PURE__ */ new Set();
    this.resolveComplete = null;
    this.destroyed = false;
    this.isNotifying = false;
    // setConfig() was called since the running spring was created: the next
    // set() must create a spring with the new physics instead of retargeting
    this.configChanged = false;
    this.value = validateAnimationValue(initial, "createSpringValue.initial");
    this.config = { ...defaultConfig, ...config };
    this.finishedPromise = Promise.resolve();
  }
  get() {
    return this.value;
  }
  getVelocity() {
    return this.currentAnimation?.getVelocity() ?? 0;
  }
  set(to, config = {}) {
    if (this.destroyed) return;
    const validTo = validateAnimationValue(to, "SpringValue.set");
    const running = this.currentAnimation;
    if (running && running.isAnimating() && !running.isPaused() && !this.configChanged && Object.keys(config).length === 0) {
      this.resolveComplete?.();
      this.finishedPromise = new Promise((resolve) => {
        this.resolveComplete = resolve;
      });
      running.setWithVelocity(validTo);
      return;
    }
    const carriedVelocity = this.currentAnimation?.isAnimating() ? this.currentAnimation.getVelocity() : void 0;
    if (this.currentAnimation) {
      this.currentAnimation.destroy();
      this.currentAnimation = null;
      this.resolveComplete?.();
    }
    this.finishedPromise = new Promise((resolve) => {
      this.resolveComplete = resolve;
    });
    this.configChanged = false;
    const mergedConfig = { ...this.config, ...config };
    if (config.velocity === void 0 && carriedVelocity !== void 0) {
      mergedConfig.velocity = carriedVelocity;
    }
    const originalOnUpdate = mergedConfig.onUpdate;
    const originalOnComplete = mergedConfig.onComplete;
    mergedConfig.onUpdate = (value) => {
      if (this.destroyed) return;
      this.value = value;
      this.notify();
      originalOnUpdate?.(value);
    };
    mergedConfig.onComplete = () => {
      originalOnComplete?.();
      this.resolveComplete?.();
    };
    this.currentAnimation = spring(this.value, validTo, mergedConfig);
    this.currentAnimation.start();
  }
  jump(to) {
    if (this.destroyed) return;
    if (this.isNotifying) return;
    const validTo = validateAnimationValue(to, "SpringValue.jump");
    if (this.currentAnimation) {
      this.currentAnimation.destroy();
      this.currentAnimation = null;
      this.resolveComplete?.();
    }
    this.value = validTo;
    this.notify();
  }
  stop() {
    if (this.currentAnimation) {
      this.currentAnimation.destroy();
      this.currentAnimation = null;
    }
    if (this.resolveComplete) {
      this.resolveComplete();
    }
  }
  setConfig(config) {
    this.config = { ...this.config, ...config };
    this.configChanged = true;
  }
  subscribe(callback) {
    this.subscribers.add(callback);
    try {
      callback(this.value);
    } catch (e) {
      console.error("[SpringKit] Subscriber error:", e);
    }
    return () => {
      this.subscribers.delete(callback);
    };
  }
  isAnimating() {
    return this.currentAnimation?.isAnimating() ?? false;
  }
  get finished() {
    return this.finishedPromise;
  }
  notify() {
    if (this.isNotifying) return;
    this.isNotifying = true;
    for (const subscriber of this.subscribers) {
      try {
        subscriber(this.value);
      } catch (e) {
        console.error("[SpringKit] Subscriber error:", e);
      }
    }
    this.isNotifying = false;
  }
  isDestroyed() {
    return this.destroyed;
  }
  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.currentAnimation?.destroy();
    this.currentAnimation = null;
    this.resolveComplete?.();
    this.resolveComplete = null;
    this.subscribers.clear();
  }
};
function createSpringValue(initial, config) {
  return new SpringValueImpl(initial, config);
}

// src/core/spring-group.ts
var SpringGroupImpl = class {
  constructor(initialValues, config = {}) {
    this.subscribers = /* @__PURE__ */ new Set();
    this.resolveComplete = null;
    this.notifyRafId = null;
    this.notifyScheduled = false;
    this.destroyed = false;
    this.config = { ...defaultConfig, ...config };
    this.values = /* @__PURE__ */ new Map();
    for (const [key, value] of Object.entries(initialValues)) {
      const springValue = createSpringValue(value, this.config);
      springValue.subscribe(() => this.scheduleNotify());
      this.values.set(key, springValue);
    }
    this.finishedPromise = Promise.resolve();
  }
  resetPromise() {
    this.finishedPromise = new Promise((resolve) => {
      this.resolveComplete = resolve;
    });
  }
  get() {
    const result = {};
    for (const [key, springValue] of this.values) {
      result[key] = springValue.get();
    }
    return result;
  }
  getValue(key) {
    return this.values.get(key)?.get() ?? 0;
  }
  set(values, config = {}) {
    if (this.destroyed) return;
    this.resetPromise();
    const resolveBatch = this.resolveComplete;
    const promises = [];
    for (const [key, value] of Object.entries(values)) {
      const springValue = this.values.get(key);
      if (springValue && typeof value === "number") {
        springValue.set(value, config);
        promises.push(springValue.finished);
      }
    }
    const settle = () => {
      const pending = [];
      if (!this.destroyed) {
        for (const springValue of this.values.values()) {
          if (springValue.isAnimating()) pending.push(springValue.finished);
        }
      }
      if (pending.length === 0) resolveBatch?.();
      else void Promise.all(pending).then(settle);
    };
    void Promise.all(promises).then(settle);
  }
  jump(values) {
    if (this.destroyed) return;
    for (const [key, value] of Object.entries(values)) {
      const springValue = this.values.get(key);
      if (springValue && typeof value === "number") {
        springValue.jump(value);
      }
    }
  }
  stop() {
    for (const springValue of this.values.values()) {
      springValue.stop();
    }
    this.resolveComplete?.();
  }
  subscribe(callback) {
    this.subscribers.add(callback);
    try {
      callback(this.get());
    } catch (e) {
      console.error("[SpringKit] SpringGroup subscriber error:", e);
    }
    return () => this.subscribers.delete(callback);
  }
  isAnimating() {
    for (const springValue of this.values.values()) {
      if (springValue.isAnimating()) return true;
    }
    return false;
  }
  get finished() {
    return this.finishedPromise;
  }
  /**
   * Schedule notification using microtask to prevent excessive updates.
   * When animating multiple properties, this debounces notifications to once per frame
   * instead of once per property update, while avoiding RAF cascade issues.
   */
  scheduleNotify() {
    if (this.destroyed || this.notifyScheduled) return;
    this.notifyScheduled = true;
    queueMicrotask(() => {
      this.notifyScheduled = false;
      if (!this.destroyed) {
        this.notify();
      }
    });
  }
  notify() {
    const values = this.get();
    for (const subscriber of this.subscribers) {
      try {
        subscriber(values);
      } catch (e) {
        console.error("[SpringKit] SpringGroup subscriber error:", e);
      }
    }
  }
  destroy() {
    this.destroyed = true;
    for (const springValue of this.values.values()) {
      springValue.destroy();
    }
    this.resolveComplete?.();
    this.resolveComplete = null;
    this.subscribers.clear();
  }
  isDestroyed() {
    return this.destroyed;
  }
};
function createSpringGroup(initialValues, config) {
  return new SpringGroupImpl(initialValues, config);
}

// src/core/variants.ts
function resolveVariant(variant, custom) {
  if (!variant) {
    return { values: {}, transition: {} };
  }
  const resolved = typeof variant === "function" ? variant(custom) : variant;
  const { transition = {}, ...values } = resolved;
  return { values, transition };
}
function getVariant(variants, name, custom) {
  if (!variants || !name) {
    return { values: {}, transition: {} };
  }
  return resolveVariant(variants[name], custom);
}
function mergeVariants(...variants) {
  const merged = {};
  for (const variant of variants) {
    if (variant) {
      const previousTransition = merged.transition;
      Object.assign(merged, variant);
      if (variant.transition) {
        merged.transition = { ...previousTransition, ...variant.transition };
      }
    }
  }
  return merged;
}
function isTransformProperty(key) {
  return [
    "x",
    "y",
    "z",
    "scale",
    "scaleX",
    "scaleY",
    "scaleZ",
    "rotate",
    "rotateX",
    "rotateY",
    "rotateZ",
    "skew",
    "skewX",
    "skewY",
    "perspective",
    "transformOrigin"
  ].includes(key);
}
function isAnimatable(value) {
  return typeof value === "number" || typeof value === "string";
}
function parseValueWithUnit(value) {
  if (typeof value === "number") {
    return { value, unit: "" };
  }
  const match = value.match(/^(-?[\d.]+)(.*)$/);
  if (match && match[1]) {
    return { value: parseFloat(match[1]), unit: match[2] || "" };
  }
  return { value: 0, unit: "" };
}
function buildTransformString(values) {
  const transforms = [];
  if (values.x !== void 0 || values.y !== void 0) {
    const toLength = (v) => typeof v === "number" ? `${v}px` : v;
    const x = toLength(values.x ?? 0);
    const y = toLength(values.y ?? 0);
    transforms.push(`translate(${x}, ${y})`);
  }
  if (values.scale !== void 0) {
    transforms.push(`scale(${values.scale})`);
  } else {
    if (values.scaleX !== void 0) {
      transforms.push(`scaleX(${values.scaleX})`);
    }
    if (values.scaleY !== void 0) {
      transforms.push(`scaleY(${values.scaleY})`);
    }
  }
  if (values.rotate !== void 0) {
    transforms.push(`rotate(${values.rotate}deg)`);
  }
  if (values.rotateX !== void 0) {
    transforms.push(`rotateX(${values.rotateX}deg)`);
  }
  if (values.rotateY !== void 0) {
    transforms.push(`rotateY(${values.rotateY}deg)`);
  }
  if (values.rotateZ !== void 0) {
    transforms.push(`rotateZ(${values.rotateZ}deg)`);
  }
  if (values.skewX !== void 0) {
    transforms.push(`skewX(${values.skewX}deg)`);
  }
  if (values.skewY !== void 0) {
    transforms.push(`skewY(${values.skewY}deg)`);
  }
  return transforms.join(" ");
}
function applyValuesToElement(element, values) {
  const transform = buildTransformString(values);
  if (transform) {
    element.style.transform = transform;
  }
  if (values.opacity !== void 0) {
    element.style.opacity = String(values.opacity);
  }
  if (values.backgroundColor !== void 0) {
    element.style.backgroundColor = values.backgroundColor;
  }
  if (values.borderRadius !== void 0) {
    element.style.borderRadius = typeof values.borderRadius === "number" ? `${values.borderRadius}px` : values.borderRadius;
  }
  if (values.borderColor !== void 0) {
    element.style.borderColor = values.borderColor;
  }
  if (values.boxShadow !== void 0) {
    element.style.boxShadow = values.boxShadow;
  }
  if (values.color !== void 0) {
    element.style.color = values.color;
  }
  if (values.width !== void 0) {
    element.style.width = typeof values.width === "number" ? `${values.width}px` : values.width;
  }
  if (values.height !== void 0) {
    element.style.height = typeof values.height === "number" ? `${values.height}px` : values.height;
  }
}
function calculateStaggerDelays(count, options) {
  const { staggerChildren = 0, staggerDirection = 1, delayChildren = 0 } = options;
  const delays = [];
  for (let i = 0; i < count; i++) {
    const index = staggerDirection === -1 ? count - 1 - i : i;
    delays.push(delayChildren + index * staggerChildren);
  }
  return delays;
}
function createOrchestration(parentAnim, childrenAnims, options = {}) {
  const { when = false, delay: delay2 = 0 } = options;
  const delays = calculateStaggerDelays(childrenAnims.length, options);
  const parent = async () => {
    if (delay2 > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay2));
    }
    await parentAnim();
  };
  const children = async () => {
    await Promise.all(
      childrenAnims.map(
        (anim, i) => new Promise((resolve, reject) => {
          setTimeout(() => {
            Promise.resolve().then(anim).then(resolve, reject);
          }, delays[i]);
        })
      )
    );
  };
  const execute = async () => {
    switch (when) {
      case "beforeChildren":
        await parent();
        await children();
        break;
      case "afterChildren":
        await children();
        await parent();
        break;
      default:
        await Promise.all([parent(), children()]);
    }
  };
  return { parent, children, execute };
}
var variantPresets = {
  /** Fade in from invisible */
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },
  /** Fade in and slide up */
  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  },
  /** Fade in and slide down */
  fadeInDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 }
  },
  /** Fade in and slide from left */
  fadeInLeft: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 }
  },
  /** Fade in and slide from right */
  fadeInRight: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  },
  /** Scale up from small */
  scaleIn: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 }
  },
  /** Pop in with overshoot */
  popIn: {
    initial: { opacity: 0, scale: 0.5 },
    animate: {
      opacity: 1,
      scale: 1,
      transition: { spring: { stiffness: 400, damping: 15 } }
    },
    exit: { opacity: 0, scale: 0.5 }
  },
  /** Slide in from bottom (percentage-based) */
  slideUp: {
    initial: { y: 100, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: 100, opacity: 0 }
  },
  /** Slide in from top */
  slideDown: {
    initial: { y: -100, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -100, opacity: 0 }
  },
  /** Slide in from left */
  slideLeft: {
    initial: { x: -100, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -100, opacity: 0 }
  },
  /** Slide in from right */
  slideRight: {
    initial: { x: 100, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: 100, opacity: 0 }
  },
  /** Container with staggered children (stagger and delays in ms) */
  staggerContainer: {
    initial: {},
    animate: {
      transition: {
        staggerChildren: 100,
        delayChildren: 100
      }
    },
    exit: {
      transition: {
        staggerChildren: 50,
        staggerDirection: -1
      }
    }
  },
  /** Item for staggered lists */
  staggerItem: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  }
};
function createVariantPreset(initial, animate2, exit) {
  return {
    initial,
    animate: animate2,
    exit: exit || initial
  };
}
function isVariants(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value) && Object.values(value).every(
    (v) => typeof v === "object" || typeof v === "function"
  );
}
function isVariant(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// src/animation/sequence.ts
async function sequence(animations) {
  for (const createAnimation of animations) {
    const anim = createAnimation();
    await anim.finished;
  }
}
async function parallel(animations) {
  const promises = animations.map((createAnimation) => {
    const anim = createAnimation();
    return anim.finished;
  });
  await Promise.all(promises);
}
async function stagger(items, animate2, options = {}) {
  const { delay: delay2 = 0, from = "first" } = options;
  if (items.length === 0) return;
  let startIndex = 0;
  if (from === "last") startIndex = items.length - 1;
  else if (from === "center") startIndex = Math.floor(items.length / 2);
  else if (typeof from === "number") {
    startIndex = Number.isFinite(from) ? Math.min(Math.max(Math.round(from), 0), items.length - 1) : 0;
  }
  const indices = [];
  const used = /* @__PURE__ */ new Set();
  indices.push(startIndex);
  used.add(startIndex);
  for (let offset = 1; offset < items.length; offset++) {
    const left = startIndex - offset;
    const right = startIndex + offset;
    if (right < items.length && !used.has(right)) {
      indices.push(right);
      used.add(right);
    }
    if (left >= 0 && !used.has(left)) {
      indices.push(left);
      used.add(left);
    }
  }
  const getDelay = typeof delay2 === "function" ? (i) => delay2(i) : (i) => Math.abs(indices[i] - startIndex) * delay2;
  const animations = [];
  const cancelDelays = [];
  for (let i = 0; i < indices.length; i++) {
    const index = indices[i];
    const anim = animate2(items[index], index);
    animations.push(anim);
    const delayMs = getDelay(i);
    if (delayMs > 0) {
      cancelDelays.push(globalLoop.delay(delayMs, () => anim.start()));
    } else {
      anim.start();
    }
  }
  try {
    await Promise.all(animations.map((a) => a.finished));
  } finally {
    cancelDelays.forEach((cancel) => cancel());
  }
}

// src/animation/trail.ts
var TrailImpl = class {
  constructor(count, config = {}) {
    this.subscribers = /* @__PURE__ */ new Set();
    this.frameCount = 0;
    // Cancel functions of pending follower delays (loop-driven, so they
    // follow the time scale), cleared on jump/destroy
    this.pendingDelays = /* @__PURE__ */ new Set();
    this.destroyed = false;
    const { followDelay = 2, ...springConfig } = config;
    this.followDelay = followDelay;
    this.leader = createSpringValue(0, springConfig);
    this.springs = [];
    for (let i = 0; i < count; i++) {
      const spring2 = createSpringValue(0, springConfig);
      this.springs.push(spring2);
    }
    this.leader.subscribe(() => {
      this.frameCount++;
      this.scheduleFollowerUpdates();
    });
  }
  scheduleFollowerUpdates() {
    const targetValue = this.leader.get();
    for (let i = 0; i < this.springs.length; i++) {
      const delayFrames = (i + 1) * this.followDelay;
      const targetFrame = this.frameCount + delayFrames;
      this.scheduleFollowerUpdate(i, targetValue, targetFrame, delayFrames);
    }
  }
  scheduleFollowerUpdate(index, targetValue, targetFrame, _delayFrames) {
    const startFrame = this.frameCount;
    const framesToWait = targetFrame - startFrame;
    if (framesToWait <= 0) {
      this.springs[index].set(targetValue);
    } else {
      const delayMs = Math.max(framesToWait * 16, 0);
      const cancel = globalLoop.delay(delayMs, () => {
        this.pendingDelays.delete(cancel);
        if (this.destroyed) return;
        this.springs[index].set(targetValue);
      });
      this.pendingDelays.add(cancel);
    }
  }
  set(value) {
    this.leader.set(value);
  }
  jump(value) {
    this.clearPendingDelays();
    this.leader.jump(value);
    for (const spring2 of this.springs) {
      spring2.jump(value);
    }
  }
  getValues() {
    return this.springs.map((s) => s.get());
  }
  subscribe(callback) {
    this.subscribers.add(callback);
    let initialized = false;
    const handler = () => {
      if (initialized) this.safeNotify(callback);
    };
    const unsubscribers = [];
    for (const spring2 of this.springs) {
      unsubscribers.push(spring2.subscribe(handler));
    }
    initialized = true;
    this.safeNotify(callback);
    return () => {
      this.subscribers.delete(callback);
      for (const unsubscribe of unsubscribers) {
        unsubscribe();
      }
    };
  }
  safeNotify(callback) {
    try {
      callback(this.getValues());
    } catch (e) {
      console.error("[SpringKit] Trail subscriber error:", e);
    }
  }
  clearPendingDelays() {
    for (const cancel of this.pendingDelays) cancel();
    this.pendingDelays.clear();
  }
  destroy() {
    this.destroyed = true;
    this.clearPendingDelays();
    this.leader.destroy();
    for (const spring2 of this.springs) {
      spring2.destroy();
    }
    this.subscribers.clear();
  }
};
function createTrail(count, config) {
  return new TrailImpl(count, config);
}

// src/animation/decay.ts
var MAX_DELTA_MS = 64;
var DEFAULT_DECELERATION = 0.998;
var DEFAULT_REST_DELTA = 0.5;
var DecayAnimationImpl = class {
  constructor(config) {
    this.elapsed = 0;
    this.lastUpdateTime = 0;
    this.state = "idle" /* Idle */;
    this.resolveComplete = null;
    this.destroyed = false;
    validateDecayConfig(config);
    this.config = { ...config };
    this.from = config.from !== void 0 && Number.isFinite(config.from) ? config.from : 0;
    this.value = this.from;
    this.clampRange = config.clamp;
    this.restDelta = config.restDelta !== void 0 && config.restDelta > 0 ? config.restDelta : DEFAULT_REST_DELTA;
    const rawDecel = validateAnimationValue(
      config.deceleration ?? DEFAULT_DECELERATION,
      "decay.deceleration"
    );
    const deceleration = rawDecel > 0 && rawDecel < 1 ? rawDecel : DEFAULT_DECELERATION;
    this.logDecel = Math.log(deceleration);
    let velocityMs = validateAnimationValue(config.velocity, "decay.velocity") / 1e3;
    let target = this.from - velocityMs / this.logDecel;
    if (config.modifyTarget) {
      const modified = config.modifyTarget(target);
      if (Number.isFinite(modified)) {
        target = modified;
        velocityMs = (target - this.from) * -this.logDecel;
      }
    }
    this.velocityMs = velocityMs;
    this.target = target;
    this.resetFinished();
  }
  /** Create a new pending `finished` promise for the next run */
  resetFinished() {
    this.finished = new Promise((resolve) => {
      this.resolveComplete = resolve;
    });
  }
  /** Resolve the current `finished` promise (once) */
  settleFinished() {
    const resolve = this.resolveComplete;
    this.resolveComplete = null;
    resolve?.();
  }
  start() {
    if (this.state === "running" /* Running */) return this;
    if (this.resolveComplete === null && !this.destroyed) {
      this.resetFinished();
    }
    this.state = "running" /* Running */;
    this.lastUpdateTime = 0;
    globalLoop.add(this);
    return this;
  }
  stop() {
    if (this.state === "running" /* Running */) {
      this.state = "idle" /* Idle */;
    }
    globalLoop.remove(this);
    this.settleFinished();
  }
  getValue() {
    return this.value;
  }
  getVelocity() {
    if (this.state === "complete" /* Complete */) return 0;
    return this.velocityMs * Math.exp(this.logDecel * this.elapsed) * 1e3;
  }
  update(now, deltaTime) {
    if (this.state !== "running" /* Running */) return;
    const rawElapsed = this.lastUpdateTime === 0 ? deltaTime ?? 0 : now - this.lastUpdateTime;
    this.lastUpdateTime = now;
    this.elapsed += Math.min(Math.max(rawElapsed, 0), MAX_DELTA_MS);
    const decayFactor = Math.exp(this.logDecel * this.elapsed);
    const velocityMs = this.velocityMs * decayFactor;
    const remaining = Math.abs(velocityMs / this.logDecel);
    let done = remaining < this.restDelta;
    this.value = done ? this.target : this.from + this.velocityMs * (decayFactor - 1) / this.logDecel;
    if (this.clampRange) {
      const [min, max] = this.clampRange;
      const clamped = clamp(this.value, min, max);
      if (clamped !== this.value) {
        this.value = clamped;
        done = true;
      }
    }
    try {
      this.config.onUpdate?.(this.value);
    } catch (error) {
      console.error("[SpringKit] Error in decay onUpdate callback:", error);
    }
    if (done && this.state === "running" /* Running */) {
      this.state = "complete" /* Complete */;
      globalLoop.remove(this);
      try {
        this.config.onComplete?.();
      } catch (error) {
        console.error("[SpringKit] Error in decay onComplete callback:", error);
      }
      this.settleFinished();
    }
  }
  isComplete() {
    return this.state === "complete" /* Complete */;
  }
  destroy() {
    this.destroyed = true;
    this.stop();
    this.config.onUpdate = void 0;
    this.config.onComplete = void 0;
  }
};
function decay(config) {
  return new DecayAnimationImpl(config);
}

// src/animation/keyframes.ts
var MAX_FRAME_MS = 64;
var TIME_EPSILON = 1e-6;
function keyframes(values, options = {}) {
  const {
    config = {},
    times,
    duration,
    onKeyframe,
    onComplete,
    onUpdate
  } = options;
  const totalDuration = typeof duration === "number" && Number.isFinite(duration) && duration > 0 ? duration : 0;
  const timed = totalDuration > 0;
  const normalizedKeyframes = values.map((v, i) => {
    if (typeof v === "number") {
      return {
        value: v,
        at: times?.[i]
      };
    }
    return { ...v, at: v.at ?? times?.[i] };
  });
  const keyframeCount = normalizedKeyframes.length;
  normalizedKeyframes.forEach((kf, i) => {
    if (kf.at === void 0) {
      kf.at = keyframeCount > 1 ? i / (keyframeCount - 1) : 0;
    }
  });
  normalizedKeyframes.sort((a, b) => (a.at ?? 0) - (b.at ?? 0));
  const dueTimes = normalizedKeyframes.map((kf) => Math.max(0, kf.at ?? 0) * totalDuration);
  let currentIndex = 0;
  let isPlaying = false;
  let isPaused = false;
  let spring2 = null;
  let currentValue = normalizedKeyframes[0]?.value ?? 0;
  let destroyed = false;
  let pendingRafId = null;
  let cancelPendingDelay = null;
  let pendingResolve = null;
  let runId = 0;
  let interrupted = false;
  let elapsed = 0;
  let lastFrameTime = null;
  const now = () => typeof performance !== "undefined" ? performance.now() : Date.now();
  const advanceClock = (timestamp) => {
    if (lastFrameTime !== null) {
      const delta = Math.min(Math.max(timestamp - lastFrameTime, 0), MAX_FRAME_MS);
      elapsed += delta * globalLoop.getTimeScale();
    }
    lastFrameTime = timestamp;
  };
  const waitUntil = (done, id) => new Promise((resolve) => {
    if (done()) {
      resolve();
      return;
    }
    pendingResolve = resolve;
    const finish = () => {
      pendingResolve = null;
      resolve();
    };
    const frame = (timestamp) => {
      pendingRafId = null;
      if (destroyed || id !== runId) {
        finish();
        return;
      }
      advanceClock(timestamp);
      if (done()) {
        finish();
      } else {
        pendingRafId = requestAnimationFrame(frame);
      }
    };
    pendingRafId = requestAnimationFrame(frame);
  });
  const createSpring = () => {
    if (spring2) {
      spring2.destroy();
    }
    spring2 = createSpringValue(currentValue, config);
    spring2.subscribe((value) => {
      currentValue = value;
      onUpdate?.(value);
    });
  };
  const cancelWait = () => {
    if (pendingRafId !== null) {
      cancelAnimationFrame(pendingRafId);
      pendingRafId = null;
    }
    cancelPendingDelay?.();
    cancelPendingDelay = null;
    const resolve = pendingResolve;
    pendingResolve = null;
    resolve?.();
  };
  const transitionTo = async (targetKf, id) => {
    if (!spring2) return;
    spring2.set(targetKf.value, targetKf.config ?? config);
    if (timed) {
      if (currentIndex < normalizedKeyframes.length - 1) return;
      const due = dueTimes[currentIndex] ?? 0;
      await waitUntil(
        () => elapsed >= due - TIME_EPSILON && !(spring2?.isAnimating() ?? false),
        id
      );
      return;
    }
    await new Promise((resolve) => {
      pendingResolve = resolve;
      const finish = () => {
        pendingResolve = null;
        resolve();
      };
      const checkComplete = () => {
        pendingRafId = null;
        if (destroyed || id !== runId) {
          finish();
          return;
        }
        if (spring2 && !spring2.isAnimating()) {
          finish();
        } else {
          pendingRafId = requestAnimationFrame(checkComplete);
        }
      };
      cancelPendingDelay = globalLoop.delay(16, () => {
        cancelPendingDelay = null;
        checkComplete();
      });
    });
  };
  const animateToNext = async (id) => {
    if (destroyed || isPaused || id !== runId) return false;
    if (currentIndex >= normalizedKeyframes.length - 1) return false;
    if (timed) {
      const due = dueTimes[currentIndex] ?? 0;
      await waitUntil(() => elapsed >= due - TIME_EPSILON, id);
      if (destroyed || isPaused || id !== runId) return false;
    }
    currentIndex++;
    const targetKf = normalizedKeyframes[currentIndex];
    if (!targetKf) return false;
    onKeyframe?.(currentIndex);
    await transitionTo(targetKf, id);
    return id === runId && !destroyed && !isPaused;
  };
  const run = async (id) => {
    if (interrupted) {
      interrupted = false;
      const targetKf = normalizedKeyframes[currentIndex];
      if (targetKf) {
        await transitionTo(targetKf, id);
      }
    }
    while (await animateToNext(id)) {
    }
    if (id === runId && !isPaused && !destroyed) {
      isPlaying = false;
      onComplete?.();
    }
  };
  const animation = {
    play: async () => {
      if (destroyed) return;
      if (isPlaying) return;
      cancelWait();
      const id = ++runId;
      isPlaying = true;
      isPaused = false;
      if (currentIndex >= normalizedKeyframes.length - 1) {
        currentIndex = 0;
        currentValue = normalizedKeyframes[0]?.value ?? 0;
        interrupted = false;
        elapsed = 0;
      }
      lastFrameTime = now();
      createSpring();
      onKeyframe?.(currentIndex);
      await run(id);
    },
    pause: () => {
      if (destroyed) return;
      if (isPlaying) {
        interrupted = spring2?.isAnimating() ?? false;
      }
      isPaused = true;
      isPlaying = false;
      runId++;
      if (lastFrameTime !== null) advanceClock(now());
      lastFrameTime = null;
      if (spring2) {
        spring2.stop();
      }
      cancelWait();
    },
    resume: () => {
      if (!isPaused || destroyed) return;
      isPaused = false;
      isPlaying = true;
      cancelWait();
      lastFrameTime = now();
      const id = ++runId;
      void run(id);
    },
    stop: () => {
      runId++;
      isPaused = false;
      isPlaying = false;
      interrupted = false;
      currentIndex = 0;
      currentValue = normalizedKeyframes[0]?.value ?? 0;
      elapsed = 0;
      lastFrameTime = null;
      if (spring2) {
        spring2.jump(currentValue);
      }
      cancelWait();
    },
    get: () => currentValue,
    getCurrentKeyframe: () => currentIndex,
    isPlaying: () => isPlaying,
    jumpTo: (index) => {
      if (index < 0 || index >= normalizedKeyframes.length) return;
      currentIndex = index;
      interrupted = false;
      elapsed = dueTimes[index] ?? 0;
      const targetValue = normalizedKeyframes[index]?.value ?? 0;
      currentValue = targetValue;
      if (spring2) {
        spring2.jump(targetValue);
      }
      onUpdate?.(targetValue);
      onKeyframe?.(index);
    },
    destroy: () => {
      destroyed = true;
      isPlaying = false;
      isPaused = false;
      runId++;
      cancelWait();
      if (spring2) {
        spring2.destroy();
        spring2 = null;
      }
    }
  };
  return animation;
}
function parseKeyframeArray(values, times) {
  return values.map((value, index) => ({
    value,
    at: times?.[index]
  }));
}
function isKeyframeArray(value) {
  return Array.isArray(value) && value.every((v) => typeof v === "number");
}

// src/animation/animate.ts
var transformProperties = /* @__PURE__ */ new Set([
  "x",
  "y",
  "z",
  "scale",
  "scaleX",
  "scaleY",
  "scaleZ",
  "rotate",
  "rotateX",
  "rotateY",
  "rotateZ",
  "skew",
  "skewX",
  "skewY"
]);
var pxProperties = /* @__PURE__ */ new Set([
  "x",
  "y",
  "z",
  "width",
  "height",
  "top",
  "right",
  "bottom",
  "left",
  "padding",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "margin",
  "marginTop",
  "marginRight",
  "marginBottom",
  "marginLeft",
  "borderWidth",
  "borderRadius",
  "fontSize",
  "letterSpacing",
  "lineHeight"
]);
var elementTransforms = /* @__PURE__ */ new WeakMap();
var propertyOwners = /* @__PURE__ */ new WeakMap();
function buildTransform(values) {
  const parts = [];
  const x = values.get("x");
  const y = values.get("y");
  const z = values.get("z");
  if (x !== void 0 || y !== void 0 || z !== void 0) {
    parts.push(`translate3d(${x ?? 0}px, ${y ?? 0}px, ${z ?? 0}px)`);
  }
  const scale = values.get("scale");
  const scaleX = values.get("scaleX");
  const scaleY = values.get("scaleY");
  if (scale !== void 0) {
    parts.push(`scale(${scale})`);
  } else if (scaleX !== void 0 || scaleY !== void 0) {
    parts.push(`scale(${scaleX ?? 1}, ${scaleY ?? 1})`);
  }
  const scaleZ = values.get("scaleZ");
  if (scaleZ !== void 0) parts.push(`scaleZ(${scaleZ})`);
  const rotate = values.get("rotate") ?? values.get("rotateZ");
  const rotateX = values.get("rotateX");
  const rotateY = values.get("rotateY");
  if (rotateX !== void 0) parts.push(`rotateX(${rotateX}deg)`);
  if (rotateY !== void 0) parts.push(`rotateY(${rotateY}deg)`);
  if (rotate !== void 0) parts.push(`rotate(${rotate}deg)`);
  const skew = values.get("skew");
  if (skew !== void 0) parts.push(`skew(${skew}deg)`);
  const skewX = values.get("skewX");
  const skewY = values.get("skewY");
  if (skewX !== void 0 || skewY !== void 0) {
    parts.push(`skew(${skewX ?? 0}deg, ${skewY ?? 0}deg)`);
  }
  return parts.join(" ");
}
function applyStylesToElement(element, values) {
  const el = element;
  const transformValues = /* @__PURE__ */ new Map();
  const styleValues = {};
  values.forEach((value, property) => {
    if (transformProperties.has(property)) {
      transformValues.set(property, value);
    } else if (property === "opacity") {
      styleValues.opacity = String(value);
    } else if (pxProperties.has(property)) {
      styleValues[property] = `${value}px`;
    } else {
      styleValues[property] = String(value);
    }
  });
  if (transformValues.size > 0) {
    let stored = elementTransforms.get(element);
    if (!stored) {
      stored = /* @__PURE__ */ new Map();
      elementTransforms.set(element, stored);
    }
    transformValues.forEach((value, property) => stored.set(property, value));
    el.style.transform = buildTransform(stored);
  }
  Object.entries(styleValues).forEach(([prop, val]) => {
    el.style.setProperty(prop, val);
  });
}
function parseCurrentValue(element, property) {
  const el = element;
  const computed = getComputedStyle(el);
  if (property === "opacity") {
    const opacity = parseFloat(computed.opacity);
    return Number.isNaN(opacity) ? 1 : opacity;
  }
  if (transformProperties.has(property)) {
    const stored = elementTransforms.get(element)?.get(property);
    if (stored !== void 0) {
      return stored;
    }
    return property.startsWith("scale") ? 1 : 0;
  }
  const value = computed.getPropertyValue(property);
  return parseFloat(value) || 0;
}
function animate(elementOrSelector, target, options = {}) {
  const { delay: delay2 = 0, onUpdate, onComplete, ...springConfig } = options;
  const element = typeof elementOrSelector === "string" ? document.querySelector(elementOrSelector) : elementOrSelector;
  if (!element) {
    console.warn("animate: Element not found");
    return createNoopControls();
  }
  const springs = /* @__PURE__ */ new Map();
  const currentValues = /* @__PURE__ */ new Map();
  const currentTargets = /* @__PURE__ */ new Map();
  const pausedVelocities = /* @__PURE__ */ new Map();
  const released = /* @__PURE__ */ new Set();
  const ownedBy = propertyOwners.get(element) ?? /* @__PURE__ */ new Map();
  propertyOwners.set(element, ownedBy);
  const releasers = /* @__PURE__ */ new Map();
  const disown = (property) => {
    const release = releasers.get(property);
    if (release && ownedBy.get(property) === release) ownedBy.delete(property);
    releasers.delete(property);
  };
  let isRunning = true;
  let isPaused = false;
  let resolveFinished;
  const rafIds = /* @__PURE__ */ new Set();
  let cancelDelay = null;
  const finished = new Promise((resolve, _reject) => {
    resolveFinished = resolve;
  });
  const startAnimation = () => {
    const entries = Object.entries(target);
    let completedCount = 0;
    const totalAnimations = entries.length;
    if (totalAnimations === 0) {
      if (isRunning) {
        isRunning = false;
        try {
          onComplete?.();
        } catch {
        }
        resolveFinished();
      }
      return;
    }
    const toNumber = (v) => typeof v === "string" ? parseFloat(v) || 0 : v;
    entries.forEach(([property, value]) => {
      const list = Array.isArray(value) ? value : [value];
      const hasFrom = list.length > 1;
      const values = hasFrom ? list.slice(1) : list;
      const startValue = hasFrom ? toNumber(list[0]) : parseCurrentValue(element, property);
      const spring2 = createSpringValue(startValue, {
        stiffness: springConfig.stiffness ?? 100,
        damping: springConfig.damping ?? 10,
        mass: springConfig.mass ?? 1
      });
      springs.set(property, spring2);
      currentValues.set(property, startValue);
      ownedBy.get(property)?.();
      const release = () => {
        released.add(property);
        releasers.delete(property);
        spring2.stop();
        currentValues.delete(property);
        currentTargets.delete(property);
      };
      releasers.set(property, release);
      ownedBy.set(property, release);
      spring2.subscribe((v) => {
        if (!isRunning || isPaused || released.has(property)) return;
        currentValues.set(property, v);
        applyStylesToElement(element, currentValues);
        if (onUpdate) {
          const valuesObj = {};
          currentValues.forEach((val, key) => {
            valuesObj[key] = val;
          });
          onUpdate(valuesObj);
        }
      });
      const animateKeyframes = async () => {
        for (const targetValue of values) {
          if (!isRunning || released.has(property)) break;
          const numValue = toNumber(targetValue);
          await new Promise((resolve) => {
            currentTargets.set(property, numValue);
            if (!isPaused) {
              spring2.set(numValue);
            }
            let checkId = null;
            const checkDone = () => {
              if (checkId !== null) {
                rafIds.delete(checkId);
              }
              if (!isRunning || released.has(property) || !isPaused && !spring2.isAnimating()) {
                resolve();
              } else {
                checkId = requestAnimationFrame(checkDone);
                rafIds.add(checkId);
              }
            };
            checkId = requestAnimationFrame(checkDone);
            rafIds.add(checkId);
          });
        }
        disown(property);
        completedCount++;
        if (completedCount === totalAnimations && isRunning) {
          isRunning = false;
          try {
            onComplete?.();
          } catch {
          }
          resolveFinished();
        }
      };
      animateKeyframes();
    });
  };
  if (delay2 > 0) {
    cancelDelay = globalLoop.delay(delay2, () => {
      cancelDelay = null;
      startAnimation();
    });
  } else {
    startAnimation();
  }
  const cleanup = () => {
    rafIds.forEach((id) => {
      cancelAnimationFrame(id);
    });
    rafIds.clear();
    cancelDelay?.();
    cancelDelay = null;
  };
  return {
    stop: () => {
      isRunning = false;
      cleanup();
      for (const property of [...releasers.keys()]) disown(property);
      springs.forEach((spring2) => spring2.stop());
      resolveFinished();
    },
    pause: () => {
      if (!isRunning || isPaused) return;
      isPaused = true;
      springs.forEach((spring2, property) => {
        pausedVelocities.set(property, spring2.getVelocity());
        spring2.stop();
      });
    },
    resume: () => {
      if (!isPaused) return;
      isPaused = false;
      if (!isRunning) return;
      currentTargets.forEach((value, property) => {
        springs.get(property)?.set(value, { velocity: pausedVelocities.get(property) ?? 0 });
      });
      pausedVelocities.clear();
    },
    getProgress: () => {
      let totalProgress = 0;
      let count = 0;
      springs.forEach((spring2) => {
        totalProgress += spring2.isAnimating() ? 0.5 : 1;
        count++;
      });
      return count > 0 ? totalProgress / count : 1;
    },
    isAnimating: () => isRunning && !isPaused,
    finished
  };
}
function createNoopControls() {
  return {
    stop: () => {
    },
    pause: () => {
    },
    resume: () => {
    },
    getProgress: () => 1,
    isAnimating: () => false,
    finished: Promise.resolve()
  };
}
function animateAll(selector, target, options = {}) {
  const { stagger: stagger2 = 0, ...animateOptions } = options;
  const elements = document.querySelectorAll(selector);
  return Array.from(elements).map((element, index) => {
    return animate(element, target, {
      ...animateOptions,
      delay: (animateOptions.delay ?? 0) + stagger2 * index
    });
  });
}

// src/interpolation/interpolate.ts
var defaultInterpolateOptions = {
  clamp: false
};
var InterpolationImpl = class {
  constructor(source, input, output, options = {}) {
    this.source = source;
    const length = Math.min(input.length, output.length);
    let normalizedInput = input.slice(0, length);
    let normalizedOutput = output.slice(0, length);
    if (length > 1 && normalizedInput[0] > normalizedInput[length - 1]) {
      normalizedInput = normalizedInput.reverse();
      normalizedOutput = normalizedOutput.reverse();
    }
    this.input = normalizedInput;
    this.output = normalizedOutput;
    this.options = { ...defaultInterpolateOptions, ...options };
  }
  get() {
    const value = typeof this.source === "function" ? this.source() : this.source.get();
    if (!Number.isFinite(value)) {
      return this.output[0] ?? 0;
    }
    return this.interpolate(value);
  }
  interpolate(value) {
    const { input, output } = this;
    const { extrapolate, extrapolateLeft, extrapolateRight, clamp: clamp2 } = this.options;
    if (input.length <= 1) {
      return output[0] ?? 0;
    }
    if (value < input[0]) {
      const mode = this.getExtrapolationMode(extrapolateLeft, extrapolate);
      if (mode === "clamp") {
        value = input[0];
      } else if (mode === "identity") {
        return value;
      }
    } else if (value > input[input.length - 1]) {
      const mode = this.getExtrapolationMode(extrapolateRight, extrapolate);
      if (mode === "clamp") {
        value = input[input.length - 1];
      } else if (mode === "identity") {
        return value;
      }
    }
    let i = 1;
    while (i < input.length - 1 && value > input[i]) {
      i++;
    }
    const denominator = input[i] - input[i - 1];
    const ratio = denominator === 0 ? 0 : (value - input[i - 1]) / denominator;
    const result = output[i - 1] + ratio * (output[i] - output[i - 1]);
    if (clamp2) {
      const min = Math.min(...output);
      const max = Math.max(...output);
      return Math.max(min, Math.min(max, result));
    }
    return result;
  }
  getExtrapolationMode(specificMode, fallbackMode) {
    if (specificMode !== void 0) {
      return specificMode;
    }
    if (fallbackMode !== void 0) {
      return fallbackMode;
    }
    return "extend";
  }
};
function interpolate(value, input, output, options) {
  return new InterpolationImpl(value, input, output, options);
}

// src/utils/named-colors.ts
var NAMED_COLORS = {
  aliceblue: 15792383,
  antiquewhite: 16444375,
  aqua: 65535,
  aquamarine: 8388564,
  azure: 15794175,
  beige: 16119260,
  bisque: 16770244,
  black: 0,
  blanchedalmond: 16772045,
  blue: 255,
  blueviolet: 9055202,
  brown: 10824234,
  burlywood: 14596231,
  cadetblue: 6266528,
  chartreuse: 8388352,
  chocolate: 13789470,
  coral: 16744272,
  cornflowerblue: 6591981,
  cornsilk: 16775388,
  crimson: 14423100,
  cyan: 65535,
  darkblue: 139,
  darkcyan: 35723,
  darkgoldenrod: 12092939,
  darkgray: 11119017,
  darkgreen: 25600,
  darkgrey: 11119017,
  darkkhaki: 12433259,
  darkmagenta: 9109643,
  darkolivegreen: 5597999,
  darkorange: 16747520,
  darkorchid: 10040012,
  darkred: 9109504,
  darksalmon: 15308410,
  darkseagreen: 9419919,
  darkslateblue: 4734347,
  darkslategray: 3100495,
  darkslategrey: 3100495,
  darkturquoise: 52945,
  darkviolet: 9699539,
  deeppink: 16716947,
  deepskyblue: 49151,
  dimgray: 6908265,
  dimgrey: 6908265,
  dodgerblue: 2003199,
  firebrick: 11674146,
  floralwhite: 16775920,
  forestgreen: 2263842,
  fuchsia: 16711935,
  gainsboro: 14474460,
  ghostwhite: 16316671,
  gold: 16766720,
  goldenrod: 14329120,
  gray: 8421504,
  green: 32768,
  greenyellow: 11403055,
  grey: 8421504,
  honeydew: 15794160,
  hotpink: 16738740,
  indianred: 13458524,
  indigo: 4915330,
  ivory: 16777200,
  khaki: 15787660,
  lavender: 15132410,
  lavenderblush: 16773365,
  lawngreen: 8190976,
  lemonchiffon: 16775885,
  lightblue: 11393254,
  lightcoral: 15761536,
  lightcyan: 14745599,
  lightgoldenrodyellow: 16448210,
  lightgray: 13882323,
  lightgreen: 9498256,
  lightgrey: 13882323,
  lightpink: 16758465,
  lightsalmon: 16752762,
  lightseagreen: 2142890,
  lightskyblue: 8900346,
  lightslategray: 7833753,
  lightslategrey: 7833753,
  lightsteelblue: 11584734,
  lightyellow: 16777184,
  lime: 65280,
  limegreen: 3329330,
  linen: 16445670,
  magenta: 16711935,
  maroon: 8388608,
  mediumaquamarine: 6737322,
  mediumblue: 205,
  mediumorchid: 12211667,
  mediumpurple: 9662683,
  mediumseagreen: 3978097,
  mediumslateblue: 8087790,
  mediumspringgreen: 64154,
  mediumturquoise: 4772300,
  mediumvioletred: 13047173,
  midnightblue: 1644912,
  mintcream: 16121850,
  mistyrose: 16770273,
  moccasin: 16770229,
  navajowhite: 16768685,
  navy: 128,
  oldlace: 16643558,
  olive: 8421376,
  olivedrab: 7048739,
  orange: 16753920,
  orangered: 16729344,
  orchid: 14315734,
  palegoldenrod: 15657130,
  palegreen: 10025880,
  paleturquoise: 11529966,
  palevioletred: 14381203,
  papayawhip: 16773077,
  peachpuff: 16767673,
  peru: 13468991,
  pink: 16761035,
  plum: 14524637,
  powderblue: 11591910,
  purple: 8388736,
  rebeccapurple: 6697881,
  red: 16711680,
  rosybrown: 12357519,
  royalblue: 4286945,
  saddlebrown: 9127187,
  salmon: 16416882,
  sandybrown: 16032864,
  seagreen: 3050327,
  seashell: 16774638,
  sienna: 10506797,
  silver: 12632256,
  skyblue: 8900331,
  slateblue: 6970061,
  slategray: 7372944,
  slategrey: 7372944,
  snow: 16775930,
  springgreen: 65407,
  steelblue: 4620980,
  tan: 13808780,
  teal: 32896,
  thistle: 14204888,
  tomato: 16737095,
  turquoise: 4251856,
  violet: 15631086,
  wheat: 16113331,
  white: 16777215,
  whitesmoke: 16119285,
  yellow: 16776960,
  yellowgreen: 10145074
};
function namedColorToRgb(name) {
  const packed = NAMED_COLORS[name.toLowerCase()];
  if (packed === void 0) return null;
  return { r: packed >> 16 & 255, g: packed >> 8 & 255, b: packed & 255 };
}

// src/utils/color.ts
var NUMBER = /[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/.source;
var FUNCTIONAL_COLOR_REGEX = new RegExp(
  String.raw`^(rgba?|hsla?)\(\s*(${NUMBER})(deg|%)?\s*,?\s*(${NUMBER})(%)?\s*,?\s*(${NUMBER})(%)?\s*(?:[,/]\s*(${NUMBER})(%)?\s*)?\)$`,
  "i"
);
function isColorString(value) {
  if (typeof value !== "string") return false;
  const input = value.trim();
  return /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(input) || /^(?:rgba?|hsla?)\(/i.test(input) || input.toLowerCase() === "transparent" || namedColorToRgb(input) !== null;
}
function parseColorRGBA(color) {
  const input = color.trim();
  if (input.toLowerCase() === "transparent") {
    return { r: 0, g: 0, b: 0, a: 0 };
  }
  if (/^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(input)) {
    return { ...hexToRgb(input), a: hexAlpha(input) };
  }
  const match = input.match(FUNCTIONAL_COLOR_REGEX);
  if (match) {
    const fn = match[1].toLowerCase();
    const alphaValue = match[8];
    let a = 1;
    if (alphaValue !== void 0) {
      a = parseFloat(alphaValue) / (match[9] ? 100 : 1);
      a = Math.max(0, Math.min(1, a));
    }
    if (fn.startsWith("rgb")) {
      const channel = (value, percent) => Math.round(percent ? parseFloat(value) / 100 * 255 : parseFloat(value));
      return {
        r: channel(match[2], match[3] === "%" ? "%" : void 0),
        g: channel(match[4], match[5]),
        b: channel(match[6], match[7]),
        a
      };
    }
    return {
      ...hslToRgb(parseFloat(match[2]), parseFloat(match[4]), parseFloat(match[6])),
      a
    };
  }
  const named = namedColorToRgb(input);
  if (named) return { ...named, a: 1 };
  warnOnce(`Unrecognized color "${color}"; using black.`);
  return { r: 0, g: 0, b: 0, a: 1 };
}
function parseColor(color) {
  const { r, g, b } = parseColorRGBA(color);
  return { r, g, b };
}
function hexAlpha(hex) {
  const cleanHex = hex.replace("#", "");
  if (cleanHex.length === 4) {
    return parseInt(cleanHex.charAt(3) + cleanHex.charAt(3), 16) / 255;
  }
  if (cleanHex.length === 8) {
    return parseInt(cleanHex.slice(6, 8), 16) / 255;
  }
  return 1;
}
function rgbToHex(r, g, b) {
  const toHex = (n) => {
    const clamped = Math.round(Math.max(0, Math.min(255, n)));
    return clamped.toString(16).padStart(2, "0");
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
function hexToRgb(hex) {
  const cleanHex = hex.replace("#", "");
  if (cleanHex.length === 3 || cleanHex.length === 4) {
    return {
      r: parseInt(cleanHex.charAt(0) + cleanHex.charAt(0), 16),
      g: parseInt(cleanHex.charAt(1) + cleanHex.charAt(1), 16),
      b: parseInt(cleanHex.charAt(2) + cleanHex.charAt(2), 16)
    };
  }
  return {
    r: parseInt(cleanHex.slice(0, 2), 16),
    g: parseInt(cleanHex.slice(2, 4), 16),
    b: parseInt(cleanHex.slice(4, 6), 16)
  };
}
function hslToRgb(h, s, l) {
  h = (h % 360 + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;
  if (s === 0) {
    const gray = Math.round(l * 255);
    return { r: gray, g: gray, b: gray };
  }
  const hue2rgb = (p2, q2, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p2 + (q2 - p2) * 6 * t;
    if (t < 1 / 2) return q2;
    if (t < 2 / 3) return p2 + (q2 - p2) * (2 / 3 - t) * 6;
    return p2;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return {
    r: Math.round(hue2rgb(p, q, h / 360 + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, h / 360) * 255),
    b: Math.round(hue2rgb(p, q, h / 360 - 1 / 3) * 255)
  };
}
function rgbToHsl(r, g, b) {
  r = Math.max(0, Math.min(255, r)) / 255;
  g = Math.max(0, Math.min(255, g)) / 255;
  b = Math.max(0, Math.min(255, b)) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0;
  let s = 0;
  if (delta !== 0) {
    s = (max + min) / 2 > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    if (max === r) {
      h = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
    } else if (max === g) {
      h = ((b - r) / delta + 2) / 6;
    } else {
      h = ((r - g) / delta + 4) / 6;
    }
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round((max + min) / 2 * 100)
  };
}
function srgbToLinear(channel) {
  const abs = Math.abs(channel);
  const linear = abs <= 0.04045 ? abs / 12.92 : Math.pow((abs + 0.055) / 1.055, 2.4);
  return channel < 0 ? -linear : linear;
}
function linearToSrgb(channel) {
  const abs = Math.abs(channel);
  const encoded = abs <= 31308e-7 ? abs * 12.92 : 1.055 * Math.pow(abs, 1 / 2.4) - 0.055;
  return channel < 0 ? -encoded : encoded;
}
function linearRgbToOklab(r, g, b) {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return {
    l: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  };
}
function oklabToLinearRgb(L, a, b) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return {
    r: 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    g: -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    b: -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
  };
}
function rgbToOklab(r, g, b) {
  return linearRgbToOklab(srgbToLinear(r / 255), srgbToLinear(g / 255), srgbToLinear(b / 255));
}
function oklabToRgb(L, a, b) {
  const linear = oklabToLinearRgb(L, a, b);
  return {
    r: linearToSrgb(linear.r) * 255,
    g: linearToSrgb(linear.g) * 255,
    b: linearToSrgb(linear.b) * 255
  };
}
function toSpace(color, space) {
  if (space === "oklab") {
    const { l, a, b } = rgbToOklab(color.r, color.g, color.b);
    return [l, a, b];
  }
  if (space === "linear") {
    return [srgbToLinear(color.r / 255), srgbToLinear(color.g / 255), srgbToLinear(color.b / 255)];
  }
  return [color.r, color.g, color.b];
}
function fromSpace(c, space) {
  if (space === "oklab") {
    return oklabToRgb(c[0], c[1], c[2]);
  }
  if (space === "linear") {
    return { r: linearToSrgb(c[0]) * 255, g: linearToSrgb(c[1]) * 255, b: linearToSrgb(c[2]) * 255 };
  }
  return { r: c[0], g: c[1], b: c[2] };
}
function mixColorsRGBA(from, to, t, space = "srgb") {
  const fromAlpha = Math.max(0, Math.min(1, from.a));
  const toAlpha = Math.max(0, Math.min(1, to.a));
  const alpha = fromAlpha + (toAlpha - fromAlpha) * t;
  const a = toSpace(from, space);
  const b = toSpace(to, space);
  const mixed = [0, 0, 0];
  for (let i = 0; i < 3; i++) {
    const premultiplied = a[i] * fromAlpha + (b[i] * toAlpha - a[i] * fromAlpha) * t;
    mixed[i] = alpha > 0 ? premultiplied / alpha : 0;
  }
  const rgb = alpha > 0 ? fromSpace(mixed, space) : { r: 0, g: 0, b: 0 };
  return { ...rgb, a: alpha };
}
function formatRGBA(color) {
  const channel = (v) => Math.round(Math.max(0, Math.min(255, v)));
  const rgb = `${channel(color.r)}, ${channel(color.g)}, ${channel(color.b)}`;
  const alpha = Math.round(Math.max(0, Math.min(1, color.a)) * 1e3) / 1e3;
  return alpha >= 1 ? `rgb(${rgb})` : `rgba(${rgb}, ${alpha})`;
}

// src/interpolation/color.ts
var MAX_COLOR_CACHE_SIZE = 1e3;
var colorCache = /* @__PURE__ */ new Map();
var ColorInterpolationImpl = class {
  constructor(source, input, colorStrings, options = {}) {
    this.source = source;
    const length = Math.min(input.length, colorStrings.length);
    let normalizedInput = input.slice(0, length);
    let colors = colorStrings.slice(0, length).map((c) => this.parseColorCached(c));
    if (length > 1 && normalizedInput[0] > normalizedInput[length - 1]) {
      normalizedInput = normalizedInput.reverse();
      colors = colors.reverse();
    }
    this.input = normalizedInput;
    this.colors = colors;
    this.options = options;
  }
  /**
   * Parse color with caching for performance
   * Avoids repeated regex operations for the same color strings
   * Implements LRU eviction to prevent memory bloat
   */
  parseColorCached(color) {
    const cached = colorCache.get(color);
    if (cached) {
      colorCache.delete(color);
      colorCache.set(color, cached);
      return cached;
    }
    const result = this.parseColorInternal(color);
    if (colorCache.size >= MAX_COLOR_CACHE_SIZE) {
      const firstKey = colorCache.keys().next().value;
      if (firstKey !== void 0) {
        colorCache.delete(firstKey);
      }
    }
    colorCache.set(color, result);
    return result;
  }
  get() {
    let value = typeof this.source === "function" ? this.source() : this.source.get();
    const { extrapolate, extrapolateLeft, extrapolateRight } = this.options;
    if (this.input.length <= 1 || !Number.isFinite(value)) {
      const [r, g, b, a] = this.colors[0] ?? [0, 0, 0, 1];
      return this.format(r, g, b, a);
    }
    if (value < this.input[0]) {
      const mode = extrapolateLeft ?? extrapolate ?? "extend";
      if (mode === "clamp") {
        value = this.input[0];
      } else if (mode === "identity") {
        value = this.input[0];
      }
    } else if (value > this.input[this.input.length - 1]) {
      const mode = extrapolateRight ?? extrapolate ?? "extend";
      if (mode === "clamp") {
        value = this.input[this.input.length - 1];
      } else if (mode === "identity") {
        value = this.input[this.input.length - 1];
      }
    }
    let i = 1;
    while (i < this.input.length - 1 && value > this.input[i]) {
      i++;
    }
    const inputRange = this.input[i] - this.input[i - 1];
    const ratio = inputRange !== 0 ? (value - this.input[i - 1]) / inputRange : 0;
    const from = this.colors[i - 1];
    const to = this.colors[i];
    const mixed = mixColorsRGBA(
      { r: from[0], g: from[1], b: from[2], a: from[3] },
      { r: to[0], g: to[1], b: to[2], a: to[3] },
      ratio,
      this.options.space
    );
    return this.format(mixed.r, mixed.g, mixed.b, mixed.a);
  }
  /**
   * Format channels as a CSS color. Opaque colors keep the `rgb()` form,
   * translucent ones use `rgba()` so alpha is not silently dropped.
   */
  format(r, g, b, a) {
    return formatRGBA({ r, g, b, a });
  }
  parseColorInternal(color) {
    const { r, g, b, a } = parseColorRGBA(color);
    return [r, g, b, a];
  }
};
function interpolateColor(value, input, colors, options) {
  return new ColorInterpolationImpl(value, input, colors, options);
}

// src/gesture/drag.ts
var defaultDragConfig = {
  axis: "both",
  rubberBand: false,
  rubberBandFactor: 0.5,
  momentum: true,
  momentumDecay: 0.95,
  stiffness: 200,
  damping: 20,
  mass: 1,
  restSpeed: 0.01,
  restDelta: 0.01,
  clamp: false
};
var VELOCITY_WINDOW_MS = 100;
var DEFAULT_SNAP_VELOCITY_THRESHOLD = 500;
var FRAME_MS = 1e3 / 60;
var MIN_MOMENTUM_DECAY = 0.01;
var MAX_MOMENTUM_DECAY = 0.99;
function computeVelocity(samples, time) {
  const last = samples[samples.length - 1];
  if (!last || time - last.t > VELOCITY_WINDOW_MS) return { x: 0, y: 0 };
  let base = last;
  for (let i = samples.length - 2; i >= 0; i--) {
    const sample = samples[i];
    if (last.t - sample.t > VELOCITY_WINDOW_MS) break;
    base = sample;
  }
  const dt = last.t - base.t;
  if (dt <= 0) return { x: 0, y: 0 };
  const vx = (last.x - base.x) / dt * 1e3;
  const vy = (last.y - base.y) / dt * 1e3;
  return { x: Number.isFinite(vx) ? vx : 0, y: Number.isFinite(vy) ? vy : 0 };
}
function projectOnDiagonal(dx, dy) {
  const sign = dx * dy < 0 ? -1 : 1;
  const amount = (dx + sign * dy) / 2;
  return { x: amount, y: sign * amount };
}
var DragSpringImpl = class {
  constructor(element, config = {}) {
    this.enabled = true;
    this.position = { x: 0, y: 0 };
    this._isDragging = false;
    this.startPosition = { x: 0, y: 0 };
    this.pointerStart = { x: 0, y: 0 };
    /** Element positions during the drag, for the velocity estimate */
    this.samples = [];
    /** Drag velocity of the element (px/s) */
    this.velocity = { x: 0, y: 0 };
    /** Running momentum animations, per axis */
    this.momentum = { x: null, y: null };
    this.currentSnap = null;
    this.snapGeneration = 0;
    this.destroyed = false;
    /** Pointer that owns the current drag (other pointers are ignored) */
    this.activePointerId = null;
    /** Bounds resolved at drag start (explicit bounds + element constraints) */
    this.dragBounds = { left: -Infinity, right: Infinity, top: -Infinity, bottom: Infinity };
    this.onPointerDown = (e) => {
      if (!this.enabled || e.button !== 0) return;
      if (this._isDragging) {
        const activeId = this.activePointerId;
        if (activeId !== null && e.pointerId !== activeId && (this.element.hasPointerCapture?.(activeId) ?? true)) {
          return;
        }
        this.endDrag(activeId);
      }
      this._isDragging = true;
      this.activePointerId = e.pointerId;
      this.stopMomentum();
      this.cancelSnap();
      this.springX.jump(this.position.x);
      this.springY.jump(this.position.y);
      this.dragBounds = this.getEffectiveBounds();
      this.startPosition = { ...this.position };
      this.pointerStart = { x: e.clientX, y: e.clientY };
      this.samples = [{ x: this.position.x, y: this.position.y, t: performance.now() }];
      this.velocity = { x: 0, y: 0 };
      try {
        this.element.setPointerCapture(e.pointerId);
      } catch {
      }
      this.element.addEventListener("pointermove", this.onPointerMove);
      this.element.addEventListener("pointerup", this.onPointerUp);
      this.element.addEventListener("pointercancel", this.onPointerUp);
      this.element.addEventListener("lostpointercapture", this.onPointerUp);
      if (this.config.onDragStart) {
        this.config.onDragStart(e);
      }
    };
    this.onPointerMove = (e) => {
      if (!this._isDragging || e.pointerId !== this.activePointerId) return;
      let deltaX = e.clientX - this.pointerStart.x;
      let deltaY = e.clientY - this.pointerStart.y;
      if (this.config.constraints?.lockToDiagonal) {
        const diagonal = projectOnDiagonal(deltaX, deltaY);
        deltaX = diagonal.x;
        deltaY = diagonal.y;
      }
      let newX = this.startPosition.x + deltaX;
      let newY = this.startPosition.y + deltaY;
      newX = this.applyBounds(newX, this.dragBounds.left, this.dragBounds.right, "x");
      newY = this.applyBounds(newY, this.dragBounds.top, this.dragBounds.bottom, "y");
      const lockAxis = this.config.constraints?.lockAxis;
      if (lockAxis === "x" || this.config.axis === "x") {
        newY = this.startPosition.y;
      } else if (lockAxis === "y" || this.config.axis === "y") {
        newX = this.startPosition.x;
      }
      this.position = { x: newX, y: newY };
      this.recordSample(performance.now());
      if (this.config.onDrag) {
        this.config.onDrag(newX, newY, e);
      }
      if (this.config.onUpdate) {
        this.config.onUpdate(newX, newY);
      }
    };
    this.onPointerUp = (e) => {
      if (!this._isDragging || e.pointerId !== this.activePointerId) return;
      this.springX.jump(this.position.x);
      this.springY.jump(this.position.y);
      this.velocity = computeVelocity(this.samples, performance.now());
      this.samples = [];
      this.endDrag(e.pointerId);
      if (this.config.snap?.snapOnRelease !== false) {
        const snapPoint = this.findNearestSnapPoint();
        if (snapPoint) {
          this.startSnap(snapPoint, this.velocity);
          if (this.config.onDragEnd) {
            this.config.onDragEnd(this.position.x, this.position.y, this.velocity);
          }
          return;
        }
      }
      this.release(this.velocity.x, this.velocity.y);
      if (this.config.onDragEnd) {
        this.config.onDragEnd(this.position.x, this.position.y, this.velocity);
      }
    };
    this.element = element;
    this.config = {
      ...defaultDragConfig,
      ...config,
      // Deep clone bounds if provided
      bounds: config.bounds ? { ...config.bounds } : void 0
    };
    const springConfig = {
      stiffness: this.config.stiffness,
      damping: this.config.damping,
      mass: this.config.mass,
      restSpeed: this.config.restSpeed,
      restDelta: this.config.restDelta,
      clamp: this.config.clamp
    };
    this.springX = createSpringValue(0, springConfig);
    this.springY = createSpringValue(0, springConfig);
    this.springX.subscribe(() => {
      if (!this._isDragging) {
        this.position.x = this.springX.get();
        if (this.config.onUpdate) {
          this.config.onUpdate(this.position.x, this.position.y);
        }
      }
    });
    this.springY.subscribe(() => {
      if (!this._isDragging) {
        this.position.y = this.springY.get();
        if (this.config.onUpdate) {
          this.config.onUpdate(this.position.x, this.position.y);
        }
      }
    });
    this.setupPointerEvents();
  }
  setupPointerEvents() {
    this.element.addEventListener("pointerdown", this.onPointerDown);
  }
  /**
   * Track the element position for the velocity estimate. This is the
   * velocity of the element (after axis / diagonal lock and bounds), so the
   * release motion continues exactly as the element was moving.
   */
  recordSample(time) {
    const last = this.samples[this.samples.length - 1];
    if (!last || last.x !== this.position.x || last.y !== this.position.y) {
      this.samples.push({ x: this.position.x, y: this.position.y, t: time });
      while (this.samples.length > 2 && time - this.samples[0].t > VELOCITY_WINDOW_MS * 2) {
        this.samples.shift();
      }
    }
    this.velocity = computeVelocity(this.samples, time);
  }
  getElasticFactor(edge) {
    const dragElastic = this.config.dragElastic;
    if (dragElastic === void 0) {
      if (this.config.rubberBand) {
        return this.config.rubberBandFactor ?? 0.5;
      }
      return 0;
    }
    if (typeof dragElastic === "boolean") {
      return dragElastic ? 0.5 : 0;
    }
    if (typeof dragElastic === "number") {
      return clamp(dragElastic, 0, 1);
    }
    return clamp(dragElastic[edge] ?? 0, 0, 1);
  }
  applyBounds(value, min, max, axis = "x") {
    if (!isFinite(min) && !isFinite(max)) return value;
    const actualMin = isFinite(min) ? min : -Infinity;
    const actualMax = isFinite(max) ? max : Infinity;
    const hasElastic = this.config.dragElastic !== void 0 || this.config.rubberBand;
    if (hasElastic) {
      if (value < actualMin) {
        const elasticFactor = this.getElasticFactor(axis === "x" ? "left" : "top");
        return actualMin - (actualMin - value) * elasticFactor;
      }
      if (value > actualMax) {
        const elasticFactor = this.getElasticFactor(axis === "x" ? "right" : "bottom");
        return actualMax + (value - actualMax) * elasticFactor;
      }
    }
    return clamp(value, actualMin, actualMax);
  }
  /**
   * Leave drag mode: release pointer capture and remove move/up listeners
   */
  endDrag(pointerId) {
    this._isDragging = false;
    this.activePointerId = null;
    this.element.removeEventListener("lostpointercapture", this.onPointerUp);
    if (pointerId !== null) {
      try {
        this.element.releasePointerCapture(pointerId);
      } catch {
      }
    }
    this.element.removeEventListener("pointermove", this.onPointerMove);
    this.element.removeEventListener("pointerup", this.onPointerUp);
    this.element.removeEventListener("pointercancel", this.onPointerUp);
  }
  findNearestSnapPoint() {
    const snap = this.config.snap;
    if (!snap) return null;
    if (snap.grid) {
      const gridX = snap.grid.x === 0 ? this.position.x : Math.round(this.position.x / snap.grid.x) * snap.grid.x;
      const gridY = snap.grid.y === 0 ? this.position.y : Math.round(this.position.y / snap.grid.y) * snap.grid.y;
      return { x: gridX, y: gridY };
    }
    if (snap.points && snap.points.length > 0) {
      const velocityMagnitude = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2);
      const threshold = snap.velocityThreshold ?? DEFAULT_SNAP_VELOCITY_THRESHOLD;
      if (velocityMagnitude > threshold) return null;
      let nearestPoint = null;
      let nearestDistance = Infinity;
      for (const point of snap.points) {
        const dx = this.position.x - point.x;
        const dy = this.position.y - point.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const radius = point.radius ?? 50;
        if (distance < radius && distance < nearestDistance) {
          nearestDistance = distance;
          nearestPoint = point;
        }
      }
      return nearestPoint;
    }
    return null;
  }
  getEffectiveBounds() {
    const bounds = {
      left: this.config.bounds?.left ?? this.config.constraints?.bounds?.left ?? -Infinity,
      right: this.config.bounds?.right ?? this.config.constraints?.bounds?.right ?? Infinity,
      top: this.config.bounds?.top ?? this.config.constraints?.bounds?.top ?? -Infinity,
      bottom: this.config.bounds?.bottom ?? this.config.constraints?.bounds?.bottom ?? Infinity
    };
    const constraints = this.config.constraints;
    const layoutOrigin = () => {
      const elementRect = this.element.getBoundingClientRect();
      return {
        left: elementRect.left - this.position.x,
        top: elementRect.top - this.position.y,
        width: elementRect.width,
        height: elementRect.height
      };
    };
    if (constraints?.constrainToParent && this.element.parentElement) {
      const parent = this.element.parentElement;
      const parentRect = parent.getBoundingClientRect();
      const element = layoutOrigin();
      const padding = this.normalizePadding(constraints.constraintPadding);
      const hasClientBox = parent.clientWidth > 0 || parent.clientHeight > 0;
      const boxLeft = parentRect.left + (hasClientBox ? parent.clientLeft : 0);
      const boxTop = parentRect.top + (hasClientBox ? parent.clientTop : 0);
      const boxWidth = hasClientBox ? parent.clientWidth : parentRect.width;
      const boxHeight = hasClientBox ? parent.clientHeight : parentRect.height;
      const offsetX = element.left - boxLeft;
      const offsetY = element.top - boxTop;
      bounds.left = Math.max(bounds.left, padding.left - offsetX);
      bounds.right = Math.min(bounds.right, boxWidth - element.width - padding.right - offsetX);
      bounds.top = Math.max(bounds.top, padding.top - offsetY);
      bounds.bottom = Math.min(bounds.bottom, boxHeight - element.height - padding.bottom - offsetY);
    }
    if (constraints?.constrainToElement) {
      const constraintRect = constraints.constrainToElement.getBoundingClientRect();
      const elementRect = layoutOrigin();
      const padding = this.normalizePadding(constraints.constraintPadding);
      const offsetX = constraintRect.left - elementRect.left;
      const offsetY = constraintRect.top - elementRect.top;
      bounds.left = Math.max(bounds.left, offsetX + padding.left);
      bounds.right = Math.min(bounds.right, offsetX + constraintRect.width - elementRect.width - padding.right);
      bounds.top = Math.max(bounds.top, offsetY + padding.top);
      bounds.bottom = Math.min(bounds.bottom, offsetY + constraintRect.height - elementRect.height - padding.bottom);
    }
    return bounds;
  }
  normalizePadding(padding) {
    if (typeof padding === "number") {
      return { top: padding, right: padding, bottom: padding, left: padding };
    }
    return {
      top: padding?.top ?? 0,
      right: padding?.right ?? 0,
      bottom: padding?.bottom ?? 0,
      left: padding?.left ?? 0
    };
  }
  enable() {
    this.enabled = true;
  }
  disable() {
    this.enabled = false;
    if (this._isDragging) {
      this.springX.jump(this.position.x);
      this.springY.jump(this.position.y);
      this.samples = [];
      this.velocity = { x: 0, y: 0 };
      this.endDrag(this.activePointerId);
      const { left, right, top, bottom } = this.getEffectiveBounds();
      const targetX = clamp(this.position.x, left, right);
      const targetY = clamp(this.position.y, top, bottom);
      if (targetX !== this.position.x) this.springAxis("x", targetX, 0, this.getBounceConfig());
      if (targetY !== this.position.y) this.springAxis("y", targetY, 0, this.getBounceConfig());
      if (this.config.onDragEnd) {
        this.config.onDragEnd(this.position.x, this.position.y, { x: 0, y: 0 });
      }
    }
  }
  isEnabled() {
    return this.enabled;
  }
  isDragging() {
    return this._isDragging;
  }
  reset() {
    this.stopMomentum();
    this.springX.jump(0);
    this.springY.jump(0);
    this.position = { x: 0, y: 0 };
    this.velocity = { x: 0, y: 0 };
    this.currentSnap = null;
    if (this.config.onUpdate) {
      this.config.onUpdate(0, 0);
    }
  }
  getPosition() {
    return { ...this.position };
  }
  getVelocity() {
    if (this._isDragging) return { ...this.velocity };
    return {
      x: this.momentum.x ? this.momentum.x.getVelocity() : this.springX.getVelocity(),
      y: this.momentum.y ? this.momentum.y.getVelocity() : this.springY.getVelocity()
    };
  }
  setPosition(x, y) {
    if (this.destroyed) return;
    const safeX = Number.isFinite(x) ? x : this.position.x;
    const safeY = Number.isFinite(y) ? y : this.position.y;
    this.stopMomentum();
    this.cancelSnap();
    this.position = { x: safeX, y: safeY };
    this.springX.jump(safeX);
    this.springY.jump(safeY);
  }
  jumpTo(x, y) {
    if (this.destroyed) return;
    const safeX = Number.isFinite(x) ? x : this.position.x;
    const safeY = Number.isFinite(y) ? y : this.position.y;
    this.stopMomentum();
    this.cancelSnap();
    this.position = { x: safeX, y: safeY };
    this.springX.jump(safeX);
    this.springY.jump(safeY);
    if (this.config.onUpdate) {
      this.config.onUpdate(safeX, safeY);
    }
  }
  animateTo(x, y) {
    if (this.destroyed) return;
    const safeX = Number.isFinite(x) ? x : this.position.x;
    const safeY = Number.isFinite(y) ? y : this.position.y;
    const velocity = this.stopMomentum();
    this.cancelSnap();
    this.springAxis("x", safeX, velocity.x);
    this.springAxis("y", safeY, velocity.y);
  }
  /**
   * Release model (velocities in px/s):
   *
   * - Inside the bounds, with momentum: each axis runs a core `decay()` that
   *   starts at exactly the release velocity and slows down exponentially
   *   (per-ms deceleration d = momentumDecay^(60/1000)), coming to rest at
   *   `position + v/1000 / -ln(d)`. `modifyTarget` receives that 2D rest
   *   point; the decay then lands exactly on the modified point. If the
   *   motion reaches a bound it stops there, or — with elasticity
   *   (`rubberBand` / `dragElastic`) or `elasticBounce` — hands its current
   *   velocity over to a bounce spring that settles on the bound (like the
   *   React `Animated` drag).
   *
   *   A spring towards the projected rest point is deliberately NOT used: it
   *   is pulled by stiffness * distance from the first frame (e.g. 200 *
   *   325px = 65000 px/s², +1000 px/s within one frame), so the element
   *   would jump in speed at release and overshoot the rest point. The decay
   *   keeps the velocity continuous and lands without overshoot.
   * - Outside the bounds: spring back to the nearest bound, starting with the
   *   release velocity (bounce per `elasticBounce`).
   * - Without momentum (or zero velocity): spring to the current position
   *   after `modifyTarget` (clamped to the bounds), starting with the release
   *   velocity.
   */
  release(velocityX, velocityY) {
    if (this.destroyed) return;
    let vx = Number.isFinite(velocityX) ? velocityX : 0;
    let vy = Number.isFinite(velocityY) ? velocityY : 0;
    if (this.config.constraints?.lockToDiagonal) {
      const diagonal = projectOnDiagonal(vx, vy);
      vx = diagonal.x;
      vy = diagonal.y;
    }
    const lockAxis = this.config.constraints?.lockAxis;
    if (lockAxis === "x" || this.config.axis === "x") vy = 0;
    else if (lockAxis === "y" || this.config.axis === "y") vx = 0;
    this.stopMomentum();
    this.cancelSnap();
    const { left, right, top, bottom } = this.getEffectiveBounds();
    const useMomentum = this.config.momentum !== false;
    const deceleration = this.getMomentumDeceleration();
    const travelPerVelocity = useMomentum ? 1 / (1e3 * -Math.log(deceleration)) : 0;
    let restX = this.position.x + vx * travelPerVelocity;
    let restY = this.position.y + vy * travelPerVelocity;
    if (this.config.modifyTarget) {
      const modified = this.config.modifyTarget({ x: restX, y: restY });
      if (Number.isFinite(modified?.x)) restX = modified.x;
      if (Number.isFinite(modified?.y)) restY = modified.y;
    }
    if (this.config.onBoundsHit) {
      if (this.position.x < left) this.config.onBoundsHit("left");
      if (this.position.x > right) this.config.onBoundsHit("right");
      if (this.position.y < top) this.config.onBoundsHit("top");
      if (this.position.y > bottom) this.config.onBoundsHit("bottom");
    }
    this.releaseAxis("x", vx, restX, left, right, useMomentum, deceleration);
    this.releaseAxis("y", vy, restY, top, bottom, useMomentum, deceleration);
  }
  /** Release one axis (see `release`) */
  releaseAxis(axis, velocity, rest, min, max, useMomentum, deceleration) {
    const from = this.position[axis];
    if (from < min || from > max) {
      this.springAxis(axis, clamp(from, min, max), velocity, this.getBounceConfig());
      return;
    }
    if (useMomentum && velocity !== 0) {
      this.startMomentum(axis, from, velocity, rest, deceleration, min, max);
      return;
    }
    const target = clamp(rest, min, max);
    if (target !== from || velocity !== 0) {
      this.springAxis(axis, target, velocity, target !== rest ? this.getBounceConfig() : {});
    }
  }
  /**
   * Spring an axis to `to`. A given velocity (px/s) is the spring's initial
   * velocity; otherwise a running spring keeps its own.
   */
  springAxis(axis, to, velocity, extra = {}) {
    const springValue = axis === "x" ? this.springX : this.springY;
    if (velocity === void 0 && extra.damping === void 0) {
      springValue.set(to);
    } else {
      springValue.set(to, { ...velocity === void 0 ? {} : { velocity }, ...extra });
    }
  }
  /**
   * Stop the momentum animations, syncing the springs with the current
   * position. Returns the velocity (px/s) of each stopped axis (undefined for
   * an axis without momentum).
   */
  stopMomentum() {
    const stopped = { x: void 0, y: void 0 };
    for (const axis of ["x", "y"]) {
      const animation = this.momentum[axis];
      if (!animation) continue;
      this.momentum[axis] = null;
      stopped[axis] = animation.getVelocity();
      animation.destroy();
      (axis === "x" ? this.springX : this.springY).jump(this.position[axis]);
    }
    return stopped;
  }
  /**
   * Momentum along one axis: exponential decay from `from` at `velocity`
   * (px/s) that comes to rest exactly at `target`. On reaching a bound it
   * stops there, or (with elasticity / elasticBounce) hands its current
   * velocity over to a bounce spring that settles on the bound.
   */
  startMomentum(axis, from, velocity, target, deceleration, min, max) {
    const springValue = axis === "x" ? this.springX : this.springY;
    if (springValue.isAnimating() || springValue.get() !== from) springValue.jump(from);
    const animation = decay({
      from,
      velocity,
      deceleration,
      // Land exactly on the (possibly modified) rest point
      modifyTarget: () => target,
      onUpdate: (value) => {
        if (this.momentum[axis] !== animation) return;
        if (value >= min && value <= max) {
          this.position[axis] = value;
          this.config.onUpdate?.(this.position.x, this.position.y);
          return;
        }
        const edge = value < min ? axis === "x" ? "left" : "top" : axis === "x" ? "right" : "bottom";
        const bound = value < min ? min : max;
        const boundVelocity = animation.getVelocity();
        this.momentum[axis] = null;
        animation.destroy();
        this.config.onBoundsHit?.(edge);
        const elastic = this.config.dragElastic !== void 0 || this.config.rubberBand ? this.getElasticFactor(edge) : 0;
        if (elastic > 0 || this.config.elasticBounce !== void 0) {
          springValue.jump(value);
          springValue.set(bound, { velocity: boundVelocity, ...this.getBounceConfig() });
        } else {
          springValue.jump(bound);
        }
      },
      onComplete: () => {
        if (this.momentum[axis] !== animation) return;
        this.momentum[axis] = null;
        springValue.jump(this.position[axis]);
      }
    });
    this.momentum[axis] = animation;
    animation.start();
  }
  /** Per-millisecond `decay()` deceleration from the per-frame `momentumDecay` */
  getMomentumDeceleration() {
    const raw = this.config.momentumDecay;
    const perFrame = raw !== void 0 && Number.isFinite(raw) ? clamp(raw, MIN_MOMENTUM_DECAY, MAX_MOMENTUM_DECAY) : defaultDragConfig.momentumDecay;
    return Math.pow(perFrame, 1 / FRAME_MS);
  }
  /**
   * Damping override for bound hits derived from `elasticBounce`
   * (0 = critically damped, 1 = barely damped). Empty when unset.
   */
  getBounceConfig() {
    const bounce = this.config.elasticBounce;
    if (bounce === void 0 || !Number.isFinite(bounce)) return {};
    const stiffness = this.config.stiffness ?? defaultDragConfig.stiffness;
    const mass = this.config.mass ?? defaultDragConfig.mass;
    const dampingRatio = Math.max(0.05, 1 - clamp(bounce, 0, 1));
    return { damping: 2 * Math.sqrt(stiffness * mass) * dampingRatio };
  }
  snapToNearest() {
    const snapPoint = this.findNearestSnapPoint();
    if (snapPoint) {
      this.snapTo(snapPoint);
    }
  }
  snapTo(point) {
    if (this.destroyed) return;
    this.startSnap(point, this.stopMomentum());
  }
  /**
   * Spring to a snap point. A given velocity (px/s) is the initial velocity
   * of the snap spring; otherwise a running spring keeps its own.
   */
  startSnap(point, velocity) {
    this.stopMomentum();
    this.currentSnap = point;
    if (this.config.onSnapStart) {
      this.config.onSnapStart(point);
    }
    this.springAxis("x", point.x, velocity.x);
    this.springAxis("y", point.y, velocity.y);
    const generation = ++this.snapGeneration;
    void Promise.all([this.springX.finished, this.springY.finished]).then(() => {
      if (!this.destroyed && generation === this.snapGeneration && this.currentSnap === point) {
        this.currentSnap = null;
        this.config.onSnapComplete?.(point);
      }
    });
  }
  /**
   * Forget a running snap (it was interrupted by a drag, release, jump or
   * animateTo), so its onSnapComplete doesn't fire
   */
  cancelSnap() {
    this.snapGeneration++;
    this.currentSnap = null;
  }
  setConstraints(constraints) {
    this.config.constraints = constraints;
  }
  setSnap(snap) {
    this.config.snap = snap;
  }
  destroy() {
    this.destroyed = true;
    for (const axis of ["x", "y"]) {
      this.momentum[axis]?.destroy();
      this.momentum[axis] = null;
    }
    this.element.removeEventListener("pointerdown", this.onPointerDown);
    this.endDrag(this._isDragging ? this.activePointerId : null);
    this.springX.destroy();
    this.springY.destroy();
  }
};
function createDragSpring(element, config) {
  return new DragSpringImpl(element, config);
}

// src/gesture/scroll.ts
var defaultScrollConfig = {
  direction: "vertical",
  momentum: false,
  momentumDecay: 0.95,
  bounce: false,
  stiffness: 100,
  damping: 10,
  mass: 1,
  restSpeed: 0.01,
  restDelta: 0.01,
  clamp: false
};
var LINE_HEIGHT_PX = 16;
var PAGE_HEIGHT_FALLBACK_PX = 800;
var RUBBER_BAND_COEFFICIENT = 0.55;
function rubberBand(overscroll, dimension) {
  return (1 - 1 / (overscroll * RUBBER_BAND_COEFFICIENT / dimension + 1)) * dimension;
}
var ScrollSpringImpl = class {
  constructor(container, config = {}) {
    this.scroll = { x: 0, y: 0 };
    this.target = { x: 0, y: 0 };
    /**
     * Scroll position the wheel input asks for, without the rubber band; the
     * spring target is this position with the overscroll rubber-banded
     */
    this.rawTarget = { x: 0, y: 0 };
    this.isScrolling = false;
    this.isEnabled = true;
    this.pendingRafId = null;
    this.destroyed = false;
    this.onWheel = (e) => {
      if (!this.isEnabled) return;
      if (!this.isScrolling) {
        this.isScrolling = true;
        this.config.onScrollStart?.();
      }
      const deltaScale = e.deltaMode === 1 ? LINE_HEIGHT_PX : e.deltaMode === 2 ? this.container.clientHeight || PAGE_HEIGHT_FALLBACK_PX : 1;
      let deltaX = e.deltaX * deltaScale;
      let deltaY = e.deltaY * deltaScale;
      if (this.config.direction === "horizontal") {
        deltaY = 0;
      } else if (this.config.direction === "vertical") {
        deltaX = 0;
      }
      if (this.config.bounce) {
        const maxScrollX = Math.max(0, this.container.scrollWidth - this.container.clientWidth);
        const maxScrollY = Math.max(0, this.container.scrollHeight - this.container.clientHeight);
        this.rawTarget.x += deltaX;
        this.rawTarget.y += deltaY;
        this.target = {
          x: this.applyRubberBand(this.rawTarget.x, maxScrollX, this.container.clientWidth),
          y: this.applyRubberBand(this.rawTarget.y, maxScrollY, this.container.clientHeight)
        };
        e.preventDefault();
      } else {
        this.target.x += deltaX;
        this.target.y += deltaY;
        const maxScrollX = this.container.scrollWidth - this.container.clientWidth;
        const maxScrollY = this.container.scrollHeight - this.container.clientHeight;
        this.target.x = Math.max(0, Math.min(this.target.x, maxScrollX));
        this.target.y = Math.max(0, Math.min(this.target.y, maxScrollY));
        this.rawTarget = { ...this.target };
      }
      this.startScrollLoop();
    };
    this.container = container;
    this.config = { ...defaultScrollConfig, ...config };
    const springConfig = {
      stiffness: this.config.stiffness,
      damping: this.config.damping,
      mass: this.config.mass,
      restSpeed: this.config.restSpeed,
      restDelta: this.config.restDelta,
      clamp: this.config.clamp
    };
    this.springX = createSpringValue(0, springConfig);
    this.springY = createSpringValue(0, springConfig);
    this.springX.subscribe(() => {
      this.scroll.x = this.springX.get();
      this.config.onScroll?.(this.scroll.x, this.scroll.y);
    });
    this.springY.subscribe(() => {
      this.scroll.y = this.springY.get();
      this.config.onScroll?.(this.scroll.x, this.scroll.y);
    });
    this.setupScrollEvents();
  }
  setupScrollEvents() {
    this.container.addEventListener("wheel", this.onWheel, { passive: false });
  }
  startScrollLoop() {
    this.springX.set(this.target.x);
    this.springY.set(this.target.y);
    if (this.pendingRafId !== null) {
      cancelAnimationFrame(this.pendingRafId);
      this.pendingRafId = null;
    }
    const checkEnd = () => {
      this.pendingRafId = null;
      if (this.destroyed) return;
      const settled = Math.abs(this.scroll.x - this.target.x) < 0.1 && Math.abs(this.scroll.y - this.target.y) < 0.1 && !this.springX.isAnimating() && !this.springY.isAnimating();
      if (settled && this.isScrolling && this.config.bounce && this.clampTargetToBounds()) {
        const bounceConfig = this.getBounceConfig();
        this.springX.set(this.target.x, bounceConfig);
        this.springY.set(this.target.y, bounceConfig);
        this.pendingRafId = requestAnimationFrame(checkEnd);
        return;
      }
      if (settled && this.isScrolling) {
        this.isScrolling = false;
        this.config.onScrollEnd?.();
      } else if (this.isScrolling) {
        this.pendingRafId = requestAnimationFrame(checkEnd);
      }
    };
    checkEnd();
  }
  /** Spring config of the bounce back from an overscroll (bounceStiffness / bounceDamping) */
  getBounceConfig() {
    const config = {};
    const { bounceStiffness, bounceDamping } = this.config;
    if (bounceStiffness !== void 0 && Number.isFinite(bounceStiffness)) config.stiffness = bounceStiffness;
    if (bounceDamping !== void 0 && Number.isFinite(bounceDamping)) config.damping = bounceDamping;
    return config;
  }
  /** Rubber-band the part of `raw` outside [0, max] (`dimension` = container size) */
  applyRubberBand(raw, max, dimension) {
    const size = dimension > 0 ? dimension : PAGE_HEIGHT_FALLBACK_PX;
    if (raw < 0) return -rubberBand(-raw, size);
    if (raw > max) return max + rubberBand(raw - max, size);
    return raw;
  }
  /**
   * Clamp the scroll target into the scrollable range.
   * @returns true if the target was outside the range
   */
  clampTargetToBounds() {
    const maxScrollX = Math.max(0, this.container.scrollWidth - this.container.clientWidth);
    const maxScrollY = Math.max(0, this.container.scrollHeight - this.container.clientHeight);
    const x = Math.max(0, Math.min(this.target.x, maxScrollX));
    const y = Math.max(0, Math.min(this.target.y, maxScrollY));
    const changed = x !== this.target.x || y !== this.target.y;
    this.target = { x, y };
    this.rawTarget = { x, y };
    return changed;
  }
  getScroll() {
    return { ...this.scroll };
  }
  scrollTo(x, y) {
    this.target = { x, y };
    this.rawTarget = { x, y };
    this.springX.set(x);
    this.springY.set(y);
  }
  scrollToElement(element, offset = 0) {
    const containerRect = this.container.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();
    const x = elementRect.left - containerRect.left + this.scroll.x + offset;
    const y = elementRect.top - containerRect.top + this.scroll.y + offset;
    this.scrollTo(x, y);
  }
  enable() {
    this.isEnabled = true;
  }
  disable() {
    this.isEnabled = false;
    if (this.pendingRafId !== null) {
      cancelAnimationFrame(this.pendingRafId);
      this.pendingRafId = null;
    }
    if (this.isScrolling) {
      this.isScrolling = false;
      this.config.onScrollEnd?.();
    }
  }
  destroy() {
    this.destroyed = true;
    if (this.pendingRafId !== null) {
      cancelAnimationFrame(this.pendingRafId);
      this.pendingRafId = null;
    }
    this.container.removeEventListener("wheel", this.onWheel);
    this.springX.destroy();
    this.springY.destroy();
  }
};
function createScrollSpring(container, config) {
  return new ScrollSpringImpl(container, config);
}

// src/gesture/advanced.ts
function getDistance(p1, p2) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}
function getAngle(p1, p2) {
  return Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
}
function getCenter(p1, p2) {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2
  };
}
function rubberBand2(value, min, max, factor) {
  const f = clamp(factor, 0, 1);
  if (value < min) {
    return min - (min - value) * f;
  }
  if (value > max) {
    return max + (value - max) * f;
  }
  return value;
}
function normalizeAngleDelta(delta) {
  let d = delta % 360;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d;
}
function capturePointer(element, pointerId) {
  try {
    element.setPointerCapture(pointerId);
  } catch {
  }
}
var VELOCITY_STALE_MS = 100;
function createPinchGesture(element, config = {}) {
  const {
    minScale = 0.1,
    maxScale = 10,
    rubberBand: enableRubberBand = true,
    rubberBandFactor = 0.5,
    spring: spring2 = { stiffness: 200, damping: 20 },
    onPinch,
    onPinchStart,
    onPinchEnd
  } = config;
  let enabled = true;
  let active = false;
  let initialDistance = 0;
  let initialScale = 1;
  let currentScale = 1;
  let lastScale = 1;
  let velocity = 0;
  let startTime = 0;
  let lastTime = 0;
  const touches = /* @__PURE__ */ new Map();
  let scaleSpring = null;
  const createState = (event, first = false, last = false) => {
    const touchArray = Array.from(touches.values());
    const p1 = touchArray[0] ?? { x: 0, y: 0 };
    const p2 = touchArray[1] ?? { x: 0, y: 0 };
    const origin = touchArray.length >= 2 ? getCenter(p1, p2) : { x: 0, y: 0 };
    return {
      active,
      first,
      last,
      event,
      elapsedTime: performance.now() - startTime,
      cancelled: false,
      scale: currentScale,
      velocity,
      distance: touchArray.length >= 2 ? getDistance(p1, p2) : 0,
      initialDistance,
      origin,
      movement: currentScale - initialScale,
      offset: currentScale - 1
    };
  };
  const handleTouchStart = (e) => {
    if (!enabled) return;
    for (const touch of Array.from(e.changedTouches)) {
      touches.set(touch.identifier, { x: touch.clientX, y: touch.clientY });
    }
    if (touches.size === 2) {
      const touchArray = Array.from(touches.values());
      const p1 = touchArray[0];
      const p2 = touchArray[1];
      initialDistance = getDistance(p1, p2);
      initialScale = currentScale;
      startTime = performance.now();
      lastTime = startTime;
      active = true;
      scaleSpring?.destroy();
      scaleSpring = null;
      onPinchStart?.(createState(e, true, false));
    }
  };
  const handleTouchMove = (e) => {
    if (!enabled || !active) return;
    for (const touch of Array.from(e.changedTouches)) {
      if (touches.has(touch.identifier)) {
        touches.set(touch.identifier, { x: touch.clientX, y: touch.clientY });
      }
    }
    if (touches.size >= 2) {
      const touchArray = Array.from(touches.values());
      const p1 = touchArray[0];
      const p2 = touchArray[1];
      const currentDistance = getDistance(p1, p2);
      const now = performance.now();
      const dt = now - lastTime;
      if (initialDistance === 0) {
        initialDistance = currentDistance;
        initialScale = currentScale;
        lastTime = now;
        return;
      }
      let newScale = initialScale * (currentDistance / initialDistance);
      if (enableRubberBand) {
        newScale = rubberBand2(newScale, minScale, maxScale, rubberBandFactor);
      } else {
        newScale = clamp(newScale, minScale, maxScale);
      }
      lastScale = currentScale;
      currentScale = newScale;
      velocity = dt > 0 ? (currentScale - lastScale) / dt * 1e3 : 0;
      lastTime = now;
      onPinch?.(createState(e, false, false));
      e.preventDefault();
    }
  };
  const handleTouchEnd = (e) => {
    for (const touch of Array.from(e.changedTouches)) {
      touches.delete(touch.identifier);
    }
    if (active && touches.size < 2) {
      active = false;
      if (currentScale < minScale || currentScale > maxScale) {
        const targetScale = clamp(currentScale, minScale, maxScale);
        scaleSpring = createSpringValue(currentScale, {
          stiffness: spring2.stiffness,
          damping: spring2.damping
        });
        scaleSpring.subscribe(() => {
          currentScale = scaleSpring.get();
          onPinch?.(createState(e, false, false));
        });
        scaleSpring.set(targetScale);
      }
      onPinchEnd?.(createState(e, false, true));
    } else if (active) {
      const touchArray = Array.from(touches.values());
      initialDistance = getDistance(touchArray[0], touchArray[1]);
      initialScale = currentScale;
    }
  };
  element.addEventListener("touchstart", handleTouchStart, { passive: false });
  element.addEventListener("touchmove", handleTouchMove, { passive: false });
  element.addEventListener("touchend", handleTouchEnd);
  element.addEventListener("touchcancel", handleTouchEnd);
  return {
    enable: () => {
      enabled = true;
    },
    disable: () => {
      enabled = false;
      scaleSpring?.destroy();
      scaleSpring = null;
    },
    isEnabled: () => enabled,
    destroy: () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchmove", handleTouchMove);
      element.removeEventListener("touchend", handleTouchEnd);
      element.removeEventListener("touchcancel", handleTouchEnd);
      scaleSpring?.destroy();
      scaleSpring = null;
      touches.clear();
    }
  };
}
function createRotateGesture(element, config = {}) {
  const {
    enabled: initialEnabled = true,
    threshold = 0,
    onRotate,
    onRotateStart,
    onRotateEnd
  } = config;
  let enabled = initialEnabled;
  let active = false;
  let initialAngle = 0;
  let currentAngle = 0;
  let lastAngle = 0;
  let velocity = 0;
  let startTime = 0;
  let lastTime = 0;
  let angleOffset = 0;
  let gestureStartAngle = 0;
  let lastRawAngle = 0;
  let accumulatedDelta = 0;
  const touches = /* @__PURE__ */ new Map();
  const createState = (event, first = false, last = false) => {
    const touchArray = Array.from(touches.values());
    const p1 = touchArray[0] ?? { x: 0, y: 0 };
    const p2 = touchArray[1] ?? { x: 0, y: 0 };
    const origin = touchArray.length >= 2 ? getCenter(p1, p2) : { x: 0, y: 0 };
    return {
      active,
      first,
      last,
      event,
      elapsedTime: performance.now() - startTime,
      cancelled: false,
      angle: currentAngle,
      velocity,
      initialAngle,
      origin,
      // Rotation during this gesture (initialAngle is the raw finger angle,
      // not a rotation, so it can't be subtracted from `angle`)
      movement: currentAngle - gestureStartAngle,
      offset: angleOffset
    };
  };
  const handleTouchStart = (e) => {
    if (!enabled) return;
    for (const touch of Array.from(e.changedTouches)) {
      touches.set(touch.identifier, { x: touch.clientX, y: touch.clientY });
    }
    if (touches.size === 2) {
      const touchArray = Array.from(touches.values());
      const p1 = touchArray[0];
      const p2 = touchArray[1];
      initialAngle = getAngle(p1, p2);
      lastRawAngle = initialAngle;
      accumulatedDelta = 0;
      startTime = performance.now();
      lastTime = startTime;
      lastAngle = currentAngle;
      gestureStartAngle = currentAngle;
      active = true;
      onRotateStart?.(createState(e, true, false));
    }
  };
  const handleTouchMove = (e) => {
    if (!enabled || !active) return;
    for (const touch of Array.from(e.changedTouches)) {
      if (touches.has(touch.identifier)) {
        touches.set(touch.identifier, { x: touch.clientX, y: touch.clientY });
      }
    }
    if (touches.size >= 2) {
      const touchArray = Array.from(touches.values());
      const p1 = touchArray[0];
      const p2 = touchArray[1];
      const newAngle = getAngle(p1, p2);
      const now = performance.now();
      const dt = now - lastTime;
      accumulatedDelta += normalizeAngleDelta(newAngle - lastRawAngle);
      lastRawAngle = newAngle;
      const angleDelta = accumulatedDelta;
      if (Math.abs(angleDelta) >= threshold) {
        currentAngle = angleOffset + angleDelta;
        velocity = dt > 0 ? (currentAngle - lastAngle) / dt * 1e3 : 0;
        lastAngle = currentAngle;
        lastTime = now;
        onRotate?.(createState(e, false, false));
      }
      e.preventDefault();
    }
  };
  const handleTouchEnd = (e) => {
    for (const touch of Array.from(e.changedTouches)) {
      touches.delete(touch.identifier);
    }
    if (active && touches.size < 2) {
      active = false;
      angleOffset = currentAngle;
      onRotateEnd?.(createState(e, false, true));
    } else if (active) {
      const touchArray = Array.from(touches.values());
      lastRawAngle = getAngle(touchArray[0], touchArray[1]);
    }
  };
  element.addEventListener("touchstart", handleTouchStart, { passive: false });
  element.addEventListener("touchmove", handleTouchMove, { passive: false });
  element.addEventListener("touchend", handleTouchEnd);
  element.addEventListener("touchcancel", handleTouchEnd);
  return {
    enable: () => {
      enabled = true;
    },
    disable: () => {
      enabled = false;
    },
    isEnabled: () => enabled,
    destroy: () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchmove", handleTouchMove);
      element.removeEventListener("touchend", handleTouchEnd);
      element.removeEventListener("touchcancel", handleTouchEnd);
      touches.clear();
    }
  };
}
function createSwipeGesture(element, config = {}) {
  const {
    velocityThreshold = 500,
    distanceThreshold = 50,
    minDistance = 10,
    maxDuration = 300,
    axis = "both",
    onSwipe,
    onSwipeStart,
    onSwipeEnd
  } = config;
  let enabled = true;
  let active = false;
  let startPoint = { x: 0, y: 0 };
  let lastPoint = { x: 0, y: 0 };
  let startTime = 0;
  let lastTime = 0;
  let pointerId = null;
  let moveVelocity = { x: 0, y: 0 };
  let cancelledByDisable = false;
  const createState = (event, first = false, last = false, direction = null, point = { x: event.clientX, y: event.clientY }, velocityOverride, cancelled = false) => {
    const now = performance.now();
    const duration = now - startTime;
    const dt = now - lastTime;
    const movement = {
      x: point.x - startPoint.x,
      y: point.y - startPoint.y
    };
    const velocity = velocityOverride ?? {
      x: dt > 0 ? (point.x - lastPoint.x) / dt * 1e3 : 0,
      y: dt > 0 ? (point.y - lastPoint.y) / dt * 1e3 : 0
    };
    return {
      active,
      first,
      last,
      event,
      elapsedTime: duration,
      cancelled,
      direction,
      velocity,
      distance: movement,
      movement,
      duration
    };
  };
  const detectDirection = (movement, velocity) => {
    const absX = Math.abs(movement.x);
    const absY = Math.abs(movement.y);
    const velX = Math.abs(velocity.x);
    const velY = Math.abs(velocity.y);
    const meetsDistanceX = absX >= distanceThreshold;
    const meetsDistanceY = absY >= distanceThreshold;
    const meetsVelocityX = velX >= velocityThreshold && absX >= minDistance;
    const meetsVelocityY = velY >= velocityThreshold && absY >= minDistance;
    if (axis === "x" || axis === "both" && absX > absY) {
      if (meetsDistanceX || meetsVelocityX) {
        return movement.x > 0 ? "right" : "left";
      }
    }
    if (axis === "y" || axis === "both" && absY > absX) {
      if (meetsDistanceY || meetsVelocityY) {
        return movement.y > 0 ? "down" : "up";
      }
    }
    return null;
  };
  const handlePointerDown = (e) => {
    if (!enabled || pointerId !== null) return;
    pointerId = e.pointerId;
    startPoint = { x: e.clientX, y: e.clientY };
    lastPoint = { ...startPoint };
    startTime = performance.now();
    lastTime = startTime;
    moveVelocity = { x: 0, y: 0 };
    cancelledByDisable = false;
    active = true;
    capturePointer(element, e.pointerId);
    addSwipeEndGuards();
    onSwipeStart?.(createState(e, true, false));
  };
  const handlePointerMove = (e) => {
    if (!enabled || !active || e.pointerId !== pointerId) return;
    const now = performance.now();
    const dt = now - lastTime;
    if (dt > 0) {
      moveVelocity = {
        x: (e.clientX - lastPoint.x) / dt * 1e3,
        y: (e.clientY - lastPoint.y) / dt * 1e3
      };
    }
    lastPoint = { x: e.clientX, y: e.clientY };
    lastTime = now;
  };
  const handlePointerUp = (e) => {
    if (!active || e.pointerId !== pointerId) return;
    if (!enabled || cancelledByDisable) {
      handlePointerCancel(e);
      return;
    }
    active = false;
    pointerId = null;
    removeSwipeEndGuards();
    const now = performance.now();
    const duration = now - startTime;
    if (duration <= maxDuration) {
      const movement = {
        x: e.clientX - startPoint.x,
        y: e.clientY - startPoint.y
      };
      const dt = now - lastTime;
      const movedSinceLastSample = e.clientX !== lastPoint.x || e.clientY !== lastPoint.y;
      const velocity = movedSinceLastSample && dt > 0 ? { x: (e.clientX - lastPoint.x) / dt * 1e3, y: (e.clientY - lastPoint.y) / dt * 1e3 } : dt <= VELOCITY_STALE_MS ? moveVelocity : { x: 0, y: 0 };
      const direction = detectDirection(movement, velocity);
      const state = createState(e, false, true, direction, void 0, velocity);
      if (direction) {
        onSwipe?.(state);
      }
      onSwipeEnd?.(state);
    } else {
      onSwipeEnd?.(createState(e, false, true, null));
    }
    try {
      element.releasePointerCapture(e.pointerId);
    } catch {
    }
  };
  const handlePointerCancel = (e) => {
    if (!active || e.pointerId !== pointerId) return;
    active = false;
    pointerId = null;
    removeSwipeEndGuards();
    onSwipeEnd?.(createState(e, false, true, null, lastPoint, { x: 0, y: 0 }, true));
    try {
      element.releasePointerCapture(e.pointerId);
    } catch {
    }
  };
  const handleLostCapture = (e) => handlePointerCancel(e);
  const addSwipeEndGuards = () => {
    element.addEventListener("lostpointercapture", handleLostCapture);
    if (typeof window !== "undefined") {
      window.addEventListener("pointerup", handlePointerUp);
      window.addEventListener("pointercancel", handlePointerCancel);
    }
  };
  function removeSwipeEndGuards() {
    element.removeEventListener("lostpointercapture", handleLostCapture);
    if (typeof window !== "undefined") {
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerCancel);
    }
  }
  element.addEventListener("pointerdown", handlePointerDown);
  element.addEventListener("pointermove", handlePointerMove);
  element.addEventListener("pointerup", handlePointerUp);
  element.addEventListener("pointercancel", handlePointerCancel);
  return {
    enable: () => {
      enabled = true;
    },
    disable: () => {
      enabled = false;
      if (active) cancelledByDisable = true;
    },
    isEnabled: () => enabled,
    destroy: () => {
      element.removeEventListener("pointerdown", handlePointerDown);
      element.removeEventListener("pointermove", handlePointerMove);
      element.removeEventListener("pointerup", handlePointerUp);
      element.removeEventListener("pointercancel", handlePointerCancel);
      removeSwipeEndGuards();
      active = false;
      pointerId = null;
    }
  };
}
function createLongPressGesture(element, config = {}) {
  const {
    threshold = 500,
    movementTolerance = 10,
    onLongPress,
    onPressStart,
    onPressEnd
  } = config;
  let enabled = true;
  let active = false;
  let triggered = false;
  let startPoint = { x: 0, y: 0 };
  let startTime = 0;
  let timerId = null;
  let pointerId = null;
  const createState = (event, first = false, last = false, cancelled = false) => ({
    active,
    first,
    last,
    event,
    elapsedTime: performance.now() - startTime,
    cancelled,
    position: startPoint,
    duration: performance.now() - startTime,
    triggered
  });
  const handlePointerDown = (e) => {
    if (!enabled || pointerId !== null) return;
    pointerId = e.pointerId;
    startPoint = { x: e.clientX, y: e.clientY };
    startTime = performance.now();
    active = true;
    triggered = false;
    capturePointer(element, e.pointerId);
    addPressEndGuards();
    onPressStart?.(createState(e, true, false));
    timerId = setTimeout(() => {
      if (active && !triggered) {
        triggered = true;
        onLongPress?.(createState(e, false, false));
      }
    }, threshold);
  };
  const handlePointerMove = (e) => {
    if (!active || e.pointerId !== pointerId) return;
    const dx = e.clientX - startPoint.x;
    const dy = e.clientY - startPoint.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance > movementTolerance) {
      if (timerId) {
        clearTimeout(timerId);
        timerId = null;
      }
    }
  };
  const handlePointerUp = (e) => {
    if (!active || e.pointerId !== pointerId) return;
    active = false;
    pointerId = null;
    removePressEndGuards();
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
    onPressEnd?.(createState(e, false, true, e.type !== "pointerup"));
    try {
      element.releasePointerCapture(e.pointerId);
    } catch {
    }
  };
  const addPressEndGuards = () => {
    element.addEventListener("lostpointercapture", handlePointerUp);
    if (typeof window !== "undefined") {
      window.addEventListener("pointerup", handlePointerUp);
      window.addEventListener("pointercancel", handlePointerUp);
    }
  };
  function removePressEndGuards() {
    element.removeEventListener("lostpointercapture", handlePointerUp);
    if (typeof window !== "undefined") {
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    }
  }
  element.addEventListener("pointerdown", handlePointerDown);
  element.addEventListener("pointermove", handlePointerMove);
  element.addEventListener("pointerup", handlePointerUp);
  element.addEventListener("pointercancel", handlePointerUp);
  return {
    enable: () => {
      enabled = true;
    },
    disable: () => {
      enabled = false;
      if (timerId) {
        clearTimeout(timerId);
        timerId = null;
      }
    },
    isEnabled: () => enabled,
    destroy: () => {
      if (timerId) clearTimeout(timerId);
      timerId = null;
      element.removeEventListener("pointerdown", handlePointerDown);
      element.removeEventListener("pointermove", handlePointerMove);
      element.removeEventListener("pointerup", handlePointerUp);
      element.removeEventListener("pointercancel", handlePointerUp);
      removePressEndGuards();
      active = false;
      pointerId = null;
    }
  };
}
function createGestures(element, config) {
  const controllers = [];
  if (config.pinch) {
    controllers.push(createPinchGesture(element, config.pinch));
  }
  if (config.rotate) {
    controllers.push(createRotateGesture(element, config.rotate));
  }
  if (config.swipe) {
    controllers.push(createSwipeGesture(element, config.swipe));
  }
  if (config.longPress) {
    controllers.push(createLongPressGesture(element, config.longPress));
  }
  return {
    enable: () => controllers.forEach((c) => c.enable()),
    disable: () => controllers.forEach((c) => c.disable()),
    isEnabled: () => controllers.every((c) => c.isEnabled()),
    destroy: () => controllers.forEach((c) => c.destroy())
  };
}

// src/scroll/scroll-linked.ts
var MAX_SMOOTHING_FACTOR = 0.95;
function resolveSmoothing(smooth) {
  const rest = { restDelta: 1e-4, restSpeed: 1e-3 };
  if (typeof smooth === "number") {
    if (!Number.isFinite(smooth) || smooth <= 0) return null;
    const omega = -Math.log(Math.min(smooth, MAX_SMOOTHING_FACTOR)) * 60;
    const mass = Math.min(10, Math.max(1, 100 / (omega * omega)));
    return { ...rest, mass, stiffness: mass * omega * omega, damping: 2 * mass * omega };
  }
  if (smooth && typeof smooth === "object") return { ...rest, ...smooth };
  return null;
}
function createSmoother(smooth, onChange) {
  const config = resolveSmoothing(smooth);
  if (!config) return null;
  const value = createSpringValue(0, config);
  let initialized = false;
  let target = 0;
  value.subscribe((v) => {
    if (initialized) onChange(v);
  });
  return {
    set: (next) => {
      if (!Number.isFinite(next)) return;
      if (!initialized) {
        target = next;
        value.jump(next);
        initialized = true;
        return;
      }
      if (next === target) return;
      target = next;
      value.set(next);
    },
    get: () => value.get(),
    destroy: () => value.destroy()
  };
}
function lerpColor(colorA, colorB, t, space) {
  const mixed = mixColorsRGBA(parseColorRGBA(colorA), parseColorRGBA(colorB), t, space);
  return mixed.a >= 1 ? rgbToHex(mixed.r, mixed.g, mixed.b) : formatRGBA(mixed);
}
var isColorString2 = isColorString;
function getVisibleRatio(rect, windowHeight) {
  if (rect.height <= 0) return 0;
  return clamp((Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0)) / rect.height, 0, 1);
}
function createScrollProgress(element, options = {}) {
  const { offset = ["start", "end"], smooth = 0 } = options;
  let progress = 0;
  let lastScrollY = typeof window !== "undefined" ? window.scrollY : 0;
  let lastTime = performance.now();
  let rafId = null;
  let destroyed = false;
  const subscribers = /* @__PURE__ */ new Set();
  const calculateProgress = (commit = true) => {
    const scrollY = window.scrollY;
    const windowHeight = window.innerHeight;
    const now = performance.now();
    const dt = Math.max(now - lastTime, 1);
    const currentVelocity = (scrollY - lastScrollY) / dt * 1e3;
    const currentDirection = scrollY > lastScrollY ? 1 : scrollY < lastScrollY ? -1 : 0;
    if (commit) {
      lastScrollY = scrollY;
      lastTime = now;
    }
    let newProgress;
    let isInView = true;
    let visibleRatio = 1;
    if (element) {
      const rect = element.getBoundingClientRect();
      const elementTop = rect.top + scrollY;
      const elementHeight = rect.height;
      const startPoint = offset[0] === "start" ? elementTop : offset[0] === "center" ? elementTop + elementHeight / 2 : elementTop + elementHeight;
      const endPoint = offset[1] === "start" ? windowHeight : offset[1] === "center" ? windowHeight / 2 : 0;
      const scrollStart = startPoint - windowHeight;
      const scrollEnd = startPoint - endPoint;
      const scrollRange = scrollEnd - scrollStart;
      newProgress = scrollRange !== 0 ? clamp((scrollY - scrollStart) / scrollRange, 0, 1) : scrollY >= scrollEnd ? 1 : 0;
      isInView = rect.top < windowHeight && rect.bottom > 0;
      visibleRatio = isInView ? getVisibleRatio(rect, windowHeight) : 0;
    } else {
      const documentHeight = document.documentElement.scrollHeight - windowHeight;
      newProgress = documentHeight > 0 ? clamp(scrollY / documentHeight, 0, 1) : 0;
    }
    if (smoother && commit) smoother.set(newProgress);
    const currentProgress = smoother ? smoother.get() : newProgress;
    if (commit) progress = currentProgress;
    return {
      progress: currentProgress,
      scrollY,
      velocity: currentVelocity,
      direction: currentDirection,
      isInView,
      visibleRatio
    };
  };
  const notify = (info) => {
    subscribers.forEach((cb) => {
      try {
        cb(info);
      } catch (e) {
        console.error("[SpringKit] ScrollProgress subscriber error:", e);
      }
    });
  };
  const smoother = createSmoother(smooth, (value) => {
    if (destroyed) return;
    progress = value;
    latestInfo = { ...latestInfo, progress: value };
    notify(latestInfo);
  });
  const onScroll = () => {
    if (rafId || destroyed) return;
    rafId = requestAnimationFrame(() => {
      rafId = null;
      if (destroyed) return;
      latestInfo = calculateProgress();
      notify(latestInfo);
    });
  };
  let latestInfo = calculateProgress();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  return {
    get: () => progress,
    // Side-effect free: doesn't move the velocity baseline or the smoothing target
    getInfo: () => calculateProgress(false),
    subscribe: (callback) => {
      subscribers.add(callback);
      try {
        callback(latestInfo);
      } catch (e) {
        console.error("[SpringKit] ScrollProgress subscriber error:", e);
      }
      return () => subscribers.delete(callback);
    },
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      smoother?.destroy();
      subscribers.clear();
    }
  };
}
function createParallax(element, config = {}) {
  const {
    speed = 0.5,
    direction = "vertical",
    easing = (t) => t,
    rootMargin = "0px"
  } = config;
  let offset = 0;
  let isInView = false;
  let observer = null;
  let pendingRafId = null;
  let destroyed = false;
  const originalTransform = element.style.transform;
  const update = () => {
    if (!isInView) return;
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const elementCenter = rect.top + rect.height / 2;
    const viewportCenter = windowHeight / 2;
    const distanceFromCenter = elementCenter - viewportCenter;
    const normalizedDistance = distanceFromCenter / windowHeight;
    const easedDistance = easing(Math.abs(normalizedDistance)) * Math.sign(normalizedDistance);
    offset = easedDistance * speed * 100;
    if (direction === "vertical") {
      element.style.transform = `translate3d(0, ${offset}px, 0)`;
    } else {
      element.style.transform = `translate3d(${offset}px, 0, 0)`;
    }
  };
  observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      if (entry) {
        isInView = entry.isIntersecting;
        if (isInView) update();
      }
    },
    { rootMargin }
  );
  observer.observe(element);
  const onScroll = () => {
    if (destroyed) return;
    if (isInView && pendingRafId === null) {
      pendingRafId = requestAnimationFrame(() => {
        pendingRafId = null;
        if (!destroyed) update();
      });
    }
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  return {
    getOffset: () => offset,
    update,
    destroy: () => {
      destroyed = true;
      if (pendingRafId !== null) {
        cancelAnimationFrame(pendingRafId);
        pendingRafId = null;
      }
      observer?.disconnect();
      window.removeEventListener("scroll", onScroll);
      element.style.transform = originalTransform;
    }
  };
}
function createScrollTrigger(element, config = {}) {
  const {
    start = "top",
    end = "bottom",
    startOffset = 0,
    endOffset = 0,
    onEnter,
    onLeave,
    onProgress,
    once = false,
    scrub = false
  } = config;
  let isActive = false;
  let progress = 0;
  let rawProgress = 0;
  let hasEntered = false;
  let rafId = null;
  let destroyed = false;
  let latestInfo = null;
  const smoother = typeof scrub === "number" ? createSmoother(scrub, (value) => {
    if (destroyed || !latestInfo) return;
    progress = value;
    latestInfo = { ...latestInfo, progress: value };
    try {
      onProgress?.(latestInfo);
    } catch (e) {
      console.error("[SpringKit] ScrollTrigger onProgress error:", e);
    }
  }) : null;
  const getPosition = (pos, rect) => {
    if (typeof pos === "number") return pos;
    switch (pos) {
      case "top":
        return rect.top;
      case "center":
        return rect.top + rect.height / 2;
      case "bottom":
        return rect.bottom;
    }
  };
  const calculateProgress = () => {
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const startPos = getPosition(start, rect) + startOffset;
    const endPos = getPosition(end, rect) + endOffset;
    const scrolled = windowHeight - startPos;
    const scrollDistance = windowHeight + (endPos - startPos);
    rawProgress = scrollDistance > 0 ? clamp(scrolled / scrollDistance, 0, 1) : scrolled >= 0 ? 1 : 0;
    const isInView = rect.top < windowHeight && rect.bottom > 0;
    const visibleRatio = isInView ? getVisibleRatio(rect, windowHeight) : 0;
    latestInfo = {
      progress: rawProgress,
      scrollY: window.scrollY,
      velocity: 0,
      direction: 0,
      isInView,
      visibleRatio
    };
    if (smoother) {
      smoother.set(rawProgress);
      progress = smoother.get();
    } else {
      progress = rawProgress;
    }
    return {
      progress,
      scrollY: window.scrollY,
      velocity: 0,
      direction: 0,
      isInView,
      visibleRatio
    };
  };
  const onScroll = () => {
    if (rafId || destroyed) return;
    rafId = requestAnimationFrame(() => {
      rafId = null;
      if (destroyed) return;
      const info = calculateProgress();
      const wasActive = isActive;
      isActive = rawProgress > 0 && rawProgress < 1;
      if (!wasActive && isActive && (!once || !hasEntered)) {
        hasEntered = true;
        try {
          onEnter?.(info);
        } catch (e) {
          console.error("[SpringKit] ScrollTrigger onEnter error:", e);
        }
      }
      if (wasActive && !isActive) {
        try {
          onLeave?.(info);
        } catch (e) {
          console.error("[SpringKit] ScrollTrigger onLeave error:", e);
        }
      }
      if (isActive || scrub) {
        try {
          onProgress?.(info);
        } catch (e) {
          console.error("[SpringKit] ScrollTrigger onProgress error:", e);
        }
      }
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  onScroll();
  return {
    isActive: () => isActive,
    getProgress: () => progress,
    refresh: () => {
      calculateProgress();
    },
    destroy: () => {
      destroyed = true;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      smoother?.destroy();
    }
  };
}
function createScrollLinkedValue(scrollProgress, config) {
  const { clamp: shouldClamp = true, easing, colorSpace, smooth } = config;
  let { inputRange, outputRange } = config;
  if (inputRange.length !== outputRange.length) {
    throw new Error("inputRange and outputRange must have the same length");
  }
  if (inputRange.length > 1 && inputRange[0] > inputRange[inputRange.length - 1]) {
    inputRange = [...inputRange].reverse();
    outputRange = [...outputRange].reverse();
  }
  const firstOutput = config.outputRange[0];
  const isColorOutput = isColorString2(firstOutput);
  let currentValue = firstOutput ?? 0;
  const subscribers = /* @__PURE__ */ new Set();
  const interpolate2 = (progress) => {
    let p = progress;
    if (easing) p = easing(p);
    const firstInput = inputRange[0] ?? 0;
    const lastInput = inputRange[inputRange.length - 1] ?? 1;
    if (shouldClamp) p = clamp(p, firstInput, lastInput);
    let segmentIndex = 0;
    for (let i = 0; i < inputRange.length - 1; i++) {
      const curr = inputRange[i] ?? 0;
      const next = inputRange[i + 1] ?? 1;
      if (p >= curr && p <= next) {
        segmentIndex = i;
        break;
      }
      if (p > next) {
        segmentIndex = Math.min(i + 1, Math.max(inputRange.length - 2, 0));
      }
    }
    const segmentStart = inputRange[segmentIndex] ?? 0;
    const segmentEnd = inputRange[segmentIndex + 1] ?? segmentStart;
    const segmentProgress = segmentEnd !== segmentStart ? (p - segmentStart) / (segmentEnd - segmentStart) : 0;
    const startValue = outputRange[segmentIndex] ?? 0;
    const endValue = outputRange[segmentIndex + 1] ?? startValue;
    if (isColorOutput && typeof startValue === "string" && typeof endValue === "string") {
      return lerpColor(startValue, endValue, segmentProgress, colorSpace);
    }
    return lerp(startValue, endValue, segmentProgress);
  };
  let destroyed = false;
  const update = (progress) => {
    if (destroyed) return;
    currentValue = interpolate2(progress);
    subscribers.forEach((cb) => {
      try {
        cb(currentValue);
      } catch (e) {
        console.error("[SpringKit] ScrollLinkedValue subscriber error:", e);
      }
    });
  };
  const smoother = createSmoother(smooth, update);
  let hasValue = false;
  const unsubscribe = scrollProgress.subscribe((info) => {
    if (!smoother) return update(info.progress);
    smoother.set(info.progress);
    if (!hasValue) {
      hasValue = true;
      update(smoother.get());
    }
  });
  return {
    get: () => currentValue,
    subscribe: (callback) => {
      subscribers.add(callback);
      try {
        callback(currentValue);
      } catch (e) {
        console.error("[SpringKit] ScrollLinkedValue subscriber error:", e);
      }
      return () => subscribers.delete(callback);
    },
    destroy: () => {
      destroyed = true;
      unsubscribe();
      smoother?.destroy();
      subscribers.clear();
    }
  };
}
var scrollEasings = {
  linear: (t) => t,
  easeIn: (t) => t * t,
  easeOut: (t) => t * (2 - t),
  easeInOut: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeInCubic: (t) => t * t * t,
  easeOutCubic: (t) => --t * t * t + 1,
  easeInOutCubic: (t) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  easeInQuart: (t) => t * t * t * t,
  easeOutQuart: (t) => 1 - --t * t * t * t,
  easeInOutQuart: (t) => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t
};

// src/animation/timeline.ts
var elementTransforms2 = /* @__PURE__ */ new WeakMap();
var SETTLE_THRESHOLD = 1e-3;
var MAX_SETTLE_TIME = 10;
function springCurve(config) {
  const motion = springMotion(config, 1, 0);
  const stiffness = config.stiffness !== void 0 && config.stiffness > 0 ? config.stiffness : 100;
  const mass = config.mass !== void 0 && config.mass > 0 ? config.mass : 1;
  const omega = Math.sqrt(stiffness / mass);
  const dt = 1 / 240;
  let settleTime = MAX_SETTLE_TIME;
  for (let t = dt; t < MAX_SETTLE_TIME; t += dt) {
    const state = motion(t);
    if (Math.hypot(state.position, state.velocity / omega) < SETTLE_THRESHOLD) {
      settleTime = t;
      break;
    }
  }
  return (progress) => {
    if (progress <= 0) return 0;
    if (progress >= 1) return 1;
    return 1 - motion(progress * settleTime).position;
  };
}
var timelineIdCounter = 0;
function createTimeline(config = {}) {
  const timelineInstanceId = ++timelineIdCounter;
  let segmentIdCounter = 0;
  const {
    defaults = {},
    autoplay = false,
    repeat = 0,
    yoyo = false,
    repeatDelay = 0,
    onStart,
    onUpdate,
    onComplete,
    onRepeat
  } = config;
  const segments = [];
  const labels = /* @__PURE__ */ new Map();
  const callbacks = /* @__PURE__ */ new Map();
  const pauses = /* @__PURE__ */ new Map();
  let currentTime = 0;
  let totalDuration = 0;
  let isPlaying = false;
  let isReversed = false;
  let isPaused = false;
  let repeatCount = 0;
  let rafId = null;
  let cancelRepeatDelay = null;
  let lastFrameTime = null;
  let hasStarted = false;
  let insertTime = 0;
  let includeStartPosition = true;
  const now = () => typeof performance !== "undefined" ? performance.now() : Date.now();
  const parsePosition = (position) => {
    if (position === void 0) {
      return insertTime;
    }
    if (typeof position === "number") {
      return position;
    }
    if (position === "<") {
      const lastSegment = segments[segments.length - 1];
      if (!lastSegment) {
        console.warn('[SpringKit] Timeline: "<" position used with no previous segments');
        return 0;
      }
      return lastSegment.startTime;
    }
    if (position === ">") {
      return insertTime;
    }
    if (position.startsWith("+=")) {
      return insertTime + parseFloat(position.slice(2));
    }
    if (position.startsWith("-=")) {
      return insertTime - parseFloat(position.slice(2));
    }
    if (labels.has(position)) {
      return labels.get(position);
    }
    const labelMatch = position.match(/^([a-zA-Z_]\w*)([+-]=?\d*\.?\d+)?$/);
    if (labelMatch) {
      const labelName = labelMatch[1];
      const offset = labelMatch[2];
      if (!labelName) {
        console.warn(`[SpringKit] Timeline: Invalid label reference in position "${position}"`);
        return insertTime;
      }
      const labelTime = labels.get(labelName) ?? 0;
      if (offset) {
        const offsetValue = parseFloat(offset.replace("=", ""));
        return labelTime + offsetValue;
      }
      return labelTime;
    }
    return insertTime;
  };
  const resolveTarget = (target) => {
    if (typeof target === "string") {
      return document.querySelector(target);
    }
    if (typeof HTMLElement !== "undefined" && target instanceof HTMLElement) {
      return target;
    }
    return null;
  };
  const createAdapter = (target) => {
    const element = resolveTarget(target);
    if (element) {
      return {
        read: (keys) => getCurrentElementValues(element, keys),
        write: (values) => applyPropsToElement(element, values)
      };
    }
    if (typeof target === "object" && target !== null && !(typeof Node !== "undefined" && target instanceof Node)) {
      const object = target;
      return {
        read: (keys) => {
          const current = {};
          for (const key of keys) {
            const value = object[key];
            current[key] = typeof value === "number" && Number.isFinite(value) ? value : 0;
          }
          return current;
        },
        write: (values) => {
          Object.assign(object, values);
        }
      };
    }
    return null;
  };
  const extractNumericProps = (props) => {
    const result = {};
    for (const [key, value] of Object.entries(props)) {
      if (typeof value === "number" && !["duration", "delay"].includes(key)) {
        result[key] = value;
      }
    }
    return result;
  };
  const applyPropsToElement = (element, props) => {
    const cssProps = {};
    let stored = elementTransforms2.get(element);
    let transformChanged = false;
    for (const [key, value] of Object.entries(props)) {
      if (transformFunction(key, 0) !== null) {
        if (!stored) {
          stored = /* @__PURE__ */ new Map();
          elementTransforms2.set(element, stored);
        }
        stored.set(key, value);
        transformChanged = true;
      } else if (key === "opacity") {
        cssProps.opacity = String(value);
      } else {
        cssProps[key] = `${value}px`;
      }
    }
    if (transformChanged && stored) {
      const transforms = [];
      stored.forEach((value, key) => {
        const fn = transformFunction(key, value);
        if (fn) transforms.push(fn);
      });
      element.style.transform = transforms.join(" ");
    }
    for (const [prop, val] of Object.entries(cssProps)) {
      element.style[prop] = val;
    }
  };
  const transformFunction = (key, value) => {
    switch (key) {
      case "x":
        return `translateX(${value}px)`;
      case "y":
        return `translateY(${value}px)`;
      case "z":
        return `translateZ(${value}px)`;
      case "scale":
        return `scale(${value})`;
      case "scaleX":
        return `scaleX(${value})`;
      case "scaleY":
        return `scaleY(${value})`;
      case "rotate":
      case "rotation":
        return `rotate(${value}deg)`;
      case "rotateX":
        return `rotateX(${value}deg)`;
      case "rotateY":
        return `rotateY(${value}deg)`;
      case "rotateZ":
        return `rotateZ(${value}deg)`;
      case "skewX":
        return `skewX(${value}deg)`;
      case "skewY":
        return `skewY(${value}deg)`;
      default:
        return null;
    }
  };
  const getCurrentElementValues = (element, keys) => {
    const current = {};
    const computed = getComputedStyle(element);
    const stored = elementTransforms2.get(element);
    for (const key of keys) {
      switch (key) {
        case "opacity": {
          const opacity = parseFloat(computed.opacity);
          current[key] = Number.isNaN(opacity) ? 1 : opacity;
          break;
        }
        case "x":
        case "y":
        case "z":
        case "scale":
        case "scaleX":
        case "scaleY":
        case "rotate":
        case "rotation":
        case "rotateX":
        case "rotateY":
        case "rotateZ":
        case "skewX":
        case "skewY":
          current[key] = stored?.get(key) ?? (key.startsWith("scale") ? 1 : 0);
          break;
        default:
          current[key] = parseFloat(computed.getPropertyValue(key)) || 0;
      }
    }
    return current;
  };
  const MAX_DELTA_TIME2 = 64;
  const scheduleTick = () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
    }
    rafId = requestAnimationFrame(tick);
  };
  const isCrossed = (positionMs, prevTime, nextTime, includeStart) => {
    const prevMs = Math.round(prevTime * 1e6) / 1e3;
    const nextMs = Math.round(nextTime * 1e6) / 1e3;
    if (nextMs >= prevMs) {
      return (includeStart ? positionMs >= Math.floor(prevMs) : positionMs > prevMs) && positionMs <= nextMs;
    }
    return (includeStart ? positionMs <= prevMs : positionMs < Math.floor(prevMs)) && positionMs >= Math.floor(nextMs);
  };
  const segmentProgressAt = (segment, time) => {
    const segmentDuration = segment.endTime - segment.startTime;
    return segmentDuration > 0 ? clamp((time - segment.startTime) / segmentDuration, 0, 1) : time >= segment.endTime ? 1 : 0;
  };
  const renderSegment = (segment, progress, force) => {
    const changed = progress !== segment.lastProgress;
    if (!changed && !force) return false;
    segment.lastProgress = progress;
    const { adapter } = segment;
    const keys = Object.keys(segment.toValues);
    if (adapter && keys.length > 0) {
      const from = segment.fromValues ?? (segment.fromValues = adapter.read(keys));
      const eased = segment.curve(progress);
      const values = {};
      for (const key of keys) {
        const start = from[key] ?? 0;
        values[key] = start + ((segment.toValues[key] ?? 0) - start) * eased;
      }
      adapter.write(values);
    }
    return changed;
  };
  const renderAt = (time, events) => {
    let restored = false;
    for (let i = segments.length - 1; i >= 0; i--) {
      const segment = segments[i];
      if (time < segment.startTime && segment.lastProgress > 0) {
        renderSegment(segment, 0, false);
        restored = true;
        if (events) segment.props.onUpdate?.(0);
      }
    }
    for (const segment of segments) {
      if (time < segment.startTime) {
        segment.isActive = false;
        segment.isComplete = false;
        continue;
      }
      const progress = segmentProgressAt(segment, time);
      if (progress < 1) segment.isComplete = false;
      if (!segment.isActive) {
        segment.isActive = true;
        if (events) segment.props.onStart?.();
      }
      const changed = renderSegment(segment, progress, restored);
      if (events && changed) segment.props.onUpdate?.(progress);
      if (progress >= 1 && !segment.isComplete) {
        segment.isComplete = true;
        if (events) segment.props.onComplete?.();
      }
    }
  };
  const tick = (timestamp) => {
    rafId = null;
    if (!isPlaying || isPaused) return;
    const rawDelta = lastFrameTime !== null ? timestamp - lastFrameTime : 0;
    const deltaTime = Math.min(Math.max(rawDelta, 0), MAX_DELTA_TIME2) / 1e3 * globalLoop.getTimeScale();
    lastFrameTime = timestamp;
    const prevTime = currentTime;
    currentTime += isReversed ? -deltaTime : deltaTime;
    currentTime = clamp(currentTime, 0, totalDuration);
    const includeStart = includeStartPosition;
    includeStartPosition = false;
    const crossedPauses = Array.from(pauses.keys()).filter((ms) => isCrossed(ms, prevTime, currentTime, includeStart)).sort((a, b) => isReversed ? b - a : a - b);
    const pauseMs = crossedPauses[0];
    const reachedTime = pauseMs !== void 0 ? clamp(pauseMs / 1e3, 0, totalDuration) : currentTime;
    const crossedCallbacks = Array.from(callbacks.keys()).filter((ms) => isCrossed(ms, prevTime, reachedTime, includeStart)).sort((a, b) => isReversed ? b - a : a - b);
    for (const ms of crossedCallbacks) {
      callbacks.get(ms)?.forEach((cb) => {
        try {
          cb();
        } catch (e) {
          console.error("[SpringKit] Timeline callback error:", e);
        }
      });
    }
    if (pauseMs !== void 0) {
      isPaused = true;
      currentTime = reachedTime;
      renderAt(currentTime, true);
      const pauseCallback = pauses.get(pauseMs);
      try {
        pauseCallback?.();
      } catch (e) {
        console.error("[SpringKit] Timeline pause callback error:", e);
      }
      return;
    }
    renderAt(currentTime, true);
    onUpdate?.(totalDuration > 0 ? currentTime / totalDuration : 1);
    if (isReversed && currentTime <= 0 || !isReversed && currentTime >= totalDuration) {
      if (repeat === -1 || repeatCount < repeat) {
        repeatCount++;
        onRepeat?.(repeatCount);
        if (yoyo) {
          isReversed = !isReversed;
        } else {
          currentTime = isReversed ? totalDuration : 0;
          includeStartPosition = true;
          segments.forEach((s) => {
            s.isActive = false;
            s.isComplete = false;
          });
        }
        if (repeatDelay > 0) {
          cancelRepeatDelay = globalLoop.delay(repeatDelay * 1e3, () => {
            cancelRepeatDelay = null;
            lastFrameTime = null;
            scheduleTick();
          });
          return;
        }
      } else {
        isPlaying = false;
        onComplete?.();
        return;
      }
    }
    scheduleTick();
  };
  const addSegment = (target, props, position, toValues, fromValues, adapter) => {
    const startTime = parsePosition(position) + (props.delay || 0);
    const duration = props.duration || 0.5;
    const endTime = startTime + duration;
    const segment = {
      id: `segment_${timelineInstanceId}_${segmentIdCounter++}`,
      target,
      props,
      startTime,
      endTime,
      adapter: Object.keys(toValues).length > 0 ? adapter : null,
      fromValues,
      toValues,
      curve: props.ease ?? springCurve({ ...defaults, ...props.spring }),
      lastProgress: -1,
      isActive: false,
      isComplete: false
    };
    if (segment.adapter && fromValues) {
      segment.adapter.write(fromValues);
    }
    segments.push(segment);
    insertTime = endTime;
    totalDuration = Math.max(totalDuration, endTime);
  };
  const timeline = {
    to(target, props, position) {
      addSegment(target, props, position, extractNumericProps(props), null, createAdapter(target));
      return timeline;
    },
    from(target, props, position) {
      const adapter = createAdapter(target);
      const fromValues = extractNumericProps(props);
      const toValues = adapter ? adapter.read(Object.keys(fromValues)) : fromValues;
      addSegment(target, props, position, toValues, fromValues, adapter);
      return timeline;
    },
    fromTo(target, fromProps, toProps, position) {
      const adapter = createAdapter(target);
      const toValues = extractNumericProps(toProps);
      const fromValues = {
        ...adapter ? adapter.read(Object.keys(toValues)) : toValues,
        ...extractNumericProps(fromProps)
      };
      addSegment(target, toProps, position, toValues, fromValues, adapter);
      return timeline;
    },
    addLabel(label, position) {
      const time = parsePosition(position);
      labels.set(label, time);
      return timeline;
    },
    call(callback, position) {
      const time = Math.round(parsePosition(position) * 1e3);
      if (!callbacks.has(time)) {
        callbacks.set(time, []);
      }
      callbacks.get(time).push(callback);
      return timeline;
    },
    set(target, props, position) {
      const adapter = createAdapter(target);
      if (adapter) {
        const time = parsePosition(position);
        this.call(() => {
          adapter.write(extractNumericProps(props));
        }, time);
      }
      return timeline;
    },
    addPause(position, callback) {
      const time = Math.round(parsePosition(position) * 1e3);
      pauses.set(time, callback);
      return timeline;
    },
    play() {
      if (!hasStarted) {
        hasStarted = true;
        onStart?.();
      }
      isPlaying = true;
      isPaused = false;
      lastFrameTime = now();
      scheduleTick();
      return timeline;
    },
    pause() {
      isPaused = true;
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      return timeline;
    },
    resume() {
      if (isPaused) {
        isPaused = false;
        lastFrameTime = now();
        scheduleTick();
      }
      return timeline;
    },
    reverse() {
      isReversed = !isReversed;
      return timeline;
    },
    restart() {
      currentTime = isReversed ? totalDuration : 0;
      repeatCount = 0;
      hasStarted = false;
      includeStartPosition = true;
      segments.forEach((s) => {
        s.isActive = false;
        s.isComplete = false;
      });
      return this.play();
    },
    seek(position) {
      if (typeof position === "string") {
        currentTime = labels.get(position) ?? 0;
      } else {
        currentTime = clamp(position, 0, totalDuration);
      }
      segments.forEach((s) => {
        if (currentTime < s.startTime) {
          s.isActive = false;
          s.isComplete = false;
        } else if (currentTime < s.endTime) {
          s.isComplete = false;
        }
      });
      const flags = segments.map((s) => [s.isActive, s.isComplete]);
      renderAt(currentTime, false);
      segments.forEach((s, i) => {
        [s.isActive, s.isComplete] = flags[i];
      });
      includeStartPosition = true;
      return timeline;
    },
    kill() {
      isPlaying = false;
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      cancelRepeatDelay?.();
      cancelRepeatDelay = null;
      segments.length = 0;
      labels.clear();
      callbacks.clear();
      pauses.clear();
    },
    time: () => currentTime,
    duration: () => totalDuration,
    progress: () => totalDuration > 0 ? currentTime / totalDuration : 0,
    isPlaying: () => isPlaying && !isPaused,
    isReversed: () => isReversed,
    getById(id) {
      return segments.find((s) => s.id === id);
    }
  };
  if (autoplay) {
    timeline.play();
  }
  return timeline;
}
function tween(target, props) {
  return createTimeline().to(target, props).play();
}
function allTo(targets, props) {
  const tl = createTimeline();
  targets.forEach((target, i) => {
    tl.to(target, props, i === 0 ? 0 : "<");
  });
  return tl.play();
}

// src/svg/morph.ts
var PARAM_COUNTS = {
  M: 2,
  L: 2,
  H: 1,
  V: 1,
  C: 6,
  S: 4,
  Q: 4,
  T: 2,
  A: 7,
  Z: 0
};
var PATH_NUMBER_REGEX = /[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/gi;
var STICKY_NUMBER_REGEX = /[\s,]*([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)/iy;
var STICKY_FLAG_REGEX = /[\s,]*([01])/y;
function parseArcValues(valuesStr) {
  const values = [];
  let index = 0;
  for (; ; ) {
    const position = values.length % 7;
    const regex = position === 3 || position === 4 ? STICKY_FLAG_REGEX : STICKY_NUMBER_REGEX;
    regex.lastIndex = index;
    const match = regex.exec(valuesStr);
    if (!match) break;
    values.push(parseFloat(match[1]));
    index = regex.lastIndex;
  }
  return values;
}
function parsePath(d) {
  const commands = [];
  const regex = /([MLCQAZHVST])([^MLCQAZHVST]*)/gi;
  const matches = d.matchAll(regex);
  for (const matchItem of matches) {
    const typeChar = matchItem[1];
    const valuesStr = matchItem[2];
    if (!typeChar || valuesStr === void 0) continue;
    const type = typeChar.toUpperCase();
    const relative = typeChar !== type;
    const values = type === "A" ? parseArcValues(valuesStr) : (valuesStr.match(PATH_NUMBER_REGEX) ?? []).map(parseFloat).filter((v) => !isNaN(v));
    const count = PARAM_COUNTS[type];
    if (count === 0 || values.length <= count) {
      commands.push({ type, values, relative });
      continue;
    }
    for (let i = 0; i + count <= values.length; i += count) {
      commands.push({
        type: type === "M" && i > 0 ? "L" : type,
        values: values.slice(i, i + count),
        relative
      });
    }
  }
  return commands;
}
function toAbsolute(commands) {
  let currentX = 0;
  let currentY = 0;
  let startX = 0;
  let startY = 0;
  return commands.map((cmd) => {
    const { type, values, relative } = cmd;
    const absValues = [...values];
    if (relative) {
      const offsetPair = (i) => {
        const x = absValues[i];
        const y = absValues[i + 1];
        if (x !== void 0) absValues[i] = x + currentX;
        if (y !== void 0) absValues[i + 1] = y + currentY;
      };
      switch (type) {
        case "H":
          if (absValues[0] !== void 0) absValues[0] += currentX;
          break;
        case "V":
          if (absValues[0] !== void 0) absValues[0] += currentY;
          break;
        case "A":
          offsetPair(5);
          break;
        case "Z":
          break;
        default:
          for (let i = 0; i < absValues.length; i += 2) offsetPair(i);
      }
    }
    switch (type) {
      case "M":
        currentX = absValues[0] ?? 0;
        currentY = absValues[1] ?? 0;
        startX = currentX;
        startY = currentY;
        break;
      case "L":
        currentX = absValues[0] ?? 0;
        currentY = absValues[1] ?? 0;
        break;
      case "H":
        absValues[0] = absValues[0] ?? 0;
        currentX = absValues[0];
        break;
      case "V":
        absValues[0] = absValues[0] ?? 0;
        currentY = absValues[0];
        break;
      case "C":
        currentX = absValues[4] ?? 0;
        currentY = absValues[5] ?? 0;
        break;
      case "Q":
        currentX = absValues[2] ?? 0;
        currentY = absValues[3] ?? 0;
        break;
      case "A":
        currentX = absValues[5] ?? 0;
        currentY = absValues[6] ?? 0;
        break;
      case "S":
        currentX = absValues[2] ?? 0;
        currentY = absValues[3] ?? 0;
        break;
      case "T":
        currentX = absValues[0] ?? 0;
        currentY = absValues[1] ?? 0;
        break;
      case "Z":
        currentX = startX;
        currentY = startY;
        break;
    }
    return { type, values: absValues };
  });
}
function hasSvgPathSupport() {
  if (typeof document === "undefined") return false;
  try {
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("d", "M0,0 L10,10");
    svg.appendChild(path);
    document.body.appendChild(svg);
    const hasSupport = typeof path.getTotalLength === "function";
    let works = false;
    if (hasSupport) {
      try {
        path.getTotalLength();
        works = true;
      } catch {
        works = false;
      }
    }
    document.body.removeChild(svg);
    return works;
  } catch {
    return false;
  }
}
function samplePathFallback(commands, samples) {
  const points = [];
  for (const cmd of commands) {
    if (cmd.type === "M" || cmd.type === "L") {
      points.push({ x: cmd.values[0] ?? 0, y: cmd.values[1] ?? 0 });
    } else if (cmd.type === "C") {
      points.push({
        x: cmd.values[4] ?? 0,
        y: cmd.values[5] ?? 0,
        cp1x: cmd.values[0] ?? 0,
        cp1y: cmd.values[1] ?? 0,
        cp2x: cmd.values[2] ?? 0,
        cp2y: cmd.values[3] ?? 0
      });
    } else if (cmd.type === "Q") {
      points.push({
        x: cmd.values[2] ?? 0,
        y: cmd.values[3] ?? 0,
        cp1x: cmd.values[0] ?? 0,
        cp1y: cmd.values[1] ?? 0
      });
    } else if (cmd.type === "S") {
      points.push({ x: cmd.values[2] ?? 0, y: cmd.values[3] ?? 0 });
    } else if (cmd.type === "T") {
      points.push({ x: cmd.values[0] ?? 0, y: cmd.values[1] ?? 0 });
    } else if (cmd.type === "A") {
      points.push({ x: cmd.values[5] ?? 0, y: cmd.values[6] ?? 0 });
    } else if (cmd.type === "H") {
      const lastPoint = points[points.length - 1];
      points.push({ x: cmd.values[0] ?? 0, y: lastPoint?.y ?? 0 });
    } else if (cmd.type === "V") {
      const lastPoint = points[points.length - 1];
      points.push({ x: lastPoint?.x ?? 0, y: cmd.values[0] ?? 0 });
    }
  }
  if (points.length > 0 && points.length < samples) {
    const interpolated = [];
    const step = (points.length - 1) / (samples - 1);
    for (let i = 0; i < samples; i++) {
      const t = i * step;
      const index = Math.floor(t);
      const frac = t - index;
      if (index >= points.length - 1) {
        interpolated.push(points[points.length - 1]);
      } else {
        const p1 = points[index];
        const p2 = points[index + 1];
        interpolated.push({
          x: lerp(p1.x, p2.x, frac),
          y: lerp(p1.y, p2.y, frac)
        });
      }
    }
    return interpolated;
  }
  return points;
}
function samplePath(commands, samples) {
  if (!hasSvgPathSupport()) {
    return samplePathFallback(commands, samples);
  }
  const points = [];
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  const path = document.createElementNS(svgNS, "path");
  let d = "";
  for (const cmd of commands) {
    d += cmd.type + cmd.values.join(" ");
  }
  path.setAttribute("d", d);
  svg.appendChild(path);
  document.body.appendChild(svg);
  try {
    const totalLength = path.getTotalLength();
    const step = samples > 1 ? totalLength / (samples - 1) : 0;
    for (let i = 0; i < samples; i++) {
      const point = path.getPointAtLength(i * step);
      points.push({ x: point.x, y: point.y });
    }
  } finally {
    document.body.removeChild(svg);
  }
  return points;
}
function interpolatePoint(p1, p2, t) {
  return {
    x: lerp(p1.x, p2.x, t),
    y: lerp(p1.y, p2.y, t)
  };
}
function pointsToPath(points) {
  if (points.length === 0) return "";
  const firstPoint = points[0];
  let d = `M ${firstPoint.x} ${firstPoint.y}`;
  for (let i = 1; i < points.length; i++) {
    const point = points[i];
    d += ` L ${point.x} ${point.y}`;
  }
  return d;
}
function createMorph(initialPath, config = {}) {
  const {
    spring: springConfig = { stiffness: 120, damping: 14 },
    samples = 100,
    onProgress,
    onComplete
  } = config;
  let currentPath = initialPath;
  let fromPoints = [];
  let toPoints = [];
  let currentPoints = [];
  const subscribers = /* @__PURE__ */ new Set();
  let completed = false;
  let notifications = 0;
  const initialCommands = parsePath(initialPath);
  fromPoints = samplePath(toAbsolute(initialCommands), samples);
  currentPoints = [...fromPoints];
  toPoints = [...fromPoints];
  const progressSpring = createSpringValue(0, springConfig);
  let initialized = false;
  progressSpring.subscribe(() => {
    notifications++;
    const progress = progressSpring.get();
    if (initialized) onProgress?.(progress);
    currentPoints = fromPoints.map(
      (from, i) => interpolatePoint(from, toPoints[i] ?? from, progress)
    );
    currentPath = pointsToPath(currentPoints);
    subscribers.forEach((cb) => {
      try {
        cb(currentPath);
      } catch (e) {
        console.error("[SpringKit] Morph subscriber error:", e);
      }
    });
    if (progress >= 0.999 && !completed) {
      completed = true;
      onComplete?.();
    }
  });
  initialized = true;
  return {
    getPath: () => currentPath,
    getProgress: () => progressSpring.get(),
    morphTo(path) {
      const targetCommands = parsePath(path);
      const targetPoints = samplePath(toAbsolute(targetCommands), samples);
      fromPoints = [...currentPoints];
      toPoints = targetPoints;
      while (fromPoints.length < toPoints.length) {
        fromPoints.push(fromPoints[fromPoints.length - 1] || { x: 0, y: 0 });
      }
      while (toPoints.length < fromPoints.length) {
        toPoints.push(toPoints[toPoints.length - 1] || { x: 0, y: 0 });
      }
      completed = false;
      progressSpring.jump(0);
      progressSpring.set(1);
    },
    setProgress(progress) {
      const p = clamp(progress, 0, 1);
      const before = notifications;
      progressSpring.jump(p);
      if (notifications !== before) return;
      currentPoints = fromPoints.map(
        (from, i) => interpolatePoint(from, toPoints[i] ?? from, p)
      );
      currentPath = pointsToPath(currentPoints);
      subscribers.forEach((cb) => {
        try {
          cb(currentPath);
        } catch (e) {
          console.error("[SpringKit] Morph subscriber error:", e);
        }
      });
    },
    subscribe(callback) {
      subscribers.add(callback);
      try {
        callback(currentPath);
      } catch (e) {
        console.error("[SpringKit] Morph subscriber error:", e);
      }
      return () => subscribers.delete(callback);
    },
    destroy() {
      progressSpring.destroy();
      subscribers.clear();
    }
  };
}
function createMorphSequence(paths, config = {}) {
  if (paths.length === 0) {
    throw new Error("At least one path is required");
  }
  let currentIndex = 0;
  const firstPath = paths[0];
  const morph = createMorph(firstPath, config);
  const sequence2 = {
    getPath: () => morph.getPath(),
    getCurrentIndex: () => currentIndex,
    morphToIndex(index) {
      const targetIndex = clamp(index, 0, paths.length - 1);
      if (targetIndex !== currentIndex) {
        currentIndex = targetIndex;
        const targetPath = paths[targetIndex];
        morph.morphTo(targetPath);
      }
    },
    // Use the local object instead of `this` so detached calls work
    // (e.g. passing sequence.morphToNext directly as an event handler)
    morphToNext() {
      sequence2.morphToIndex((currentIndex + 1) % paths.length);
    },
    morphToPrevious() {
      sequence2.morphToIndex((currentIndex - 1 + paths.length) % paths.length);
    },
    subscribe: (callback) => morph.subscribe(callback),
    destroy: () => morph.destroy()
  };
  return sequence2;
}
var shapes = {
  /**
   * Generate circle path
   */
  circle(cx, cy, r) {
    return `M ${cx - r} ${cy}
            A ${r} ${r} 0 1 1 ${cx + r} ${cy}
            A ${r} ${r} 0 1 1 ${cx - r} ${cy}`;
  },
  /**
   * Generate rectangle path
   */
  rect(x, y, width, height, rx = 0) {
    if (rx === 0) {
      return `M ${x} ${y}
              L ${x + width} ${y}
              L ${x + width} ${y + height}
              L ${x} ${y + height}
              Z`;
    }
    return `M ${x + rx} ${y}
            L ${x + width - rx} ${y}
            Q ${x + width} ${y} ${x + width} ${y + rx}
            L ${x + width} ${y + height - rx}
            Q ${x + width} ${y + height} ${x + width - rx} ${y + height}
            L ${x + rx} ${y + height}
            Q ${x} ${y + height} ${x} ${y + height - rx}
            L ${x} ${y + rx}
            Q ${x} ${y} ${x + rx} ${y}
            Z`;
  },
  /**
   * Generate polygon path
   */
  polygon(cx, cy, r, sides) {
    const points = [];
    for (let i = 0; i < sides; i++) {
      const angle = i / sides * Math.PI * 2 - Math.PI / 2;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      points.push(`${i === 0 ? "M" : "L"} ${x} ${y}`);
    }
    return points.join(" ") + " Z";
  },
  /**
   * Generate star path
   */
  star(cx, cy, outerR, innerR, points) {
    const path = [];
    const step = Math.PI / points;
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = i * step - Math.PI / 2;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      path.push(`${i === 0 ? "M" : "L"} ${x} ${y}`);
    }
    return path.join(" ") + " Z";
  },
  /**
   * Generate heart path
   */
  heart(cx, cy, size) {
    const d = size / 4;
    return `M ${cx} ${cy + d}
            C ${cx} ${cy} ${cx - 2 * d} ${cy} ${cx - 2 * d} ${cy - d}
            C ${cx - 2 * d} ${cy - 2 * d} ${cx} ${cy - 2 * d} ${cx} ${cy - d}
            C ${cx} ${cy - 2 * d} ${cx + 2 * d} ${cy - 2 * d} ${cx + 2 * d} ${cy - d}
            C ${cx + 2 * d} ${cy} ${cx} ${cy} ${cx} ${cy + d}
            Z`;
  },
  /**
   * Generate arrow path
   */
  arrow(x, y, width, height, direction = "right") {
    const hw = width / 2;
    const hh = height / 2;
    switch (direction) {
      case "right":
        return `M ${x} ${y - hh} L ${x + width} ${y} L ${x} ${y + hh} Z`;
      case "left":
        return `M ${x + width} ${y - hh} L ${x} ${y} L ${x + width} ${y + hh} Z`;
      case "up":
        return `M ${x - hw} ${y + height} L ${x} ${y} L ${x + hw} ${y + height} Z`;
      case "down":
        return `M ${x - hw} ${y} L ${x} ${y + height} L ${x + hw} ${y} Z`;
    }
  }
};

// src/layout/shared.ts
function measureElement(element) {
  const rect = element.getBoundingClientRect();
  const styles = getComputedStyle(element);
  return {
    x: rect.left + window.scrollX,
    y: rect.top + window.scrollY,
    width: rect.width,
    height: rect.height,
    // Note: `|| 1` would turn a real opacity of 0 into 1
    opacity: Number.isNaN(parseFloat(styles.opacity)) ? 1 : parseFloat(styles.opacity),
    borderRadius: parseFloat(styles.borderRadius) || 0,
    scaleX: 1,
    scaleY: 1
  };
}
function applyTransform(element, from, to, current) {
  const dx = current.x !== void 0 ? from.x - to.x + (current.x - from.x) : 0;
  const dy = current.y !== void 0 ? from.y - to.y + (current.y - from.y) : 0;
  const scaleX = current.width !== void 0 && to.width !== 0 ? current.width / to.width : 1;
  const scaleY = current.height !== void 0 && to.height !== 0 ? current.height / to.height : 1;
  element.style.transform = `translate(${dx}px, ${dy}px) scale(${scaleX}, ${scaleY})`;
  element.style.transformOrigin = "top left";
  if (current.opacity !== void 0) {
    element.style.opacity = String(current.opacity);
  }
  if (current.borderRadius !== void 0) {
    const radiusX = scaleX === 0 ? 0 : current.borderRadius / scaleX;
    const radiusY = scaleY === 0 ? 0 : current.borderRadius / scaleY;
    element.style.borderRadius = radiusX === radiusY ? `${radiusX}px` : `${radiusX}px / ${radiusY}px`;
  }
}
function saveStyles(entry) {
  if (entry.savedStyles) return;
  const { style } = entry.element;
  entry.savedStyles = {
    transform: style.transform,
    transformOrigin: style.transformOrigin,
    opacity: style.opacity,
    borderRadius: style.borderRadius
  };
}
function resetTransform(entry) {
  if (entry.pendingRafId !== null) {
    cancelAnimationFrame(entry.pendingRafId);
    entry.pendingRafId = null;
  }
  entry.spring?.destroy();
  entry.spring = null;
  entry.isAnimating = false;
  const saved = entry.savedStyles;
  if (!saved) return;
  entry.savedStyles = null;
  const { style } = entry.element;
  style.transform = saved.transform;
  style.transformOrigin = saved.transformOrigin;
  style.opacity = saved.opacity;
  style.borderRadius = saved.borderRadius;
}
function createLayoutGroup(config = {}) {
  const {
    spring: defaultSpring = { stiffness: 300, damping: 30 },
    onAnimationStart,
    onAnimationComplete,
    crossfade = false,
    transition = {}
  } = config;
  const elements = /* @__PURE__ */ new Map();
  const previousMeasurements = /* @__PURE__ */ new Map();
  const register = (id, element) => {
    if (!elements.has(id)) {
      elements.set(id, []);
    }
    const existing = elements.get(id);
    const alreadyRegistered = existing.some((e) => e.element === element);
    if (!alreadyRegistered) {
      const measurement = measureElement(element);
      existing.push({
        id,
        element,
        measurement,
        spring: null,
        isAnimating: false,
        pendingRafId: null,
        savedStyles: null
      });
      if (!previousMeasurements.has(id)) {
        previousMeasurements.set(id, measurement);
      }
    }
  };
  const unregister = (id, element) => {
    const group = elements.get(id);
    if (!group) return;
    const index = group.findIndex((e) => e.element === element);
    if (index !== -1) {
      const entry = group[index];
      previousMeasurements.set(id, measureElement(element));
      resetTransform(entry);
      group.splice(index, 1);
      if (group.length === 0) {
        elements.delete(id);
      }
    }
  };
  const animateElement = (entry, from, to) => {
    if (entry.pendingRafId !== null) {
      cancelAnimationFrame(entry.pendingRafId);
      entry.pendingRafId = null;
    }
    entry.spring?.destroy();
    saveStyles(entry);
    const initialValues = {
      x: from.x,
      y: from.y,
      width: from.width,
      height: from.height
    };
    if (crossfade) {
      initialValues.opacity = from.opacity ?? 1;
    }
    if (from.borderRadius !== void 0) {
      initialValues.borderRadius = from.borderRadius;
    }
    entry.spring = createSpringGroup(initialValues, defaultSpring);
    entry.isAnimating = true;
    onAnimationStart?.(entry.id);
    entry.spring.subscribe((values) => {
      applyTransform(entry.element, from, to, values);
    });
    const targetValues = {
      x: to.x,
      y: to.y,
      width: to.width,
      height: to.height
    };
    if (crossfade) {
      targetValues.opacity = to.opacity ?? 1;
    }
    if (to.borderRadius !== void 0) {
      targetValues.borderRadius = to.borderRadius;
    }
    for (const [key, value] of Object.entries(targetValues)) {
      const propertyConfig = transition[key];
      entry.spring.set({ [key]: value }, propertyConfig ?? {});
    }
    const checkComplete = () => {
      entry.pendingRafId = null;
      if (entry.spring && !entry.spring.isAnimating()) {
        resetTransform(entry);
        onAnimationComplete?.(entry.id);
      } else if (entry.isAnimating) {
        entry.pendingRafId = requestAnimationFrame(checkComplete);
      }
    };
    entry.pendingRafId = requestAnimationFrame(checkComplete);
  };
  const update = () => {
    for (const [id, group] of elements) {
      for (const entry of group) {
        let previousMeasurement = previousMeasurements.get(id);
        if (entry.isAnimating) {
          previousMeasurement = measureElement(entry.element);
          resetTransform(entry);
        }
        const currentMeasurement = measureElement(entry.element);
        if (previousMeasurement) {
          const hasChanged = previousMeasurement.x !== currentMeasurement.x || previousMeasurement.y !== currentMeasurement.y || previousMeasurement.width !== currentMeasurement.width || previousMeasurement.height !== currentMeasurement.height;
          if (hasChanged) {
            animateElement(entry, previousMeasurement, currentMeasurement);
          }
        }
        entry.measurement = currentMeasurement;
        previousMeasurements.set(id, currentMeasurement);
      }
    }
  };
  const forceUpdate = () => {
    for (const [id, group] of elements) {
      for (const entry of group) {
        entry.measurement = measureElement(entry.element);
        previousMeasurements.set(id, entry.measurement);
      }
    }
  };
  const destroy = () => {
    for (const group of elements.values()) {
      for (const entry of group) {
        resetTransform(entry);
      }
    }
    elements.clear();
    previousMeasurements.clear();
  };
  return {
    register,
    unregister,
    update,
    forceUpdate,
    destroy
  };
}
var groupIdCounter = 0;
function createSharedLayoutContext() {
  const groups = /* @__PURE__ */ new Map();
  return {
    createGroup(id, config) {
      const groupId = id ?? `layout-group-${groupIdCounter++}`;
      groups.get(groupId)?.destroy();
      const group = createLayoutGroup(config);
      groups.set(groupId, group);
      return group;
    },
    getGroup(id) {
      return groups.get(id);
    },
    updateAll() {
      for (const group of groups.values()) {
        group.update();
      }
    },
    destroy() {
      for (const group of groups.values()) {
        group.destroy();
      }
      groups.clear();
    }
  };
}
function createAutoLayout(config = {}) {
  const {
    root = typeof document !== "undefined" ? document.body : null,
    attribute = "data-layout-id",
    debounce: debounceTime = 0,
    ...layoutConfig
  } = config;
  if (!root) {
    return {
      update: () => {
      },
      forceUpdate: () => {
      },
      destroy: () => {
      }
    };
  }
  const group = createLayoutGroup(layoutConfig);
  let observer = null;
  let resizeObserver = null;
  let debounceTimer = null;
  const scanAndRegister = () => {
    const elements = root.querySelectorAll(`[${attribute}]`);
    elements.forEach((el) => {
      const id = el.getAttribute(attribute);
      if (id && el instanceof HTMLElement) {
        group.register(id, el);
      }
    });
  };
  const debouncedUpdate = () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    if (debounceTime > 0) {
      debounceTimer = setTimeout(() => {
        scanAndRegister();
        group.update();
      }, debounceTime);
    } else {
      scanAndRegister();
      group.update();
    }
  };
  scanAndRegister();
  observer = new MutationObserver((mutations) => {
    let shouldUpdate = false;
    for (const mutation of mutations) {
      if (mutation.type === "childList") {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            if (node.hasAttribute(attribute)) {
              shouldUpdate = true;
            }
            if (node.querySelector(`[${attribute}]`)) {
              shouldUpdate = true;
            }
          }
        });
        mutation.removedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            const removed = [node, ...Array.from(node.querySelectorAll(`[${attribute}]`))];
            for (const el of removed) {
              const id = el.getAttribute(attribute);
              if (id && el instanceof HTMLElement) {
                group.unregister(id, el);
              }
            }
          }
        });
      }
      if (mutation.type === "attributes" && mutation.attributeName === attribute) {
        shouldUpdate = true;
      }
    }
    if (shouldUpdate) {
      debouncedUpdate();
    }
  });
  observer.observe(root, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: [attribute]
  });
  resizeObserver = new ResizeObserver(() => {
    debouncedUpdate();
  });
  resizeObserver.observe(root);
  return {
    update: () => {
      scanAndRegister();
      group.update();
    },
    forceUpdate: () => {
      scanAndRegister();
      group.forceUpdate();
    },
    destroy: () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      observer?.disconnect();
      resizeObserver?.disconnect();
      group.destroy();
    }
  };
}

// src/animation/stagger-patterns.ts
function seededRandom(seed) {
  let state = seed;
  return () => {
    state = state * 1103515245 + 12345 & 2147483647;
    return state / 2147483647;
  };
}
function gridDistance(index, columns, rows, origin) {
  const col = index % columns;
  const row = Math.floor(index / columns);
  let originCol;
  let originRow;
  switch (origin) {
    case "top-left":
      originCol = 0;
      originRow = 0;
      break;
    case "top-right":
      originCol = columns - 1;
      originRow = 0;
      break;
    case "bottom-left":
      originCol = 0;
      originRow = rows - 1;
      break;
    case "bottom-right":
      originCol = columns - 1;
      originRow = rows - 1;
      break;
    case "center":
    default:
      originCol = (columns - 1) / 2;
      originRow = (rows - 1) / 2;
      break;
  }
  const dx = col - originCol;
  const dy = row - originRow;
  return Math.sqrt(dx * dx + dy * dy);
}
function linearStagger(config) {
  const { count, delay: delay2 = 100, easing = (t) => t } = config;
  const delays = [];
  for (let i = 0; i < count; i++) {
    const t = count > 1 ? i / (count - 1) : 0;
    delays.push(easing(t) * delay2 * (count - 1));
  }
  return delays;
}
function reverseStagger(config) {
  return linearStagger(config).reverse();
}
function centerStagger(config) {
  const { count, delay: delay2 = 100, easing = (t) => t } = config;
  const delays = [];
  const center = (count - 1) / 2;
  for (let i = 0; i < count; i++) {
    const distanceFromCenter = Math.abs(i - center);
    const maxDistance = center;
    const t = maxDistance > 0 ? distanceFromCenter / maxDistance : 0;
    delays.push(easing(t) * delay2 * maxDistance);
  }
  return delays;
}
function edgeStagger(config) {
  const { count, delay: delay2 = 100, easing = (t) => t } = config;
  const delays = [];
  const center = (count - 1) / 2;
  const maxDelay = delay2 * center;
  for (let i = 0; i < count; i++) {
    const distanceFromCenter = Math.abs(i - center);
    const maxDistance = center;
    const t = maxDistance > 0 ? 1 - distanceFromCenter / maxDistance : 0;
    delays.push(easing(t) * maxDelay);
  }
  return delays;
}
function gridStagger(config) {
  const {
    count,
    columns,
    origin = "top-left",
    direction = "diagonal",
    delay: delay2 = 100,
    easing = (t) => t
  } = config;
  const rows = Math.ceil(count / columns);
  const delays = [];
  let maxRadialDistance = 0;
  if (direction === "radial") {
    for (let i = 0; i < count; i++) {
      maxRadialDistance = Math.max(maxRadialDistance, gridDistance(i, columns, rows, origin));
    }
  }
  for (let i = 0; i < count; i++) {
    const col = i % columns;
    const row = Math.floor(i / columns);
    let t;
    switch (direction) {
      case "row":
        t = row / Math.max(rows - 1, 1);
        break;
      case "column":
        t = col / Math.max(columns - 1, 1);
        break;
      case "diagonal": {
        const diagonalSpan = columns + rows - 2;
        t = diagonalSpan > 0 ? (col + row) / diagonalSpan : 0;
        break;
      }
      case "radial":
      default: {
        const distance = gridDistance(i, columns, rows, origin);
        t = maxRadialDistance > 0 ? distance / maxRadialDistance : 0;
        break;
      }
    }
    delays.push(easing(clamp(t, 0, 1)) * delay2 * Math.max(columns, rows));
  }
  return delays;
}
function waveStagger(config) {
  const {
    count,
    direction = "horizontal",
    frequency = 1,
    amplitude = 0.5,
    delay: delay2 = 100,
    easing = (t) => t
  } = config;
  const delays = [];
  for (let i = 0; i < count; i++) {
    const t = count > 1 ? i / (count - 1) : 0;
    let d = t;
    const waveOffset = Math.sin(t * Math.PI * 2 * frequency) * amplitude;
    switch (direction) {
      case "horizontal":
        d = t + waveOffset * 0.5;
        break;
      case "vertical":
        d = t + Math.abs(waveOffset);
        break;
      case "diagonal":
        d = t + waveOffset;
        break;
    }
    delays.push(easing(clamp(d, 0, 1.5)) * delay2 * (count - 1));
  }
  return delays;
}
function spiralStagger(config) {
  const {
    count,
    columns,
    direction = "clockwise",
    startFrom = "edge",
    delay: delay2 = 100,
    easing = (t) => t
  } = config;
  const rows = Math.ceil(count / columns);
  const spiral = [];
  const visited = /* @__PURE__ */ new Set();
  const mirror = direction === "counter-clockwise";
  const cellIndex = (row, col) => row * columns + (mirror ? columns - 1 - col : col);
  let top = 0;
  let bottom = rows - 1;
  let left = 0;
  let right = columns - 1;
  while (top <= bottom && left <= right) {
    for (let col = left; col <= right; col++) {
      const idx = cellIndex(top, col);
      if (idx < count && !visited.has(`${top},${col}`)) {
        spiral.push(idx);
        visited.add(`${top},${col}`);
      }
    }
    top++;
    for (let row = top; row <= bottom; row++) {
      const idx = cellIndex(row, right);
      if (idx < count && !visited.has(`${row},${right}`)) {
        spiral.push(idx);
        visited.add(`${row},${right}`);
      }
    }
    right--;
    if (top <= bottom) {
      for (let col = right; col >= left; col--) {
        const idx = cellIndex(bottom, col);
        if (idx < count && !visited.has(`${bottom},${col}`)) {
          spiral.push(idx);
          visited.add(`${bottom},${col}`);
        }
      }
      bottom--;
    }
    if (left <= right) {
      for (let row = bottom; row >= top; row--) {
        const idx = cellIndex(row, left);
        if (idx < count && !visited.has(`${row},${left}`)) {
          spiral.push(idx);
          visited.add(`${row},${left}`);
        }
      }
      left++;
    }
  }
  if (startFrom === "center") {
    spiral.reverse();
  }
  const delays = new Array(count).fill(0);
  const maxDelay = delay2 * (spiral.length - 1);
  spiral.forEach((originalIndex, spiralPosition) => {
    const t = spiral.length > 1 ? spiralPosition / (spiral.length - 1) : 0;
    delays[originalIndex] = easing(t) * maxDelay;
  });
  return delays;
}
function randomStagger(config) {
  const {
    count,
    seed = Date.now(),
    delay: delay2 = 100,
    minMultiplier = 0,
    maxMultiplier = 1,
    easing = (t) => t
  } = config;
  const random = seededRandom(seed);
  const delays = [];
  const maxDelay = delay2 * (count - 1);
  for (let i = 0; i < count; i++) {
    const r = random();
    const multiplier = minMultiplier + r * (maxMultiplier - minMultiplier);
    delays.push(easing(multiplier) * maxDelay);
  }
  return delays;
}
function customStagger(config, fn) {
  const { count, delay: delay2 = 100 } = config;
  const delays = [];
  const maxDelay = delay2 * (count - 1);
  for (let i = 0; i < count; i++) {
    const t = fn(i, count);
    delays.push(clamp(t, 0, 1) * maxDelay);
  }
  return delays;
}
function applyStagger(options, delays) {
  return options.map((opt, i) => ({
    ...opt,
    delay: (opt.delay ?? 0) + (delays[i] ?? 0)
  }));
}
var staggerPresets = {
  /** Quick cascade from first to last */
  cascade: (count) => linearStagger({ count, delay: 50 }),
  /** Slow reveal from first to last */
  reveal: (count) => linearStagger({ count, delay: 150 }),
  /** Pop from center outward */
  pop: (count) => centerStagger({ count, delay: 80 }),
  /** Ripple from edges to center */
  ripple: (count) => edgeStagger({ count, delay: 80 }),
  /** Random scatter effect */
  scatter: (count) => randomStagger({ count, delay: 100, seed: 42 }),
  /** Grid diagonal wave */
  gridWave: (count, columns) => gridStagger({ count, columns, direction: "diagonal", delay: 50 }),
  /** Grid radial from center */
  gridRadial: (count, columns) => gridStagger({ count, columns, origin: "center", direction: "radial", delay: 50 }),
  /** Spiral inward */
  spiralIn: (count, columns) => spiralStagger({ count, columns, startFrom: "edge", delay: 50 }),
  /** Spiral outward */
  spiralOut: (count, columns) => spiralStagger({ count, columns, startFrom: "center", delay: 50 })
};

// src/core/MotionValue.ts
var MotionValue = class {
  constructor(initialValue, options = {}) {
    this._velocity = 0;
    this._subscribers = /* @__PURE__ */ new Set();
    this._eventListeners = /* @__PURE__ */ new Map();
    this._springValue = null;
    this._isAnimating = false;
    this._destroyed = false;
    this._checkEndRafId = null;
    this._value = initialValue;
    this._springConfig = options.spring ?? { stiffness: 100, damping: 15 };
    if (typeof initialValue === "number") {
      this._springValue = createSpringValue(initialValue, {
        ...this._springConfig,
        onUpdate: (v) => {
          if (this._destroyed) return;
          this._value = v;
          this._velocity = this._springValue?.getVelocity() ?? 0;
          this._notify();
        }
      });
    }
  }
  /**
   * Get current value synchronously
   */
  get() {
    return this._value;
  }
  /**
   * Get current velocity (for numeric values)
   */
  getVelocity() {
    return this._velocity;
  }
  /**
   * Check if currently animating
   */
  isAnimating() {
    return this._isAnimating;
  }
  /**
   * Check if this MotionValue has been destroyed
   */
  isDestroyed() {
    return this._destroyed;
  }
  /**
   * Set value with spring animation
   */
  set(newValue, animate2 = true) {
    if (this._destroyed) return;
    if (this._checkEndRafId !== null) {
      cancelAnimationFrame(this._checkEndRafId);
      this._checkEndRafId = null;
    }
    if (typeof newValue === "number" && this._springValue && animate2) {
      this._isAnimating = true;
      this._emit("animationStart");
      this._springValue.set(newValue);
      const checkEnd = () => {
        if (this._destroyed) {
          this._checkEndRafId = null;
          return;
        }
        const isSettled = !(this._springValue?.isAnimating() ?? false);
        if (isSettled) {
          this._isAnimating = false;
          this._checkEndRafId = null;
          this._emitEnd("animationComplete");
        } else if (this._isAnimating) {
          this._checkEndRafId = requestAnimationFrame(checkEnd);
        } else {
          this._checkEndRafId = null;
        }
      };
      this._checkEndRafId = requestAnimationFrame(checkEnd);
    } else {
      const wasAnimating = this._isAnimating;
      if (typeof newValue === "number" && this._springValue) {
        this._springValue.jump(newValue);
      }
      this._isAnimating = false;
      this._value = newValue;
      this._velocity = 0;
      this._notify();
      if (wasAnimating) {
        this._emitEnd("animationCancel");
      }
    }
  }
  /**
   * Instantly set value without animation
   */
  jump(newValue) {
    if (this._destroyed) return;
    if (this._checkEndRafId !== null) {
      cancelAnimationFrame(this._checkEndRafId);
      this._checkEndRafId = null;
    }
    const wasAnimating = this._isAnimating;
    this._value = newValue;
    this._velocity = 0;
    if (typeof newValue === "number" && this._springValue) {
      this._springValue.jump(newValue);
    }
    this._isAnimating = false;
    this._notify();
    if (wasAnimating) {
      this._emitEnd("animationCancel");
    }
  }
  /**
   * Stop any running animation at current position
   */
  stop() {
    if (this._checkEndRafId !== null) {
      cancelAnimationFrame(this._checkEndRafId);
      this._checkEndRafId = null;
    }
    if (this._springValue) {
      this._springValue.stop();
    }
    const wasAnimating = this._isAnimating;
    this._isAnimating = false;
    if (wasAnimating) {
      this._emitEnd("animationCancel");
    }
  }
  /**
   * Subscribe to value changes
   * Returns unsubscribe function
   */
  subscribe(callback) {
    this._subscribers.add(callback);
    callback(this._value);
    return () => {
      this._subscribers.delete(callback);
    };
  }
  /**
   * Add event listener
   */
  on(event, callback) {
    if (!this._eventListeners.has(event)) {
      this._eventListeners.set(event, /* @__PURE__ */ new Set());
    }
    this._eventListeners.get(event).add(callback);
    return () => {
      this._eventListeners.get(event)?.delete(callback);
    };
  }
  /**
   * Update spring configuration. Applies from the next animated `set()`
   * (which retargets an ongoing animation with the new physics, keeping its
   * velocity); an animation already in flight keeps its current target.
   */
  setConfig(config) {
    this._springConfig = { ...this._springConfig, ...config };
    if (this._springValue) {
      this._springValue.setConfig(config);
    }
  }
  /**
   * Destroy and cleanup
   */
  destroy() {
    if (this._destroyed) return;
    this._destroyed = true;
    if (this._checkEndRafId !== null) {
      cancelAnimationFrame(this._checkEndRafId);
      this._checkEndRafId = null;
    }
    if (this._isAnimating) {
      this._isAnimating = false;
      this._emitEnd("animationCancel");
    }
    this._subscribers.clear();
    this._eventListeners.clear();
    if (this._springValue) {
      this._springValue.destroy();
      this._springValue = null;
    }
  }
  _notify() {
    for (const callback of this._subscribers) {
      try {
        callback(this._value);
      } catch (e) {
        console.error("MotionValue subscriber error:", e);
      }
    }
    if (this._eventListeners.size !== 0) this._emit("change");
  }
  /**
   * Signal the end of an animation: `reason` (animationComplete or
   * animationCancel) followed by `animationEnd` (kept for compatibility)
   */
  _emitEnd(reason) {
    this._emit(reason);
    this._emit("animationEnd");
  }
  _emit(event) {
    const listeners = this._eventListeners.get(event);
    if (!listeners) return;
    for (const callback of listeners) {
      try {
        callback();
      } catch (e) {
        console.error(`MotionValue ${event} listener error:`, e);
      }
    }
  }
};
function createMotionValue(initialValue, options) {
  return new MotionValue(initialValue, options);
}
function transformValue(source, transform) {
  const derived = new MotionValue(transform(source.get()));
  const unsubscribe = source.subscribe((value) => {
    derived.jump(transform(value));
  });
  const originalDestroy = derived.destroy.bind(derived);
  derived.destroy = () => {
    unsubscribe();
    originalDestroy();
  };
  return derived;
}
function mapRange2(source, inputRange, outputRange, options = {}) {
  const [inMin, inMax] = inputRange;
  const [outMin, outMax] = outputRange;
  const inputDelta = inMax - inMin;
  return transformValue(source, (value) => {
    if (inputDelta === 0) {
      return outMin;
    }
    let normalized = (value - inMin) / inputDelta;
    if (options.clamp) {
      normalized = Math.max(0, Math.min(1, normalized));
    }
    return outMin + normalized * (outMax - outMin);
  });
}

// src/native/solver.ts
var MAX_DURATION_MS = 1e4;
var SETTLE_STEP_MS = 1;
function solveSpring(config = {}, from = 0, to = 1) {
  const stiffness = positiveOr2(config.stiffness, 100);
  const damping = Math.max(0, finiteOr(config.damping, 10));
  const mass = positiveOr2(config.mass, 1);
  const v0 = finiteOr(config.velocity, 0);
  const distance = Math.abs(to - from);
  const scale = distance > 0 ? distance : 1;
  const restDelta = positiveOr2(config.restDelta, scale * 1e-3);
  const restSpeed = positiveOr2(config.restSpeed, scale * 0.01);
  const omega0 = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));
  const x0 = from - to;
  const isCritical = Math.abs(zeta - 1) < 1e-6;
  const motion = springMotion({ stiffness, damping, mass }, x0, v0);
  const isSettled = (t) => {
    const s = motion(t / 1e3);
    return Math.abs(s.position) <= restDelta && Math.abs(s.velocity) <= restSpeed;
  };
  let duration = 0;
  if (distance > 0 || v0 !== 0) {
    duration = MAX_DURATION_MS;
    const period = zeta < 1 && !isCritical ? 2 * Math.PI / (omega0 * Math.sqrt(1 - zeta * zeta)) : 0;
    const lookAheadMs = Math.min(MAX_DURATION_MS, Math.max(50, period * 1e3));
    for (let t = 0; t <= MAX_DURATION_MS; t += SETTLE_STEP_MS) {
      if (!isSettled(t)) continue;
      let stays = true;
      for (let u = t; u <= t + lookAheadMs; u += 4) {
        if (!isSettled(u)) {
          stays = false;
          break;
        }
      }
      if (stays) {
        duration = t;
        break;
      }
    }
  }
  return {
    from,
    to,
    duration,
    at(t) {
      if (!(t > 0)) return { value: from, velocity: v0 };
      if (t >= duration) return { value: to, velocity: 0 };
      const s = motion(t / 1e3);
      return { value: to + s.position, velocity: s.velocity };
    }
  };
}
function defineSpring(options = {}) {
  return perceptualSpringConfig(
    options.duration ?? 500,
    options.bounce ?? 0,
    options.mass ?? 1
  );
}
function finiteOr(value, fallback) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}
function positiveOr2(value, fallback) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : fallback;
}

// src/native/easing.ts
var MAX_CACHE_SIZE = 64;
var cache = /* @__PURE__ */ new Map();
function springEasing(options = {}) {
  const precision = options.precision !== void 0 && options.precision > 0 ? options.precision : 2e-3;
  const key = [
    options.stiffness,
    options.damping,
    options.mass,
    options.velocity,
    options.restSpeed,
    options.restDelta,
    precision
  ].join("|");
  const cached = cache.get(key);
  if (cached) return cached;
  const solver = solveSpring(options, 0, 1);
  const duration = Math.max(1, Math.round(solver.duration));
  const sampleCount = Math.min(2e3, Math.max(64, Math.ceil(duration / 2)));
  const samples = [];
  for (let i = 0; i <= sampleCount; i++) {
    const progress = i / sampleCount;
    samples.push([progress, solver.at(progress * duration).value]);
  }
  samples[sampleCount] = [1, 1];
  const points = simplify(samples, precision);
  const easing = `linear(${points.map(
    ([t, v], i) => i === 0 || i === points.length - 1 ? round(v, 4) : `${round(v, 4)} ${round(t * 100, 2)}%`
  ).join(", ")})`;
  const result = {
    easing,
    duration,
    toString: () => `${duration}ms ${easing}`
  };
  if (cache.size >= MAX_CACHE_SIZE) {
    const oldest = cache.keys().next().value;
    if (oldest !== void 0) cache.delete(oldest);
  }
  cache.set(key, result);
  return result;
}
function springTransition(properties, options = {}) {
  const { easing, duration } = springEasing(options);
  const list = typeof properties === "string" ? [properties] : properties;
  return list.map((property) => `${property} ${duration}ms ${easing}`).join(", ");
}
var linearSupport;
function supportsLinearEasing() {
  if (linearSupport === void 0) {
    try {
      linearSupport = typeof CSS !== "undefined" && typeof CSS.supports === "function" && CSS.supports("transition-timing-function", "linear(0, 1)");
    } catch {
      linearSupport = false;
    }
  }
  return linearSupport;
}
function simplify(points, tolerance) {
  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length > 0) {
    const [start, end] = stack.pop();
    const [t0, v0] = points[start];
    const [t1, v1] = points[end];
    let maxError = 0;
    let index = -1;
    for (let i = start + 1; i < end; i++) {
      const [t, v] = points[i];
      const expected = t1 === t0 ? v0 : v0 + (v1 - v0) * (t - t0) / (t1 - t0);
      const error = Math.abs(v - expected);
      if (error > maxError) {
        maxError = error;
        index = i;
      }
    }
    if (maxError > tolerance && index !== -1) {
      keep[index] = 1;
      stack.push([start, index], [index, end]);
    }
  }
  return points.filter((_, i) => keep[i] === 1);
}
function round(value, digits) {
  const factor = Math.pow(10, digits);
  const rounded = Math.round(value * factor) / factor;
  return Object.is(rounded, -0) ? 0 : rounded;
}

// src/native/animate-native.ts
var FALLBACK_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";
function animateNative(element, keyframes2, options = {}) {
  const {
    delay: delay2 = 0,
    persist = true,
    respectReducedMotion = true,
    onComplete,
    ...springOptions
  } = options;
  const compiled = springEasing(springOptions);
  const reduced = respectReducedMotion && prefersReducedMotion();
  const duration = reduced ? 0 : compiled.duration;
  const canAnimate = typeof element.animate === "function";
  if (!canAnimate) {
    applyFinalKeyframe(element, keyframes2);
    onComplete?.();
    return {
      animation: null,
      duration,
      finished: Promise.resolve(),
      play: noop,
      pause: noop,
      cancel: noop,
      finish: noop,
      reverse: noop,
      seek: noop
    };
  }
  const animation = element.animate(keyframes2, {
    duration,
    delay: reduced ? 0 : Math.max(0, delay2),
    easing: supportsLinearEasing() ? compiled.easing : FALLBACK_EASING,
    fill: "both"
  });
  let direction = 1;
  const applyTimeScale = (scale) => {
    const rate = scale * direction;
    if (typeof animation.updatePlaybackRate === "function") {
      animation.updatePlaybackRate(rate);
    } else {
      animation.playbackRate = rate;
    }
  };
  let unsubscribeTimeScale = null;
  const follow = () => {
    if (!unsubscribeTimeScale) {
      unsubscribeTimeScale = globalLoop.onTimeScaleChange(applyTimeScale);
    }
  };
  const unfollow = () => {
    unsubscribeTimeScale?.();
    unsubscribeTimeScale = null;
  };
  let watchedRun = null;
  let finished = Promise.resolve();
  const watchRun = () => {
    const run = animation.finished;
    if (run === watchedRun) return;
    watchedRun = run;
    finished = run.then(
      () => {
        if (watchedRun !== run) return;
        unfollow();
        if (persist) {
          try {
            animation.commitStyles();
          } catch {
            applyFinalKeyframe(element, keyframes2);
          }
          animation.cancel();
        }
        try {
          onComplete?.();
        } catch (error) {
          console.error("[SpringKit]", error);
        }
      },
      // Rejected with AbortError when cancelled — that's a normal outcome
      () => {
        if (watchedRun === run) unfollow();
      }
    );
  };
  const resumed = () => {
    watchRun();
    if (!unsubscribeTimeScale) {
      applyTimeScale(globalLoop.getTimeScale());
      follow();
    }
  };
  if (globalLoop.getTimeScale() !== 1) applyTimeScale(globalLoop.getTimeScale());
  follow();
  watchRun();
  return {
    animation,
    duration,
    get finished() {
      return finished;
    },
    play: () => {
      animation.play();
      resumed();
    },
    pause: () => {
      animation.pause();
      unfollow();
    },
    cancel: () => {
      animation.cancel();
      unfollow();
    },
    finish: () => animation.finish(),
    reverse: () => {
      direction = -direction;
      animation.reverse();
      resumed();
    },
    seek: (ms) => {
      animation.currentTime = Math.max(0, delay2) + Math.min(Math.max(0, ms), duration);
    }
  };
}
function prefersReducedMotion() {
  try {
    return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}
function applyFinalKeyframe(element, keyframes2) {
  const style = element.style;
  if (!style) return;
  const final = Array.isArray(keyframes2) ? { ...keyframes2[keyframes2.length - 1] ?? {} } : Object.fromEntries(
    Object.entries(keyframes2).map(([key, value]) => [
      key,
      Array.isArray(value) ? value[value.length - 1] : value
    ])
  );
  for (const [property, value] of Object.entries(final)) {
    if (value === void 0 || value === null || property === "offset" || property === "easing" || property === "composite") {
      continue;
    }
    if (property.startsWith("--")) {
      style.setProperty(property, String(value));
    } else {
      style[property] = String(value);
    }
  }
}
function noop() {
}

// src/svg/path.ts
function createPathAnimation(element, options = {}) {
  const {
    config = {},
    autoPlay = false,
    onUpdate,
    onComplete
  } = options;
  const totalLength = element.getTotalLength?.() ?? 0;
  element.style.strokeDasharray = String(totalLength);
  element.style.strokeDashoffset = String(totalLength);
  let currentValue = 0;
  let targetValue = 0;
  let destroyed = false;
  let paused = false;
  let pendingRafId = null;
  let pendingTimeoutId = null;
  const waiters = /* @__PURE__ */ new Set();
  const spring2 = createSpringValue(0, config);
  const unsubscribe = spring2.subscribe((value) => {
    if (destroyed) return;
    currentValue = value;
    const offset = totalLength * (1 - value);
    element.style.strokeDashoffset = String(offset);
    onUpdate?.(value);
  });
  const cancelWatch = () => {
    if (pendingRafId !== null) {
      cancelAnimationFrame(pendingRafId);
      pendingRafId = null;
    }
    if (pendingTimeoutId !== null) {
      clearTimeout(pendingTimeoutId);
      pendingTimeoutId = null;
    }
  };
  const settle = (completed) => {
    cancelWatch();
    if (waiters.size === 0) return;
    const resolvers = [...waiters];
    waiters.clear();
    resolvers.forEach((resolve) => resolve());
    if (completed) {
      try {
        onComplete?.();
      } catch (e) {
        console.error("[SpringKit] Path animation onComplete error:", e);
      }
    }
  };
  const watch = () => {
    if (pendingRafId !== null || pendingTimeoutId !== null) return;
    const check = () => {
      pendingRafId = null;
      if (destroyed || paused) return;
      if (!spring2.isAnimating()) {
        settle(true);
      } else {
        pendingRafId = requestAnimationFrame(check);
      }
    };
    pendingTimeoutId = setTimeout(() => {
      pendingTimeoutId = null;
      check();
    }, 16);
  };
  const animateTo = (target) => {
    targetValue = target;
    paused = false;
    spring2.set(target);
    return new Promise((resolve) => {
      waiters.add(resolve);
      watch();
    });
  };
  const animation = {
    play: async (target = 1) => {
      if (destroyed) return;
      await animateTo(target);
    },
    reverse: async () => {
      if (destroyed) return;
      await animateTo(0);
    },
    set: (value, animate2 = false) => {
      if (destroyed) return;
      targetValue = value;
      paused = false;
      if (animate2) {
        spring2.set(value);
        if (waiters.size > 0) watch();
      } else {
        spring2.jump(value);
        currentValue = value;
        const offset = totalLength * (1 - value);
        element.style.strokeDashoffset = String(offset);
        settle(false);
      }
    },
    get: () => currentValue,
    pause: () => {
      if (destroyed) return;
      paused = true;
      cancelWatch();
      spring2.stop();
    },
    resume: () => {
      if (destroyed) return;
      paused = false;
      spring2.set(targetValue);
      if (waiters.size > 0) watch();
    },
    reset: () => {
      if (destroyed) return;
      paused = false;
      spring2.jump(0);
      currentValue = 0;
      targetValue = 0;
      element.style.strokeDashoffset = String(totalLength);
      settle(false);
    },
    isAnimating: () => spring2.isAnimating(),
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      settle(false);
      unsubscribe();
      spring2.destroy();
    }
  };
  if (autoPlay) {
    animation.play();
  }
  return animation;
}
function getPathLength(element) {
  return element.getTotalLength?.() ?? 0;
}
function preparePathForAnimation(element, initialProgress = 0) {
  const length = element.getTotalLength?.() ?? 0;
  element.style.strokeDasharray = String(length);
  element.style.strokeDashoffset = String(length * (1 - initialProgress));
}
function getPointAtProgress(path, progress) {
  try {
    const length = path.getTotalLength();
    return path.getPointAtLength(length * Math.max(0, Math.min(1, progress)));
  } catch {
    return null;
  }
}

// src/layout/flip.ts
var activeFlips = /* @__PURE__ */ new WeakMap();
function measureElement2(element) {
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left + window.scrollX,
    y: rect.top + window.scrollY,
    width: rect.width,
    height: rect.height
  };
}
function resolveTransformOrigin(value, width, height) {
  const keywords = {
    left: { axis: "x", ratio: 0 },
    right: { axis: "x", ratio: 1 },
    top: { axis: "y", ratio: 0 },
    bottom: { axis: "y", ratio: 1 },
    center: { axis: "any", ratio: 0.5 }
  };
  const tokens = value.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const a = tokens[0] ?? "50%";
  const b = tokens[1] ?? "center";
  const swapped = keywords[a]?.axis === "y" || keywords[b]?.axis === "x";
  const first = swapped ? b : a;
  const second = swapped ? a : b;
  const resolve = (token, size) => {
    const keyword = keywords[token];
    if (keyword) return keyword.ratio * size;
    const number = parseFloat(token);
    if (!Number.isFinite(number)) return size / 2;
    return token.endsWith("%") ? number / 100 * size : number;
  };
  return { x: resolve(first, width), y: resolve(second, height) };
}
function parseComputedMatrix(value) {
  const match = /^matrix(3d)?\(([^)]*)\)$/.exec(value.trim());
  if (!match) return null;
  const v = match[2].split(",").map((n) => parseFloat(n));
  const m = match[1] ? [v[0], v[1], v[4], v[5], v[12], v[13]] : v;
  if (m.length < 6 || m.slice(0, 6).some((n) => n === void 0 || !Number.isFinite(n))) return null;
  return m.slice(0, 6);
}
function createFlip(element, first, last, options = {}) {
  const {
    config = {},
    position = true,
    size = true,
    onComplete,
    onUpdate,
    correctBorderRadius = false
  } = options;
  const deltaX = first.x - last.x;
  const deltaY = first.y - last.y;
  const deltaWidth = last.width === 0 ? 1 : first.width / last.width;
  const deltaHeight = last.height === 0 ? 1 : first.height / last.height;
  let progress = 0;
  let isPlaying = false;
  let cancelled = false;
  let pendingRafId = null;
  let pendingTimeoutId = null;
  let resolvePlay = null;
  const spring2 = createSpringValue(0, config);
  activeFlips.get(element)?.cancel();
  const originalTransform = element.style.transform;
  const originalTransformOrigin = element.style.transformOrigin;
  const originalBorderRadius = element.style.borderRadius;
  const isScaling = size && (deltaWidth !== 1 || deltaHeight !== 1);
  let origin = { x: 0, y: 0 };
  let anchor = { x: 0, y: 0 };
  let borderRadius = 0;
  if (isScaling) {
    let computedOrigin = "";
    let computedRadius = "";
    let computedTransform = "";
    try {
      const styles = getComputedStyle(element);
      computedOrigin = styles.transformOrigin;
      computedRadius = styles.borderTopLeftRadius || styles.borderRadius;
      computedTransform = styles.transform;
    } catch {
    }
    const layoutWidth = element.offsetWidth || last.width;
    const layoutHeight = element.offsetHeight || last.height;
    origin = resolveTransformOrigin(
      computedOrigin || originalTransformOrigin || "50% 50%",
      layoutWidth,
      layoutHeight
    );
    const matrix = originalTransform && originalTransform !== "none" ? parseComputedMatrix(computedTransform || "") : null;
    if (matrix) {
      const [a, b, c, d, e, f] = matrix;
      const corners = [[0, 0], [layoutWidth, 0], [0, layoutHeight], [layoutWidth, layoutHeight]].map(([px, py]) => {
        const x = px - origin.x;
        const y = py - origin.y;
        return { x: origin.x + a * x + c * y + e, y: origin.y + b * x + d * y + f };
      });
      anchor = {
        x: Math.min(...corners.map((p) => p.x)),
        y: Math.min(...corners.map((p) => p.y))
      };
    }
    const radiusSource = computedRadius || originalBorderRadius;
    if (correctBorderRadius && !radiusSource.includes("%")) {
      borderRadius = parseFloat(radiusSource) || 0;
    }
  }
  const applyTransform2 = (t) => {
    progress = t;
    const invertedT = 1 - t;
    const transforms = [];
    const scaleX = isScaling ? 1 + (deltaWidth - 1) * invertedT : 1;
    const scaleY = isScaling ? 1 + (deltaHeight - 1) * invertedT : 1;
    if (position) {
      transforms.push(`translate(${deltaX * invertedT}px, ${deltaY * invertedT}px)`);
    }
    if (isScaling) {
      if (anchor.x !== 0 || anchor.y !== 0) {
        transforms.push(`translate(${(1 - scaleX) * anchor.x}px, ${(1 - scaleY) * anchor.y}px)`);
      }
      const hasOrigin = origin.x !== 0 || origin.y !== 0;
      if (hasOrigin) {
        transforms.push(`translate(${-origin.x}px, ${-origin.y}px)`);
      }
      transforms.push(`scale(${scaleX}, ${scaleY})`);
      if (hasOrigin) {
        transforms.push(`translate(${origin.x}px, ${origin.y}px)`);
      }
      if (borderRadius > 0) {
        const radiusX = scaleX === 0 ? 0 : borderRadius / scaleX;
        const radiusY = scaleY === 0 ? 0 : borderRadius / scaleY;
        element.style.borderRadius = radiusX === radiusY ? `${radiusX}px` : `${radiusX}px / ${radiusY}px`;
      }
    }
    if (originalTransform && originalTransform !== "none") {
      transforms.push(originalTransform);
    }
    element.style.transform = transforms.length > 0 ? transforms.join(" ") : "";
    try {
      onUpdate?.(t);
    } catch (e) {
      console.error("[SpringKit] FLIP onUpdate error:", e);
    }
  };
  applyTransform2(0);
  let restored = false;
  const cleanup = () => {
    if (restored) return;
    restored = true;
    if (activeFlips.get(element) === animation) activeFlips.delete(element);
    element.style.transform = originalTransform;
    element.style.transformOrigin = originalTransformOrigin;
    if (borderRadius > 0) {
      element.style.borderRadius = originalBorderRadius;
    }
  };
  const animation = {
    play: async () => {
      if (cancelled) return;
      isPlaying = true;
      return new Promise((resolve) => {
        resolvePlay = resolve;
        const unsubscribe = spring2.subscribe((value) => {
          if (cancelled) {
            unsubscribe();
            resolvePlay = null;
            resolve();
            return;
          }
          applyTransform2(value);
        });
        spring2.set(1);
        const checkComplete = () => {
          pendingRafId = null;
          if (cancelled) {
            unsubscribe();
            cleanup();
            resolvePlay = null;
            resolve();
            return;
          }
          if (!spring2.isAnimating()) {
            isPlaying = false;
            unsubscribe();
            cleanup();
            try {
              onComplete?.();
            } catch (e) {
              console.error("[SpringKit] FLIP onComplete error:", e);
            }
            resolvePlay = null;
            resolve();
          } else {
            pendingRafId = requestAnimationFrame(checkComplete);
          }
        };
        pendingTimeoutId = setTimeout(() => {
          pendingTimeoutId = null;
          checkComplete();
        }, 16);
      });
    },
    getProgress: () => progress,
    cancel: () => {
      cancelled = true;
      isPlaying = false;
      if (pendingRafId !== null) {
        cancelAnimationFrame(pendingRafId);
        pendingRafId = null;
      }
      if (pendingTimeoutId !== null) {
        clearTimeout(pendingTimeoutId);
        pendingTimeoutId = null;
      }
      spring2.stop();
      cleanup();
      if (resolvePlay) {
        resolvePlay();
        resolvePlay = null;
      }
    },
    isAnimating: () => isPlaying
  };
  activeFlips.set(element, animation);
  return animation;
}
async function flip(element, mutate, options = {}) {
  const first = measureElement2(element);
  activeFlips.get(element)?.cancel();
  await mutate();
  element.offsetHeight;
  const last = measureElement2(element);
  const animation = createFlip(element, first, last, options);
  await animation.play();
}
async function flipBatch(elements, mutate, options = {}) {
  const firstStates = elements.map((el) => measureElement2(el));
  elements.forEach((el) => activeFlips.get(el)?.cancel());
  await mutate();
  document.body.offsetHeight;
  const animations = elements.map((element, i) => {
    const last = measureElement2(element);
    return createFlip(element, firstStates[i], last, options);
  });
  await Promise.all(animations.map((anim) => anim.play()));
}

export { AnimationState, MotionValue, adjustBounce, adjustSpeed, allTo, animate, animateAll, animateNative, applyStagger, applyValuesToElement, buildTransformString, calculateDampingRatio, calculatePeriod, calculateStaggerDelays, centerStagger, clamp, clearWarnings, configFromBounce, configFromDuration, createAutoLayout, createDragSpring, createFeeling, createFlip, createGestures, createLayoutGroup, createLongPressGesture, createMorph, createMorphSequence, createMotionValue, createOrchestration, createParallax, createPathAnimation, createPinchGesture, createRotateGesture, createScrollLinkedValue, createScrollProgress, createScrollSpring, createScrollTrigger, createSharedLayoutContext, createSpringGroup, createSpringValue, createSwipeGesture, createTimeline, createTrail, createVariantPreset, customStagger, decay, defineSpring, degToRad, delay, edgeStagger, flip, flipBatch, formatRGBA, getPathLength, getPhysicsPreset, getPointAtProgress, getVariant, globalLoop, gridStagger, hexToRgb, hslToRgb, interpolate, interpolateColor, isAnimatable, isColorString, isCriticallyDamped, isKeyframeArray, isOverdamped, isTransformProperty, isUnderdamped, isVariant, isVariants, keyframes, lerp, linearRgbToOklab, linearStagger, linearToSrgb, mapRange, measureElement2 as measureElement, mergeVariants, mixColorsRGBA, oklabToLinearRgb, oklabToRgb, parallel, parseColor, parseColorRGBA, parseKeyframeArray, parseValueWithUnit, physicsPresets, preparePathForAnimation, radToDeg, randomStagger, resolveVariant, reverseStagger, rgbToHex, rgbToHsl, rgbToOklab, scrollEasings, sequence, shapes, simulateSpring, solveSpring, spiralStagger, spring, springEasing, springMotion, springPresets, springTransition, srgbToLinear, stagger, staggerPresets, stepSpring, supportsLinearEasing, mapRange2 as transformMapRange, transformValue, tween, validateDecayConfig, validateDragConfig, validateSpringConfig, variantPresets, waveStagger };
