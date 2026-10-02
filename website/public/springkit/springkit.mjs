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
  const stiffness = (preset.stiffness ?? 100) * speed;
  const damping = (preset.damping ?? 10) * Math.sqrt(speed);
  return { ...preset, stiffness, damping };
}
function adjustBounce(preset, bounce) {
  const minDamping = 5;
  const maxDamping = 40;
  const damping = maxDamping - bounce * (maxDamping - minDamping);
  return { ...preset, damping: Math.max(minDamping, Math.min(maxDamping, damping)) };
}
function configFromDuration(ms) {
  if (ms < 300) {
    return { stiffness: 170, damping: 26 };
  }
  if (ms < 500) {
    return { stiffness: 100, damping: 20 };
  }
  return { stiffness: 80, damping: 15 };
}
function configFromBounce(bounce) {
  if (bounce <= 0) {
    return { stiffness: 170, damping: 26 };
  }
  if (bounce <= 0.25) {
    return { stiffness: 200, damping: 12 };
  }
  return { stiffness: 200, damping: 8 };
}

// src/core/physics.ts
var FIXED_TIME_STEP = 1 / 60;
function simulateSpring(position, velocity, target, config) {
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
  const dt = FIXED_TIME_STEP;
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

// src/animation/loop.ts
var AnimationState = /* @__PURE__ */ ((AnimationState2) => {
  AnimationState2["Idle"] = "idle";
  AnimationState2["Running"] = "running";
  AnimationState2["Paused"] = "paused";
  AnimationState2["Complete"] = "complete";
  return AnimationState2;
})(AnimationState || {});
var MAX_DELTA_TIME = 64;
var AnimationLoop = class {
  constructor() {
    this.animations = /* @__PURE__ */ new Set();
    this.animationMap = /* @__PURE__ */ new WeakMap();
    this.rafId = null;
    this.isRunning = false;
    this.lastTime = 0;
    this.nextId = 1;
    this.idMap = /* @__PURE__ */ new WeakMap();
    this.frameListeners = /* @__PURE__ */ new Set();
    // FinalizationRegistry for automatic cleanup notifications
    // Feature detection for older browsers (Safari < 14.1, IE11)
    this.registry = typeof FinalizationRegistry !== "undefined" ? new FinalizationRegistry((id) => {
      this.cleanupCallbacks.forEach((cb) => cb(id));
    }) : null;
    this.cleanupCallbacks = /* @__PURE__ */ new Set();
    /**
     * Single animation frame - optimized single-pass update + cleanup
     * Features:
     * - WeakRef dereferencing with automatic cleanup of dead refs
     * - Delta time clamping for frame-drop resilience
     * - O(n) single-pass performance
     * - Frame listener notifications
     */
    this.tick = () => {
      const now = performance.now();
      const rawDelta = now - this.lastTime;
      const clampedDelta = Math.min(rawDelta, MAX_DELTA_TIME);
      this.lastTime = now;
      this.lastFrameDuration = clampedDelta;
      for (const listener of this.frameListeners) {
        try {
          listener(clampedDelta);
        } catch (e) {
          console.error("[SpringKit] Frame listener error:", e);
        }
      }
      const toRemove = [];
      for (const ref of this.animations) {
        const animation = ref.deref();
        if (!animation) {
          toRemove.push(ref);
          continue;
        }
        animation.update(now);
        if (animation.isComplete()) {
          toRemove.push(ref);
          this.animationMap.delete(animation);
          this.idMap.delete(animation);
        }
      }
      for (let i = 0; i < toRemove.length; i++) {
        this.animations.delete(toRemove[i]);
      }
      if (this.animations.size > 0) {
        this.rafId = requestAnimationFrame(this.tick);
      } else {
        this.stop();
      }
    };
    this.lastFrameDuration = 16.67;
  }
  /**
   * Add an animation to the loop
   * Uses WeakRef to prevent memory leaks if animation is garbage collected
   * @returns Unique ID for this animation
   */
  add(animation) {
    const existingId = this.idMap.get(animation);
    if (existingId !== void 0) return existingId;
    if (this.animations.size > 0 && this.animations.size % 100 === 0) {
      this.cleanupDeadRefs();
    }
    const id = this.nextId++;
    const ref = new WeakRef(animation);
    this.animations.add(ref);
    this.animationMap.set(animation, ref);
    this.idMap.set(animation, id);
    this.registry?.register(animation, id);
    this.start();
    return id;
  }
  /**
   * Clean up dead WeakRefs from the animations set
   * Prevents memory bloat from accumulated dead references
   */
  cleanupDeadRefs() {
    for (const ref of this.animations) {
      if (ref.deref() === void 0) {
        this.animations.delete(ref);
      }
    }
  }
  /**
   * Remove an animation from the loop
   */
  remove(animation) {
    const ref = this.animationMap.get(animation);
    if (ref) {
      this.animations.delete(ref);
      this.animationMap.delete(animation);
      this.idMap.delete(animation);
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
   * Start the animation loop
   */
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.tick();
  }
  /**
   * Stop the animation loop
   */
  stop() {
    this.isRunning = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
  /**
   * Get the number of active animations (including potentially dead refs)
   */
  get size() {
    return this.animations.size;
  }
  /**
   * Get count of actually alive animations (for debugging/testing)
   */
  getAliveCount() {
    let count = 0;
    for (const ref of this.animations) {
      if (ref.deref()) count++;
    }
    return count;
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

// src/utils/warnings.ts
var isDev = typeof process !== "undefined" && process.env?.NODE_ENV !== "production";
var warnedMessages = /* @__PURE__ */ new Set();
function warnOnce(message) {
  if (!isDev || warnedMessages.has(message)) return;
  warnedMessages.add(message);
  console.warn(`[SpringKit] ${message}`);
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
      `Deceleration should be between 0 and 1 (exclusive). Got ${deceleration}. Typical values are 0.99-0.999.`
    );
  }
}
function validateAnimationValue(value, context) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    const message = `Invalid animation value in ${context}: expected number, got ${value}`;
    if (isDev) {
      console.error(`[SpringKit] ${message}`);
    }
    return 0;
  }
  if (!Number.isFinite(value)) {
    const message = `Invalid animation value in ${context}: Infinity is not supported`;
    if (isDev) {
      console.error(`[SpringKit] ${message}`);
    }
    return 0;
  }
  return value;
}
function clearWarnings() {
  warnedMessages.clear();
}

// src/core/spring.ts
var SpringAnimationImpl = class {
  constructor(from, to, config = {}) {
    this.state = "idle" /* Idle */;
    this.resolveComplete = null;
    this.lastUpdateTime = 0;
    validateSpringConfig(config);
    this.from = validateAnimationValue(from, "spring.from");
    this.to = validateAnimationValue(to, "spring.to");
    this.clampedFrom = this.from;
    this.clampedTo = this.to;
    this.position = this.from;
    this.velocity = config.velocity ?? 0;
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
    this.finished = new Promise((resolve) => {
      this.resolveComplete = resolve;
    });
  }
  start() {
    if (this.state === "running" /* Running */) return this;
    this.state = "running" /* Running */;
    this.lastUpdateTime = 0;
    this.config.onStart?.();
    globalLoop.add(this);
    return this;
  }
  stop() {
    this.state = "idle" /* Idle */;
    globalLoop.remove(this);
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
    if (this.state === "running" /* Running */) {
      this.velocity = -this.velocity;
    }
  }
  set(to) {
    const validTo = validateAnimationValue(to, "spring.set");
    this.to = validTo;
    this.clampedTo = validTo;
    this.target = validTo;
  }
  setWithVelocity(to, velocity) {
    const validTo = validateAnimationValue(to, "spring.setWithVelocity");
    this.from = this.position;
    this.clampedFrom = this.position;
    this.to = validTo;
    this.clampedTo = validTo;
    this.target = validTo;
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
  update(now) {
    if (this.state !== "running" /* Running */) return;
    if (this.lastUpdateTime === 0) {
      this.lastUpdateTime = now;
    }
    const elapsed = (now - this.lastUpdateTime) / 1e3;
    this.lastUpdateTime = now;
    const MAX_DELTA_TIME2 = 1 / 15;
    const FIXED_TIME_STEP2 = 1 / 60;
    const safeElapsed = Math.min(elapsed, MAX_DELTA_TIME2);
    const steps = Math.max(1, Math.ceil(safeElapsed / FIXED_TIME_STEP2));
    let currentPosition = this.position;
    let currentVelocity = this.velocity;
    let isRest = false;
    for (let i = 0; i < steps && !isRest; i++) {
      const result = simulateSpring(
        currentPosition,
        currentVelocity,
        this.target,
        this.config
      );
      currentPosition = result.position;
      currentVelocity = result.velocity;
      isRest = result.isRest;
    }
    this.position = currentPosition;
    this.velocity = currentVelocity;
    if (this.config.clamp) {
      const min = Math.min(this.clampedFrom, this.clampedTo);
      const max = Math.max(this.clampedFrom, this.clampedTo);
      this.position = clamp(this.position, min, max);
    }
    this.config.onUpdate?.(this.position);
    if (isRest) {
      this.state = "complete" /* Complete */;
      globalLoop.remove(this);
      this.position = this.target;
      this.velocity = 0;
      this.config.onUpdate?.(this.position);
      this.config.onComplete?.();
      this.config.onRest?.();
      this.resolveComplete?.();
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
    this.stop();
    this.resolveComplete?.();
    this.resolveComplete = null;
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
    this.value = validateAnimationValue(initial, "createSpringValue.initial");
    this.config = { ...defaultConfig, ...config };
    this.finishedPromise = new Promise((resolve) => {
      this.resolveComplete = resolve;
    });
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
    if (this.currentAnimation) {
      this.currentAnimation.destroy();
      this.currentAnimation = null;
      this.resolveComplete?.();
    }
    let animationResolver = null;
    this.finishedPromise = new Promise((resolve) => {
      animationResolver = resolve;
      this.resolveComplete = resolve;
    });
    const mergedConfig = { ...this.config, ...config };
    const originalOnUpdate = mergedConfig.onUpdate;
    const originalOnComplete = mergedConfig.onComplete;
    this.currentAnimation = spring(this.value, validTo, {
      ...mergedConfig,
      onUpdate: (value) => {
        if (this.destroyed) return;
        this.value = value;
        this.notify();
        originalOnUpdate?.(value);
      },
      onComplete: () => {
        originalOnComplete?.();
        animationResolver?.();
      }
    });
    this.currentAnimation.start();
  }
  jump(to) {
    if (this.destroyed) return;
    if (this.isNotifying) return;
    const validTo = validateAnimationValue(to, "SpringValue.jump");
    if (this.currentAnimation) {
      this.currentAnimation.destroy();
      this.currentAnimation = null;
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
    this.resetPromise();
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
    const promises = [];
    for (const [key, value] of Object.entries(values)) {
      const springValue = this.values.get(key);
      if (springValue && typeof value === "number") {
        springValue.set(value, config);
        promises.push(springValue.finished);
      }
    }
    Promise.all(promises).then(() => {
      if (this.resolveComplete && !this.destroyed) {
        this.resolveComplete();
      }
    });
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
      Object.assign(merged, variant);
      if (variant.transition) {
        merged.transition = { ...merged.transition, ...variant.transition };
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
    const x = values.x ?? 0;
    const y = values.y ?? 0;
    transforms.push(`translate(${x}px, ${y}px)`);
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
  const { when = false, delay = 0 } = options;
  const delays = calculateStaggerDelays(childrenAnims.length, options);
  const parent = async () => {
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    await parentAnim();
  };
  const children = async () => {
    await Promise.all(
      childrenAnims.map(
        (anim, i) => new Promise((resolve) => {
          setTimeout(async () => {
            await anim();
            resolve();
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
  /** Container with staggered children */
  staggerContainer: {
    initial: {},
    animate: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    },
    exit: {
      transition: {
        staggerChildren: 0.05,
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
  const { delay = 0, from = "first" } = options;
  let startIndex = 0;
  if (from === "last") startIndex = items.length - 1;
  else if (from === "center") startIndex = Math.floor(items.length / 2);
  else if (typeof from === "number") startIndex = from;
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
  const getDelay = typeof delay === "function" ? delay : (_i) => delay;
  const animations = [];
  const timeoutIds = [];
  for (let i = 0; i < indices.length; i++) {
    const index = indices[i];
    const anim = animate2(items[index], index);
    animations.push(anim);
    const delayMs = getDelay(i);
    if (delayMs > 0) {
      const timeoutId = setTimeout(() => {
        anim.start();
      }, delayMs);
      timeoutIds.push(timeoutId);
    } else {
      anim.start();
    }
  }
  try {
    await Promise.all(animations.map((a) => a.finished));
  } finally {
    timeoutIds.forEach(clearTimeout);
  }
}

// src/animation/trail.ts
var TrailImpl = class {
  constructor(count, config = {}) {
    this.subscribers = /* @__PURE__ */ new Set();
    this.frameCount = 0;
    this.pendingUpdates = /* @__PURE__ */ new Map();
    // Track timeout IDs for cleanup to prevent memory leaks
    this.pendingTimeouts = /* @__PURE__ */ new Set();
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
      this.pendingUpdates.set(i, targetFrame);
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
      const timeoutId = setTimeout(() => {
        this.pendingTimeouts.delete(timeoutId);
        if (this.destroyed) return;
        const currentTarget = this.pendingUpdates.get(index);
        if (currentTarget === targetFrame) {
          this.springs[index].set(targetValue);
        }
      }, delayMs);
      this.pendingTimeouts.add(timeoutId);
    }
  }
  set(value) {
    this.leader.set(value);
  }
  jump(value) {
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
    const unsubscribers = [];
    for (const spring2 of this.springs) {
      unsubscribers.push(
        spring2.subscribe(() => {
          this.notify();
        })
      );
    }
    callback(this.getValues());
    return () => {
      this.subscribers.delete(callback);
      for (const unsubscribe of unsubscribers) {
        unsubscribe();
      }
    };
  }
  notify() {
    const values = this.getValues();
    for (const subscriber of this.subscribers) {
      subscriber(values);
    }
  }
  destroy() {
    this.destroyed = true;
    for (const timeoutId of this.pendingTimeouts) {
      clearTimeout(timeoutId);
    }
    this.pendingTimeouts.clear();
    this.leader.destroy();
    for (const spring2 of this.springs) {
      spring2.destroy();
    }
    this.subscribers.clear();
    this.pendingUpdates.clear();
  }
};
function createTrail(count, config) {
  return new TrailImpl(count, config);
}

// src/animation/decay.ts
var DecayAnimationImpl = class {
  constructor(config) {
    this.state = "idle" /* Idle */;
    this.rafId = null;
    this.resolveComplete = null;
    validateDecayConfig(config);
    this.value = 0;
    this.velocity = validateAnimationValue(config.velocity, "decay.velocity");
    const rawDecel = config.deceleration ?? 0.998;
    this.deceleration = validateAnimationValue(rawDecel, "decay.deceleration");
    if (this.deceleration <= 0 || this.deceleration >= 1) {
      this.deceleration = 0.998;
    }
    this.clampRange = config.clamp;
    this.state = "idle" /* Idle */;
    this.config = config;
    this.finished = new Promise((resolve) => {
      this.resolveComplete = resolve;
    });
  }
  start() {
    if (this.state === "running" /* Running */) return this;
    this.state = "running" /* Running */;
    globalLoop.add(this);
    return this;
  }
  stop() {
    this.state = "idle" /* Idle */;
    globalLoop.remove(this);
  }
  update(_now) {
    if (this.state !== "running" /* Running */) return;
    this.velocity *= this.deceleration;
    this.value += this.velocity;
    if (this.clampRange) {
      const [min, max] = this.clampRange;
      this.value = clamp(this.value, min, max);
      if (this.value <= min && this.velocity < 0 || this.value >= max && this.velocity > 0) {
        this.velocity = 0;
      }
    }
    this.config.onUpdate?.(this.value);
    if (Math.abs(this.velocity) < 0.01) {
      this.state = "complete" /* Complete */;
      globalLoop.remove(this);
      this.config.onComplete?.();
      this.resolveComplete?.();
    }
  }
  isComplete() {
    return this.state === "complete" /* Complete */;
  }
  destroy() {
    this.stop();
    this.resolveComplete?.();
    this.resolveComplete = null;
    this.config.onUpdate = void 0;
    this.config.onComplete = void 0;
  }
};
function decay(config) {
  return new DecayAnimationImpl(config);
}

// src/animation/keyframes.ts
function keyframes(values, options = {}) {
  const {
    config = {},
    times,
    onKeyframe,
    onComplete,
    onUpdate
  } = options;
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
  let currentIndex = 0;
  let isPlaying = false;
  let isPaused = false;
  let spring2 = null;
  let currentValue = normalizedKeyframes[0]?.value ?? 0;
  let destroyed = false;
  let pendingRafId = null;
  let pendingTimeoutId = null;
  const createSpring = () => {
    if (spring2) {
      spring2.destroy();
    }
    const currentKf = normalizedKeyframes[currentIndex];
    const springConfig = currentKf?.config ?? config;
    spring2 = createSpringValue(currentValue, springConfig);
    spring2.subscribe((value) => {
      currentValue = value;
      onUpdate?.(value);
    });
  };
  const animateToNext = async () => {
    if (destroyed || isPaused) return false;
    if (currentIndex >= normalizedKeyframes.length - 1) return false;
    currentIndex++;
    const targetKf = normalizedKeyframes[currentIndex];
    if (!targetKf) return false;
    if (targetKf.config) {
      createSpring();
    }
    onKeyframe?.(currentIndex);
    if (spring2) {
      spring2.set(targetKf.value);
      await new Promise((resolve) => {
        const checkComplete = () => {
          pendingRafId = null;
          if (destroyed || isPaused) {
            resolve();
            return;
          }
          if (spring2 && !spring2.isAnimating()) {
            resolve();
          } else {
            pendingRafId = requestAnimationFrame(checkComplete);
          }
        };
        pendingTimeoutId = setTimeout(() => {
          pendingTimeoutId = null;
          if (!destroyed) {
            checkComplete();
          } else {
            resolve();
          }
        }, 16);
      });
    }
    return true;
  };
  const animation = {
    play: async () => {
      if (destroyed) return;
      if (isPlaying) return;
      isPlaying = true;
      isPaused = false;
      if (currentIndex >= normalizedKeyframes.length - 1) {
        currentIndex = 0;
        currentValue = normalizedKeyframes[0]?.value ?? 0;
      }
      createSpring();
      onKeyframe?.(0);
      while (await animateToNext()) {
      }
      if (!isPaused && !destroyed) {
        isPlaying = false;
        onComplete?.();
      }
    },
    pause: () => {
      isPaused = true;
      isPlaying = false;
      if (spring2) {
        spring2.stop();
      }
    },
    resume: () => {
      if (!isPaused || destroyed) return;
      isPaused = false;
      isPlaying = true;
      const continueAnimation = async () => {
        while (await animateToNext()) {
        }
        if (!isPaused && !destroyed) {
          isPlaying = false;
          onComplete?.();
        }
      };
      continueAnimation();
    },
    stop: () => {
      isPaused = false;
      isPlaying = false;
      currentIndex = 0;
      currentValue = normalizedKeyframes[0]?.value ?? 0;
      if (spring2) {
        spring2.jump(currentValue);
      }
    },
    get: () => currentValue,
    getCurrentKeyframe: () => currentIndex,
    isPlaying: () => isPlaying,
    jumpTo: (index) => {
      if (index < 0 || index >= normalizedKeyframes.length) return;
      currentIndex = index;
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
      if (pendingRafId !== null) {
        cancelAnimationFrame(pendingRafId);
        pendingRafId = null;
      }
      if (pendingTimeoutId !== null) {
        clearTimeout(pendingTimeoutId);
        pendingTimeoutId = null;
      }
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
  const rotate = values.get("rotate") ?? values.get("rotateZ");
  const rotateX = values.get("rotateX");
  const rotateY = values.get("rotateY");
  if (rotateX !== void 0) parts.push(`rotateX(${rotateX}deg)`);
  if (rotateY !== void 0) parts.push(`rotateY(${rotateY}deg)`);
  if (rotate !== void 0) parts.push(`rotate(${rotate}deg)`);
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
    el.style.transform = buildTransform(transformValues);
  }
  Object.entries(styleValues).forEach(([prop, val]) => {
    el.style.setProperty(prop, val);
  });
}
function parseCurrentValue(element, property) {
  const el = element;
  const computed = getComputedStyle(el);
  if (property === "opacity") {
    return parseFloat(computed.opacity) || 1;
  }
  if (transformProperties.has(property)) {
    const transform = computed.transform;
    if (transform === "none") {
      if (property === "scale" || property === "scaleX" || property === "scaleY") {
        return 1;
      }
      return 0;
    }
    if (property === "scale" || property === "scaleX" || property === "scaleY") {
      return 1;
    }
    return 0;
  }
  const value = computed.getPropertyValue(property);
  return parseFloat(value) || 0;
}
function animate(elementOrSelector, target, options = {}) {
  const { delay = 0, onUpdate, onComplete, ...springConfig } = options;
  const element = typeof elementOrSelector === "string" ? document.querySelector(elementOrSelector) : elementOrSelector;
  if (!element) {
    console.warn("animate: Element not found");
    return createNoopControls();
  }
  const springs = /* @__PURE__ */ new Map();
  const currentValues = /* @__PURE__ */ new Map();
  let isRunning = true;
  let isPaused = false;
  let resolveFinished;
  const rafIds = /* @__PURE__ */ new Set();
  const timeoutIds = /* @__PURE__ */ new Set();
  let delayTimeoutId = null;
  const finished = new Promise((resolve, _reject) => {
    resolveFinished = resolve;
  });
  const startAnimation = () => {
    const entries = Object.entries(target);
    let completedCount = 0;
    const totalAnimations = entries.length;
    entries.forEach(([property, value]) => {
      const values = Array.isArray(value) ? value : [value];
      const startValue = parseCurrentValue(element, property);
      const spring2 = createSpringValue(startValue, {
        stiffness: springConfig.stiffness ?? 100,
        damping: springConfig.damping ?? 10,
        mass: springConfig.mass ?? 1
      });
      springs.set(property, spring2);
      currentValues.set(property, startValue);
      spring2.subscribe((v) => {
        if (!isRunning || isPaused) return;
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
          if (!isRunning) break;
          const numValue = typeof targetValue === "string" ? parseFloat(targetValue) || 0 : targetValue;
          await new Promise((resolve) => {
            spring2.set(numValue);
            let checkId = null;
            const checkDone = () => {
              if (checkId !== null) {
                rafIds.delete(checkId);
                timeoutIds.delete(checkId);
              }
              if (!isRunning || !spring2.isAnimating()) {
                resolve();
              } else if (!isPaused) {
                checkId = requestAnimationFrame(checkDone);
                rafIds.add(checkId);
              } else {
                const timeoutId = setTimeout(() => {
                  timeoutIds.delete(timeoutId);
                  checkDone();
                }, 100);
                checkId = timeoutId;
                timeoutIds.add(timeoutId);
              }
            };
            checkId = requestAnimationFrame(checkDone);
            rafIds.add(checkId);
          });
        }
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
  if (delay > 0) {
    delayTimeoutId = setTimeout(startAnimation, delay);
  } else {
    startAnimation();
  }
  const cleanup = () => {
    rafIds.forEach((id) => {
      cancelAnimationFrame(id);
    });
    rafIds.clear();
    timeoutIds.forEach((id) => {
      clearTimeout(id);
    });
    timeoutIds.clear();
    if (delayTimeoutId !== null) {
      clearTimeout(delayTimeoutId);
      delayTimeoutId = null;
    }
  };
  return {
    stop: () => {
      isRunning = false;
      cleanup();
      springs.forEach((spring2) => spring2.stop());
      resolveFinished();
    },
    pause: () => {
      isPaused = true;
    },
    resume: () => {
      isPaused = false;
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
    this.input = input;
    this.output = output;
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
    if (input.length === 1) {
      return output[0];
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

// src/interpolation/color.ts
var MAX_COLOR_CACHE_SIZE = 1e3;
var colorCache = /* @__PURE__ */ new Map();
var ColorInterpolationImpl = class {
  constructor(source, input, colorStrings, options = {}) {
    this.source = source;
    this.input = input;
    this.colors = colorStrings.map((c) => this.parseColorCached(c));
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
    if (this.input.length === 1) {
      const [r2, g2, b2] = this.colors[0];
      return `rgb(${r2}, ${g2}, ${b2})`;
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
    const r = this.lerp(this.colors[i - 1][0], this.colors[i][0], ratio);
    const g = this.lerp(this.colors[i - 1][1], this.colors[i][1], ratio);
    const b = this.lerp(this.colors[i - 1][2], this.colors[i][2], ratio);
    return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
  }
  parseColorInternal(color) {
    const hexMatch = color.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (hexMatch) {
      const hex = hexMatch[1];
      if (hex.length === 3) {
        return [
          parseInt(hex.charAt(0) + hex.charAt(0), 16),
          parseInt(hex.charAt(1) + hex.charAt(1), 16),
          parseInt(hex.charAt(2) + hex.charAt(2), 16)
        ];
      }
      return [
        parseInt(hex.slice(0, 2), 16),
        parseInt(hex.slice(2, 4), 16),
        parseInt(hex.slice(4, 6), 16)
      ];
    }
    const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/i);
    if (rgbMatch) {
      return [
        parseInt(rgbMatch[1], 10),
        parseInt(rgbMatch[2], 10),
        parseInt(rgbMatch[3], 10)
      ];
    }
    const rgbaMatch = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)/i);
    if (rgbaMatch) {
      return [
        parseInt(rgbaMatch[1], 10),
        parseInt(rgbaMatch[2], 10),
        parseInt(rgbaMatch[3], 10)
      ];
    }
    const hslMatch = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/i);
    if (hslMatch) {
      return this.hslToRgb(
        parseInt(hslMatch[1], 10),
        parseInt(hslMatch[2], 10),
        parseInt(hslMatch[3], 10)
      );
    }
    return [0, 0, 0];
  }
  hslToRgb(h, s, l) {
    h = (h % 360 + 360) % 360;
    s = Math.max(0, Math.min(100, s)) / 100;
    l = Math.max(0, Math.min(100, l)) / 100;
    if (s === 0) {
      const gray = Math.round(l * 255);
      return [gray, gray, gray];
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
    return [
      Math.round(hue2rgb(p, q, h / 360 + 1 / 3) * 255),
      Math.round(hue2rgb(p, q, h / 360) * 255),
      Math.round(hue2rgb(p, q, h / 360 - 1 / 3) * 255)
    ];
  }
  lerp(a, b, t) {
    return a + (b - a) * t;
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
  elasticBounce: 0.3,
  momentum: true,
  momentumDecay: 0.95,
  stiffness: 200,
  damping: 20,
  mass: 1,
  restSpeed: 0.01,
  restDelta: 0.01,
  clamp: false
};
var DragSpringImpl = class {
  constructor(element, config = {}) {
    this.enabled = true;
    this.position = { x: 0, y: 0 };
    this._isDragging = false;
    this.startPosition = { x: 0, y: 0 };
    this.pointerStart = { x: 0, y: 0 };
    this.lastPosition = { x: 0, y: 0 };
    this.lastTime = 0;
    this.velocity = { x: 0, y: 0 };
    this.currentSnap = null;
    this.snapTimeoutId = null;
    this.snapGeneration = 0;
    this.destroyed = false;
    this.onPointerDown = (e) => {
      if (!this.enabled || e.button !== 0) return;
      this._isDragging = true;
      this.startPosition = { ...this.position };
      this.pointerStart = { x: e.clientX, y: e.clientY };
      this.lastPosition = { x: e.clientX, y: e.clientY };
      this.lastTime = performance.now();
      this.velocity = { x: 0, y: 0 };
      this.element.setPointerCapture(e.pointerId);
      this.element.addEventListener("pointermove", this.onPointerMove);
      this.element.addEventListener("pointerup", this.onPointerUp);
      this.element.addEventListener("pointercancel", this.onPointerUp);
      if (this.config.onDragStart) {
        this.config.onDragStart(e);
      }
    };
    this.onPointerMove = (e) => {
      const now = performance.now();
      const dt = now - this.lastTime;
      const safeDt = Math.min(Math.max(dt, 16), 100);
      const instantVelocity = {
        x: (e.clientX - this.lastPosition.x) / safeDt,
        y: (e.clientY - this.lastPosition.y) / safeDt
      };
      const smoothingFactor = 0.5;
      this.velocity = {
        x: this.velocity.x * (1 - smoothingFactor) + instantVelocity.x * smoothingFactor,
        y: this.velocity.y * (1 - smoothingFactor) + instantVelocity.y * smoothingFactor
      };
      this.lastPosition = { x: e.clientX, y: e.clientY };
      this.lastTime = now;
      let newX = this.startPosition.x + (e.clientX - this.pointerStart.x);
      let newY = this.startPosition.y + (e.clientY - this.pointerStart.y);
      if (this.config.bounds) {
        newX = this.applyBounds(
          newX,
          this.config.bounds.left ?? -Infinity,
          this.config.bounds.right ?? Infinity,
          "x"
        );
        newY = this.applyBounds(
          newY,
          this.config.bounds.top ?? -Infinity,
          this.config.bounds.bottom ?? Infinity,
          "y"
        );
      }
      if (this.config.axis === "x") {
        newY = 0;
      } else if (this.config.axis === "y") {
        newX = 0;
      }
      this.position = { x: newX, y: newY };
      if (this.config.onDrag) {
        this.config.onDrag(newX, newY, e);
      }
      if (this.config.onUpdate) {
        this.config.onUpdate(newX, newY);
      }
    };
    this.onPointerUp = (e) => {
      this._isDragging = false;
      if (this.element && document.contains(this.element)) {
        try {
          this.element.releasePointerCapture(e.pointerId);
        } catch {
        }
        this.element.removeEventListener("pointermove", this.onPointerMove);
        this.element.removeEventListener("pointerup", this.onPointerUp);
        this.element.removeEventListener("pointercancel", this.onPointerUp);
      }
      if (this.config.snap?.snapOnRelease !== false) {
        const snapPoint = this.findNearestSnapPoint();
        if (snapPoint) {
          this.snapTo(snapPoint);
          if (this.config.onDragEnd) {
            this.config.onDragEnd(this.position.x, this.position.y, this.velocity);
          }
          return;
        }
      }
      this.release(this.velocity.x * 16, this.velocity.y * 16);
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
    return clamp(dragElastic[edge] ?? 0.5, 0, 1);
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
  findNearestSnapPoint() {
    const snap = this.config.snap;
    if (!snap) return null;
    if (snap.grid) {
      const gridX = Math.round(this.position.x / snap.grid.x) * snap.grid.x;
      const gridY = Math.round(this.position.y / snap.grid.y) * snap.grid.y;
      return { x: gridX, y: gridY };
    }
    if (snap.points && snap.points.length > 0) {
      const velocityMagnitude = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2);
      const threshold = snap.velocityThreshold ?? 0.5;
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
    if (constraints?.constrainToParent && this.element.parentElement) {
      const parent = this.element.parentElement;
      const parentRect = parent.getBoundingClientRect();
      const elementRect = this.element.getBoundingClientRect();
      const padding = this.normalizePadding(constraints.constraintPadding);
      bounds.left = Math.max(bounds.left, padding.left);
      bounds.right = Math.min(bounds.right, parentRect.width - elementRect.width - padding.right);
      bounds.top = Math.max(bounds.top, padding.top);
      bounds.bottom = Math.min(bounds.bottom, parentRect.height - elementRect.height - padding.bottom);
    }
    if (constraints?.constrainToElement) {
      const constraintRect = constraints.constrainToElement.getBoundingClientRect();
      const elementRect = this.element.getBoundingClientRect();
      const parentRect = this.element.parentElement?.getBoundingClientRect() ?? { left: 0, top: 0 };
      const padding = this.normalizePadding(constraints.constraintPadding);
      const offsetX = constraintRect.left - parentRect.left;
      const offsetY = constraintRect.top - parentRect.top;
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
      this._isDragging = false;
    }
  }
  isEnabled() {
    return this.enabled;
  }
  isDragging() {
    return this._isDragging;
  }
  reset() {
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
    return { ...this.velocity };
  }
  setPosition(x, y) {
    if (this.destroyed) return;
    const safeX = Number.isFinite(x) ? x : this.position.x;
    const safeY = Number.isFinite(y) ? y : this.position.y;
    this.position = { x: safeX, y: safeY };
    this.springX.jump(safeX);
    this.springY.jump(safeY);
  }
  jumpTo(x, y) {
    if (this.destroyed) return;
    const safeX = Number.isFinite(x) ? x : this.position.x;
    const safeY = Number.isFinite(y) ? y : this.position.y;
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
    this.springX.set(safeX);
    this.springY.set(safeY);
  }
  release(velocityX, velocityY) {
    const bounds = this.getEffectiveBounds();
    const { left, right, top, bottom } = bounds;
    let targetX = this.position.x;
    let targetY = this.position.y;
    if (this.config.momentum) {
      const rawDecay = this.config.momentumDecay ?? 0.95;
      const decay2 = Math.max(0, Math.min(0.99, rawDecay));
      const decayFactor = decay2 < 1 ? 1 / (1 - decay2) : 100;
      const momentumX = velocityX * decayFactor * 0.1;
      const momentumY = velocityY * decayFactor * 0.1;
      targetX += momentumX;
      targetY += momentumY;
    }
    if (this.config.modifyTarget) {
      const modified = this.config.modifyTarget({ x: targetX, y: targetY });
      targetX = modified.x;
      targetY = modified.y;
    }
    targetX = clamp(targetX, left, right);
    targetY = clamp(targetY, top, bottom);
    if (this.config.onBoundsHit) {
      if (this.position.x < left) this.config.onBoundsHit("left");
      if (this.position.x > right) this.config.onBoundsHit("right");
      if (this.position.y < top) this.config.onBoundsHit("top");
      if (this.position.y > bottom) this.config.onBoundsHit("bottom");
    }
    if (targetX !== this.position.x || this.position.x < left || this.position.x > right) {
      this.springX.set(targetX, { velocity: velocityX });
    }
    if (targetY !== this.position.y || this.position.y < top || this.position.y > bottom) {
      this.springY.set(targetY, { velocity: velocityY });
    }
  }
  snapToNearest() {
    const snapPoint = this.findNearestSnapPoint();
    if (snapPoint) {
      this.snapTo(snapPoint);
    }
  }
  snapTo(point) {
    this.currentSnap = point;
    if (this.config.onSnapStart) {
      this.config.onSnapStart(point);
    }
    this.springX.set(point.x);
    this.springY.set(point.y);
    if (this.snapTimeoutId !== null) {
      clearTimeout(this.snapTimeoutId);
    }
    const generation = ++this.snapGeneration;
    this.snapTimeoutId = setTimeout(() => {
      this.snapTimeoutId = null;
      if (!this.destroyed && generation === this.snapGeneration && this.currentSnap === point && this.config.onSnapComplete) {
        this.config.onSnapComplete(point);
      }
    }, 500);
  }
  setConstraints(constraints) {
    this.config.constraints = constraints;
  }
  setSnap(snap) {
    this.config.snap = snap;
  }
  destroy() {
    this.destroyed = true;
    if (this.snapTimeoutId !== null) {
      clearTimeout(this.snapTimeoutId);
      this.snapTimeoutId = null;
    }
    this.element.removeEventListener("pointerdown", this.onPointerDown);
    this.element.removeEventListener("pointermove", this.onPointerMove);
    this.element.removeEventListener("pointerup", this.onPointerUp);
    this.element.removeEventListener("pointercancel", this.onPointerUp);
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
var ScrollSpringImpl = class {
  constructor(container, config = {}) {
    this.scroll = { x: 0, y: 0 };
    this.target = { x: 0, y: 0 };
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
      let deltaX = e.deltaX;
      let deltaY = e.deltaY;
      if (this.config.direction === "horizontal") {
        deltaY = 0;
      } else if (this.config.direction === "vertical") {
        deltaX = 0;
      }
      if (this.config.bounce) {
        const maxScrollX = this.container.scrollWidth - this.container.clientWidth;
        const maxScrollY = this.container.scrollHeight - this.container.clientHeight;
        this.target.x += deltaX;
        this.target.y += deltaY;
        if (this.target.x < 0) {
          this.target.x = -Math.sqrt(Math.abs(this.target.x)) * 10;
        } else if (this.target.x > maxScrollX) {
          this.target.x = maxScrollX + Math.sqrt(Math.abs(this.target.x - maxScrollX)) * 10;
        }
        if (this.target.y < 0) {
          this.target.y = -Math.sqrt(Math.abs(this.target.y)) * 10;
        } else if (this.target.y > maxScrollY) {
          this.target.y = maxScrollY + Math.sqrt(Math.abs(this.target.y - maxScrollY)) * 10;
        }
        e.preventDefault();
      } else {
        this.target.x += deltaX;
        this.target.y += deltaY;
        const maxScrollX = this.container.scrollWidth - this.container.clientWidth;
        const maxScrollY = this.container.scrollHeight - this.container.clientHeight;
        this.target.x = Math.max(0, Math.min(this.target.x, maxScrollX));
        this.target.y = Math.max(0, Math.min(this.target.y, maxScrollY));
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
    const checkEnd = () => {
      this.pendingRafId = null;
      if (this.destroyed) return;
      const settled = Math.abs(this.scroll.x - this.target.x) < 0.1 && Math.abs(this.scroll.y - this.target.y) < 0.1 && !this.springX.isAnimating() && !this.springY.isAnimating();
      if (settled && this.isScrolling) {
        this.isScrolling = false;
        this.config.onScrollEnd?.();
      } else if (this.isScrolling) {
        this.pendingRafId = requestAnimationFrame(checkEnd);
      }
    };
    checkEnd();
  }
  getScroll() {
    return { ...this.scroll };
  }
  scrollTo(x, y) {
    this.target = { x, y };
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
function rubberBand(value, min, max, factor) {
  if (value < min) {
    return min - Math.pow(min - value, factor);
  }
  if (value > max) {
    return max + Math.pow(value - max, factor);
  }
  return value;
}
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
      let newScale = initialScale * (currentDistance / initialDistance);
      if (enableRubberBand) {
        newScale = rubberBand(newScale, minScale, maxScale, rubberBandFactor);
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
      movement: currentAngle - initialAngle,
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
      startTime = performance.now();
      lastTime = startTime;
      lastAngle = currentAngle;
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
      let angleDelta = newAngle - initialAngle;
      if (angleDelta > 180) angleDelta -= 360;
      if (angleDelta < -180) angleDelta += 360;
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
    velocityThreshold = 0.5,
    distanceThreshold = 50,
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
  const createState = (event, first = false, last = false, direction = null) => {
    const now = performance.now();
    const duration = now - startTime;
    const dt = now - lastTime;
    const movement = {
      x: event.clientX - startPoint.x,
      y: event.clientY - startPoint.y
    };
    const velocity = {
      x: dt > 0 ? (event.clientX - lastPoint.x) / dt : 0,
      y: dt > 0 ? (event.clientY - lastPoint.y) / dt : 0
    };
    return {
      active,
      first,
      last,
      event,
      elapsedTime: duration,
      cancelled: false,
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
    const meetsVelocityX = velX >= velocityThreshold;
    const meetsVelocityY = velY >= velocityThreshold;
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
    active = true;
    element.setPointerCapture(e.pointerId);
    onSwipeStart?.(createState(e, true, false));
  };
  const handlePointerMove = (e) => {
    if (!enabled || !active || e.pointerId !== pointerId) return;
    const now = performance.now();
    lastPoint = { x: e.clientX, y: e.clientY };
    lastTime = now;
  };
  const handlePointerUp = (e) => {
    if (!active || e.pointerId !== pointerId) return;
    active = false;
    pointerId = null;
    const duration = performance.now() - startTime;
    if (duration <= maxDuration) {
      const movement = {
        x: e.clientX - startPoint.x,
        y: e.clientY - startPoint.y
      };
      const dt = performance.now() - lastTime;
      const velocity = {
        x: dt > 0 ? (e.clientX - lastPoint.x) / dt : 0,
        y: dt > 0 ? (e.clientY - lastPoint.y) / dt : 0
      };
      const direction = detectDirection(movement, velocity);
      const state = createState(e, false, true, direction);
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
    },
    isEnabled: () => enabled,
    destroy: () => {
      element.removeEventListener("pointerdown", handlePointerDown);
      element.removeEventListener("pointermove", handlePointerMove);
      element.removeEventListener("pointerup", handlePointerUp);
      element.removeEventListener("pointercancel", handlePointerUp);
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
  const createState = (event, first = false, last = false) => ({
    active,
    first,
    last,
    event,
    elapsedTime: performance.now() - startTime,
    cancelled: false,
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
    element.setPointerCapture(e.pointerId);
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
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
    onPressEnd?.(createState(e, false, true));
    try {
      element.releasePointerCapture(e.pointerId);
    } catch {
    }
  };
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
      element.removeEventListener("pointerdown", handlePointerDown);
      element.removeEventListener("pointermove", handlePointerMove);
      element.removeEventListener("pointerup", handlePointerUp);
      element.removeEventListener("pointercancel", handlePointerUp);
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

// src/utils/color.ts
function parseColor(color) {
  const hexMatch = color.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hexMatch) {
    return hexToRgb(color);
  }
  const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/i);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1], 10),
      g: parseInt(rgbMatch[2], 10),
      b: parseInt(rgbMatch[3], 10)
    };
  }
  const rgbaMatch = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)/i);
  if (rgbaMatch) {
    return {
      r: parseInt(rgbaMatch[1], 10),
      g: parseInt(rgbaMatch[2], 10),
      b: parseInt(rgbaMatch[3], 10)
    };
  }
  const hslMatch = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/i);
  if (hslMatch) {
    return hslToRgb(
      parseInt(hslMatch[1], 10),
      parseInt(hslMatch[2], 10),
      parseInt(hslMatch[3], 10)
    );
  }
  return { r: 0, g: 0, b: 0 };
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
  if (cleanHex.length === 3) {
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

// src/scroll/scroll-linked.ts
function lerpColor(colorA, colorB, t) {
  const a = parseColor(colorA);
  const b = parseColor(colorB);
  return rgbToHex(
    Math.round(lerp(a.r, b.r, t)),
    Math.round(lerp(a.g, b.g, t)),
    Math.round(lerp(a.b, b.b, t))
  );
}
function createScrollProgress(element, options = {}) {
  const { offset = ["start", "end"], smooth = 0 } = options;
  let progress = 0;
  let smoothedProgress = 0;
  let lastScrollY = 0;
  let lastTime = performance.now();
  let velocity = 0;
  let direction = 0;
  let rafId = null;
  let destroyed = false;
  const subscribers = /* @__PURE__ */ new Set();
  const calculateProgress = () => {
    const scrollY = window.scrollY;
    const windowHeight = window.innerHeight;
    const now = performance.now();
    const dt = Math.max(now - lastTime, 1);
    velocity = (scrollY - lastScrollY) / dt * 1e3;
    direction = scrollY > lastScrollY ? 1 : scrollY < lastScrollY ? -1 : 0;
    lastScrollY = scrollY;
    lastTime = now;
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
      visibleRatio = isInView ? clamp((Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0)) / rect.height, 0, 1) : 0;
    } else {
      const documentHeight = document.documentElement.scrollHeight - windowHeight;
      newProgress = documentHeight > 0 ? clamp(scrollY / documentHeight, 0, 1) : 0;
    }
    if (smooth > 0) {
      smoothedProgress = lerp(smoothedProgress, newProgress, 1 - smooth);
      progress = smoothedProgress;
    } else {
      progress = newProgress;
    }
    return {
      progress,
      scrollY,
      velocity,
      direction,
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
  const onScroll = () => {
    if (rafId || destroyed) return;
    rafId = requestAnimationFrame(() => {
      rafId = null;
      if (destroyed) return;
      const info = calculateProgress();
      notify(info);
    });
  };
  const initialInfo = calculateProgress();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  return {
    get: () => progress,
    getInfo: () => calculateProgress(),
    subscribe: (callback) => {
      subscribers.add(callback);
      callback(initialInfo);
      return () => subscribers.delete(callback);
    },
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
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
      element.style.transform = "";
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
  let hasEntered = false;
  let smoothedProgress = 0;
  let rafId = null;
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
    const triggerStart = windowHeight;
    const triggerEnd = 0;
    const triggerRange = triggerStart - triggerEnd;
    const startProgress = triggerRange !== 0 ? (triggerStart - startPos) / triggerRange : 0;
    const endProgress = triggerRange !== 0 ? (triggerStart - endPos) / triggerRange : 1;
    const progressRange = endProgress - startProgress;
    const rawProgress = progressRange !== 0 ? clamp((startProgress - 0) / progressRange, 0, 1) : startProgress >= 0 ? 1 : 0;
    if (typeof scrub === "number" && scrub > 0) {
      smoothedProgress = lerp(smoothedProgress, rawProgress, 1 - scrub);
      progress = smoothedProgress;
    } else {
      progress = rawProgress;
    }
    const isInView = rect.top < windowHeight && rect.bottom > 0;
    return {
      progress,
      scrollY: window.scrollY,
      velocity: 0,
      direction: 0,
      isInView,
      visibleRatio: isInView ? clamp((Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0)) / rect.height, 0, 1) : 0
    };
  };
  const onScroll = () => {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      rafId = null;
      const info = calculateProgress();
      const wasActive = isActive;
      isActive = info.progress > 0 && info.progress < 1;
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
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    }
  };
}
function createScrollLinkedValue(scrollProgress, config) {
  const { inputRange, outputRange, clamp: shouldClamp = true, easing } = config;
  if (inputRange.length !== outputRange.length) {
    throw new Error("inputRange and outputRange must have the same length");
  }
  const firstOutput = outputRange[0];
  const isColorOutput = typeof firstOutput === "string" && (firstOutput.startsWith("#") || firstOutput.startsWith("rgb") || firstOutput.startsWith("hsl"));
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
        segmentIndex = i + 1;
      }
    }
    const segmentStart = inputRange[segmentIndex] ?? 0;
    const segmentEnd = inputRange[segmentIndex + 1] ?? segmentStart;
    const segmentProgress = segmentEnd !== segmentStart ? (p - segmentStart) / (segmentEnd - segmentStart) : 0;
    const startValue = outputRange[segmentIndex] ?? 0;
    const endValue = outputRange[segmentIndex + 1] ?? startValue;
    if (isColorOutput && typeof startValue === "string" && typeof endValue === "string") {
      return lerpColor(startValue, endValue, segmentProgress);
    }
    return lerp(startValue, endValue, segmentProgress);
  };
  const unsubscribe = scrollProgress.subscribe((info) => {
    currentValue = interpolate2(info.progress);
    subscribers.forEach((cb) => cb(currentValue));
  });
  return {
    get: () => currentValue,
    subscribe: (callback) => {
      subscribers.add(callback);
      callback(currentValue);
      return () => subscribers.delete(callback);
    },
    destroy: () => {
      unsubscribe();
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
  let repeatDelayTimeoutId = null;
  let lastFrameTime = 0;
  let hasStarted = false;
  let insertTime = 0;
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
    if (target instanceof HTMLElement) {
      return target;
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
    const transforms = [];
    const cssProps = {};
    for (const [key, value] of Object.entries(props)) {
      switch (key) {
        case "x":
          transforms.push(`translateX(${value}px)`);
          break;
        case "y":
          transforms.push(`translateY(${value}px)`);
          break;
        case "z":
          transforms.push(`translateZ(${value}px)`);
          break;
        case "scale":
          transforms.push(`scale(${value})`);
          break;
        case "scaleX":
          transforms.push(`scaleX(${value})`);
          break;
        case "scaleY":
          transforms.push(`scaleY(${value})`);
          break;
        case "rotate":
        case "rotation":
          transforms.push(`rotate(${value}deg)`);
          break;
        case "rotateX":
          transforms.push(`rotateX(${value}deg)`);
          break;
        case "rotateY":
          transforms.push(`rotateY(${value}deg)`);
          break;
        case "rotateZ":
          transforms.push(`rotateZ(${value}deg)`);
          break;
        case "skewX":
          transforms.push(`skewX(${value}deg)`);
          break;
        case "skewY":
          transforms.push(`skewY(${value}deg)`);
          break;
        case "opacity":
          cssProps.opacity = String(value);
          break;
        default:
          cssProps[key] = typeof value === "number" ? `${value}px` : String(value);
      }
    }
    if (transforms.length > 0) {
      element.style.transform = transforms.join(" ");
    }
    for (const [prop, val] of Object.entries(cssProps)) {
      element.style[prop] = val;
    }
  };
  const getCurrentElementValues = (element, props) => {
    const current = {};
    const computed = getComputedStyle(element);
    for (const key of Object.keys(props)) {
      switch (key) {
        case "opacity":
          current[key] = parseFloat(computed.opacity) || 1;
          break;
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
          current[key] = key.startsWith("scale") ? 1 : 0;
          break;
        default:
          current[key] = parseFloat(computed.getPropertyValue(key)) || 0;
      }
    }
    return current;
  };
  const MAX_DELTA_TIME2 = 64;
  const tick = (timestamp) => {
    if (!isPlaying || isPaused) return;
    const rawDelta = lastFrameTime ? timestamp - lastFrameTime : 0;
    const deltaTime = Math.min(rawDelta, MAX_DELTA_TIME2) / 1e3;
    lastFrameTime = timestamp;
    currentTime += isReversed ? -deltaTime : deltaTime;
    currentTime = clamp(currentTime, 0, totalDuration);
    const callbacksAtTime = callbacks.get(Math.floor(currentTime * 1e3));
    if (callbacksAtTime) {
      callbacksAtTime.forEach((cb) => {
        try {
          cb();
        } catch (e) {
          console.error("[SpringKit] Timeline callback error:", e);
        }
      });
    }
    const pauseCallback = pauses.get(Math.floor(currentTime * 1e3));
    if (pauseCallback !== void 0) {
      isPaused = true;
      try {
        pauseCallback?.();
      } catch (e) {
        console.error("[SpringKit] Timeline pause callback error:", e);
      }
      return;
    }
    for (const segment of segments) {
      const segmentDuration = segment.endTime - segment.startTime;
      const segmentProgress = segmentDuration > 0 ? clamp((currentTime - segment.startTime) / segmentDuration, 0, 1) : currentTime >= segment.endTime ? 1 : 0;
      const shouldBeActive = currentTime >= segment.startTime && currentTime <= segment.endTime;
      if (shouldBeActive && !segment.isActive) {
        segment.isActive = true;
        segment.props.onStart?.();
      }
      if (segment.isActive && segment.spring) {
        segment.props.onUpdate?.(segmentProgress);
      }
      if (shouldBeActive && segmentProgress >= 1 && !segment.isComplete) {
        segment.isComplete = true;
        segment.props.onComplete?.();
      }
    }
    onUpdate?.(totalDuration > 0 ? currentTime / totalDuration : 1);
    if (isReversed && currentTime <= 0 || !isReversed && currentTime >= totalDuration) {
      if (repeat === -1 || repeatCount < repeat) {
        repeatCount++;
        onRepeat?.(repeatCount);
        if (yoyo) {
          isReversed = !isReversed;
        } else {
          currentTime = 0;
          segments.forEach((s) => {
            s.isActive = false;
            s.isComplete = false;
          });
        }
        if (repeatDelay > 0) {
          repeatDelayTimeoutId = setTimeout(() => {
            repeatDelayTimeoutId = null;
            rafId = requestAnimationFrame(tick);
          }, repeatDelay * 1e3);
          return;
        }
      } else {
        isPlaying = false;
        onComplete?.();
        return;
      }
    }
    rafId = requestAnimationFrame(tick);
  };
  const timeline = {
    to(target, props, position) {
      const startTime = parsePosition(position) + (props.delay || 0);
      const duration = props.duration || 0.5;
      const endTime = startTime + duration;
      const element = resolveTarget(target);
      const numericProps = extractNumericProps(props);
      const segment = {
        id: `segment_${timelineInstanceId}_${segmentIdCounter++}`,
        target,
        props,
        startTime,
        endTime,
        spring: null,
        isActive: false,
        isComplete: false
      };
      if (element && Object.keys(numericProps).length > 0) {
        const currentValues = getCurrentElementValues(element, numericProps);
        const springConfig = { ...defaults, ...props.spring };
        segment.spring = createSpringGroup(currentValues, springConfig);
        segment.spring.subscribe((values) => {
          applyPropsToElement(element, values);
        });
        const originalOnStart = segment.props.onStart;
        segment.props.onStart = () => {
          segment.spring?.set(numericProps);
          originalOnStart?.();
        };
      }
      segments.push(segment);
      insertTime = endTime;
      totalDuration = Math.max(totalDuration, endTime);
      return timeline;
    },
    from(target, props, position) {
      const startTime = parsePosition(position) + (props.delay || 0);
      const duration = props.duration || 0.5;
      const endTime = startTime + duration;
      const element = resolveTarget(target);
      const numericProps = extractNumericProps(props);
      const segment = {
        id: `segment_${timelineInstanceId}_${segmentIdCounter++}`,
        target,
        props,
        startTime,
        endTime,
        spring: null,
        isActive: false,
        isComplete: false
      };
      if (element && Object.keys(numericProps).length > 0) {
        const targetValues = getCurrentElementValues(element, numericProps);
        const springConfig = { ...defaults, ...props.spring };
        segment.spring = createSpringGroup(numericProps, springConfig);
        applyPropsToElement(element, numericProps);
        segment.spring.subscribe((values) => {
          applyPropsToElement(element, values);
        });
        const originalOnStart = segment.props.onStart;
        segment.props.onStart = () => {
          segment.spring?.set(targetValues);
          originalOnStart?.();
        };
      }
      segments.push(segment);
      insertTime = endTime;
      totalDuration = Math.max(totalDuration, endTime);
      return timeline;
    },
    fromTo(target, fromProps, toProps, position) {
      const startTime = parsePosition(position) + (toProps.delay || 0);
      const duration = toProps.duration || 0.5;
      const endTime = startTime + duration;
      const element = resolveTarget(target);
      const fromNumeric = extractNumericProps(fromProps);
      const toNumeric = extractNumericProps(toProps);
      const segment = {
        id: `segment_${timelineInstanceId}_${segmentIdCounter++}`,
        target,
        props: toProps,
        startTime,
        endTime,
        spring: null,
        isActive: false,
        isComplete: false
      };
      if (element && Object.keys(toNumeric).length > 0) {
        const springConfig = { ...defaults, ...toProps.spring };
        segment.spring = createSpringGroup(fromNumeric, springConfig);
        applyPropsToElement(element, fromNumeric);
        segment.spring.subscribe((values) => {
          applyPropsToElement(element, values);
        });
        const originalOnStart = segment.props.onStart;
        segment.props.onStart = () => {
          segment.spring?.set(toNumeric);
          originalOnStart?.();
        };
      }
      segments.push(segment);
      insertTime = endTime;
      totalDuration = Math.max(totalDuration, endTime);
      return timeline;
    },
    addLabel(label, position) {
      const time = parsePosition(position);
      labels.set(label, time);
      return timeline;
    },
    call(callback, position) {
      const time = Math.floor(parsePosition(position) * 1e3);
      if (!callbacks.has(time)) {
        callbacks.set(time, []);
      }
      callbacks.get(time).push(callback);
      return timeline;
    },
    set(target, props, position) {
      const element = resolveTarget(target);
      if (element) {
        const time = parsePosition(position);
        this.call(() => {
          applyPropsToElement(element, extractNumericProps(props));
        }, time);
      }
      return timeline;
    },
    addPause(position, callback) {
      const time = Math.floor(parsePosition(position) * 1e3);
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
      lastFrameTime = 0;
      rafId = requestAnimationFrame(tick);
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
        lastFrameTime = 0;
        rafId = requestAnimationFrame(tick);
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
      return timeline;
    },
    kill() {
      isPlaying = false;
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      if (repeatDelayTimeoutId) {
        clearTimeout(repeatDelayTimeoutId);
        repeatDelayTimeoutId = null;
      }
      segments.forEach((s) => s.spring?.destroy());
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
function parsePath(d) {
  const commands = [];
  const regex = /([MLCQAZHVST])([^MLCQAZHVST]*)/gi;
  const matches = d.matchAll(regex);
  for (const matchItem of matches) {
    const typeChar = matchItem[1];
    const valuesStr = matchItem[2];
    if (!typeChar || valuesStr === void 0) continue;
    const type = typeChar.toUpperCase();
    const values = valuesStr.trim().split(/[\s,]+/).filter((v) => v !== "").map(parseFloat).filter((v) => !isNaN(v));
    commands.push({ type, values });
  }
  return commands;
}
function toAbsolute(commands) {
  return commands.map((cmd) => {
    const { type, values } = cmd;
    const absValues = [...values];
    switch (type) {
      case "M":
        values[0] ?? 0;
        values[1] ?? 0;
        break;
      case "L":
        values[0] ?? 0;
        values[1] ?? 0;
        break;
      case "H":
        absValues[0] = values[0] ?? 0;
        values[0] ?? 0;
        break;
      case "V":
        absValues[0] = values[0] ?? 0;
        values[0] ?? 0;
        break;
      case "C":
        values[4] ?? 0;
        values[5] ?? 0;
        break;
      case "Q":
        values[2] ?? 0;
        values[3] ?? 0;
        break;
      case "A":
        values[5] ?? 0;
        values[6] ?? 0;
        break;
      case "S":
        values[2] ?? 0;
        values[3] ?? 0;
        break;
      case "T":
        values[0] ?? 0;
        values[1] ?? 0;
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
    const step = totalLength / (samples - 1);
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
  const initialCommands = parsePath(initialPath);
  fromPoints = samplePath(toAbsolute(initialCommands), samples);
  currentPoints = [...fromPoints];
  toPoints = [...fromPoints];
  const progressSpring = createSpringValue(0, springConfig);
  progressSpring.subscribe(() => {
    const progress = progressSpring.get();
    onProgress?.(progress);
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
    if (progress >= 0.999) {
      onComplete?.();
    }
  });
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
      progressSpring.jump(0);
      progressSpring.set(1);
    },
    setProgress(progress) {
      const p = clamp(progress, 0, 1);
      progressSpring.jump(p);
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
  return {
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
    morphToNext() {
      this.morphToIndex((currentIndex + 1) % paths.length);
    },
    morphToPrevious() {
      this.morphToIndex((currentIndex - 1 + paths.length) % paths.length);
    },
    subscribe: (callback) => morph.subscribe(callback),
    destroy: () => morph.destroy()
  };
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
    opacity: parseFloat(styles.opacity) || 1,
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
    const compensatedRadius = current.borderRadius / Math.max(scaleX, scaleY);
    element.style.borderRadius = `${compensatedRadius}px`;
  }
}
function resetTransform(element) {
  element.style.transform = "";
  element.style.transformOrigin = "";
  element.style.opacity = "";
  element.style.borderRadius = "";
}
function createLayoutGroup(config = {}) {
  const {
    spring: defaultSpring = { stiffness: 300, damping: 30 },
    onAnimationStart,
    onAnimationComplete,
    crossfade = false,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    transition: _transition = {}
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
        pendingRafId: null
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
      if (entry.pendingRafId !== null) {
        cancelAnimationFrame(entry.pendingRafId);
        entry.pendingRafId = null;
      }
      entry.spring?.destroy();
      group.splice(index, 1);
      if (group.length === 0) {
        elements.delete(id);
      }
    }
  };
  const animateElement = (entry, from, to) => {
    entry.spring?.destroy();
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
    entry.spring.set(targetValues);
    const checkComplete = () => {
      entry.pendingRafId = null;
      if (entry.spring && !entry.spring.isAnimating()) {
        entry.isAnimating = false;
        resetTransform(entry.element);
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
        const previousMeasurement = previousMeasurements.get(id);
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
        if (entry.pendingRafId !== null) {
          cancelAnimationFrame(entry.pendingRafId);
          entry.pendingRafId = null;
        }
        entry.spring?.destroy();
        resetTransform(entry.element);
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
    createGroup(id) {
      const groupId = id ?? `layout-group-${groupIdCounter++}`;
      const group = createLayoutGroup();
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
            const id = node.getAttribute(attribute);
            if (id) {
              group.unregister(id, node);
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
  const { count, delay = 0.1, easing = (t) => t } = config;
  const delays = [];
  for (let i = 0; i < count; i++) {
    const t = count > 1 ? i / (count - 1) : 0;
    delays.push(easing(t) * delay * (count - 1));
  }
  return delays;
}
function reverseStagger(config) {
  return linearStagger(config).reverse();
}
function centerStagger(config) {
  const { count, delay = 0.1, easing = (t) => t } = config;
  const delays = [];
  const center = (count - 1) / 2;
  for (let i = 0; i < count; i++) {
    const distanceFromCenter = Math.abs(i - center);
    const maxDistance = center;
    const t = maxDistance > 0 ? distanceFromCenter / maxDistance : 0;
    delays.push(easing(t) * delay * maxDistance);
  }
  return delays;
}
function edgeStagger(config) {
  const { count, delay = 0.1, easing = (t) => t } = config;
  const delays = [];
  const center = (count - 1) / 2;
  const maxDelay = delay * center;
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
    delay = 0.1,
    easing = (t) => t
  } = config;
  const rows = Math.ceil(count / columns);
  const delays = [];
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
      case "diagonal":
        t = (col + row) / (columns + rows - 2);
        break;
      case "radial":
      default: {
        const maxDistance = gridDistance(
          origin === "center" ? 0 : count - 1,
          columns,
          rows,
          origin === "center" ? "top-left" : origin
        );
        const distance = gridDistance(i, columns, rows, origin);
        t = maxDistance > 0 ? distance / maxDistance : 0;
        break;
      }
    }
    delays.push(easing(clamp(t, 0, 1)) * delay * Math.max(columns, rows));
  }
  return delays;
}
function waveStagger(config) {
  const {
    count,
    direction = "horizontal",
    frequency = 1,
    amplitude = 0.5,
    delay = 0.1,
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
    delays.push(easing(clamp(d, 0, 1.5)) * delay * (count - 1));
  }
  return delays;
}
function spiralStagger(config) {
  const {
    count,
    columns,
    direction = "clockwise",
    startFrom = "edge",
    delay = 0.1,
    easing = (t) => t
  } = config;
  const rows = Math.ceil(count / columns);
  const spiral = [];
  const visited = /* @__PURE__ */ new Set();
  let top = 0;
  let bottom = rows - 1;
  let left = 0;
  let right = columns - 1;
  while (top <= bottom && left <= right) {
    for (let col = left; col <= right; col++) {
      const idx = top * columns + col;
      if (idx < count && !visited.has(`${top},${col}`)) {
        spiral.push(idx);
        visited.add(`${top},${col}`);
      }
    }
    top++;
    for (let row = top; row <= bottom; row++) {
      const idx = row * columns + right;
      if (idx < count && !visited.has(`${row},${right}`)) {
        spiral.push(idx);
        visited.add(`${row},${right}`);
      }
    }
    right--;
    if (top <= bottom) {
      for (let col = right; col >= left; col--) {
        const idx = bottom * columns + col;
        if (idx < count && !visited.has(`${bottom},${col}`)) {
          spiral.push(idx);
          visited.add(`${bottom},${col}`);
        }
      }
      bottom--;
    }
    if (left <= right) {
      for (let row = bottom; row >= top; row--) {
        const idx = row * columns + left;
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
  if (direction === "counter-clockwise") {
    spiral.reverse();
  }
  const delays = new Array(count).fill(0);
  const maxDelay = delay * (spiral.length - 1);
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
    delay = 0.1,
    minMultiplier = 0,
    maxMultiplier = 1,
    easing = (t) => t
  } = config;
  const random = seededRandom(seed);
  const delays = [];
  const maxDelay = delay * (count - 1);
  for (let i = 0; i < count; i++) {
    const r = random();
    const multiplier = minMultiplier + r * (maxMultiplier - minMultiplier);
    delays.push(easing(multiplier) * maxDelay);
  }
  return delays;
}
function customStagger(config, fn) {
  const { count, delay = 0.1 } = config;
  const delays = [];
  const maxDelay = delay * (count - 1);
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
  cascade: (count) => linearStagger({ count, delay: 0.05 }),
  /** Slow reveal from first to last */
  reveal: (count) => linearStagger({ count, delay: 0.15 }),
  /** Pop from center outward */
  pop: (count) => centerStagger({ count, delay: 0.08 }),
  /** Ripple from edges to center */
  ripple: (count) => edgeStagger({ count, delay: 0.08 }),
  /** Random scatter effect */
  scatter: (count) => randomStagger({ count, delay: 0.1, seed: 42 }),
  /** Grid diagonal wave */
  gridWave: (count, columns) => gridStagger({ count, columns, direction: "diagonal", delay: 0.05 }),
  /** Grid radial from center */
  gridRadial: (count, columns) => gridStagger({ count, columns, origin: "center", direction: "radial", delay: 0.05 }),
  /** Spiral inward */
  spiralIn: (count, columns) => spiralStagger({ count, columns, startFrom: "edge", delay: 0.05 }),
  /** Spiral outward */
  spiralOut: (count, columns) => spiralStagger({ count, columns, startFrom: "center", delay: 0.05 })
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
      const targetValue = newValue;
      const checkEnd = () => {
        if (this._destroyed) {
          this._checkEndRafId = null;
          return;
        }
        const velocity = Math.abs(this._springValue?.getVelocity() ?? 0);
        const currentValue = this._springValue?.get() ?? 0;
        const isAtRest = velocity < 0.01;
        const isNearTarget = Math.abs(currentValue - targetValue) < 0.01;
        if (isAtRest || isNearTarget) {
          this._isAnimating = false;
          this._checkEndRafId = null;
          this._emit("animationEnd");
        } else if (this._isAnimating) {
          this._checkEndRafId = requestAnimationFrame(checkEnd);
        } else {
          this._checkEndRafId = null;
        }
      };
      this._checkEndRafId = requestAnimationFrame(checkEnd);
    } else {
      this._value = newValue;
      this._velocity = 0;
      this._notify();
    }
  }
  /**
   * Instantly set value without animation
   */
  jump(newValue) {
    if (this._destroyed) return;
    this._value = newValue;
    this._velocity = 0;
    if (typeof newValue === "number" && this._springValue) {
      this._springValue.jump(newValue);
    }
    this._isAnimating = false;
    this._notify();
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
    this._isAnimating = false;
    this._emit("animationEnd");
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
   * Update spring configuration
   * Takes effect immediately on ongoing animations
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
    this._destroyed = true;
    if (this._checkEndRafId !== null) {
      cancelAnimationFrame(this._checkEndRafId);
      this._checkEndRafId = null;
    }
    this._subscribers.clear();
    this._eventListeners.clear();
    if (this._springValue) {
      this._springValue.destroy();
      this._springValue = null;
    }
  }
  _notify() {
    this._subscribers.forEach((callback) => {
      try {
        callback(this._value);
      } catch (e) {
        console.error("MotionValue subscriber error:", e);
      }
    });
    this._emit("change");
  }
  _emit(event) {
    this._eventListeners.get(event)?.forEach((callback) => {
      try {
        callback();
      } catch (e) {
        console.error(`MotionValue ${event} listener error:`, e);
      }
    });
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
  let destroyed = false;
  let pendingRafId = null;
  let pendingTimeoutId = null;
  const spring2 = createSpringValue(0, config);
  const unsubscribe = spring2.subscribe((value) => {
    if (destroyed) return;
    currentValue = value;
    const offset = totalLength * (1 - value);
    element.style.strokeDashoffset = String(offset);
    onUpdate?.(value);
  });
  const waitForRest = () => {
    return new Promise((resolve) => {
      const check = () => {
        pendingRafId = null;
        if (destroyed || !spring2.isAnimating()) {
          resolve();
        } else {
          pendingRafId = requestAnimationFrame(check);
        }
      };
      pendingTimeoutId = setTimeout(() => {
        pendingTimeoutId = null;
        check();
      }, 16);
    });
  };
  const animation = {
    play: async (target = 1) => {
      if (destroyed) return;
      spring2.set(target);
      await waitForRest();
      onComplete?.();
    },
    reverse: async () => {
      if (destroyed) return;
      spring2.set(0);
      await waitForRest();
      onComplete?.();
    },
    set: (value, animate2 = false) => {
      if (destroyed) return;
      if (animate2) {
        spring2.set(value);
      } else {
        spring2.jump(value);
        currentValue = value;
        const offset = totalLength * (1 - value);
        element.style.strokeDashoffset = String(offset);
      }
    },
    get: () => currentValue,
    pause: () => {
      if (destroyed) return;
      spring2.stop();
    },
    resume: () => {
      if (destroyed) return;
      spring2.set(currentValue);
    },
    reset: () => {
      if (destroyed) return;
      spring2.jump(0);
      currentValue = 0;
      element.style.strokeDashoffset = String(totalLength);
    },
    isAnimating: () => spring2.isAnimating(),
    destroy: () => {
      destroyed = true;
      if (pendingRafId !== null) {
        cancelAnimationFrame(pendingRafId);
        pendingRafId = null;
      }
      if (pendingTimeoutId !== null) {
        clearTimeout(pendingTimeoutId);
        pendingTimeoutId = null;
      }
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
function measureElement2(element) {
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left + window.scrollX,
    y: rect.top + window.scrollY,
    width: rect.width,
    height: rect.height
  };
}
function createFlip(element, first, last, options = {}) {
  const {
    config = {},
    position = true,
    size = true,
    onComplete,
    onUpdate
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
  const originalTransform = element.style.transform;
  const originalTransformOrigin = element.style.transformOrigin;
  if (size) {
    element.style.transformOrigin = "0 0";
  }
  const applyTransform2 = (t) => {
    progress = t;
    const invertedT = 1 - t;
    const transforms = [];
    if (position) {
      transforms.push(`translate(${deltaX * invertedT}px, ${deltaY * invertedT}px)`);
    }
    if (size && (deltaWidth !== 1 || deltaHeight !== 1)) {
      const scaleX = 1 + (deltaWidth - 1) * invertedT;
      const scaleY = 1 + (deltaHeight - 1) * invertedT;
      transforms.push(`scale(${scaleX}, ${scaleY})`);
    }
    element.style.transform = transforms.length > 0 ? transforms.join(" ") : "";
    try {
      onUpdate?.(t);
    } catch (e) {
      console.error("[SpringKit] FLIP onUpdate error:", e);
    }
  };
  applyTransform2(0);
  const cleanup = () => {
    element.style.transform = originalTransform;
    element.style.transformOrigin = originalTransformOrigin;
  };
  return {
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
}
async function flip(element, mutate, options = {}) {
  const first = measureElement2(element);
  await mutate();
  element.offsetHeight;
  const last = measureElement2(element);
  const animation = createFlip(element, first, last, options);
  await animation.play();
}
async function flipBatch(elements, mutate, options = {}) {
  const firstStates = elements.map((el) => measureElement2(el));
  await mutate();
  document.body.offsetHeight;
  const animations = elements.map((element, i) => {
    const last = measureElement2(element);
    return createFlip(element, firstStates[i], last, options);
  });
  await Promise.all(animations.map((anim) => anim.play()));
}

export { AnimationState, MotionValue, adjustBounce, adjustSpeed, allTo, animate, animateAll, applyStagger, applyValuesToElement, buildTransformString, calculateDampingRatio, calculatePeriod, calculateStaggerDelays, centerStagger, clamp, clearWarnings, configFromBounce, configFromDuration, createAutoLayout, createDragSpring, createFeeling, createFlip, createGestures, createLayoutGroup, createLongPressGesture, createMorph, createMorphSequence, createMotionValue, createOrchestration, createParallax, createPathAnimation, createPinchGesture, createRotateGesture, createScrollLinkedValue, createScrollProgress, createScrollSpring, createScrollTrigger, createSharedLayoutContext, createSpringGroup, createSpringValue, createSwipeGesture, createTimeline, createTrail, createVariantPreset, customStagger, decay, degToRad, edgeStagger, flip, flipBatch, getPathLength, getPhysicsPreset, getPointAtProgress, getVariant, globalLoop, gridStagger, hexToRgb, hslToRgb, interpolate, interpolateColor, isAnimatable, isCriticallyDamped, isKeyframeArray, isOverdamped, isTransformProperty, isUnderdamped, isVariant, isVariants, keyframes, lerp, linearStagger, mapRange, measureElement2 as measureElement, mergeVariants, parallel, parseColor, parseKeyframeArray, parseValueWithUnit, physicsPresets, preparePathForAnimation, radToDeg, randomStagger, resolveVariant, reverseStagger, rgbToHex, rgbToHsl, scrollEasings, sequence, shapes, simulateSpring, spiralStagger, spring, springPresets, stagger, staggerPresets, mapRange2 as transformMapRange, transformValue, tween, validateDecayConfig, validateDragConfig, validateSpringConfig, variantPresets, waveStagger };
