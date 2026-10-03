"use client";

// src/adapters/react/hooks/useSpring.ts
import { useEffect as useEffect2, useRef as useRef2, useState, useCallback } from "react";
import { createSpringGroup } from "@oxog/springkit";

// src/adapters/react/hooks/useDestroyOnUnmount.ts
import { useEffect, useReducer, useRef } from "react";
function useDestroyOnUnmount(destroy) {
  const destroyRef = useRef(destroy);
  destroyRef.current = destroy;
  const mountIdRef = useRef(0);
  const destroyedRef = useRef(false);
  const [, forceRender] = useReducer((n) => n + 1, 0);
  useEffect(() => {
    const mountIds = mountIdRef;
    const mountId = ++mountIds.current;
    if (destroyedRef.current) {
      destroyedRef.current = false;
      forceRender();
    }
    return () => {
      queueMicrotask(() => {
        if (mountIds.current !== mountId) return;
        destroyedRef.current = true;
        destroyRef.current();
      });
    };
  }, []);
}

// src/adapters/react/hooks/useSpring.ts
function shallowEqual(a, b) {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (a[key] !== b[key]) return false;
  }
  return true;
}
function useSpring(values, config = {}) {
  const springRef = useRef2(null);
  const isMounted = useRef2(false);
  const configRef = useRef2(config);
  const prevValuesRef = useRef2(values);
  configRef.current = config;
  if (!springRef.current || springRef.current.isDestroyed()) {
    springRef.current = createSpringGroup(values, config);
    prevValuesRef.current = values;
  }
  const getSpringValues = useCallback(() => {
    const spring2 = springRef.current;
    if (!spring2) return values;
    return spring2.get();
  }, []);
  const [currentValues, setCurrentValues] = useState(getSpringValues);
  const springGroup = springRef.current;
  useEffect2(() => {
    isMounted.current = true;
    const spring2 = springGroup;
    if (!spring2) return;
    const unsubscribe = spring2.subscribe((newValues) => {
      if (isMounted.current) {
        setCurrentValues(newValues);
      }
    });
    return () => {
      isMounted.current = false;
      unsubscribe();
    };
  }, [springGroup]);
  useEffect2(() => {
    const spring2 = springRef.current;
    if (!spring2) return;
    if (!shallowEqual(values, prevValuesRef.current)) {
      prevValuesRef.current = values;
      spring2.set(values, configRef.current);
    }
  });
  useDestroyOnUnmount(() => {
    springRef.current?.destroy();
    springRef.current = null;
  });
  return currentValues;
}

// src/adapters/react/hooks/useSpringValue.ts
import { useRef as useRef3 } from "react";
import { createSpringValue } from "@oxog/springkit";
function useSpringValue(initial, config = {}) {
  const springRef = useRef3(null);
  if (!springRef.current || springRef.current.isDestroyed()) {
    springRef.current = createSpringValue(initial, config);
  }
  useDestroyOnUnmount(() => springRef.current?.destroy());
  return springRef.current;
}

// src/adapters/react/hooks/useSprings.ts
import { useEffect as useEffect3, useRef as useRef4, useState as useState2, useCallback as useCallback2 } from "react";
import { createSpringGroup as createSpringGroup2, delay } from "@oxog/springkit";
function shallowEqual2(a, b) {
  const keysA = Object.keys(a);
  if (keysA.length !== Object.keys(b).length) return false;
  for (const key of keysA) {
    if (a[key] !== b[key]) return false;
  }
  return true;
}
function useSprings(count, items, defaultConfig = {}) {
  const springsRef = useRef4([]);
  const isMountedRef = useRef4(false);
  const itemsRef = useRef4(items);
  itemsRef.current = items;
  const getInitialValues = useCallback2(() => {
    const result2 = [];
    for (let i = 0; i < count; i++) {
      const item = itemsRef.current(i);
      result2.push(item.from ?? item.values);
    }
    return result2;
  }, [count]);
  const [currentValues, setCurrentValues] = useState2(getInitialValues);
  const defaultConfigRef = useRef4(defaultConfig);
  defaultConfigRef.current = defaultConfig;
  const defaultConfigKey = JSON.stringify(defaultConfig);
  const lastTargetsRef = useRef4([]);
  const timeoutsRef = useRef4(/* @__PURE__ */ new Map());
  const scheduleSet = useCallback2((index, values, ms, config) => {
    const timeouts = timeoutsRef.current;
    timeouts.get(index)?.();
    timeouts.delete(index);
    if (!(ms > 0)) {
      springsRef.current[index]?.set(values, config);
      return;
    }
    const cancel = delay(ms, () => {
      timeouts.delete(index);
      springsRef.current[index]?.set(values, config);
    });
    timeouts.set(index, cancel);
  }, []);
  const springsConfigKeyRef = useRef4(null);
  useEffect3(() => {
    isMountedRef.current = true;
    const springs = springsRef.current;
    const timeouts = timeoutsRef.current;
    const dropSpring = (index) => {
      springs[index]?.destroy();
      const pending = timeouts.get(index);
      if (pending !== void 0) {
        pending();
        timeouts.delete(index);
      }
    };
    if (springsConfigKeyRef.current !== defaultConfigKey) {
      for (let i = 0; i < springs.length; i++) dropSpring(i);
      springs.length = 0;
      springsConfigKeyRef.current = defaultConfigKey;
    }
    for (let i = count; i < springs.length; i++) dropSpring(i);
    springs.length = Math.min(springs.length, count);
    lastTargetsRef.current.length = Math.min(lastTargetsRef.current.length, count);
    const unsubscribers = [];
    setCurrentValues((prev) => prev.length > count ? prev.slice(0, count) : prev);
    for (let i = 0; i < count; i++) {
      let spring2 = springs[i];
      if (!spring2 || spring2.isDestroyed()) {
        const item = itemsRef.current(i);
        const initialValues = item.from ?? item.values;
        spring2 = createSpringGroup2(initialValues, {
          ...defaultConfigRef.current,
          ...item.config
        });
        springs[i] = spring2;
        lastTargetsRef.current[i] = item.values;
        scheduleSet(i, item.values, item.delay ?? 0);
      }
      const index = i;
      const unsubscribe = spring2.subscribe((values) => {
        if (isMountedRef.current) {
          setCurrentValues((prev) => {
            const prevValues = prev[index];
            const newValues = values;
            let hasChanged = false;
            if (prevValues) {
              for (const key in newValues) {
                if (newValues[key] !== prevValues[key]) {
                  hasChanged = true;
                  break;
                }
              }
            } else {
              hasChanged = true;
            }
            if (!hasChanged) return prev;
            const next = [...prev];
            next[index] = newValues;
            return next;
          });
        }
      });
      unsubscribers.push(unsubscribe);
    }
    return () => {
      isMountedRef.current = false;
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [count, defaultConfigKey, scheduleSet]);
  useEffect3(() => {
    const springs = springsRef.current;
    const timeouts = timeoutsRef.current;
    return () => {
      timeouts.forEach((cancel) => cancel());
      timeouts.clear();
      springs.forEach((s) => s?.destroy());
    };
  }, []);
  useEffect3(() => {
    for (let i = 0; i < springsRef.current.length; i++) {
      const spring2 = springsRef.current[i];
      if (!spring2 || spring2.isDestroyed()) continue;
      const item = itemsRef.current(i);
      const prevTarget = lastTargetsRef.current[i];
      if (prevTarget && shallowEqual2(prevTarget, item.values)) continue;
      lastTargetsRef.current[i] = item.values;
      scheduleSet(i, item.values, item.delay ?? 0, item.config);
    }
  });
  if (currentValues.length === count) return currentValues;
  const result = currentValues.slice(0, count);
  for (let i = result.length; i < count; i++) {
    const item = itemsRef.current(i);
    result.push(item.from ?? item.values);
  }
  return result;
}

// src/adapters/react/hooks/useTrail.ts
import { useEffect as useEffect4, useRef as useRef5, useState as useState3 } from "react";
import { createSpringValue as createSpringValue2, delay as delay2 } from "@oxog/springkit";
function useTrail(count, values, config = {}) {
  const springsRef = useRef5(null);
  const isMountedRef = useRef5(false);
  const [currentValues, setCurrentValues] = useState3(
    () => Array.from({ length: count }, () => ({ ...values }))
  );
  const isFirstRender = useRef5(true);
  const prevValuesRef = useRef5(JSON.stringify(values));
  const timeoutsRef = useRef5([]);
  const springsConfigKeyRef = useRef5(null);
  const configKey = `${config.stiffness}|${config.damping}|${config.mass}`;
  useEffect4(() => {
    isMountedRef.current = true;
    const keys = Object.keys(values);
    const springs = /* @__PURE__ */ new Map();
    const existingSprings = springsConfigKeyRef.current === configKey ? springsRef.current : null;
    springsConfigKeyRef.current = configKey;
    keys.forEach((key) => {
      const propSprings = [];
      const initialValue = values[key];
      const existingPropSprings = existingSprings?.get(key);
      for (let i = 0; i < count; i++) {
        const existingSpring = existingPropSprings?.[i];
        const spring2 = existingSpring && !existingSpring.isDestroyed() ? existingSpring : createSpringValue2(initialValue, config);
        propSprings.push(spring2);
      }
      springs.set(key, propSprings);
    });
    springsRef.current?.forEach((propSprings, key) => {
      const kept = springs.get(key);
      propSprings.forEach((spring2, index) => {
        if (kept?.[index] !== spring2) spring2.destroy();
      });
    });
    springsRef.current = springs;
    setCurrentValues((prev) => prev.length > count ? prev.slice(0, count) : prev);
    const unsubscribers = [];
    springs.forEach((propSprings, _key) => {
      propSprings.forEach((spring2, index) => {
        const unsub = spring2.subscribe(() => {
          if (!isMountedRef.current) return;
          setCurrentValues((prev) => {
            const next = [...prev];
            if (!next[index]) {
              next[index] = { ...values };
            }
            const newItem = { ...next[index] };
            springs.forEach((ps, k) => {
              newItem[k] = ps[index].get();
            });
            next[index] = newItem;
            return next;
          });
        });
        unsubscribers.push(unsub);
      });
    });
    return () => {
      isMountedRef.current = false;
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [count, configKey]);
  useEffect4(() => {
    return () => {
      springsRef.current?.forEach((propSprings) => {
        propSprings.forEach((spring2) => spring2.destroy());
      });
    };
  }, []);
  useEffect4(() => {
    if (!springsRef.current) return;
    const currentValuesString = JSON.stringify(values);
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevValuesRef.current = currentValuesString;
      return;
    }
    if (currentValuesString === prevValuesRef.current) return;
    prevValuesRef.current = currentValuesString;
    const keys = Object.keys(values);
    const staggerDelay = 50;
    timeoutsRef.current.forEach((cancel) => cancel());
    timeoutsRef.current = [];
    keys.forEach((key) => {
      const propSprings = springsRef.current?.get(key);
      if (!propSprings) return;
      const targetValue = values[key];
      propSprings.forEach((spring2, index) => {
        if (index === 0) {
          spring2.set(targetValue, config);
          return;
        }
        const cancel = delay2(index * staggerDelay, () => {
          spring2.set(targetValue, config);
        });
        timeoutsRef.current.push(cancel);
      });
    });
    return () => {
      timeoutsRef.current.forEach((cancel) => cancel());
      timeoutsRef.current = [];
    };
  }, [JSON.stringify(values), config.stiffness, config.damping]);
  if (currentValues.length === count) return currentValues;
  const result = currentValues.slice(0, count);
  while (result.length < count) result.push({ ...values });
  return result;
}

// src/adapters/react/hooks/useDrag.ts
import { useCallback as useCallback3, useEffect as useEffect5, useRef as useRef6, useState as useState4 } from "react";
import { createDragSpring } from "@oxog/springkit";
var elementIds = /* @__PURE__ */ new WeakMap();
var nextElementId = 0;
function configKeyOf(config) {
  return JSON.stringify(config, (_key, value) => {
    if (typeof value === "function") return void 0;
    if (typeof Element !== "undefined" && value instanceof Element) {
      let id = elementIds.get(value);
      if (id === void 0) {
        id = nextElementId++;
        elementIds.set(value, id);
      }
      return `#element${id}`;
    }
    return value;
  });
}
function useDrag(config = {}) {
  const dragSpringRef = useRef6(null);
  const positionRef = useRef6({ x: 0, y: 0 });
  const [element, setElement] = useState4(null);
  const [isDragging, setIsDragging] = useState4(false);
  const [, forceUpdate] = useState4({});
  const configRef = useRef6(config);
  const rafIdRef = useRef6(null);
  const pendingUpdateRef = useRef6(false);
  configRef.current = config;
  const refCallback = useCallback3((el) => {
    setElement(el);
  }, []);
  const throttledUpdate = () => {
    if (rafIdRef.current === null) {
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null;
        if (pendingUpdateRef.current) {
          pendingUpdateRef.current = false;
          forceUpdate({});
        }
      });
    }
  };
  const configKey = configKeyOf(config);
  useEffect5(() => {
    let isActive = true;
    if (dragSpringRef.current) {
      dragSpringRef.current.destroy();
      dragSpringRef.current = null;
    }
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    if (element) {
      const carried = positionRef.current;
      dragSpringRef.current = createDragSpring(element, {
        ...configRef.current,
        onDragStart: (e) => {
          if (!isActive) return;
          setIsDragging(true);
          configRef.current.onDragStart?.(e);
        },
        onDragEnd: (x, y, velocity) => {
          if (!isActive) return;
          setIsDragging(false);
          configRef.current.onDragEnd?.(x, y, velocity);
        },
        onUpdate: (x, y) => {
          if (!isActive) return;
          positionRef.current = { x, y };
          pendingUpdateRef.current = true;
          throttledUpdate();
          configRef.current.onUpdate?.(x, y);
        }
      });
      if (carried.x !== 0 || carried.y !== 0) dragSpringRef.current.setPosition(carried.x, carried.y);
    }
    return () => {
      isActive = false;
      if (dragSpringRef.current?.isDragging()) setIsDragging(false);
      dragSpringRef.current?.destroy();
      dragSpringRef.current = null;
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [element, configKey]);
  const set = (values) => {
    const rawX = values.x ?? positionRef.current.x;
    const rawY = values.y ?? positionRef.current.y;
    const x = Number.isFinite(rawX) ? rawX : positionRef.current.x;
    const y = Number.isFinite(rawY) ? rawY : positionRef.current.y;
    dragSpringRef.current?.setPosition(x, y);
  };
  const reset = () => {
    dragSpringRef.current?.reset();
    positionRef.current = { x: 0, y: 0 };
    forceUpdate({});
  };
  return [positionRef.current, { ref: refCallback, set, reset, isDragging }];
}

// src/adapters/react/hooks/useGesture.ts
import { useRef as useRef7 } from "react";
function useGesture(handlers) {
  const pointersRef = useRef7(/* @__PURE__ */ new Map());
  const dragRef = useRef7(null);
  const pinchRef = useRef7(null);
  const call = (name, fn, arg) => {
    if (!fn) return;
    try {
      fn(arg);
    } catch (error) {
      console.error(`[SpringKit] Gesture ${name} error:`, error);
    }
  };
  const startPinch = () => {
    const [first, second] = Array.from(pointersRef.current.entries());
    if (!first || !second) return;
    const [idA, a] = first;
    const [idB, b] = second;
    const angle = angleOf(a, b);
    pinchRef.current = {
      ids: [idA, idB],
      startDistance: distanceOf(a, b),
      startMid: midpointOf(a, b),
      lastAngle: angle,
      angle: 0
    };
  };
  const onPointerDown = (e) => {
    try {
      const target = e.currentTarget;
      target?.setPointerCapture?.(e.pointerId);
    } catch {
    }
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (!dragRef.current) {
      dragRef.current = { pointerId: e.pointerId, startX: e.clientX, startY: e.clientY };
      call("onDragStart", handlers.onDragStart, e);
    }
    if (pointersRef.current.size === 2) startPinch();
  };
  const onPointerMove = (e) => {
    const pointers = pointersRef.current;
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const drag = dragRef.current;
    if (drag && drag.pointerId === e.pointerId) {
      call("onDrag", handlers.onDrag, { x: e.clientX - drag.startX, y: e.clientY - drag.startY });
    }
    const pinch = pinchRef.current;
    if (!pinch || !pinch.ids.includes(e.pointerId)) return;
    const a = pointers.get(pinch.ids[0]);
    const b = pointers.get(pinch.ids[1]);
    if (!a || !b) return;
    const angle = angleOf(a, b);
    let delta = angle - pinch.lastAngle;
    if (delta > 180) delta -= 360;
    else if (delta < -180) delta += 360;
    pinch.lastAngle = angle;
    pinch.angle += delta;
    const mid = midpointOf(a, b);
    const state = {
      x: mid.x - pinch.startMid.x,
      y: mid.y - pinch.startMid.y,
      scale: pinch.startDistance === 0 ? 1 : distanceOf(a, b) / pinch.startDistance,
      angle: pinch.angle
    };
    call("onPinch", handlers.onPinch, state);
    call("onRotate", handlers.onRotate, state);
  };
  const onPointerEnd = (e) => {
    pointersRef.current.delete(e.pointerId);
    if (pinchRef.current?.ids.includes(e.pointerId)) pinchRef.current = null;
    if (dragRef.current?.pointerId === e.pointerId) dragRef.current = null;
  };
  return {
    onPointerDown,
    onPointerMove,
    onPointerUp: onPointerEnd,
    onPointerCancel: onPointerEnd
  };
}
function distanceOf(a, b) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}
function angleOf(a, b) {
  return Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
}
function midpointOf(a, b) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

// src/adapters/react/hooks/usePresence.ts
import { useContext } from "react";

// src/adapters/react/context/PresenceContext.ts
import { createContext } from "react";
var PresenceContext = createContext(null);
PresenceContext.displayName = "PresenceContext";

// src/adapters/react/hooks/usePresence.ts
function usePresence() {
  const context = useContext(PresenceContext);
  if (context === null) {
    return [true, () => {
    }];
  }
  return [context.isPresent, context.safeToRemove];
}
function useIsPresent() {
  const context = useContext(PresenceContext);
  return context === null ? true : context.isPresent;
}
function usePresenceCustom() {
  const context = useContext(PresenceContext);
  return context?.custom;
}

// src/adapters/react/hooks/useAnimate.ts
import { useRef as useRef8, useCallback as useCallback4, useEffect as useEffect6 } from "react";
import { createSpringValue as createSpringValue3, delay as animationDelay } from "@oxog/springkit";
var TRANSFORM_DEFAULTS = {
  x: 0,
  y: 0,
  z: 0,
  scale: 1,
  scaleX: 1,
  scaleY: 1,
  rotate: 0,
  rotateX: 0,
  rotateY: 0,
  rotateZ: 0
};
function readInitialValue(element, property) {
  const transformDefault = TRANSFORM_DEFAULTS[property];
  if (transformDefault !== void 0) return transformDefault;
  if (element && typeof getComputedStyle === "function") {
    const computed = parseFloat(
      getComputedStyle(element).getPropertyValue(
        property.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)
      )
    );
    if (Number.isFinite(computed)) return computed;
  }
  return property === "opacity" ? 1 : 0;
}
function useAnimate() {
  const scopeRef = useRef8(null);
  const springsRef = useRef8(/* @__PURE__ */ new Map());
  const valuesRef = useRef8(/* @__PURE__ */ new Map());
  const isAnimatingRef = useRef8(false);
  const cleanupRef = useRef8([]);
  const rafIdsRef = useRef8(/* @__PURE__ */ new Set());
  const timeoutIdsRef = useRef8(/* @__PURE__ */ new Set());
  const isDestroyedRef = useRef8(false);
  const pendingResolversRef = useRef8(/* @__PURE__ */ new Set());
  const trackedPromise = useCallback4((executor) => {
    return new Promise((resolve) => {
      const done = () => {
        pendingResolversRef.current.delete(done);
        resolve();
      };
      pendingResolversRef.current.add(done);
      executor(done);
    });
  }, []);
  useEffect6(() => {
    isDestroyedRef.current = false;
  }, []);
  const _getPropertyStyle = useCallback4((_property, _value) => {
    return null;
  }, []);
  const applyStyles = useCallback4(() => {
    const element = scopeRef.current;
    if (!element) return;
    const transforms = [];
    const styles = {};
    valuesRef.current.forEach((value, property) => {
      switch (property) {
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
        case "rotateZ":
          transforms.push(`rotate(${value}deg)`);
          break;
        case "rotateX":
          transforms.push(`rotateX(${value}deg)`);
          break;
        case "rotateY":
          transforms.push(`rotateY(${value}deg)`);
          break;
        case "opacity":
          styles.opacity = String(value);
          break;
        default:
          styles[property] = `${value}px`;
      }
    });
    if (transforms.length > 0) {
      element.style.transform = transforms.join(" ");
    }
    Object.entries(styles).forEach(([prop, val]) => {
      element.style.setProperty(prop, val);
    });
  }, []);
  const animate = useCallback4(async (target, options = {}) => {
    const { config = {}, delay: delay6 = 0, onComplete } = options;
    try {
      if (delay6 > 0) {
        await trackedPromise((resolve) => {
          const cancel = animationDelay(delay6, () => {
            timeoutIdsRef.current.delete(cancel);
            resolve();
          });
          timeoutIdsRef.current.add(cancel);
        });
      }
      if (isDestroyedRef.current) return;
      isAnimatingRef.current = true;
      const promises = [];
      for (const [property, value] of Object.entries(target)) {
        const targetValues = Array.isArray(value) ? value : [value];
        let animationPromise = Promise.resolve();
        for (const targetValue of targetValues) {
          animationPromise = animationPromise.then(() => {
            return trackedPromise((resolve) => {
              if (isDestroyedRef.current) {
                resolve();
                return;
              }
              try {
                let spring2 = springsRef.current.get(property);
                if (!spring2) {
                  spring2 = createSpringValue3(
                    valuesRef.current.get(property) ?? readInitialValue(scopeRef.current, property),
                    config
                  );
                  springsRef.current.set(property, spring2);
                  const unsubscribe = spring2.subscribe((v) => {
                    if (!isDestroyedRef.current) {
                      valuesRef.current.set(property, v);
                      applyStyles();
                    }
                  });
                  cleanupRef.current.push(unsubscribe);
                }
                if (config.stiffness || config.damping || config.mass) {
                  spring2.setConfig(config);
                }
                spring2.set(targetValue);
                let rafId = null;
                const checkComplete = () => {
                  if (rafId !== null) {
                    rafIdsRef.current.delete(rafId);
                  }
                  if (isDestroyedRef.current || !spring2 || !spring2.isAnimating()) {
                    resolve();
                  } else {
                    rafId = requestAnimationFrame(checkComplete);
                    rafIdsRef.current.add(rafId);
                  }
                };
                rafId = requestAnimationFrame(checkComplete);
                rafIdsRef.current.add(rafId);
              } catch (error) {
                console.error("[SpringKit] Animation failed:", error);
                resolve();
              }
            });
          });
        }
        promises.push(animationPromise);
      }
      await Promise.all(promises);
      if (!isDestroyedRef.current) {
        isAnimatingRef.current = false;
        onComplete?.();
      }
    } catch (error) {
      console.error("[SpringKit] animate() error:", error);
      isAnimatingRef.current = false;
    }
  }, [applyStyles, trackedPromise]);
  const controls = {
    stop: useCallback4(() => {
      springsRef.current.forEach((spring2) => {
        spring2.stop();
      });
      isAnimatingRef.current = false;
    }, []),
    get: useCallback4((property) => {
      return valuesRef.current.get(property);
    }, []),
    isAnimating: useCallback4(() => {
      return isAnimatingRef.current;
    }, [])
  };
  useEffect6(() => {
    const rafIds = rafIdsRef.current;
    const timeoutIds = timeoutIdsRef.current;
    const cleanup = cleanupRef.current;
    const springs = springsRef.current;
    const pendingResolvers = pendingResolversRef.current;
    return () => {
      isDestroyedRef.current = true;
      rafIds.forEach((id) => cancelAnimationFrame(id));
      rafIds.clear();
      timeoutIds.forEach((cancel) => cancel());
      timeoutIds.clear();
      cleanup.forEach((c) => c());
      springs.forEach((spring2) => spring2.destroy());
      springs.clear();
      Array.from(pendingResolvers).forEach((resolve) => resolve());
      pendingResolvers.clear();
    };
  }, []);
  return [scopeRef, animate, controls];
}

// src/adapters/react/hooks/useMotionValue.ts
import { useRef as useRef9, useEffect as useEffect7, useState as useState5 } from "react";
import { createMotionValue } from "@oxog/springkit";
function useMotionValue(initialValue, options) {
  const motionValueRef = useRef9(null);
  if (motionValueRef.current === null || motionValueRef.current.isDestroyed()) {
    motionValueRef.current = createMotionValue(initialValue, options);
  }
  useDestroyOnUnmount(() => {
    motionValueRef.current?.destroy();
  });
  return motionValueRef.current;
}
function useMotionValueState(motionValue) {
  const [value, setValue] = useState5(() => motionValue?.get());
  useEffect7(() => {
    if (!motionValue) return;
    setValue(motionValue.get());
    const unsubscribe = motionValue.subscribe((newValue) => {
      setValue(newValue);
    });
    return unsubscribe;
  }, [motionValue]);
  return value;
}
function useMotionValueSync(externalValue, options) {
  const motionValue = useMotionValue(externalValue, options);
  useEffect7(() => {
    motionValue.set(externalValue);
  }, [externalValue, motionValue]);
  return motionValue;
}
function useMotionValues(initialValues, options) {
  const motionValuesRef = useRef9(null);
  const needsRecreate = motionValuesRef.current === null || Object.values(motionValuesRef.current).some((mv) => mv.isDestroyed());
  if (needsRecreate) {
    const values = {};
    for (const key in initialValues) {
      if (Object.prototype.hasOwnProperty.call(initialValues, key)) {
        const value = initialValues[key];
        values[key] = createMotionValue(value, options);
      }
    }
    motionValuesRef.current = values;
  }
  useDestroyOnUnmount(() => {
    if (motionValuesRef.current) {
      const current = motionValuesRef.current;
      for (const key in current) {
        if (Object.prototype.hasOwnProperty.call(current, key)) {
          current[key].destroy();
        }
      }
    }
  });
  return motionValuesRef.current;
}

// src/adapters/react/hooks/useTransform.ts
import { useRef as useRef10, useEffect as useEffect8, useMemo, useCallback as useCallback5 } from "react";
import {
  createMotionValue as createMotionValue2,
  parseColorRGBA,
  isColorString,
  mixColorsRGBA,
  formatRGBA
} from "@oxog/springkit";
function useVelocity(source) {
  const velocityRef = useRef10(null);
  const frameRef = useRef10(null);
  const lastVelocityRef = useRef10(0);
  const isRunningRef = useRef10(false);
  if (velocityRef.current === null || velocityRef.current.isDestroyed()) {
    velocityRef.current = createMotionValue2(source.getVelocity());
  }
  useEffect8(() => {
    const startLoop = () => {
      if (isRunningRef.current) return;
      isRunningRef.current = true;
      const update = () => {
        if (!isRunningRef.current) return;
        const velocity = source.getVelocity();
        if (Math.abs(velocity - lastVelocityRef.current) > 1e-3) {
          velocityRef.current?.jump(velocity);
          lastVelocityRef.current = velocity;
        }
        if (source.isAnimating() || Math.abs(velocity) > 1e-3) {
          frameRef.current = requestAnimationFrame(update);
        } else {
          isRunningRef.current = false;
          frameRef.current = null;
        }
      };
      frameRef.current = requestAnimationFrame(update);
    };
    const unsubscribe = source.on("animationStart", startLoop);
    if (source.isAnimating()) {
      startLoop();
    }
    return () => {
      unsubscribe();
      isRunningRef.current = false;
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [source]);
  useDestroyOnUnmount(() => {
    velocityRef.current?.destroy();
  });
  return velocityRef.current;
}
function useMotionValueEvent(value, event, callback) {
  const callbackRef = useRef10(callback);
  callbackRef.current = callback;
  useEffect8(() => {
    return value.on(event, () => callbackRef.current(value.get()));
  }, [value, event]);
}
var STRING_TOKEN_REGEX = /#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})\b|(?:rgba?|hsla?)\([^)]*\)|\btransparent\b|-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/gi;
function parseAnimatableString(value) {
  const trimmed = value.trim();
  if (/^[a-z]+$/i.test(trimmed) && trimmed.toLowerCase() !== "transparent" && isColorString(trimmed)) {
    return { parts: ["", ""], tokens: [parseColorRGBA(trimmed)] };
  }
  const parts = [];
  const tokens = [];
  let last = 0;
  for (const match of value.matchAll(STRING_TOKEN_REGEX)) {
    const text = match[0];
    const index = match.index ?? 0;
    parts.push(value.slice(last, index));
    tokens.push(/^[-.\d]/.test(text) ? parseFloat(text) : parseColorRGBA(text));
    last = index + text.length;
  }
  parts.push(value.slice(last));
  return { parts, tokens };
}
function isCompatible(a, b) {
  return a.parts.length === b.parts.length && a.parts.every((part, i) => part === b.parts[i]) && a.tokens.every((token, i) => typeof token === typeof b.tokens[i]);
}
var formatNumber = (value) => String(Math.round(value * 1e6) / 1e6 || 0);
function mixParsedStrings(a, b, t, space) {
  let result = a.parts[0] ?? "";
  for (let i = 0; i < a.tokens.length; i++) {
    const from = a.tokens[i];
    const to = b.tokens[i];
    result += typeof from === "number" ? formatNumber(from + (to - from) * t) : formatRGBA(mixColorsRGBA(from, to, t, space));
    result += a.parts[i + 1] ?? "";
  }
  return result;
}
function useTransform(source, inputRangeOrTransform, outputRange, options) {
  const derivedRef = useRef10(null);
  const unsubscribeRef = useRef10(null);
  const transformFn = useMemo(() => {
    if (typeof inputRangeOrTransform === "function") {
      return inputRangeOrTransform;
    }
    if (!outputRange) {
      throw new Error("useTransform: outputRange is required when using range mapping");
    }
    const inputRange = inputRangeOrTransform;
    const locate = (value) => {
      const descending = (inputRange[inputRange.length - 1] ?? 0) < (inputRange[0] ?? 0);
      let i = 0;
      for (; i < inputRange.length - 2; i++) {
        const nextVal = inputRange[i + 1];
        if (nextVal !== void 0 && (descending ? value >= nextVal : value <= nextVal)) break;
      }
      const next = Math.min(i + 1, inputRange.length - 1);
      const inputMin = inputRange[i] ?? 0;
      const inputMax = inputRange[next] ?? 1;
      let t = inputMax !== inputMin ? (value - inputMin) / (inputMax - inputMin) : 0;
      if (options?.clamp) {
        t = Math.max(0, Math.min(1, t));
      }
      if (options?.ease) {
        t = options.ease(t);
        if (options.clamp) t = Math.max(0, Math.min(1, t));
      }
      return { i, next, t };
    };
    if (typeof outputRange[0] === "number") {
      return (value) => {
        const { i, next, t } = locate(value);
        const outputMin = outputRange[i] ?? 0;
        const outputMax = outputRange[Math.min(next, outputRange.length - 1)] ?? 1;
        return outputMin + t * (outputMax - outputMin);
      };
    }
    const strings = outputRange.map(String);
    const parsed = strings.map(parseAnimatableString);
    const space = options?.space;
    return (value) => {
      const { i, next, t } = locate(value);
      const j = Math.min(next, strings.length - 1);
      const from = parsed[i];
      const to = parsed[j];
      if (from && to && isCompatible(from, to)) {
        return mixParsedStrings(from, to, t, space);
      }
      return t < 0.5 ? strings[i] : strings[j] ?? strings[i];
    };
  }, [inputRangeOrTransform, outputRange, options?.clamp, options?.ease, options?.space]);
  if (derivedRef.current === null || derivedRef.current.isDestroyed()) {
    derivedRef.current = createMotionValue2(transformFn(source.get()));
  }
  useEffect8(() => {
    unsubscribeRef.current = source.subscribe((value) => {
      derivedRef.current?.jump(transformFn(value));
    });
    return () => {
      unsubscribeRef.current?.();
    };
  }, [source, transformFn]);
  useDestroyOnUnmount(() => {
    derivedRef.current?.destroy();
  });
  return derivedRef.current;
}
function useCombinedTransform(sources, transform) {
  const derivedRef = useRef10(null);
  const unsubscribesRef = useRef10([]);
  const getCurrentValues = () => {
    return sources.map((source) => source.get());
  };
  if (derivedRef.current === null || derivedRef.current.isDestroyed()) {
    derivedRef.current = createMotionValue2(transform(getCurrentValues()));
  }
  useEffect8(() => {
    unsubscribesRef.current = sources.map(
      (source) => source.subscribe(() => {
        derivedRef.current?.jump(transform(getCurrentValues()));
      })
    );
    return () => {
      unsubscribesRef.current.forEach((unsub) => unsub());
    };
  }, [sources, transform]);
  useDestroyOnUnmount(() => {
    derivedRef.current?.destroy();
  });
  return derivedRef.current;
}
function useVelocityTransform(source, transform) {
  const derivedRef = useRef10(null);
  const frameRef = useRef10(null);
  const isRunningRef = useRef10(false);
  if (derivedRef.current === null || derivedRef.current.isDestroyed()) {
    derivedRef.current = createMotionValue2(transform(source.getVelocity()));
  }
  useEffect8(() => {
    const startLoop = () => {
      if (isRunningRef.current) return;
      isRunningRef.current = true;
      const update = () => {
        if (!isRunningRef.current) return;
        const velocity = source.getVelocity();
        derivedRef.current?.jump(transform(velocity));
        if (source.isAnimating() || Math.abs(velocity) > 1e-3) {
          frameRef.current = requestAnimationFrame(update);
        } else {
          isRunningRef.current = false;
          frameRef.current = null;
        }
      };
      frameRef.current = requestAnimationFrame(update);
    };
    const unsubscribe = source.on("animationStart", startLoop);
    if (source.isAnimating()) {
      startLoop();
    }
    return () => {
      unsubscribe();
      isRunningRef.current = false;
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [source, transform]);
  useDestroyOnUnmount(() => {
    derivedRef.current?.destroy();
  });
  return derivedRef.current;
}
function useSpringTransform(source, inputRange, outputRange, springConfig) {
  const derivedRef = useRef10(null);
  const unsubscribeRef = useRef10(null);
  const transform = useMemo(() => {
    return (value) => {
      const descending = (inputRange[inputRange.length - 1] ?? 0) < (inputRange[0] ?? 0);
      let i = 0;
      for (; i < inputRange.length - 2; i++) {
        const nextVal = inputRange[i + 1];
        if (nextVal !== void 0 && (descending ? value >= nextVal : value <= nextVal)) break;
      }
      const inCurr = inputRange[i] ?? 0;
      const inNext = inputRange[i + 1] ?? 1;
      const outCurr = outputRange[i] ?? 0;
      const outNext = outputRange[i + 1] ?? 1;
      const t = inNext !== inCurr ? (value - inCurr) / (inNext - inCurr) : 0;
      return outCurr + t * (outNext - outCurr);
    };
  }, [inputRange, outputRange]);
  if (derivedRef.current === null || derivedRef.current.isDestroyed()) {
    derivedRef.current = createMotionValue2(transform(source.get()), {
      spring: springConfig
    });
  }
  useEffect8(() => {
    unsubscribeRef.current = source.subscribe((value) => {
      derivedRef.current?.set(transform(value));
    });
    return () => {
      unsubscribeRef.current?.();
    };
  }, [source, transform]);
  useDestroyOnUnmount(() => {
    derivedRef.current?.destroy();
  });
  return derivedRef.current;
}
function useMotionTemplate(strings, ...values) {
  const templateRef = useRef10(null);
  const unsubscribesRef = useRef10([]);
  const valuesRef = useRef10(values);
  valuesRef.current = values;
  const stringsRef = useRef10(strings);
  stringsRef.current = strings;
  const buildString = useCallback5(() => {
    let result = "";
    stringsRef.current.forEach((str, i) => {
      result += str;
      if (i < valuesRef.current.length) {
        result += String(valuesRef.current[i]?.get() ?? "");
      }
    });
    return result;
  }, []);
  if (templateRef.current === null || templateRef.current.isDestroyed()) {
    templateRef.current = createMotionValue2(buildString());
  }
  const subscribedValuesRef = useRef10(values);
  const valuesVersionRef = useRef10(0);
  const prevValues = subscribedValuesRef.current;
  if (prevValues.length !== values.length || values.some((v, i) => v !== prevValues[i])) {
    subscribedValuesRef.current = values;
    valuesVersionRef.current++;
  }
  const valuesVersion = valuesVersionRef.current;
  useEffect8(() => {
    unsubscribesRef.current.forEach((unsub) => unsub());
    unsubscribesRef.current = valuesRef.current.map(
      (value) => value.subscribe(() => {
        templateRef.current?.jump(buildString());
      })
    );
    return () => {
      unsubscribesRef.current.forEach((unsub) => unsub());
      unsubscribesRef.current = [];
    };
  }, [valuesVersion, buildString]);
  useDestroyOnUnmount(() => {
    templateRef.current?.destroy();
  });
  return templateRef.current;
}
function useTime() {
  const timeRef = useRef10(null);
  const frameRef = useRef10(null);
  const startTimeRef = useRef10(null);
  if (timeRef.current === null || timeRef.current.isDestroyed()) {
    timeRef.current = createMotionValue2(0);
  }
  useEffect8(() => {
    let isActive = true;
    const update = (timestamp) => {
      if (!isActive) return;
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }
      const elapsed = timestamp - startTimeRef.current;
      timeRef.current?.jump(elapsed);
      frameRef.current = requestAnimationFrame(update);
    };
    frameRef.current = requestAnimationFrame(update);
    return () => {
      isActive = false;
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);
  useDestroyOnUnmount(() => {
    timeRef.current?.destroy();
  });
  return timeRef.current;
}
function useAnimationFrame(callback) {
  const callbackRef = useRef10(callback);
  const frameRef = useRef10(null);
  const lastTimeRef = useRef10(null);
  callbackRef.current = callback;
  useEffect8(() => {
    const update = (timestamp) => {
      const delta = lastTimeRef.current !== null ? timestamp - lastTimeRef.current : 0;
      lastTimeRef.current = timestamp;
      callbackRef.current(timestamp, delta);
      frameRef.current = requestAnimationFrame(update);
    };
    frameRef.current = requestAnimationFrame(update);
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);
}
function useWillChange(sources, properties = ["transform", "opacity"]) {
  const willChangeRef = useRef10(null);
  const frameRef = useRef10(null);
  const wasAnimatingRef = useRef10(false);
  const isDestroyedRef = useRef10(false);
  const sourcesRef = useRef10(sources);
  sourcesRef.current = sources;
  const propertiesRef = useRef10(properties);
  propertiesRef.current = properties;
  if (willChangeRef.current === null || willChangeRef.current.isDestroyed()) {
    willChangeRef.current = createMotionValue2("auto");
  }
  const sourcesLength = sources.length;
  useEffect8(() => {
    isDestroyedRef.current = false;
    const checkAnimating = () => {
      if (isDestroyedRef.current) return;
      const isAnimating = sourcesRef.current.some((source) => source.isAnimating());
      if (isAnimating && !wasAnimatingRef.current) {
        ;
        willChangeRef.current?.jump(propertiesRef.current.join(", "));
        wasAnimatingRef.current = true;
      } else if (!isAnimating && wasAnimatingRef.current) {
        ;
        willChangeRef.current?.jump("auto");
        wasAnimatingRef.current = false;
      }
      if (!isDestroyedRef.current) {
        frameRef.current = requestAnimationFrame(checkAnimating);
      }
    };
    frameRef.current = requestAnimationFrame(checkAnimating);
    return () => {
      isDestroyedRef.current = true;
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [sourcesLength]);
  useDestroyOnUnmount(() => {
    willChangeRef.current?.destroy();
  });
  return willChangeRef.current;
}
function useSum(...sources) {
  return useCombinedTransform(
    sources,
    (values) => values.reduce((sum, v) => sum + v, 0)
  );
}
function useProduct(...sources) {
  return useCombinedTransform(
    sources,
    (values) => values.reduce((product, v) => product * v, 1)
  );
}
function useDifference(a, b) {
  return useCombinedTransform([a, b], ([aVal, bVal]) => aVal - bVal);
}
function useClamp(source, min, max) {
  return useTransform(source, (v) => Math.max(min, Math.min(max, v)));
}
function useSnap(source, step) {
  return useTransform(source, (v) => Math.round(v / step) * step);
}
function useSmooth(source, factor = 0.1) {
  const smoothedRef = useRef10(null);
  const currentRef = useRef10(source.get());
  if (smoothedRef.current === null || smoothedRef.current.isDestroyed()) {
    smoothedRef.current = createMotionValue2(source.get());
  }
  useEffect8(() => {
    const unsub = source.subscribe((target) => {
      currentRef.current = currentRef.current + (target - currentRef.current) * factor;
      smoothedRef.current?.jump(currentRef.current);
    });
    return unsub;
  }, [source, factor]);
  useDestroyOnUnmount(() => {
    smoothedRef.current?.destroy();
  });
  return smoothedRef.current;
}
function useDelay(source, frames) {
  const delayedRef = useRef10(null);
  const bufferRef = useRef10([]);
  if (delayedRef.current === null || delayedRef.current.isDestroyed()) {
    delayedRef.current = createMotionValue2(source.get());
    bufferRef.current = Array(frames).fill(source.get());
  }
  useEffect8(() => {
    const buffer = bufferRef.current;
    const safeFrames = Math.max(0, Math.floor(frames) || 0);
    while (buffer.length > safeFrames) buffer.shift();
    while (buffer.length < safeFrames) buffer.unshift(buffer[0] ?? source.get());
    const unsub = source.subscribe((value) => {
      bufferRef.current.push(value);
      const delayed = bufferRef.current.shift();
      if (delayed !== void 0) {
        delayedRef.current?.jump(delayed);
      }
    });
    return unsub;
  }, [source, frames]);
  useDestroyOnUnmount(() => {
    delayedRef.current?.destroy();
  });
  return delayedRef.current;
}

// src/adapters/react/hooks/useDragControls.ts
import { useRef as useRef11, useCallback as useCallback6, useMemo as useMemo2 } from "react";
function useDragControls() {
  const isDraggingRef = useRef11(false);
  const activeCountRef = useRef11(0);
  const listenerRef = useRef11(null);
  const stopRef = useRef11(null);
  const subscribersRef = useRef11(/* @__PURE__ */ new Set());
  const start = useCallback6((event, options) => {
    isDraggingRef.current = true;
    event.preventDefault();
    const pointerEvent = "nativeEvent" in event ? event.nativeEvent : event;
    listenerRef.current?.(pointerEvent, options);
    for (const subscriber of Array.from(subscribersRef.current)) {
      subscriber.start(pointerEvent, options);
    }
  }, []);
  const stop = useCallback6(() => {
    isDraggingRef.current = false;
    stopRef.current?.();
    for (const subscriber of Array.from(subscribersRef.current)) {
      subscriber.stop();
    }
  }, []);
  const cancel = useCallback6(() => {
    isDraggingRef.current = false;
    for (const subscriber of Array.from(subscribersRef.current)) {
      subscriber.cancel();
    }
  }, []);
  const isDragging = useCallback6(() => {
    return isDraggingRef.current;
  }, []);
  const controls = useMemo2(() => ({
    start,
    stop,
    cancel,
    isDragging,
    _subscribe: (subscriber) => {
      subscribersRef.current.add(subscriber);
      return () => {
        subscribersRef.current.delete(subscriber);
      };
    },
    _setDragHandler: (handler) => {
      listenerRef.current = handler;
    },
    _setStopHandler: (handler) => {
      stopRef.current = handler;
    },
    // Called by the dragged component when a gesture starts / ends, including
    // gestures started by its own pointer listener
    _notifyDragStart: () => {
      activeCountRef.current++;
      isDraggingRef.current = true;
    },
    _notifyDragEnd: () => {
      activeCountRef.current = Math.max(0, activeCountRef.current - 1);
      if (activeCountRef.current === 0) isDraggingRef.current = false;
    }
  }), [start, stop, cancel, isDragging]);
  return controls;
}

// src/adapters/react/hooks/useInstantTransition.ts
import { useCallback as useCallback7, useRef as useRef12, useTransition } from "react";
import { useState as useState6 } from "react";
function useInstantTransition() {
  const [isPending, startTransition] = useTransition();
  const startInstantTransition = useCallback7((callback) => {
    startTransition(() => {
      callback();
    });
  }, [startTransition]);
  return [startInstantTransition, isPending];
}
function useForceUpdate() {
  const [, setTick] = useState6(0);
  return useCallback7(() => {
    setTick((t) => t + 1);
  }, []);
}
function useLayoutMeasure() {
  const beforeRef = useRef12(null);
  const measureBefore = useCallback7((element) => {
    if (element) {
      beforeRef.current = element.getBoundingClientRect();
    }
  }, []);
  const measureAfter = useCallback7((element) => {
    if (element) {
      return element.getBoundingClientRect();
    }
    return null;
  }, []);
  const getLayoutDelta = useCallback7((element) => {
    if (!element || !beforeRef.current) {
      return { x: 0, y: 0, scaleX: 1, scaleY: 1 };
    }
    const after = element.getBoundingClientRect();
    const before = beforeRef.current;
    return {
      x: before.left - after.left,
      y: before.top - after.top,
      scaleX: before.width / after.width,
      scaleY: before.height / after.height
    };
  }, []);
  return { measureBefore, measureAfter, getLayoutDelta };
}

// src/adapters/react/hooks/useInView.ts
import { useState as useState7, useRef as useRef14, useEffect as useEffect11, useCallback as useCallback8 } from "react";

// src/adapters/react/utils/ssr.ts
import { useLayoutEffect, useEffect as useEffect9 } from "react";
var isBrowser = typeof window !== "undefined";
var isServer = !isBrowser;
var useIsomorphicLayoutEffect = isBrowser ? useLayoutEffect : useEffect9;
function shouldSkipAnimation() {
  if (isServer) return true;
  return false;
}
function safeRequestAnimationFrame(callback) {
  if (isBrowser && typeof requestAnimationFrame !== "undefined") {
    return requestAnimationFrame(callback);
  }
  return 0;
}
function safeCancelAnimationFrame(id) {
  if (isBrowser && typeof cancelAnimationFrame !== "undefined") {
    cancelAnimationFrame(id);
  }
}

// src/adapters/react/hooks/useElementEffect.ts
import { useEffect as useEffect10, useRef as useRef13 } from "react";
function sameDeps(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (!Object.is(a[i], b[i])) return false;
  }
  return true;
}
function useElementEffect(effect, getDeps) {
  const stateRef = useRef13(null);
  useEffect10(() => {
    const deps = getDeps();
    const previous = stateRef.current;
    if (previous && sameDeps(previous.deps, deps)) return;
    previous?.cleanup?.();
    stateRef.current = { deps, cleanup: void 0 };
    stateRef.current.cleanup = effect(deps) || void 0;
  });
  useEffect10(() => {
    const state = stateRef;
    return () => {
      state.current?.cleanup?.();
      state.current = null;
    };
  }, []);
}

// src/adapters/react/hooks/useInView.ts
function hasIntersectionObserver() {
  return typeof IntersectionObserver !== "undefined";
}
function useInView(options = {}) {
  const {
    once = false,
    amount = "some",
    margin = "0px",
    root
  } = options;
  const ref = useRef14(null);
  const [inView, setInView] = useState7(false);
  const [entry, setEntry] = useState7();
  const hasTriggered = useRef14(false);
  useElementEffect(() => {
    if (!isBrowser) return;
    const element = ref.current;
    if (!element) return;
    if (once && hasTriggered.current) return;
    if (!hasIntersectionObserver()) {
      hasTriggered.current = true;
      setInView(true);
      return;
    }
    let threshold;
    if (amount === "some") {
      threshold = 0;
    } else if (amount === "all") {
      threshold = 1;
    } else {
      threshold = amount;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const [observerEntry] = entries;
        if (observerEntry) {
          const isIntersecting = observerEntry.isIntersecting;
          setEntry(observerEntry);
          setInView(isIntersecting);
          if (isIntersecting && once) {
            hasTriggered.current = true;
            observer.disconnect();
          }
        }
      },
      {
        root: root?.current ?? null,
        rootMargin: margin,
        threshold
      }
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, () => [ref.current, root?.current ?? null, once, amount, margin]);
  return { ref, inView, entry };
}
function useInViewCallback(callback, options = {}) {
  const ref = useRef14(null);
  const callbackRef = useRef14(callback);
  const hasTriggered = useRef14(false);
  callbackRef.current = callback;
  const { once = false, amount = "some", margin = "0px", root } = options;
  useElementEffect(() => {
    if (!isBrowser) return;
    const element = ref.current;
    if (!element) return;
    if (once && hasTriggered.current) return;
    if (!hasIntersectionObserver()) return;
    let threshold;
    if (amount === "some") {
      threshold = 0;
    } else if (amount === "all") {
      threshold = 1;
    } else {
      threshold = amount;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          callbackRef.current(entry);
          if (once) {
            hasTriggered.current = true;
            observer.disconnect();
          }
        }
      },
      {
        root: root?.current ?? null,
        rootMargin: margin,
        threshold
      }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, () => [ref.current, root?.current ?? null, once, amount, margin]);
  return ref;
}
function useInViewMultiple(options = {}) {
  const elementsRef = useRef14(/* @__PURE__ */ new Map());
  const [inViewMap, setInViewMap] = useState7(/* @__PURE__ */ new Map());
  const observerRef = useRef14(null);
  const detachedRef = useRef14(/* @__PURE__ */ new Map());
  const triggeredRef = useRef14(/* @__PURE__ */ new Set());
  const { once = false, amount = "some", margin = "0px", root } = options;
  const onceRef = useRef14(once);
  onceRef.current = once;
  useEffect11(() => {
    if (!isBrowser || !hasIntersectionObserver()) return;
    let threshold;
    if (amount === "some") {
      threshold = 0;
    } else if (amount === "all") {
      threshold = 1;
    } else {
      threshold = amount;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const updates = [];
        entries.forEach((entry) => {
          const id = entry.target.dataset.inviewId;
          if (!id) return;
          updates.push([id, entry.isIntersecting]);
          if (entry.isIntersecting && once) {
            triggeredRef.current.add(id);
            observer.unobserve(entry.target);
          }
        });
        if (updates.length === 0) return;
        setInViewMap((prev) => {
          if (updates.every(([id, value]) => prev.get(id) === value)) return prev;
          const next = new Map(prev);
          updates.forEach(([id, value]) => next.set(id, value));
          return next;
        });
      },
      {
        root: root?.current ?? null,
        rootMargin: margin,
        threshold
      }
    );
    observerRef.current = observer;
    elementsRef.current.forEach((element, id) => {
      if (once && triggeredRef.current.has(id)) return;
      observer.observe(element);
    });
    return () => {
      observer.disconnect();
      if (observerRef.current === observer) {
        observerRef.current = null;
      }
    };
  }, [once, amount, margin, root]);
  const setRef = useCallback8((id, element) => {
    const elements = elementsRef.current;
    const detached = detachedRef.current;
    if (element) {
      const pending = detached.get(id);
      if (pending !== void 0) {
        detached.delete(id);
        if (pending === element) {
          elements.set(id, element);
          return;
        }
        observerRef.current?.unobserve(pending);
      }
      const existing2 = elements.get(id);
      if (existing2 === element) return;
      if (existing2) observerRef.current?.unobserve(existing2);
      element.dataset.inviewId = id;
      elements.set(id, element);
      if (!(onceRef.current && triggeredRef.current.has(id))) {
        observerRef.current?.observe(element);
      }
      return;
    }
    const existing = elements.get(id);
    if (!existing) return;
    elements.delete(id);
    detached.set(id, existing);
    queueMicrotask(() => {
      if (detached.get(id) !== existing) return;
      detached.delete(id);
      observerRef.current?.unobserve(existing);
      setInViewMap((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Map(prev);
        next.delete(id);
        return next;
      });
    });
  }, []);
  const getInView = (id) => {
    return inViewMap.get(id) ?? false;
  };
  return { setRef, getInView, inViewMap };
}

// src/adapters/react/hooks/useScroll.ts
import { useRef as useRef15, useEffect as useEffect12 } from "react";
import { createMotionValue as createMotionValue3 } from "@oxog/springkit";
function useScroll(options = {}) {
  const { target, container, offset = ["start start", "end end"], axis = "y" } = options;
  const [offsetStart, offsetEnd] = offset;
  const scrollXRef = useRef15(null);
  const scrollYRef = useRef15(null);
  const scrollXProgressRef = useRef15(null);
  const scrollYProgressRef = useRef15(null);
  if (scrollXRef.current === null || scrollXRef.current.isDestroyed()) {
    scrollXRef.current = createMotionValue3(0);
    scrollYRef.current = createMotionValue3(0);
    scrollXProgressRef.current = createMotionValue3(0);
    scrollYProgressRef.current = createMotionValue3(0);
  }
  useElementEffect(() => {
    if (!isBrowser) return;
    const scrollX = scrollXRef.current;
    const scrollY = scrollYRef.current;
    const scrollXProgress = scrollXProgressRef.current;
    const scrollYProgress = scrollYProgressRef.current;
    const containerEl = container?.current ?? null;
    const targetEl = target?.current ?? null;
    const scrollContainer = containerEl ?? window;
    const isWindow = scrollContainer === window;
    const getScrollPosition = () => {
      if (isWindow) {
        return {
          x: window.scrollX || window.pageXOffset,
          y: window.scrollY || window.pageYOffset
        };
      }
      const el = scrollContainer;
      return {
        x: el.scrollLeft,
        y: el.scrollTop
      };
    };
    const getScrollSize = () => {
      if (isWindow) {
        return {
          width: document.documentElement.scrollWidth - window.innerWidth,
          height: document.documentElement.scrollHeight - window.innerHeight
        };
      }
      const el = scrollContainer;
      return {
        width: el.scrollWidth - el.clientWidth,
        height: el.scrollHeight - el.clientHeight
      };
    };
    const calculateProgress = () => {
      const position = getScrollPosition();
      const size = getScrollSize();
      scrollX.jump(position.x);
      scrollY.jump(position.y);
      scrollXProgress.jump(size.width > 0 ? position.x / size.width : 0);
      scrollYProgress.jump(size.height > 0 ? position.y / size.height : 0);
    };
    const calculateTargetProgress = (targetEl2) => {
      const position = getScrollPosition();
      scrollX.jump(position.x);
      scrollY.jump(position.y);
      const rect = targetEl2.getBoundingClientRect();
      let viewStart = 0;
      let viewSize = axis === "x" ? window.innerWidth : window.innerHeight;
      if (containerEl) {
        const containerRect = containerEl.getBoundingClientRect();
        viewStart = axis === "x" ? containerRect.left : containerRect.top;
        viewSize = axis === "x" ? containerEl.clientWidth : containerEl.clientHeight;
      }
      const startPoint = parseOffset(offsetStart, rect, viewStart, viewSize, axis);
      const endPoint = parseOffset(offsetEnd, rect, viewStart, viewSize, axis);
      const range = startPoint - endPoint;
      const progress = range !== 0 ? startPoint / range : 0;
      const clampedProgress = Math.max(0, Math.min(1, progress));
      if (axis === "y") {
        scrollYProgress.jump(clampedProgress);
      } else {
        scrollXProgress.jump(clampedProgress);
      }
    };
    let rafId = null;
    let isActive = true;
    const handleScroll = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        if (!isActive) return;
        if (targetEl) {
          calculateTargetProgress(targetEl);
        } else {
          calculateProgress();
        }
        rafId = null;
      });
    };
    handleScroll();
    const scrollTarget = isWindow ? window : scrollContainer;
    scrollTarget.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    return () => {
      isActive = false;
      scrollTarget.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, () => [
    container?.current ?? null,
    target?.current ?? null,
    offsetStart,
    offsetEnd,
    axis,
    // Re-attach to recreated values (after a hidden <Activity> destroyed them)
    scrollXRef.current
  ]);
  useDestroyOnUnmount(() => {
    scrollXRef.current?.destroy();
    scrollYRef.current?.destroy();
    scrollXProgressRef.current?.destroy();
    scrollYProgressRef.current?.destroy();
  });
  return {
    scrollX: scrollXRef.current,
    scrollY: scrollYRef.current,
    scrollXProgress: scrollXProgressRef.current,
    scrollYProgress: scrollYProgressRef.current
  };
}
function parseOffset(offset, rect, viewStart, viewSize, axis) {
  const parts = offset.split(" ");
  const elementPart = parts[0] || "start";
  const viewportPart = parts[1] || "start";
  const elementStart = axis === "x" ? rect.left : rect.top;
  const elementSize = axis === "x" ? rect.width : rect.height;
  let elementPos;
  if (elementPart === "start") {
    elementPos = elementStart;
  } else if (elementPart === "center") {
    elementPos = elementStart + elementSize / 2;
  } else if (elementPart === "end") {
    elementPos = elementStart + elementSize;
  } else if (elementPart.endsWith("px")) {
    elementPos = elementStart + parseFloat(elementPart);
  } else if (elementPart.endsWith("%")) {
    elementPos = elementStart + elementSize * parseFloat(elementPart) / 100;
  } else {
    elementPos = elementStart;
  }
  let viewportPos;
  if (viewportPart === "start") {
    viewportPos = 0;
  } else if (viewportPart === "center") {
    viewportPos = viewSize / 2;
  } else if (viewportPart === "end") {
    viewportPos = viewSize;
  } else if (viewportPart.endsWith("px")) {
    viewportPos = parseFloat(viewportPart);
  } else if (viewportPart.endsWith("%")) {
    viewportPos = viewSize * parseFloat(viewportPart) / 100;
  } else {
    viewportPos = 0;
  }
  return viewStart + viewportPos - elementPos;
}
function useScrollVelocity(axis = "y") {
  const velocityRef = useRef15(null);
  if (velocityRef.current === null || velocityRef.current.isDestroyed()) {
    velocityRef.current = createMotionValue3(0);
  }
  const velocityValue = velocityRef.current;
  useEffect12(() => {
    if (!isBrowser) return;
    const velocity = velocityValue;
    const readScroll = () => axis === "y" ? window.scrollY || window.pageYOffset : window.scrollX || window.pageXOffset;
    let lastScroll = readScroll();
    let lastTime = performance.now();
    let idleTimer = null;
    const handleScroll = () => {
      const now2 = performance.now();
      const currentScroll = readScroll();
      const deltaTime = now2 - lastTime;
      const deltaScroll = currentScroll - lastScroll;
      if (deltaTime > 0) {
        velocity.jump(deltaScroll / deltaTime * 1e3);
      }
      lastScroll = currentScroll;
      lastTime = now2;
      if (idleTimer !== null) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        idleTimer = null;
        velocity.jump(0);
      }, SCROLL_VELOCITY_IDLE_MS);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (idleTimer !== null) clearTimeout(idleTimer);
    };
  }, [axis, velocityValue]);
  useDestroyOnUnmount(() => {
    velocityRef.current?.destroy();
  });
  return velocityRef.current;
}
var SCROLL_VELOCITY_IDLE_MS = 100;

// src/adapters/react/hooks/useGestureState.ts
import {
  useState as useState8,
  useRef as useRef16,
  useEffect as useEffect13
} from "react";
function useGestureState(options = {}) {
  const {
    hover = true,
    press = true,
    focus = true,
    drag = false
  } = options;
  const ref = useRef16(null);
  const [state, setState] = useState8({
    isHovered: false,
    isPressed: false,
    isFocused: false,
    isDragging: false
  });
  const handlers = {
    ...hover && {
      onMouseEnter: () => setState((s) => ({ ...s, isHovered: true })),
      onMouseLeave: () => setState((s) => ({ ...s, isHovered: false, isPressed: false }))
    },
    ...press && {
      onMouseDown: () => setState((s) => ({ ...s, isPressed: true })),
      onMouseUp: () => setState((s) => ({ ...s, isPressed: false })),
      onTouchStart: () => setState((s) => ({ ...s, isPressed: true })),
      onTouchEnd: () => setState((s) => ({ ...s, isPressed: false }))
    },
    ...focus && {
      onFocus: () => setState((s) => ({ ...s, isFocused: true })),
      onBlur: () => setState((s) => ({ ...s, isFocused: false }))
    },
    ...drag && {
      onDragStart: () => setState((s) => ({ ...s, isDragging: true })),
      onDragEnd: () => setState((s) => ({ ...s, isDragging: false }))
    }
  };
  useEffect13(() => {
    if (!press || !isBrowser) return;
    const handleGlobalMouseUp = () => {
      setState((s) => s.isPressed ? { ...s, isPressed: false } : s);
    };
    window.addEventListener("mouseup", handleGlobalMouseUp);
    window.addEventListener("touchend", handleGlobalMouseUp);
    return () => {
      window.removeEventListener("mouseup", handleGlobalMouseUp);
      window.removeEventListener("touchend", handleGlobalMouseUp);
    };
  }, [press]);
  return {
    ref,
    ...state,
    handlers
  };
}
function useHover() {
  const ref = useRef16(null);
  const [isHovered, setIsHovered] = useState8(false);
  const handlers = {
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false)
  };
  return { ref, isHovered, handlers };
}
function useTap() {
  const ref = useRef16(null);
  const [isPressed, setIsPressed] = useState8(false);
  const handlers = {
    onMouseDown: () => setIsPressed(true),
    onMouseUp: () => setIsPressed(false),
    onMouseLeave: () => setIsPressed(false),
    onTouchStart: () => setIsPressed(true),
    onTouchEnd: () => setIsPressed(false)
  };
  useEffect13(() => {
    if (!isBrowser) return;
    const handleUp = () => setIsPressed(false);
    window.addEventListener("mouseup", handleUp);
    window.addEventListener("touchend", handleUp);
    return () => {
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("touchend", handleUp);
    };
  }, []);
  return { ref, isPressed, handlers };
}
function useFocus() {
  const ref = useRef16(null);
  const [isFocused, setIsFocused] = useState8(false);
  const handlers = {
    onFocus: () => setIsFocused(true),
    onBlur: () => setIsFocused(false)
  };
  return { ref, isFocused, handlers };
}
function useInteractionState() {
  const { ref, isHovered, isPressed, isFocused, handlers } = useGestureState({
    hover: true,
    press: true,
    focus: true
  });
  const activeState = isPressed ? "pressed" : isHovered ? "hovered" : isFocused ? "focused" : "default";
  return { ref, isHovered, isPressed, isFocused, activeState, handlers };
}
function useGestureAnimation(states) {
  const { ref, isHovered, isPressed, isFocused, handlers } = useGestureState({
    hover: !!states.hover,
    press: !!states.press,
    focus: !!states.focus
  });
  const currentValues = { ...states.default };
  if (isFocused && states.focus) {
    Object.assign(currentValues, states.focus);
  }
  if (isHovered && states.hover) {
    Object.assign(currentValues, states.hover);
  }
  if (isPressed && states.press) {
    Object.assign(currentValues, states.press);
  }
  return {
    ref,
    handlers,
    isHovered,
    isPressed,
    isFocused,
    ...currentValues
  };
}

// src/adapters/react/hooks/useReducedMotion.ts
import { useSyncExternalStore } from "react";
var REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
function noop() {
}
function subscribeToReducedMotion(onChange) {
  if (!isBrowser || typeof window.matchMedia !== "function") return noop;
  const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
  if (!mediaQuery) return noop;
  if (typeof mediaQuery.addEventListener === "function") {
    mediaQuery.addEventListener("change", onChange);
    return () => mediaQuery.removeEventListener("change", onChange);
  }
  mediaQuery.addListener?.(onChange);
  return () => mediaQuery.removeListener?.(onChange);
}
function getServerReducedMotion() {
  return false;
}
function useReducedMotion() {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionPreference,
    getServerReducedMotion
  );
}
function getReducedMotionPreference() {
  if (!isBrowser || typeof window.matchMedia !== "function") return false;
  return window.matchMedia(REDUCED_MOTION_QUERY)?.matches ?? false;
}
function useReducedMotionConfig(configs) {
  const prefersReducedMotion2 = useReducedMotion();
  return prefersReducedMotion2 ? configs.reduced : configs.default;
}
function useShouldAnimate() {
  return !useReducedMotion();
}
function useReducedMotionValue(animatedValue, reducedValue) {
  const prefersReducedMotion2 = useReducedMotion();
  return prefersReducedMotion2 ? reducedValue : animatedValue;
}

// src/adapters/react/hooks/useScrollLinked.ts
import { useRef as useRef17, useState as useState9 } from "react";
import {
  createScrollProgress,
  createParallax,
  createScrollTrigger,
  createScrollLinkedValue
} from "@oxog/springkit";
function useScrollProgress(options = {}) {
  const { target, offset, smooth } = options;
  const smoothKey = JSON.stringify(smooth ?? null);
  const [progress, setProgress] = useState9(0);
  const [info, setInfo] = useState9({
    progress: 0,
    scrollY: 0,
    velocity: 0,
    direction: 0,
    isInView: true,
    visibleRatio: 1
  });
  const scrollProgressRef = useRef17(null);
  useElementEffect(() => {
    const element = target?.current ?? null;
    const scrollProgress = createScrollProgress(element, { offset, smooth });
    scrollProgressRef.current = scrollProgress;
    const unsubscribe = scrollProgress.subscribe((scrollInfo) => {
      setProgress(scrollInfo.progress);
      setInfo(scrollInfo);
    });
    return () => {
      unsubscribe();
      scrollProgress.destroy();
    };
  }, () => [target?.current ?? null, offset?.[0], offset?.[1], smoothKey]);
  return {
    progress,
    info,
    scrollProgress: scrollProgressRef.current
  };
}
function useParallax(options = {}) {
  const ref = useRef17(null);
  const [offset, setOffset] = useState9(0);
  const optionsRef = useRef17(options);
  optionsRef.current = options;
  useElementEffect(() => {
    if (!ref.current) return;
    const parallax = createParallax(ref.current, optionsRef.current);
    let rafId = null;
    let isActive = true;
    const update = () => {
      if (!isActive) return;
      setOffset(parallax.getOffset());
      rafId = requestAnimationFrame(update);
    };
    rafId = requestAnimationFrame(update);
    return () => {
      isActive = false;
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      parallax.destroy();
    };
  }, () => [ref.current, options.speed, options.direction, options.rootMargin]);
  return { ref, offset };
}
function useScrollTrigger(options = {}) {
  const ref = useRef17(null);
  const [isActive, setIsActive] = useState9(false);
  const [progress, setProgress] = useState9(0);
  const [hasEntered, setHasEntered] = useState9(false);
  const optionsRef = useRef17(options);
  optionsRef.current = options;
  useElementEffect(() => {
    if (!ref.current) return;
    const trigger = createScrollTrigger(ref.current, {
      ...optionsRef.current,
      onEnter: () => setHasEntered(true),
      onProgress: (info) => {
        setIsActive(info.progress > 0 && info.progress < 1);
        setProgress(info.progress);
      }
    });
    return () => trigger.destroy();
  }, () => [
    ref.current,
    options.start,
    options.end,
    options.startOffset,
    options.endOffset,
    options.once,
    options.scrub
  ]);
  return { ref, isActive, progress, hasEntered };
}
function useScrollLinkedValue(scrollProgress, config) {
  const [value, setValue] = useState9(config.outputRange[0] ?? 0);
  const configRef = useRef17(config);
  configRef.current = config;
  const inputRangeKey = JSON.stringify(config.inputRange);
  const outputRangeKey = JSON.stringify(config.outputRange);
  const smoothKey = JSON.stringify(config.smooth ?? null);
  useIsomorphicLayoutEffect(() => {
    if (!scrollProgress) return;
    const linkedValue = createScrollLinkedValue(scrollProgress, configRef.current);
    const unsubscribe = linkedValue.subscribe((newValue) => {
      setValue(newValue);
    });
    return () => {
      unsubscribe();
      linkedValue.destroy();
    };
  }, [scrollProgress, inputRangeKey, outputRangeKey, config.clamp, smoothKey]);
  return value;
}

// src/adapters/react/hooks/useTimeline.ts
import { useRef as useRef18, useCallback as useCallback9, useMemo as useMemo3, useState as useState10 } from "react";
import {
  createTimeline
} from "@oxog/springkit";
function useTimeline(options = {}) {
  const timelineRef = useRef18(null);
  const [timeline, setTimeline] = useState10(null);
  const optionsRef = useRef18(options);
  optionsRef.current = options;
  useIsomorphicLayoutEffect(() => {
    const instance = createTimeline(optionsRef.current);
    timelineRef.current = instance;
    setTimeline(instance);
    return () => {
      instance.kill();
      if (timelineRef.current === instance) {
        timelineRef.current = null;
      }
    };
  }, []);
  const play = useCallback9(() => {
    timelineRef.current?.play();
  }, []);
  const pause = useCallback9(() => {
    timelineRef.current?.pause();
  }, []);
  const resume = useCallback9(() => {
    timelineRef.current?.resume();
  }, []);
  const reverse = useCallback9(() => {
    timelineRef.current?.reverse();
  }, []);
  const restart = useCallback9(() => {
    timelineRef.current?.restart();
  }, []);
  const seek = useCallback9((position) => {
    timelineRef.current?.seek(position);
  }, []);
  const seekProgress = useCallback9((progress) => {
    const instance = timelineRef.current;
    if (!instance || !Number.isFinite(progress)) return;
    const clamped = Math.min(1, Math.max(0, progress));
    instance.seek(clamped * instance.duration());
  }, []);
  const kill = useCallback9(() => {
    timelineRef.current?.kill();
  }, []);
  const returnValue = useMemo3(() => {
    const result = {
      timeline,
      play,
      pause,
      resume,
      reverse,
      restart,
      seek,
      seekProgress,
      kill,
      get isPlaying() {
        return timelineRef.current?.isPlaying() ?? false;
      },
      get isPaused() {
        return !(timelineRef.current?.isPlaying() ?? false);
      },
      get progress() {
        return timelineRef.current?.progress() ?? 0;
      },
      to: (target, props, position) => {
        timelineRef.current?.to(target, props, position);
        return result;
      },
      from: (target, props, position) => {
        timelineRef.current?.from(target, props, position);
        return result;
      },
      fromTo: (target, fromProps, toProps, position) => {
        timelineRef.current?.fromTo(target, fromProps, toProps, position);
        return result;
      },
      addLabel: (label, position) => {
        timelineRef.current?.addLabel(label, position);
        return result;
      }
    };
    return result;
  }, [timeline, play, pause, resume, reverse, restart, seek, seekProgress, kill]);
  return returnValue;
}
function useTimelineState(timeline) {
  const [state, setState] = useState10({
    progress: 0,
    isPlaying: false,
    isPaused: true,
    isReversed: false
  });
  useIsomorphicLayoutEffect(() => {
    if (!timeline) return;
    const updateState = () => {
      const isPlaying = timeline.isPlaying();
      const next = {
        progress: timeline.progress(),
        isPlaying,
        isPaused: !isPlaying,
        isReversed: timeline.isReversed()
      };
      setState(
        (prev) => prev.progress === next.progress && prev.isPlaying === next.isPlaying && prev.isPaused === next.isPaused && prev.isReversed === next.isReversed ? prev : next
      );
    };
    updateState();
    let currentRafId = null;
    let isActive = true;
    const tick = () => {
      if (!isActive) return;
      updateState();
      currentRafId = requestAnimationFrame(tick);
    };
    currentRafId = requestAnimationFrame(tick);
    return () => {
      isActive = false;
      if (currentRafId !== null) {
        cancelAnimationFrame(currentRafId);
        currentRafId = null;
      }
    };
  }, [timeline]);
  return state;
}

// src/adapters/react/hooks/useMorph.ts
import { useState as useState11, useRef as useRef19, useCallback as useCallback10 } from "react";
import {
  createMorph,
  createMorphSequence
} from "@oxog/springkit";
function useMorph(initialPath, options = {}) {
  const [path, setPath] = useState11(initialPath);
  const [progress, setProgressState] = useState11(0);
  const morphRef = useRef19(null);
  const activeRef = useRef19(null);
  const isMountedRef = useRef19(false);
  const optionsRef = useRef19(options);
  optionsRef.current = options;
  if (morphRef.current === null || morphRef.current.path !== initialPath) {
    morphRef.current = {
      path: initialPath,
      controller: createMorph(initialPath, {
        ...optionsRef.current,
        onProgress: (p) => {
          if (!isMountedRef.current) return;
          setProgressState(p);
          optionsRef.current.onProgress?.(p);
        }
      })
    };
  }
  const controller = morphRef.current.controller;
  useIsomorphicLayoutEffect(() => {
    const morph = morphRef.current?.controller;
    if (!morph) return;
    if (activeRef.current !== null && activeRef.current !== morph) {
      activeRef.current.destroy();
    }
    activeRef.current = morph;
    isMountedRef.current = true;
    const unsubscribe = morph.subscribe((newPath) => {
      if (!isMountedRef.current) return;
      setPath(newPath);
    });
    return () => {
      isMountedRef.current = false;
      unsubscribe();
    };
  }, [initialPath, controller]);
  useDestroyOnUnmount(() => {
    const current = morphRef.current?.controller ?? null;
    current?.destroy();
    if (activeRef.current !== current) activeRef.current?.destroy();
    morphRef.current = null;
    activeRef.current = null;
  });
  const morphTo = useCallback10((targetPath) => {
    morphRef.current?.controller.morphTo(targetPath);
  }, []);
  const setProgress = useCallback10((p) => {
    morphRef.current?.controller.setProgress(p);
  }, []);
  return {
    path,
    progress,
    morphTo,
    setProgress,
    controller
  };
}
function useMorphSequence(paths, options = {}) {
  const [path, setPath] = useState11(paths[0] ?? "");
  const [currentIndex, setCurrentIndex] = useState11(0);
  const isMountedRef = useRef19(false);
  const sequenceRef = useRef19(null);
  const optionsRef = useRef19(options);
  optionsRef.current = options;
  const pathsKey = paths.join("|");
  useIsomorphicLayoutEffect(() => {
    if (paths.length === 0) return;
    isMountedRef.current = true;
    const sequence = createMorphSequence(paths, optionsRef.current);
    const unsubscribe = sequence.subscribe((newPath) => {
      if (!isMountedRef.current) return;
      setPath(newPath);
      setCurrentIndex(sequence.getCurrentIndex());
    });
    sequenceRef.current = sequence;
    return () => {
      isMountedRef.current = false;
      unsubscribe();
      sequence.destroy();
    };
  }, [pathsKey]);
  const morphToIndex = useCallback10((index) => {
    sequenceRef.current?.morphToIndex(index);
  }, []);
  const morphToNext = useCallback10(() => {
    sequenceRef.current?.morphToNext();
  }, []);
  const morphToPrevious = useCallback10(() => {
    sequenceRef.current?.morphToPrevious();
  }, []);
  return {
    path,
    currentIndex,
    morphToIndex,
    morphToNext,
    morphToPrevious
  };
}
function useMorphRef(initialPath, options = {}) {
  const [progress, setProgressState] = useState11(0);
  const morphRef = useRef19(null);
  const elementRef = useRef19(null);
  const unsubscribeRef = useRef19(null);
  const optionsRef = useRef19(options);
  optionsRef.current = options;
  const pathRef = useCallback10(
    (element) => {
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
      if (!element) {
        morphRef.current?.destroy();
        morphRef.current = null;
        elementRef.current = null;
        return;
      }
      elementRef.current = element;
      const morph = createMorph(initialPath, {
        ...optionsRef.current,
        onProgress: (p) => {
          setProgressState(p);
          optionsRef.current.onProgress?.(p);
        }
      });
      unsubscribeRef.current = morph.subscribe((path) => {
        element.setAttribute("d", path);
      });
      morphRef.current = morph;
    },
    [initialPath]
  );
  const morphTo = useCallback10((targetPath) => {
    morphRef.current?.morphTo(targetPath);
  }, []);
  const setProgress = useCallback10((p) => {
    morphRef.current?.setProgress(p);
  }, []);
  return {
    pathRef,
    morphTo,
    setProgress,
    progress
  };
}

// src/adapters/react/hooks/useLayoutAnimation.ts
import { useRef as useRef20, useCallback as useCallback11, useState as useState12, createContext as createContext2 } from "react";
import * as React from "react";
import {
  createLayoutGroup,
  createSharedLayoutContext,
  createAutoLayout,
  measureElement,
  flip,
  createFlip
} from "@oxog/springkit";
var LayoutGroupContext = createContext2(null);
var SharedLayoutContextReact = createContext2(null);
function useLayoutGroup(options = {}) {
  const [layoutGroup] = useState12(() => createLayoutGroup(options));
  useDestroyOnUnmount(() => {
    layoutGroup.destroy();
  });
  const register = useCallback11((id, element) => {
    layoutGroup.register(id, element);
  }, [layoutGroup]);
  const unregister = useCallback11((id, element) => {
    layoutGroup.unregister(id, element);
  }, [layoutGroup]);
  const update = useCallback11(() => {
    layoutGroup.update();
  }, [layoutGroup]);
  const forceUpdate = useCallback11(() => {
    layoutGroup.forceUpdate();
  }, [layoutGroup]);
  return {
    register,
    unregister,
    update,
    forceUpdate,
    layoutGroup
  };
}
function useLayoutId(layoutId, options = {}) {
  const { group, ...config } = options;
  const elementRef = useRef20(null);
  const [localGroup] = useState12(() => createLayoutGroup(config));
  useDestroyOnUnmount(() => {
    localGroup.destroy();
  });
  const ref = useCallback11(
    (element) => {
      const activeGroup = group ?? localGroup;
      if (elementRef.current && activeGroup) {
        activeGroup.unregister(layoutId, elementRef.current);
      }
      elementRef.current = element;
      if (element && activeGroup) {
        activeGroup.register(layoutId, element);
      }
    },
    [layoutId, group, localGroup]
  );
  const update = useCallback11(() => {
    const activeGroup = group ?? localGroup;
    activeGroup.update();
  }, [group, localGroup]);
  return { ref, update };
}
function useFlip(options = {}) {
  const elementRef = useRef20(null);
  const lastMeasurementRef = useRef20(null);
  const optionsRef = useRef20(options);
  optionsRef.current = options;
  const ref = useCallback11((element) => {
    if (element) {
      lastMeasurementRef.current = measureElement(element);
    }
    elementRef.current = element;
  }, []);
  const flipFn = useCallback11(async (mutate) => {
    const element = elementRef.current;
    if (!element) return;
    if (mutate) {
      await flip(element, mutate, optionsRef.current);
    } else {
      const first = lastMeasurementRef.current ?? measureElement(element);
      const last = measureElement(element);
      await createFlip(element, first, last, optionsRef.current).play();
    }
    if (elementRef.current) {
      lastMeasurementRef.current = measureElement(elementRef.current);
    }
  }, []);
  const measure = useCallback11(() => {
    if (!elementRef.current) return null;
    return measureElement(elementRef.current);
  }, []);
  return { ref, flip: flipFn, measure };
}
function useAutoLayout(options = {}) {
  const autoLayoutRef = useRef20(null);
  const optionsRef = useRef20(options);
  optionsRef.current = options;
  const containerRef = useCallback11((element) => {
    if (autoLayoutRef.current) {
      autoLayoutRef.current.destroy();
      autoLayoutRef.current = null;
    }
    if (element) {
      const currentOptions = optionsRef.current;
      autoLayoutRef.current = createAutoLayout({
        ...currentOptions,
        root: currentOptions.root ?? element
      });
    }
  }, []);
  const update = useCallback11(() => {
    autoLayoutRef.current?.update();
  }, []);
  const forceUpdate = useCallback11(() => {
    autoLayoutRef.current?.forceUpdate();
  }, []);
  return { containerRef, update, forceUpdate };
}
function LayoutGroupProvider({
  children,
  config
}) {
  const [layoutGroup] = useState12(() => createLayoutGroup(config));
  useDestroyOnUnmount(() => {
    layoutGroup.destroy();
  });
  return React.createElement(
    LayoutGroupContext.Provider,
    { value: layoutGroup },
    children
  );
}
function SharedLayoutProvider({
  children
}) {
  const [sharedContext] = useState12(() => createSharedLayoutContext());
  useDestroyOnUnmount(() => {
    sharedContext.destroy();
  });
  return React.createElement(
    SharedLayoutContextReact.Provider,
    { value: sharedContext },
    children
  );
}

// src/adapters/react/hooks/useVariants.ts
import { useRef as useRef22, useCallback as useCallback13, useEffect as useEffect15, useMemo as useMemo4, useState as useState14, createContext as createContext3, useContext as useContext2 } from "react";
import * as React2 from "react";
import {
  getVariant,
  calculateStaggerDelays,
  buildTransformString,
  isTransformProperty,
  solveSpring,
  delay as delay3
} from "@oxog/springkit";

// src/adapters/react/utils/useAnimatableValues.ts
import { useCallback as useCallback12, useEffect as useEffect14, useRef as useRef21, useState as useState13 } from "react";
import { createSpringGroup as createSpringGroup3 } from "@oxog/springkit";

// src/adapters/react/utils/animatable.ts
import { isColorString as isColorString2, parseColorRGBA as parseColorRGBA2, formatRGBA as formatRGBA2 } from "@oxog/springkit";
var NUMERIC_TEMPLATE = {
  id: "number",
  numeric: true,
  parts: ["", ""],
  kinds: ["n"],
  size: 1
};
var TOKEN_REGEX = /\burl\([^)]*\)|#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})\b|(?:rgba?|hsla?)\([^)]*\)|[a-z][a-z0-9-]*|[-+]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/gi;
var ALPHA_EPSILON = 1e-6;
function parseString(value) {
  const parts = [];
  const kinds = [];
  const channels = [];
  const colors = [];
  let literal = "";
  let last = 0;
  for (const match of value.matchAll(TOKEN_REGEX)) {
    const text = match[0];
    const index = match.index ?? 0;
    const first = text.charCodeAt(0);
    const isNumber = first >= 48 && first <= 57 || text[0] === "." || text[0] === "-" || text[0] === "+";
    let color = null;
    if (!isNumber) {
      const isFunction = text.endsWith(")");
      const nested = isFunction && text.indexOf("(") !== text.lastIndexOf("(");
      const isCall = !isFunction && value[index + text.length] === "(";
      if (!nested && !isCall && isColorString2(text)) color = parseColorRGBA2(text);
      if (!color) continue;
    }
    literal += value.slice(last, index);
    parts.push(literal);
    literal = "";
    last = index + text.length;
    if (color) {
      kinds.push("c");
      const a = Math.max(0, Math.min(1, color.a));
      channels.push(color.r * a, color.g * a, color.b * a, a);
      colors.push(color);
    } else {
      kinds.push("n");
      channels.push(parseFloat(text));
      colors.push(void 0);
    }
  }
  literal += value.slice(last);
  parts.push(literal);
  return {
    raw: value,
    template: {
      id: `${kinds.join("")}${parts.join("")}`,
      numeric: false,
      parts,
      kinds,
      size: channels.length
    },
    channels,
    colors
  };
}
var cache = /* @__PURE__ */ new Map();
var CACHE_LIMIT = 500;
function parseAnimatableValue(value) {
  if (typeof value === "number") {
    return { raw: value, template: NUMERIC_TEMPLATE, channels: [value], colors: [] };
  }
  let parsed = cache.get(value);
  if (!parsed) {
    parsed = parseString(value);
    if (cache.size >= CACHE_LIMIT) cache.clear();
    cache.set(value, parsed);
  }
  return parsed;
}
var formatNumber2 = (value) => String(Math.round(value * 1e6) / 1e6 || 0);
function composeAnimatableValue(target, channels) {
  const { template } = target;
  if (template.numeric) return channels[0] ?? target.raw;
  let exact = true;
  for (let i = 0; i < template.size; i++) {
    const value = channels[i];
    if (value === void 0) return target.raw;
    if (value !== target.channels[i]) exact = false;
  }
  if (exact) return target.raw;
  let result = template.parts[0] ?? "";
  let c = 0;
  for (let i = 0; i < template.kinds.length; i++) {
    if (template.kinds[i] === "n") {
      result += formatNumber2(channels[c]);
      c += 1;
    } else {
      const alpha = channels[c + 3];
      if (alpha <= ALPHA_EPSILON) {
        const color = target.colors[i] ?? { r: 0, g: 0, b: 0, a: 0 };
        result += formatRGBA2({ r: color.r, g: color.g, b: color.b, a: 0 });
      } else {
        result += formatRGBA2({
          r: channels[c] / alpha,
          g: channels[c + 1] / alpha,
          b: channels[c + 2] / alpha,
          a: alpha
        });
      }
      c += 4;
    }
    result += template.parts[i + 1] ?? "";
  }
  return result;
}
function hiddenChannelKey(key, index) {
  return `\0${key}\0${index}`;
}
var defaultChannelKeysOf = (key, value) => {
  if (value.template.numeric) return [key];
  const keys = [];
  for (let i = 0; i < value.template.size; i++) keys.push(hiddenChannelKey(key, i));
  return keys;
};
function parseAnimatableRecord(values) {
  const result = {};
  for (const key in values) result[key] = parseAnimatableValue(values[key]);
  return result;
}
function channelValuesOf(values, keysOf) {
  const result = {};
  for (const key in values) {
    const value = values[key];
    const keys = keysOf(key, value);
    for (let i = 0; i < keys.length; i++) result[keys[i]] = value.channels[i];
  }
  return result;
}
function composeAnimatableRecord(values, channels, keysOf) {
  const result = {};
  for (const key in values) {
    const value = values[key];
    result[key] = composeAnimatableValue(
      value,
      keysOf(key, value).map((channelKey) => channels[channelKey])
    );
  }
  return result;
}
function animatableSignature(values) {
  let signature = "";
  for (const key in values) {
    const value = values[key];
    signature += `${key}${typeof value === "number" ? "n" : "s"}${String(value)}`;
  }
  return signature;
}
function planTransition(from, to, keysOf, instant) {
  const plan = { jump: {}, set: {}, structural: false };
  for (const key in to) {
    const next = to[key];
    const previous = from[key];
    const sameTemplate = previous !== void 0 && previous.template.id === next.template.id;
    if (!sameTemplate) plan.structural = true;
    const destination = sameTemplate && !instant ? plan.set : plan.jump;
    const keys = keysOf(key, next);
    for (let i = 0; i < keys.length; i++) destination[keys[i]] = next.channels[i];
  }
  for (const key in from) {
    if (!(key in to)) plan.structural = true;
  }
  return plan;
}
function hasKeys(record) {
  for (const _ in record) return true;
  return false;
}

// src/adapters/react/utils/useAnimatableValues.ts
function sameChannels(a, b) {
  const keys = Object.keys(a);
  if (keys.length !== Object.keys(b).length) return false;
  return keys.every((key) => a[key] === b[key]);
}
function useAnimatableValues(target, physics) {
  const [state, setState] = useState13(() => {
    const values = parseAnimatableRecord(target);
    return { values, channels: channelValuesOf(values, defaultChannelKeysOf) };
  });
  const shownRef = useRef21(state);
  const appliedRef = useRef21(state.values);
  const signatureRef = useRef21(null);
  if (signatureRef.current === null) signatureRef.current = animatableSignature(target);
  const springRef = useRef21(null);
  const unsubscribeRef = useRef21(null);
  const latestRef = useRef21(state.channels);
  const mountedRef = useRef21(false);
  const physicsRef = useRef21(physics);
  physicsRef.current = physics;
  const show = useCallback12((values, channels) => {
    const shown = shownRef.current;
    if (shown.values === values && sameChannels(shown.channels, channels)) return;
    const next = { values, channels };
    shownRef.current = next;
    if (mountedRef.current) setState(next);
  }, []);
  useEffect14(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);
  useDestroyOnUnmount(() => {
    unsubscribeRef.current?.();
    unsubscribeRef.current = null;
    springRef.current?.destroy();
    springRef.current = null;
  });
  const ensureGroup = useCallback12(
    (keys, startAt) => {
      const current = springRef.current;
      if (current && !current.isDestroyed() && keys.every((key) => key in latestRef.current)) {
        return current;
      }
      const start = {};
      for (const key of keys) start[key] = latestRef.current[key] ?? startAt[key] ?? 0;
      unsubscribeRef.current?.();
      current?.destroy();
      const group = createSpringGroup3(start);
      springRef.current = group;
      latestRef.current = start;
      unsubscribeRef.current = group.subscribe((channels) => {
        latestRef.current = channels;
        show(appliedRef.current, channels);
      });
      return group;
    },
    [show]
  );
  useEffect14(() => {
    const signature = animatableSignature(target);
    if (signature === signatureRef.current) return;
    signatureRef.current = signature;
    const next = parseAnimatableRecord(target);
    const plan = planTransition(appliedRef.current, next, defaultChannelKeysOf, false);
    const nextChannels = channelValuesOf(next, defaultChannelKeysOf);
    const keys = Object.keys(nextChannels);
    const spring2 = keys.length > 0 ? ensureGroup(keys, plan.jump) : springRef.current;
    appliedRef.current = next;
    if (spring2) {
      if (hasKeys(plan.jump)) spring2.jump(plan.jump);
      if (hasKeys(plan.set)) {
        const { stiffness, damping, mass } = physicsRef.current;
        spring2.set(plan.set, { stiffness, damping, mass });
      }
    }
    if (plan.structural || hasKeys(plan.jump)) {
      show(next, spring2 ? spring2.get() : {});
    }
  });
  return composeAnimatableRecord(state.values, state.channels, defaultChannelKeysOf);
}

// src/adapters/react/hooks/useVariants.ts
var DEFAULT_PHYSICS = { stiffness: 100, damping: 15, mass: 1 };
var DEFAULT_VALUES = {
  x: 0,
  y: 0,
  scale: 1,
  scaleX: 1,
  scaleY: 1,
  rotate: 0,
  opacity: 1
};
function settleTime(spring2) {
  const duration = solveSpring(
    {
      stiffness: spring2.stiffness ?? DEFAULT_PHYSICS.stiffness,
      damping: spring2.damping ?? DEFAULT_PHYSICS.damping,
      mass: spring2.mass ?? DEFAULT_PHYSICS.mass
    },
    0,
    1
  ).duration;
  return Math.min(duration, 1e4);
}
var PX_REGEX = /^\s*(-?(?:\d+\.?\d*|\.\d+))px\s*$/;
function toAnimatable(values, fallback) {
  const result = { ...DEFAULT_VALUES };
  for (const source of [fallback, values]) {
    if (!source) continue;
    for (const key in source) {
      const value = source[key];
      if (key === "transition" || typeof value !== "number" && typeof value !== "string") continue;
      const px = (key === "x" || key === "y") && typeof value === "string" ? PX_REGEX.exec(value) : null;
      result[key] = px ? parseFloat(px[1]) : value;
    }
  }
  return result;
}
var VariantContext = createContext3({
  variant: void 0
});
function useVariantContext() {
  return useContext2(VariantContext);
}
function useVariants(options) {
  const {
    variants,
    animate,
    initial,
    custom,
    inherit = true,
    spring: springConfig,
    onAnimationComplete
  } = options;
  const parentContext = useVariantContext();
  const currentVariantRef = useRef22(void 0);
  const isAnimatingRef = useRef22(false);
  const [variantOverride, setVariantOverride] = useState14(null);
  const animateRef = useRef22(animate);
  animateRef.current = animate;
  const overrideName = variantOverride && variantOverride.animate === animate ? variantOverride.name : void 0;
  const targetVariant = useMemo4(() => {
    if (overrideName !== void 0) {
      return overrideName;
    }
    if (typeof animate === "string") {
      return animate;
    }
    if (inherit && parentContext.variant) {
      return parentContext.variant;
    }
    return void 0;
  }, [overrideName, animate, inherit, parentContext.variant]);
  const initialValues = useMemo4(() => {
    if (initial === false) {
      return getVariant(variants, targetVariant, custom).values;
    }
    if (typeof initial === "string") {
      return getVariant(variants, initial, custom).values;
    }
    if (typeof initial === "object") {
      return initial;
    }
    return {};
  }, [initial, variants, targetVariant, custom]);
  const targetValues = useMemo4(() => {
    if (typeof animate === "object" && overrideName === void 0) {
      return animate;
    }
    if (targetVariant && variants) {
      return getVariant(variants, targetVariant, custom).values;
    }
    return initialValues;
  }, [animate, overrideName, targetVariant, variants, custom, initialValues]);
  const transition = useMemo4(() => {
    if (targetVariant && variants) {
      return getVariant(variants, targetVariant, custom).transition;
    }
    return parentContext.transition || {};
  }, [targetVariant, variants, custom, parentContext.transition]);
  const stiffness = springConfig?.stiffness ?? transition.spring?.stiffness ?? DEFAULT_PHYSICS.stiffness;
  const damping = springConfig?.damping ?? transition.spring?.damping ?? DEFAULT_PHYSICS.damping;
  const mass = springConfig?.mass ?? transition.spring?.mass ?? DEFAULT_PHYSICS.mass;
  const parentTransition = parentContext.transition;
  const staggerDelay = useMemo4(() => {
    const staggerChildren = parentTransition?.staggerChildren ?? transition.staggerChildren;
    const delayChildren = parentTransition?.delayChildren ?? transition.delayChildren;
    const staggerDirection = parentTransition?.staggerDirection ?? transition.staggerDirection;
    const index = parentContext.staggerIndex;
    const parentFirst = parentTransition?.when === "beforeChildren" && parentContext.variant !== void 0 ? (parentTransition.delay ?? 0) + settleTime(parentTransition.spring ?? DEFAULT_PHYSICS) : 0;
    if (index !== void 0 && staggerChildren) {
      const count = parentContext.staggerCount;
      const position = staggerDirection === -1 && count !== void 0 ? count - 1 - index : index;
      return parentFirst + position * staggerChildren + (delayChildren || 0);
    }
    return parentFirst + (transition.delay || 0);
  }, [parentContext.staggerIndex, parentContext.staggerCount, parentContext.variant, parentTransition, transition]);
  const initialAnimatable = useMemo4(() => toAnimatable(initialValues), [initialValues]);
  const targetAnimatable = useMemo4(
    () => toAnimatable(targetValues, initialValues),
    [targetValues, initialValues]
  );
  const [releasedTarget, setReleasedTarget] = useState14(null);
  const latestTargetRef = useRef22(targetAnimatable);
  latestTargetRef.current = targetAnimatable;
  const hasDelay = staggerDelay > 0;
  const targetSignature = animatableSignature(targetAnimatable);
  useEffect15(() => {
    if (!hasDelay) return;
    return delay3(staggerDelay, () => {
      setReleasedTarget(latestTargetRef.current);
    });
  }, [hasDelay, staggerDelay, targetSignature]);
  const [isMounted, setIsMounted] = useState14(false);
  useEffect15(() => {
    setIsMounted(true);
  }, []);
  const springTarget = hasDelay ? releasedTarget ?? initialAnimatable : isMounted ? targetAnimatable : initialAnimatable;
  const springValues = useAnimatableValues(springTarget, { stiffness, damping, mass });
  const onAnimationCompleteRef = useRef22(onAnimationComplete);
  onAnimationCompleteRef.current = onAnimationComplete;
  const completedVariantRef = useRef22(void 0);
  useIsomorphicLayoutEffect(() => {
    if (!targetVariant) return;
    if (targetVariant !== currentVariantRef.current) {
      currentVariantRef.current = targetVariant;
      completedVariantRef.current = void 0;
    }
    if (completedVariantRef.current === targetVariant) return;
    isAnimatingRef.current = true;
    const settleDuration = settleTime({ stiffness, damping, mass });
    const variant = targetVariant;
    return delay3(staggerDelay + settleDuration, () => {
      isAnimatingRef.current = false;
      completedVariantRef.current = variant;
      onAnimationCompleteRef.current?.(variant);
    });
  }, [targetVariant, staggerDelay, stiffness, damping, mass]);
  const setVariant = useCallback13((name) => {
    setVariantOverride({ name, animate: animateRef.current });
  }, []);
  return {
    values: {
      ...targetValues,
      ...springValues
    },
    setVariant,
    currentVariant: currentVariantRef.current,
    isAnimating: isAnimatingRef.current
  };
}
function VariantProvider({
  children,
  variant,
  custom,
  transition
}) {
  const items = React2.Children.toArray(children);
  const count = items.length;
  return React2.createElement(
    React2.Fragment,
    null,
    items.map(
      (child, index) => React2.createElement(
        VariantContext.Provider,
        {
          key: React2.isValidElement(child) && child.key !== null ? child.key : index,
          value: { variant, custom, transition, staggerIndex: index, staggerCount: count }
        },
        child
      )
    )
  );
}
function useStaggerChildren(options) {
  const {
    count,
    staggerChildren = 100,
    delayChildren = 0,
    staggerDirection = 1
  } = options;
  const delays = useMemo4(() => {
    return calculateStaggerDelays(count, {
      staggerChildren,
      delayChildren,
      staggerDirection
    });
  }, [count, staggerChildren, delayChildren, staggerDirection]);
  const getDelay = useCallback13(
    (index) => delays[index] || 0,
    [delays]
  );
  const getChildProps = useCallback13(
    (index) => ({
      style: { transitionDelay: `${getDelay(index)}ms` }
    }),
    [getDelay]
  );
  return { getDelay, getChildProps, delays };
}
function variantValuesToStyle(values, baseTransform) {
  const style = {};
  const transformValues = {};
  for (const [key, value] of Object.entries(values)) {
    if (key === "transition" || typeof value !== "number" && typeof value !== "string") continue;
    if (isTransformProperty(key)) {
      ;
      transformValues[key] = value;
    } else {
      style[key] = value;
    }
  }
  const transform = buildTransformString(transformValues);
  const base = typeof baseTransform === "string" && baseTransform !== "none" ? baseTransform : "";
  if (transform || base) style.transform = [base, transform].filter(Boolean).join(" ");
  return style;
}
function createMotionComponent(element, options = {}) {
  const Component2 = React2.forwardRef(function MotionComponent(props, ref) {
    const {
      variants = options.variants,
      spring: spring2 = options.spring,
      animate,
      initial,
      custom,
      inherit,
      onAnimationComplete,
      ...rest
    } = props;
    const { style, ...elementProps } = rest;
    const { values } = useVariants({
      variants,
      spring: spring2,
      animate,
      initial,
      custom,
      inherit,
      onAnimationComplete
    });
    return React2.createElement(element, {
      ...elementProps,
      ref,
      style: { ...style, ...variantValuesToStyle(values, style?.transform) }
    });
  });
  Component2.displayName = `Motion(${String(element)})`;
  return Component2;
}

// src/adapters/react/hooks/usePhysics.ts
import { useRef as useRef23, useEffect as useEffect16, useCallback as useCallback14, useState as useState15 } from "react";
import { createMotionValue as createMotionValue4, globalLoop, delay as delay4 } from "@oxog/springkit";
import { createSpringValue as createSpringValue4 } from "@oxog/springkit";
var FRAME_MS = 1e3 / 60;
var MAX_FRAMES_PER_TICK = 4;
function elapsedFrames(lastTimeRef, now2) {
  const time = typeof now2 === "number" ? now2 : performance.now();
  const last = lastTimeRef.current;
  lastTimeRef.current = time;
  const frames = last === null ? 1 : Math.min(Math.max((time - last) / FRAME_MS, 0), MAX_FRAMES_PER_TICK);
  return frames * globalLoop.getTimeScale();
}
function smoothingFactor(perFrame, frames) {
  const f = Math.min(Math.max(perFrame, 0), 1);
  return 1 - Math.pow(1 - f, frames);
}
function useSpringState(initialValue = 0, options = {}) {
  const { initial = initialValue, onChange, ...springConfig } = options;
  const [state, setState] = useState15(initial);
  const springRef = useRef23(null);
  const motionValueRef = useRef23(null);
  const onChangeRef = useRef23(onChange);
  onChangeRef.current = onChange;
  if (springRef.current === null || springRef.current.isDestroyed()) {
    springRef.current = createSpringValue4(state, {
      ...springConfig,
      onUpdate: (value) => {
        setState(value);
        onChangeRef.current?.(value);
      }
    });
  }
  if (motionValueRef.current === null || motionValueRef.current.isDestroyed()) {
    motionValueRef.current = createMotionValue4(initial);
  }
  const springValue = springRef.current;
  useEffect16(() => {
    const unsub = springValue.subscribe((v) => {
      motionValueRef.current?.jump(v);
    });
    return () => unsub();
  }, [springValue]);
  useDestroyOnUnmount(() => {
    springRef.current?.destroy();
    springRef.current = null;
  });
  const setValue = useCallback14((value) => {
    springRef.current?.set(value);
  }, []);
  return [state, setValue, motionValueRef.current];
}
function useMomentum(options = {}) {
  const {
    friction = 0.95,
    minVelocity = 0.01,
    bounds,
    onRest
  } = options;
  const valueRef = useRef23(null);
  const velocityRef = useRef23(null);
  const frameRef = useRef23(null);
  const isActiveRef = useRef23(false);
  const optionsRef = useRef23({ friction, minVelocity, bounds, onRest });
  optionsRef.current = { friction, minVelocity, bounds, onRest };
  if (valueRef.current === null || valueRef.current.isDestroyed()) {
    valueRef.current = createMotionValue4(0);
  }
  if (velocityRef.current === null || velocityRef.current.isDestroyed()) {
    velocityRef.current = createMotionValue4(0);
  }
  const applyBounds = useCallback14((val) => {
    const { bounds: bounds2 } = optionsRef.current;
    if (!bounds2) return val;
    let result = val;
    if (bounds2.min !== void 0) result = Math.max(bounds2.min, result);
    if (bounds2.max !== void 0) result = Math.min(bounds2.max, result);
    return result;
  }, []);
  const lastTimeRef = useRef23(null);
  const tick = useCallback14((now2) => {
    if (!isActiveRef.current) return;
    const { friction: friction2, minVelocity: minVelocity2, bounds: bounds2, onRest: onRest2 } = optionsRef.current;
    const frames = elapsedFrames(lastTimeRef, now2);
    const currentVelocity = velocityRef.current?.get() ?? 0;
    const currentValue = valueRef.current?.get() ?? 0;
    const newVelocity = currentVelocity * Math.pow(friction2, frames);
    const newValue = applyBounds(currentValue + newVelocity * frames);
    valueRef.current?.jump(newValue);
    velocityRef.current?.jump(newVelocity);
    if (Math.abs(newVelocity) < minVelocity2) {
      isActiveRef.current = false;
      velocityRef.current?.jump(0);
      onRest2?.();
      return;
    }
    if (bounds2) {
      if (bounds2.min !== void 0 && newValue <= bounds2.min || bounds2.max !== void 0 && newValue >= bounds2.max) {
        isActiveRef.current = false;
        velocityRef.current?.jump(0);
        onRest2?.();
        return;
      }
    }
    frameRef.current = requestAnimationFrame(tick);
  }, [applyBounds]);
  const push = useCallback14((velocity) => {
    if (!Number.isFinite(velocity)) return;
    velocityRef.current?.jump(velocity);
    isActiveRef.current = true;
    lastTimeRef.current = null;
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(tick);
  }, [tick]);
  const stop = useCallback14(() => {
    isActiveRef.current = false;
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
    }
    velocityRef.current?.jump(0);
  }, []);
  const set = useCallback14((value) => {
    if (!Number.isFinite(value)) return;
    valueRef.current?.jump(applyBounds(value));
  }, [applyBounds]);
  useEffect16(() => {
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      isActiveRef.current = false;
    };
  }, []);
  return {
    value: valueRef.current,
    velocity: velocityRef.current,
    push,
    stop,
    set,
    isActive: () => isActiveRef.current
  };
}
function useElastic(options = {}) {
  const {
    elasticity = 0.5,
    maxStretch = 100,
    spring: spring2 = { stiffness: 300, damping: 30 }
  } = options;
  const motionValueRef = useRef23(null);
  const springRef = useRef23(null);
  if (motionValueRef.current === null || motionValueRef.current.isDestroyed()) {
    motionValueRef.current = createMotionValue4(0);
  }
  if (springRef.current === null || springRef.current.isDestroyed()) {
    springRef.current = createSpringValue4(0, {
      ...spring2,
      onUpdate: (v) => motionValueRef.current?.jump(v)
    });
  }
  const rawValueRef = useRef23(0);
  const applyElasticity = useCallback14((input) => {
    const sign = input >= 0 ? 1 : -1;
    const absInput = Math.abs(input);
    const factor = 1 - absInput / (maxStretch * 2) * (1 - elasticity);
    return sign * absInput * Math.max(0.1, factor);
  }, [elasticity, maxStretch]);
  const stretch = useCallback14((amount) => {
    if (!Number.isFinite(amount)) return;
    rawValueRef.current = amount;
    const elasticValue = applyElasticity(amount);
    motionValueRef.current?.jump(elasticValue);
  }, [applyElasticity]);
  const release = useCallback14(() => {
    rawValueRef.current = 0;
    springRef.current?.set(0);
  }, []);
  const set = useCallback14((value) => {
    if (!Number.isFinite(value)) return;
    rawValueRef.current = value;
    springRef.current?.set(value);
  }, []);
  useEffect16(() => {
    return () => {
      springRef.current?.stop();
    };
  }, []);
  return {
    value: motionValueRef.current,
    stretch,
    release,
    set,
    getRaw: () => rawValueRef.current
  };
}
function useBounce(options = {}) {
  const {
    dampening = 0.02,
    gravity = 0.5,
    floor = 300,
    ceiling = 0,
    restitution = 0.7
  } = options;
  const motionValueRef = useRef23(null);
  if (motionValueRef.current === null || motionValueRef.current.isDestroyed()) {
    motionValueRef.current = createMotionValue4(ceiling);
  }
  const motionValue = motionValueRef.current;
  const velocityRef = useRef23(0);
  const frameRef = useRef23(null);
  const isActiveRef = useRef23(false);
  const optionsRef = useRef23({ dampening, gravity, floor, ceiling, restitution });
  optionsRef.current = { dampening, gravity, floor, ceiling, restitution };
  const lastTimeRef = useRef23(null);
  const tick = useCallback14((now2) => {
    if (!isActiveRef.current) return;
    const { dampening: dampening2, gravity: gravity2, floor: floor2, ceiling: ceiling2, restitution: restitution2 } = optionsRef.current;
    const frames = elapsedFrames(lastTimeRef, now2);
    const currentValue = motionValue.get();
    velocityRef.current += gravity2 * frames;
    velocityRef.current *= Math.pow(1 - dampening2, frames);
    let newValue = currentValue + velocityRef.current * frames;
    if (newValue >= floor2) {
      newValue = floor2;
      velocityRef.current = -velocityRef.current * restitution2;
      if (Math.abs(velocityRef.current) < 0.5) {
        isActiveRef.current = false;
        velocityRef.current = 0;
        motionValue.jump(floor2);
        return;
      }
    }
    if (newValue <= ceiling2) {
      newValue = ceiling2;
      velocityRef.current = -velocityRef.current * restitution2;
    }
    motionValue.jump(newValue);
    frameRef.current = requestAnimationFrame(tick);
  }, [motionValue]);
  const drop = useCallback14((fromY = ceiling, initialVelocity = 0) => {
    const safeFromY = Number.isFinite(fromY) ? fromY : ceiling;
    const safeVelocity = Number.isFinite(initialVelocity) ? initialVelocity : 0;
    motionValue.jump(safeFromY);
    velocityRef.current = safeVelocity;
    isActiveRef.current = true;
    lastTimeRef.current = null;
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(tick);
  }, [motionValue, ceiling, tick]);
  const bounce = useCallback14((velocity) => {
    if (!Number.isFinite(velocity)) return;
    velocityRef.current = velocity;
    isActiveRef.current = true;
    lastTimeRef.current = null;
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(tick);
  }, [tick]);
  const stop = useCallback14(() => {
    isActiveRef.current = false;
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    velocityRef.current = 0;
  }, []);
  useEffect16(() => {
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      isActiveRef.current = false;
    };
  }, []);
  return {
    value: motionValue,
    drop,
    bounce,
    stop,
    isActive: () => isActiveRef.current,
    getVelocity: () => velocityRef.current
  };
}
function useGravity(options = {}) {
  const {
    gravity = { x: 0, y: 0.5 },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    mass: _mass = 1,
    drag = 0.01,
    bounds,
    bounciness = 0.7
  } = options;
  const xRef = useRef23(null);
  const yRef = useRef23(null);
  if (xRef.current === null || xRef.current.isDestroyed()) {
    xRef.current = createMotionValue4(0);
  }
  if (yRef.current === null || yRef.current.isDestroyed()) {
    yRef.current = createMotionValue4(0);
  }
  const xMotion = xRef.current;
  const yMotion = yRef.current;
  const velocityRef = useRef23({ x: 0, y: 0 });
  const frameRef = useRef23(null);
  const isActiveRef = useRef23(false);
  const optionsRef = useRef23({ gravity, drag, bounds, bounciness });
  optionsRef.current = { gravity, drag, bounds, bounciness };
  const lastTimeRef = useRef23(null);
  const tick = useCallback14((now2) => {
    if (!isActiveRef.current) return;
    const { gravity: gravity2, drag: drag2, bounds: bounds2, bounciness: bounciness2 } = optionsRef.current;
    const frames = elapsedFrames(lastTimeRef, now2);
    const currentX = xMotion.get();
    const currentY = yMotion.get();
    velocityRef.current.x += gravity2.x * frames;
    velocityRef.current.y += gravity2.y * frames;
    const dragFactor = Math.pow(1 - drag2, frames);
    velocityRef.current.x *= dragFactor;
    velocityRef.current.y *= dragFactor;
    let newX = currentX + velocityRef.current.x * frames;
    let newY = currentY + velocityRef.current.y * frames;
    if (bounds2) {
      if (bounds2.left !== void 0 && newX <= bounds2.left) {
        newX = bounds2.left;
        velocityRef.current.x = -velocityRef.current.x * bounciness2;
      }
      if (bounds2.right !== void 0 && newX >= bounds2.right) {
        newX = bounds2.right;
        velocityRef.current.x = -velocityRef.current.x * bounciness2;
      }
      if (bounds2.top !== void 0 && newY <= bounds2.top) {
        newY = bounds2.top;
        velocityRef.current.y = -velocityRef.current.y * bounciness2;
      }
      if (bounds2.bottom !== void 0 && newY >= bounds2.bottom) {
        newY = bounds2.bottom;
        velocityRef.current.y = -velocityRef.current.y * bounciness2;
        if (Math.abs(velocityRef.current.y) < 0.5 && Math.abs(velocityRef.current.x) < 0.1) {
          velocityRef.current.y = 0;
        }
      }
    }
    xMotion.jump(newX);
    yMotion.jump(newY);
    const totalVelocity = Math.abs(velocityRef.current.x) + Math.abs(velocityRef.current.y);
    const isAtRestOnGround = bounds2?.bottom !== void 0 && Math.abs(newY - bounds2.bottom) < 0.5 && totalVelocity < 0.01;
    if (totalVelocity > 0.01 || !isAtRestOnGround) {
      frameRef.current = requestAnimationFrame(tick);
    } else {
      isActiveRef.current = false;
    }
  }, [xMotion, yMotion]);
  const launch = useCallback14((velocity) => {
    const safeX = Number.isFinite(velocity.x) ? velocity.x : 0;
    const safeY = Number.isFinite(velocity.y) ? velocity.y : 0;
    velocityRef.current = { x: safeX, y: safeY };
    isActiveRef.current = true;
    lastTimeRef.current = null;
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(tick);
  }, [tick]);
  const setPosition = useCallback14((pos) => {
    const safeX = Number.isFinite(pos.x) ? pos.x : xMotion.get();
    const safeY = Number.isFinite(pos.y) ? pos.y : yMotion.get();
    xMotion.jump(safeX);
    yMotion.jump(safeY);
  }, [xMotion, yMotion]);
  const stop = useCallback14(() => {
    isActiveRef.current = false;
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    velocityRef.current = { x: 0, y: 0 };
  }, []);
  const start = useCallback14(() => {
    if (!isActiveRef.current) {
      isActiveRef.current = true;
      lastTimeRef.current = null;
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(tick);
    }
  }, [tick]);
  useEffect16(() => {
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      isActiveRef.current = false;
    };
  }, []);
  return {
    x: xMotion,
    y: yMotion,
    launch,
    setPosition,
    stop,
    start,
    isActive: () => isActiveRef.current,
    getVelocity: () => ({ ...velocityRef.current })
  };
}
function useChain(steps, initialValues = {}) {
  const valuesRef = useRef23({});
  const springsRef = useRef23({});
  const [currentStep, setCurrentStep] = useState15(-1);
  const [isPlaying, setIsPlaying] = useState15(false);
  const stepsRef = useRef23(steps);
  stepsRef.current = steps;
  const initialValuesRef = useRef23(initialValues);
  initialValuesRef.current = initialValues;
  const runIdRef = useRef23(0);
  const cancelDelayRef = useRef23(null);
  for (const step of steps) {
    for (const key of Object.keys(step.to)) {
      const existing = valuesRef.current[key];
      if (!existing || existing.isDestroyed()) {
        valuesRef.current[key] = createMotionValue4(initialValues[key] ?? 0);
      }
    }
  }
  useEffect16(() => {
    const springs = springsRef.current;
    const runId = runIdRef;
    for (const key of Object.keys(valuesRef.current)) {
      const existing = springs[key];
      if (!existing || existing.isDestroyed()) {
        springs[key] = createSpringValue4(valuesRef.current[key].get(), {
          onUpdate: (v) => valuesRef.current[key]?.jump(v)
        });
      }
    }
    return () => {
      runId.current++;
      cancelDelayRef.current?.();
      cancelDelayRef.current = null;
      Object.values(springs).forEach((s) => s.destroy());
    };
  }, []);
  const runStep = useCallback14((stepIndex, runId) => {
    if (runIdRef.current !== runId) return;
    const step = stepsRef.current[stepIndex];
    if (!step) {
      setIsPlaying(false);
      setCurrentStep(-1);
      return;
    }
    const execute = () => {
      cancelDelayRef.current = null;
      if (runIdRef.current !== runId) return;
      setCurrentStep(stepIndex);
      const finished = [];
      for (const [key, value] of Object.entries(step.to)) {
        const spring2 = springsRef.current[key];
        if (!spring2 || spring2.isDestroyed()) continue;
        if (step.config) spring2.setConfig(step.config);
        spring2.set(value);
        finished.push(spring2.finished);
      }
      void Promise.all(finished).then(() => runStep(stepIndex + 1, runId));
    };
    if (step.delay && step.delay > 0) {
      cancelDelayRef.current = delay4(step.delay, execute);
    } else {
      execute();
    }
  }, []);
  const play = useCallback14(() => {
    if (isPlaying) return;
    setIsPlaying(true);
    runStep(0, ++runIdRef.current);
  }, [isPlaying, runStep]);
  const reset = useCallback14(() => {
    runIdRef.current++;
    cancelDelayRef.current?.();
    cancelDelayRef.current = null;
    setIsPlaying(false);
    setCurrentStep(-1);
    Object.keys(valuesRef.current).forEach((key) => {
      const initial = initialValuesRef.current[key] ?? 0;
      springsRef.current[key]?.jump(initial);
      valuesRef.current[key]?.jump(initial);
    });
  }, []);
  const stop = useCallback14(() => {
    runIdRef.current++;
    cancelDelayRef.current?.();
    cancelDelayRef.current = null;
    setIsPlaying(false);
  }, []);
  return {
    values: valuesRef.current,
    play,
    reset,
    stop,
    isPlaying,
    currentStep
  };
}
function usePointer(options = {}) {
  const { target, smooth = 0, hoverOnly = false } = options;
  const xRef = useRef23(null);
  const yRef = useRef23(null);
  const rawXRef = useRef23(0);
  const rawYRef = useRef23(0);
  const [isHovering, setIsHovering] = useState15(false);
  const frameRef = useRef23(null);
  if (xRef.current === null || xRef.current.isDestroyed()) xRef.current = createMotionValue4(0);
  if (yRef.current === null || yRef.current.isDestroyed()) yRef.current = createMotionValue4(0);
  useElementEffect(() => {
    const targetElement = target?.current ?? null;
    const element = targetElement ?? window;
    const handleMove = (e) => {
      let newX;
      let newY;
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        newX = e.clientX - rect.left;
        newY = e.clientY - rect.top;
      } else {
        newX = e.clientX;
        newY = e.clientY;
      }
      rawXRef.current = newX;
      rawYRef.current = newY;
      if (smooth === 0) {
        xRef.current?.jump(newX);
        yRef.current?.jump(newY);
      }
    };
    const handleEnter = () => setIsHovering(true);
    const handleLeave = () => setIsHovering(false);
    if (smooth > 0) {
      const lastTime = { current: null };
      const smoothLoop = (now2) => {
        const k = smoothingFactor(smooth, elapsedFrames(lastTime, now2));
        const currentX = xRef.current?.get() ?? 0;
        const currentY = yRef.current?.get() ?? 0;
        const newX = currentX + (rawXRef.current - currentX) * k;
        const newY = currentY + (rawYRef.current - currentY) * k;
        xRef.current?.jump(newX);
        yRef.current?.jump(newY);
        frameRef.current = requestAnimationFrame(smoothLoop);
      };
      frameRef.current = requestAnimationFrame(smoothLoop);
    }
    if (hoverOnly && targetElement) {
      targetElement.addEventListener("pointermove", handleMove);
      targetElement.addEventListener("pointerenter", handleEnter);
      targetElement.addEventListener("pointerleave", handleLeave);
    } else {
      element.addEventListener("pointermove", handleMove);
      if (targetElement) {
        targetElement.addEventListener("pointerenter", handleEnter);
        targetElement.addEventListener("pointerleave", handleLeave);
      }
    }
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (hoverOnly && targetElement) {
        targetElement.removeEventListener("pointermove", handleMove);
        targetElement.removeEventListener("pointerenter", handleEnter);
        targetElement.removeEventListener("pointerleave", handleLeave);
      } else {
        element.removeEventListener("pointermove", handleMove);
        if (targetElement) {
          targetElement.removeEventListener("pointerenter", handleEnter);
          targetElement.removeEventListener("pointerleave", handleLeave);
        }
      }
    };
  }, () => [target?.current ?? null, smooth, hoverOnly]);
  useEffect16(() => {
    return () => {
      xRef.current?.stop();
      yRef.current?.stop();
    };
  }, []);
  return {
    x: xRef.current,
    y: yRef.current,
    isHovering
  };
}
function useGyroscope(options = {}) {
  const { multiplier = 1, clamp = 45, smooth = 0.1 } = options;
  const tiltXRef = useRef23(null);
  const tiltYRef = useRef23(null);
  const rawXRef = useRef23(0);
  const rawYRef = useRef23(0);
  const [isSupported, setIsSupported] = useState15(false);
  const frameRef = useRef23(null);
  if (tiltXRef.current === null || tiltXRef.current.isDestroyed()) tiltXRef.current = createMotionValue4(0);
  if (tiltYRef.current === null || tiltYRef.current.isDestroyed()) tiltYRef.current = createMotionValue4(0);
  const clampValue2 = useCallback14((value) => {
    return Math.max(-clamp, Math.min(clamp, value * multiplier));
  }, [clamp, multiplier]);
  useEffect16(() => {
    const hasOrientation = "DeviceOrientationEvent" in window;
    const lastTime = { current: null };
    const smoothLoop = (now2) => {
      const k = smoothingFactor(smooth, elapsedFrames(lastTime, now2));
      const currentX = tiltXRef.current?.get() ?? 0;
      const currentY = tiltYRef.current?.get() ?? 0;
      const newX = currentX + (rawXRef.current - currentX) * k;
      const newY = currentY + (rawYRef.current - currentY) * k;
      tiltXRef.current?.jump(newX);
      tiltYRef.current?.jump(newY);
      frameRef.current = requestAnimationFrame(smoothLoop);
    };
    frameRef.current = requestAnimationFrame(smoothLoop);
    const handleMouse = (e) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      rawXRef.current = clampValue2((e.clientX - centerX) / centerX * 45);
      rawYRef.current = clampValue2((e.clientY - centerY) / centerY * 45);
    };
    let usingMouse = false;
    const enableMouseFallback = () => {
      if (usingMouse) return;
      usingMouse = true;
      window.addEventListener("mousemove", handleMouse);
    };
    let fallbackTimer = null;
    let handleOrientation = null;
    if (hasOrientation) {
      handleOrientation = (e) => {
        if (e.gamma == null || e.beta == null) return;
        if (fallbackTimer !== null) {
          clearTimeout(fallbackTimer);
          fallbackTimer = null;
        }
        if (usingMouse) {
          usingMouse = false;
          window.removeEventListener("mousemove", handleMouse);
        }
        setIsSupported(true);
        rawXRef.current = clampValue2(e.gamma);
        rawYRef.current = clampValue2(e.beta);
      };
      window.addEventListener("deviceorientation", handleOrientation);
      fallbackTimer = setTimeout(() => {
        fallbackTimer = null;
        enableMouseFallback();
      }, GYROSCOPE_FALLBACK_MS);
    } else {
      enableMouseFallback();
    }
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (fallbackTimer !== null) clearTimeout(fallbackTimer);
      if (handleOrientation) window.removeEventListener("deviceorientation", handleOrientation);
      if (usingMouse) window.removeEventListener("mousemove", handleMouse);
    };
  }, [clampValue2, smooth]);
  useEffect16(() => {
    return () => {
      tiltXRef.current?.stop();
      tiltYRef.current?.stop();
    };
  }, []);
  return {
    tiltX: tiltXRef.current,
    tiltY: tiltYRef.current,
    isSupported
  };
}
var GYROSCOPE_FALLBACK_MS = 500;

// src/adapters/react/components/Spring.tsx
import { useEffect as useEffect17, useRef as useRef25, useState as useState16 } from "react";
import { createSpringGroup as createSpringGroup4 } from "@oxog/springkit";

// src/adapters/react/utils/config.ts
import { useRef as useRef24 } from "react";
var PHYSICS_KEYS = [
  "stiffness",
  "damping",
  "mass",
  "velocity",
  "restSpeed",
  "restDelta",
  "clamp"
];
function samePhysics(a, b) {
  return PHYSICS_KEYS.every((key) => a[key] === b[key]);
}
function useStableSpringConfig(config, fallback) {
  const next = config ?? fallback;
  const ref = useRef24(next);
  if (!samePhysics(ref.current, next)) {
    ref.current = next;
  }
  return ref.current;
}

// src/adapters/react/components/Spring.tsx
import { Fragment as Fragment2, jsx } from "react/jsx-runtime";
var DEFAULT_SPRING_CONFIG = {};
var Spring = ({
  from,
  to,
  config: configProp,
  onRest,
  children
}) => {
  const config = useStableSpringConfig(configProp, DEFAULT_SPRING_CONFIG);
  const springRef = useRef25(null);
  const [values, setValues] = useState16(from);
  const toRef = useRef25(to);
  toRef.current = to;
  const onRestRef = useRef25(onRest);
  onRestRef.current = onRest;
  const runIdRef = useRef25(0);
  const animateTo = useRef25((spring2, springConfig) => {
    const runId = ++runIdRef.current;
    spring2.set(toRef.current, springConfig);
    spring2.finished.then(() => {
      if (runIdRef.current !== runId || spring2.isDestroyed() || spring2.isAnimating()) return;
      onRestRef.current?.();
    });
  }).current;
  const toSignature = Object.keys(to).map((key) => `${key}:${to[key]}`).join("|");
  useEffect17(() => {
    const spring2 = createSpringGroup4(from, config);
    const unsubscribe = spring2.subscribe(setValues);
    springRef.current = spring2;
    const rafId = requestAnimationFrame(() => {
      animateTo(spring2, config);
    });
    return () => {
      cancelAnimationFrame(rafId);
      unsubscribe();
      spring2.destroy();
      springRef.current = null;
    };
  }, []);
  const isFirstUpdateRef = useRef25(true);
  useEffect17(() => {
    if (isFirstUpdateRef.current) {
      isFirstUpdateRef.current = false;
      return;
    }
    if (springRef.current) animateTo(springRef.current, config);
  }, [toSignature, config, animateTo]);
  return /* @__PURE__ */ jsx(Fragment2, { children: children(values) });
};

// src/adapters/react/components/Animated.tsx
import * as React3 from "react";
import { useEffect as useEffect19, useRef as useRef27, useState as useState18, useContext as useContext6, useCallback as useCallback16, memo } from "react";
import { createSpringGroup as createSpringGroup5 } from "@oxog/springkit";

// src/adapters/react/components/MotionConfig.tsx
import { createContext as createContext4, useContext as useContext3, useMemo as useMemo5, useSyncExternalStore as useSyncExternalStore2 } from "react";
import { jsx as jsx2 } from "react/jsx-runtime";
function noop2() {
}
function subscribeNoop() {
  return noop2;
}
var EMPTY_CONFIG = {};
var defaultContext = {
  config: {},
  reducedMotion: "user",
  initial: true,
  isReducedMotion: false
};
var MotionContext = createContext4(defaultContext);
function useMotionConfig() {
  return useContext3(MotionContext);
}
function usePrefersReducedMotion(enabled) {
  return useSyncExternalStore2(
    enabled ? subscribeToReducedMotion : subscribeNoop,
    enabled ? getReducedMotionPreference : getServerReducedMotion,
    getServerReducedMotion
  );
}
function MotionConfig({
  config: configProp,
  reducedMotion: reducedMotionProp,
  initial: initialProp,
  children
}) {
  const parentContext = useContext3(MotionContext);
  const reducedMotion = reducedMotionProp ?? parentContext.reducedMotion;
  const initial = initialProp ?? parentContext.initial;
  const config = useStableSpringConfig(configProp, EMPTY_CONFIG);
  const prefersReducedMotion2 = usePrefersReducedMotion(reducedMotion === "user");
  const value = useMemo5(() => {
    let isReducedMotion = false;
    switch (reducedMotion) {
      case "always":
        isReducedMotion = true;
        break;
      case "never":
        isReducedMotion = false;
        break;
      case "user":
      default:
        isReducedMotion = prefersReducedMotion2;
    }
    return {
      config: { ...parentContext.config, ...config },
      reducedMotion,
      initial,
      isReducedMotion
    };
  }, [config, reducedMotion, initial, parentContext.config, prefersReducedMotion2]);
  return /* @__PURE__ */ jsx2(MotionContext.Provider, { value, children });
}

// src/adapters/react/utils/reducedMotion.ts
import { useContext as useContext4 } from "react";
function useShouldReduceMotion() {
  const motionConfig = useContext4(MotionContext);
  const prefersReducedMotion2 = useReducedMotion();
  if (motionConfig.reducedMotion === "always") return true;
  if (motionConfig.reducedMotion === "never") return false;
  return motionConfig.isReducedMotion || prefersReducedMotion2;
}

// src/adapters/react/components/useAnimatedDrag.ts
import { useCallback as useCallback15, useContext as useContext5, useEffect as useEffect18, useRef as useRef26, useState as useState17 } from "react";
import { decay, spring } from "@oxog/springkit";
var ZERO = { x: 0, y: 0 };
var UNBOUNDED = [-Infinity, Infinity];
var DEFAULT_ELASTIC = 0.5;
var VELOCITY_WINDOW_MS = 100;
var DIRECTION_LOCK_THRESHOLD = 3;
var DEFAULT_DRAG_THRESHOLD = 3;
var DEFAULT_BOUNCE_STIFFNESS = 200;
var DEFAULT_BOUNCE_DAMPING = 40;
var LISTENER_OPTIONS = { capture: true };
function now() {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}
function prefersReducedMotion() {
  if (!isBrowser || typeof window.matchMedia !== "function") return false;
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}
function finiteOr(value, fallback) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}
function clampValue(value, [min, max]) {
  return value < min ? min : value > max ? max : value;
}
function clampElastic(value) {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}
function resolveElastic(elastic) {
  if (elastic === void 0 || elastic === true) {
    return { x: [DEFAULT_ELASTIC, DEFAULT_ELASTIC], y: [DEFAULT_ELASTIC, DEFAULT_ELASTIC] };
  }
  if (elastic === false) return { x: [0, 0], y: [0, 0] };
  if (typeof elastic === "number") {
    const e = clampElastic(finiteOr(elastic, DEFAULT_ELASTIC));
    return { x: [e, e], y: [e, e] };
  }
  const side = (value) => clampElastic(finiteOr(value, 0));
  return {
    x: [side(elastic.left), side(elastic.right)],
    y: [side(elastic.top), side(elastic.bottom)]
  };
}
function orderedRange(min, max) {
  return min > max ? [max, min] : [min, max];
}
function isRefConstraints(constraints) {
  return "current" in constraints;
}
function resolveBounds(constraints, element, offset) {
  if (!constraints) return { x: UNBOUNDED, y: UNBOUNDED };
  if (!isRefConstraints(constraints)) {
    return {
      x: orderedRange(finiteOr(constraints.left, -Infinity), finiteOr(constraints.right, Infinity)),
      y: orderedRange(finiteOr(constraints.top, -Infinity), finiteOr(constraints.bottom, Infinity))
    };
  }
  const container = constraints.current;
  if (!container || !element) return { x: UNBOUNDED, y: UNBOUNDED };
  const box = element.getBoundingClientRect();
  const area = container.getBoundingClientRect();
  const left = box.left - offset.x;
  const top = box.top - offset.y;
  const axisRange = (areaMin, areaMax, min, size) => {
    const lower = areaMin - min;
    const upper = areaMax - (min + size);
    return upper < lower ? [upper, lower] : [lower, upper];
  };
  return {
    x: axisRange(area.left, area.right, left, box.width),
    y: axisRange(area.top, area.bottom, top, box.height)
  };
}
function applyElastic(value, [min, max], [eMin, eMax]) {
  if (value < min) return min + (value - min) * eMin;
  if (value > max) return max + (value - max) * eMax;
  return value;
}
function removeElastic(value, [min, max], [eMin, eMax]) {
  if (value < min && eMin > 0) return min + (value - min) / eMin;
  if (value > max && eMax > 0) return max + (value - max) / eMax;
  return value;
}
function computeVelocity(samples, time) {
  const last = samples[samples.length - 1];
  if (!last || time - last.t > VELOCITY_WINDOW_MS) return ZERO;
  let base = last;
  for (let i = samples.length - 2; i >= 0; i--) {
    const sample = samples[i];
    if (last.t - sample.t > VELOCITY_WINDOW_MS) break;
    base = sample;
  }
  const dt = last.t - base.t;
  if (dt <= 0) return ZERO;
  const vx = (last.x - base.x) / dt * 1e3;
  const vy = (last.y - base.y) / dt * 1e3;
  return { x: Number.isFinite(vx) ? vx : 0, y: Number.isFinite(vy) ? vy : 0 };
}
function safeCall(fn, ...args) {
  if (!fn) return;
  try {
    fn(...args);
  } catch (error) {
    console.error("[SpringKit] Error in drag callback:", error);
  }
}
function captureTargetOf(target) {
  if (!target || typeof target.setPointerCapture !== "function") return null;
  return target;
}
function capturePointer(target, pointerId) {
  if (!target || typeof pointerId !== "number") return null;
  try {
    target.setPointerCapture(pointerId);
  } catch {
    return null;
  }
  return () => {
    try {
      const has = typeof target.hasPointerCapture === "function" ? target.hasPointerCapture(pointerId) : true;
      if (has && typeof target.releasePointerCapture === "function") target.releasePointerCapture(pointerId);
    } catch {
    }
  };
}
function useAnimatedDrag(props, elementRef) {
  const { drag, dragControls, dragConstraints } = props;
  const motionConfig = useContext5(MotionContext);
  const [dragOffset, setDragOffset] = useState17(ZERO);
  const [isDragging, setIsDragging] = useState17(false);
  const offsetRef = useRef26(ZERO);
  const activeRef = useRef26(null);
  const animationsRef = useRef26({ x: null, y: null });
  const boundsRef = useRef26({ x: UNBOUNDED, y: UNBOUNDED });
  const lockedAxisRef = useRef26(null);
  const transitionRef = useRef26(null);
  const dragCountRef = useRef26(0);
  const mountedRef = useRef26(false);
  const propsRef = useRef26(props);
  propsRef.current = props;
  const motionConfigRef = useRef26(motionConfig);
  motionConfigRef.current = motionConfig;
  const shouldReduceMotion = useCallback15(() => {
    const config = motionConfigRef.current;
    if (config.reducedMotion === "always") return true;
    if (config.reducedMotion === "never") return false;
    return config.isReducedMotion || prefersReducedMotion();
  }, []);
  const setOffset = useCallback15((next) => {
    offsetRef.current = next;
    if (mountedRef.current) setDragOffset(next);
  }, []);
  const setAxis = useCallback15((axis, value) => {
    if (offsetRef.current[axis] === value) return;
    setOffset({ ...offsetRef.current, [axis]: value });
  }, [setOffset]);
  const stopAnimation = useCallback15((axis) => {
    const entry = animationsRef.current[axis];
    animationsRef.current[axis] = null;
    entry?.animation.destroy();
  }, []);
  const stopAnimations = useCallback15(() => {
    stopAnimation("x");
    stopAnimation("y");
  }, [stopAnimation]);
  const checkTransition = useCallback15((token) => {
    if (transitionRef.current !== token || !token.armed || token.axes.size > 0) return;
    transitionRef.current = null;
    safeCall(propsRef.current.onDragTransitionEnd);
  }, []);
  const completeAxis = useCallback15((token, axis) => {
    if (!token) return;
    token.axes.delete(axis);
    checkTransition(token);
  }, [checkTransition]);
  const detach = useCallback15(() => {
    const active = activeRef.current;
    if (!active) return null;
    activeRef.current = null;
    active.removeListeners();
    if (mountedRef.current) setIsDragging(false);
    propsRef.current.dragControls?._notifyDragEnd?.();
    return active;
  }, []);
  const getAxes = useCallback15(() => {
    const axis = propsRef.current.drag;
    if (!axis) return [];
    if (axis === "x" || axis === "y") return [axis];
    return ["x", "y"];
  }, []);
  const springAxis = useCallback15((axis, from, to, velocity, token) => {
    const transition = propsRef.current.dragTransition;
    token?.axes.add(axis);
    let starting = true;
    const animation = spring(from, to, {
      stiffness: finiteOr(transition?.bounceStiffness, DEFAULT_BOUNCE_STIFFNESS),
      damping: finiteOr(transition?.bounceDamping, DEFAULT_BOUNCE_DAMPING),
      velocity,
      restDelta: 0.1,
      restSpeed: 1,
      onUpdate: (value) => {
        if (!starting && animationsRef.current[axis] === entry) setAxis(axis, value);
      },
      onComplete: () => {
        if (animationsRef.current[axis] !== entry) return;
        animationsRef.current[axis] = null;
        setAxis(axis, to);
        completeAxis(token, axis);
      }
    });
    const entry = { animation, token, target: to };
    animationsRef.current[axis] = entry;
    animation.start();
    starting = false;
  }, [setAxis, completeAxis]);
  const decayAxis = useCallback15((axis, from, velocity, elastic, token) => {
    const transition = propsRef.current.dragTransition;
    token?.axes.add(axis);
    let starting = true;
    const apply = (value) => {
      const range = boundsRef.current[axis];
      if (value >= range[0] && value <= range[1]) {
        setAxis(axis, value);
        return true;
      }
      const boundary = value < range[0] ? range[0] : range[1];
      const sideElastic = value < range[0] ? elastic[0] : elastic[1];
      const currentVelocity = animation.getVelocity();
      animationsRef.current[axis] = null;
      animation.destroy();
      if (sideElastic > 0 && !shouldReduceMotion()) {
        setAxis(axis, value);
        springAxis(axis, value, boundary, currentVelocity, token);
      } else {
        setAxis(axis, boundary);
        completeAxis(token, axis);
      }
      return false;
    };
    const animation = decay({
      from,
      velocity,
      deceleration: transition?.deceleration,
      modifyTarget: transition?.modifyTarget,
      onUpdate: (value) => {
        if (starting || animationsRef.current[axis] !== entry) return;
        apply(value);
      },
      onComplete: () => {
        if (animationsRef.current[axis] !== entry) return;
        if (starting && !apply(animation.getValue())) return;
        animationsRef.current[axis] = null;
        completeAxis(token, axis);
      }
    });
    const entry = { animation, token };
    animationsRef.current[axis] = entry;
    animation.start();
    starting = false;
  }, [setAxis, springAxis, completeAxis, shouldReduceMotion]);
  const settle = useCallback15((velocity, allowMomentum, allowAnimation, token) => {
    const { dragSnapToOrigin, dragMomentum = true, dragTransition, dragElastic } = propsRef.current;
    const bounds = boundsRef.current;
    const elastic = resolveElastic(dragElastic);
    const animate = allowAnimation && !shouldReduceMotion();
    const lockedAxis = lockedAxisRef.current;
    for (const axis of getAxes()) {
      stopAnimation(axis);
      const from = offsetRef.current[axis];
      const range = bounds[axis];
      const axisVelocity = lockedAxis && lockedAxis !== axis ? 0 : velocity[axis];
      let target = null;
      if (dragSnapToOrigin) {
        target = 0;
      } else if (from < range[0] || from > range[1]) {
        target = clampValue(from, range);
      } else if (allowMomentum && dragMomentum && axisVelocity !== 0) {
        if (animate) {
          decayAxis(axis, from, axisVelocity, elastic[axis], token);
          continue;
        }
        const probe = decay({
          from,
          velocity: axisVelocity,
          deceleration: dragTransition?.deceleration,
          modifyTarget: dragTransition?.modifyTarget
        });
        target = clampValue(probe.target, range);
        probe.destroy();
      }
      if (target === null || target === from) continue;
      if (animate) {
        springAxis(axis, from, target, axisVelocity, token);
      } else {
        setAxis(axis, target);
      }
    }
  }, [getAxes, stopAnimation, decayAxis, springAxis, setAxis, shouldReduceMotion]);
  const finishDrag = useCallback15((event, info, mode) => {
    const active = detach();
    if (!active) return;
    if (!active.started) {
      settle(ZERO, false, mode !== "stop", null);
      return;
    }
    const endInfo = info ?? { ...active.lastInfo, delta: ZERO, velocity: ZERO };
    const token = { axes: /* @__PURE__ */ new Set(), armed: false };
    transitionRef.current = token;
    settle(endInfo.velocity, mode === "release", mode !== "stop", token);
    safeCall(propsRef.current.onDragEnd, event ?? active.lastEvent, endInfo);
    token.armed = true;
    checkTransition(token);
  }, [detach, settle, checkTransition]);
  const observationRef = useRef26(null);
  const syncObservedContainer = useCallback15(() => {
    const observation = observationRef.current;
    if (!observation) return;
    const constraints = propsRef.current.dragConstraints;
    const container = constraints && isRefConstraints(constraints) ? constraints.current : null;
    if (container === observation.container) return;
    try {
      if (observation.container) observation.observer?.unobserve(observation.container);
      if (container) observation.observer?.observe(container);
    } catch {
    }
    observation.container = container;
  }, []);
  const startDrag = useCallback15((event, options, fromControls = false) => {
    const axisProp = propsRef.current.drag;
    if (!axisProp || !isBrowser) return;
    if (activeRef.current?.startEvent === event) return;
    if (activeRef.current && event.isPrimary === false) return;
    detach();
    transitionRef.current = null;
    stopAnimations();
    syncObservedContainer();
    const axes = getAxes();
    const element = elementRef.current;
    const { dragConstraints: constraints, dragElastic, dragDirectionLock, dragThreshold } = propsRef.current;
    const elastic = resolveElastic(dragElastic);
    boundsRef.current = resolveBounds(constraints, element, offsetRef.current);
    const startBounds = boundsRef.current;
    lockedAxisRef.current = null;
    const useDirectionLock = Boolean(dragDirectionLock) && axes.length === 2;
    const threshold = Math.max(0, finiteOr(dragThreshold, DEFAULT_DRAG_THRESHOLD));
    const captureTarget = captureTargetOf(fromControls ? event.target : null) ?? captureTargetOf(element);
    let origin = offsetRef.current;
    if (options?.snapToCursor && element) {
      const rect = element.getBoundingClientRect();
      const dx = event.clientX - (options.cursorOffset?.x ?? 0) - (rect.left + rect.width / 2);
      const dy = event.clientY - (options.cursorOffset?.y ?? 0) - (rect.top + rect.height / 2);
      origin = {
        x: axes.includes("x") ? applyElastic(origin.x + dx, startBounds.x, elastic.x) : origin.x,
        y: axes.includes("y") ? applyElastic(origin.y + dy, startBounds.y, elastic.y) : origin.y
      };
      setOffset(origin);
    }
    const rawOrigin = {
      x: removeElastic(origin.x, startBounds.x, elastic.x),
      y: removeElastic(origin.y, startBounds.y, elastic.y)
    };
    const startX = event.clientX;
    const startY = event.clientY;
    const pointerId = event.pointerId;
    const samples = [{ x: startX, y: startY, t: now() }];
    let lastPoint = { x: startX, y: startY };
    let releaseCapture = null;
    const isOtherPointer = (e) => pointerId !== void 0 && e.pointerId !== void 0 && e.pointerId !== pointerId;
    const makeInfo = (point, time) => {
      const info = {
        point,
        delta: { x: point.x - lastPoint.x, y: point.y - lastPoint.y },
        offset: { x: point.x - startX, y: point.y - startY },
        velocity: computeVelocity(samples, time)
      };
      lastPoint = point;
      return info;
    };
    const record = (point, time) => {
      const last = samples[samples.length - 1];
      if (last && last.x === point.x && last.y === point.y) return;
      samples.push({ x: point.x, y: point.y, t: time });
      while (samples.length > 2 && time - samples[0].t > VELOCITY_WINDOW_MS * 2) samples.shift();
    };
    const begin = (active2, e, info) => {
      active2.started = true;
      dragCountRef.current++;
      releaseCapture = capturePointer(captureTarget, pointerId);
      if (mountedRef.current) setIsDragging(true);
      safeCall(propsRef.current.onDragStart, e, info);
    };
    const handleMove = (e) => {
      const active2 = activeRef.current;
      if (!active2 || isOtherPointer(e)) return;
      const time = now();
      const point = { x: e.clientX, y: e.clientY };
      record(point, time);
      const info = makeInfo(point, time);
      active2.lastEvent = e;
      active2.lastInfo = info;
      if (!active2.started) {
        if (Math.hypot(info.offset.x, info.offset.y) < threshold) return;
        begin(active2, e, info);
        if (activeRef.current !== active2) return;
      }
      if (useDirectionLock && lockedAxisRef.current === null) {
        const ax = Math.abs(info.offset.x);
        const ay = Math.abs(info.offset.y);
        if (Math.max(ax, ay) <= DIRECTION_LOCK_THRESHOLD) return;
        const locked2 = ay > ax ? "y" : "x";
        lockedAxisRef.current = locked2;
        safeCall(propsRef.current.onDirectionLock, locked2);
      }
      const locked = lockedAxisRef.current;
      const move = (axis) => axes.includes(axis) && (!locked || locked === axis);
      const currentElastic = resolveElastic(propsRef.current.dragElastic);
      const bounds = boundsRef.current;
      setOffset({
        x: move("x") ? applyElastic(rawOrigin.x + info.offset.x, bounds.x, currentElastic.x) : offsetRef.current.x,
        y: move("y") ? applyElastic(rawOrigin.y + info.offset.y, bounds.y, currentElastic.y) : offsetRef.current.y
      });
      safeCall(propsRef.current.onDrag, e, info);
    };
    const handleUp = (e) => {
      const active2 = activeRef.current;
      if (!active2 || isOtherPointer(e)) return;
      const time = now();
      const point = { x: e.clientX, y: e.clientY };
      let info;
      if (Number.isFinite(point.x) && Number.isFinite(point.y)) {
        record(point, time);
        info = makeInfo(point, time);
      } else {
        info = { ...active2.lastInfo, delta: ZERO, velocity: computeVelocity(samples, time) };
      }
      finishDrag(e, info, "release");
    };
    const handleCancel = (e) => {
      const active2 = activeRef.current;
      if (!active2 || isOtherPointer(e)) return;
      finishDrag(e, { ...active2.lastInfo, delta: ZERO, velocity: ZERO }, "cancel");
    };
    window.addEventListener("pointermove", handleMove, LISTENER_OPTIONS);
    window.addEventListener("pointerup", handleUp, LISTENER_OPTIONS);
    window.addEventListener("pointercancel", handleCancel, LISTENER_OPTIONS);
    const startInfo = {
      point: { x: startX, y: startY },
      delta: ZERO,
      offset: ZERO,
      velocity: ZERO
    };
    const active = {
      startEvent: event,
      started: false,
      removeListeners: () => {
        window.removeEventListener("pointermove", handleMove, LISTENER_OPTIONS);
        window.removeEventListener("pointerup", handleUp, LISTENER_OPTIONS);
        window.removeEventListener("pointercancel", handleCancel, LISTENER_OPTIONS);
        releaseCapture?.();
        releaseCapture = null;
      },
      lastEvent: event,
      lastInfo: startInfo
    };
    activeRef.current = active;
    propsRef.current.dragControls?._notifyDragStart?.();
    if (threshold <= 0) begin(active, event, startInfo);
  }, [detach, stopAnimations, syncObservedContainer, getAxes, elementRef, setOffset, finishDrag]);
  const stopDrag = useCallback15(() => {
    if (activeRef.current) {
      finishDrag(null, null, "stop");
    } else {
      transitionRef.current = null;
      settle(ZERO, false, false, null);
    }
  }, [finishDrag, settle]);
  const cancelDrag = useCallback15(() => {
    if (activeRef.current) {
      finishDrag(null, null, "cancel");
    } else {
      transitionRef.current = null;
      settle(ZERO, false, true, null);
    }
  }, [finishDrag, settle]);
  const remeasure = useCallback15(() => {
    const { dragConstraints: constraints, dragSnapToOrigin } = propsRef.current;
    if (!constraints || !isRefConstraints(constraints)) return;
    const element = elementRef.current;
    if (!element || !constraints.current) return;
    const bounds = resolveBounds(constraints, element, offsetRef.current);
    boundsRef.current = bounds;
    if (activeRef.current || dragSnapToOrigin) return;
    for (const axis of getAxes()) {
      const range = bounds[axis];
      const value = offsetRef.current[axis];
      const entry = animationsRef.current[axis];
      let target;
      if (entry) {
        if (entry.target === void 0) continue;
        target = clampValue(entry.target, range);
        if (target === entry.target) continue;
      } else {
        target = clampValue(value, range);
        if (target === value) continue;
      }
      const token = entry?.token && entry.token === transitionRef.current ? entry.token : null;
      const velocity = entry ? entry.animation.getVelocity() : 0;
      stopAnimation(axis);
      if (shouldReduceMotion() || target === value) {
        setAxis(axis, target);
        completeAxis(token, axis);
      } else {
        springAxis(axis, value, target, velocity, token);
      }
    }
  }, [elementRef, getAxes, stopAnimation, shouldReduceMotion, setAxis, completeAxis, springAxis]);
  useEffect18(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      detach();
      transitionRef.current = null;
      stopAnimations();
    };
  }, [detach, stopAnimations]);
  const isDragEnabled = Boolean(drag);
  useEffect18(() => {
    if (isDragEnabled) return;
    const active = detach();
    transitionRef.current = null;
    stopAnimations();
    if (active?.started) {
      safeCall(propsRef.current.onDragEnd, active.lastEvent, { ...active.lastInfo, delta: ZERO, velocity: ZERO });
    }
  }, [isDragEnabled, detach, stopAnimations]);
  useEffect18(() => {
    const controls = dragControls;
    if (!controls || !isDragEnabled) return;
    const start = (event, options) => startDrag(event, options, true);
    if (typeof controls._subscribe === "function") {
      return controls._subscribe({ start, stop: stopDrag, cancel: cancelDrag });
    }
    controls._setDragHandler?.(start);
    controls._setStopHandler?.(stopDrag);
    return () => {
      controls._setDragHandler?.(null);
      controls._setStopHandler?.(null);
    };
  }, [dragControls, isDragEnabled, startDrag, stopDrag, cancelDrag]);
  const constraintsRef = dragConstraints && isRefConstraints(dragConstraints) ? dragConstraints : null;
  useEffect18(() => {
    if (!isDragEnabled || !constraintsRef || !isBrowser) return;
    const handleResize = () => {
      syncObservedContainer();
      remeasure();
    };
    window.addEventListener("resize", handleResize);
    let observer = null;
    if (typeof ResizeObserver === "function") {
      try {
        observer = new ResizeObserver(handleResize);
      } catch {
        observer = null;
      }
    }
    observationRef.current = { observer, container: null };
    syncObservedContainer();
    try {
      const element = elementRef.current;
      if (element) observer?.observe(element);
    } catch {
    }
    return () => {
      window.removeEventListener("resize", handleResize);
      observer?.disconnect();
      observationRef.current = null;
    };
  }, [isDragEnabled, constraintsRef, elementRef, remeasure, syncObservedContainer]);
  useEffect18(() => {
    syncObservedContainer();
  });
  const getDragCount = useCallback15(() => dragCountRef.current, []);
  return { dragOffset, isDragging, startDrag, getDragCount };
}

// src/adapters/react/components/Animated.tsx
var EMPTY_STYLE = {};
var EMPTY_CONFIG2 = {};
var TRANSFORM_KEYS = [
  "x",
  "y",
  "z",
  "translateX",
  "translateY",
  "translateZ",
  "scale",
  "scaleX",
  "scaleY",
  "rotate",
  "rotateX",
  "rotateY",
  "rotateZ",
  "skewX",
  "skewY"
];
var TRANSFORM_KEY_SET = new Set(TRANSFORM_KEYS);
var DEFAULT_VALUES2 = {
  opacity: 1,
  scale: 1,
  scaleX: 1,
  scaleY: 1
};
function getValue(source, key) {
  if (!source) return void 0;
  const value = source[key];
  return typeof value === "number" || typeof value === "string" ? value : void 0;
}
function sameChannels2(a, b) {
  const aKeys = Object.keys(a);
  if (aKeys.length !== Object.keys(b).length) return false;
  return aKeys.every((key) => a[key] === b[key]);
}
function pickKeys(values, keys) {
  const result = {};
  for (const key of keys) {
    const value = values[key];
    if (value !== void 0) result[key] = value;
  }
  return result;
}
function isIdentityTransform(key, value) {
  if (typeof value === "string") return false;
  return key.startsWith("scale") ? value === 1 : value === 0;
}
function formatTransform(key, value) {
  const fn = key === "x" ? "translateX" : key === "y" ? "translateY" : key === "z" ? "translateZ" : key;
  if (typeof value === "string") return `${fn}(${value})`;
  const unit = key.startsWith("scale") ? "" : key.startsWith("rotate") || key.startsWith("skew") ? "deg" : "px";
  return `${fn}(${value}${unit})`;
}
function buildStyle(values, staticTransform) {
  const style = {};
  const transforms = [];
  let hasNonIdentity = false;
  for (const key of TRANSFORM_KEYS) {
    const value = values[key];
    if (value === void 0) continue;
    transforms.push(formatTransform(key, value));
    if (!isIdentityTransform(key, value)) hasNonIdentity = true;
  }
  for (const key in values) {
    if (!TRANSFORM_KEY_SET.has(key)) {
      style[key] = values[key];
    }
  }
  if (hasNonIdentity) {
    style.transform = typeof staticTransform === "string" && staticTransform ? `${transforms.join(" ")} ${staticTransform}` : transforms.join(" ");
  }
  return style;
}
function createAnimatedComponent(tag) {
  const AnimatedComponent = React3.forwardRef(
    ({
      children,
      style = EMPTY_STYLE,
      config = EMPTY_CONFIG2,
      initial,
      animate,
      exit,
      whileHover,
      whileTap,
      whileFocus,
      whileDrag,
      whileInView,
      viewport,
      onAnimationComplete,
      onHoverStart,
      onHoverEnd,
      onTapStart,
      onTap,
      onTapCancel,
      drag,
      dragControls,
      dragListener = true,
      dragConstraints,
      dragElastic,
      dragMomentum,
      dragTransition,
      dragSnapToOrigin,
      dragDirectionLock,
      dragThreshold,
      onDirectionLock,
      onDragStart,
      onDrag,
      onDragEnd,
      onDragTransitionEnd,
      onMouseEnter: propsOnMouseEnter,
      onMouseLeave: propsOnMouseLeave,
      onPointerEnter: propsOnPointerEnter,
      onPointerDown: propsOnPointerDown,
      onPointerUp: propsOnPointerUp,
      onPointerCancel: propsOnPointerCancel,
      onFocus: propsOnFocus,
      onBlur: propsOnBlur,
      ...props
    }, forwardedRef) => {
      const springRef = useRef27(null);
      const unsubscribeRef = useRef27(null);
      const elementRef = useRef27(null);
      const hasCalledSafeToRemove = useRef27(false);
      const isDestroyedRef = useRef27(false);
      const hasMountedRef = useRef27(false);
      const hasCommittedRef = useRef27(false);
      const lastTargetRef = useRef27(null);
      const latestValuesRef = useRef27({});
      const [isHovered, setIsHovered] = useState18(false);
      const [isPressed, setIsPressed] = useState18(false);
      const [isFocused, setIsFocused] = useState18(false);
      const [isInViewport, setIsInViewport] = useState18(false);
      const hasTriggeredInView = useRef27(false);
      const isPressedRef = useRef27(false);
      const removeGlobalPressListenersRef = useRef27(null);
      const lastPointerTypeRef = useRef27(null);
      const onTapCancelRef = useRef27(onTapCancel);
      onTapCancelRef.current = onTapCancel;
      const { dragOffset, isDragging, startDrag, getDragCount } = useAnimatedDrag(
        {
          drag,
          dragControls,
          dragListener,
          dragConstraints,
          dragElastic,
          dragMomentum,
          dragTransition,
          dragSnapToOrigin,
          dragDirectionLock,
          dragThreshold,
          onDirectionLock,
          onDragStart,
          onDrag,
          onDragEnd,
          onDragTransitionEnd
        },
        elementRef
      );
      const pressDragCountRef = useRef27(0);
      const presenceContext = useContext6(PresenceContext);
      const isPresent = presenceContext?.isPresent ?? true;
      const safeToRemove = presenceContext?.safeToRemove;
      const motionConfig = useContext6(MotionContext);
      const reducedMotion = useShouldReduceMotion();
      const springConfig = { ...motionConfig.config, ...config };
      const skipInitial = initial === false || presenceContext?.initial === false || motionConfig.initial === false;
      const setRef = useCallback16((node) => {
        elementRef.current = node;
        if (typeof forwardedRef === "function") {
          forwardedRef(node);
        } else if (forwardedRef) {
          forwardedRef.current = node;
        }
      }, [forwardedRef]);
      useEffect19(() => {
        if (!whileInView || !isBrowser) return;
        const element = elementRef.current;
        if (!element) return;
        if (typeof IntersectionObserver === "undefined") {
          hasTriggeredInView.current = true;
          setIsInViewport(true);
          return;
        }
        const threshold = viewport?.amount === "all" ? 1 : viewport?.amount === "some" ? 0 : typeof viewport?.amount === "number" ? viewport.amount : 0.5;
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                if (viewport?.once && hasTriggeredInView.current) return;
                setIsInViewport(true);
                hasTriggeredInView.current = true;
              } else if (!viewport?.once) {
                setIsInViewport(false);
              }
            });
          },
          {
            rootMargin: viewport?.margin ?? "0px",
            threshold
          }
        );
        observer.observe(element);
        return () => {
          if (element) {
            observer.unobserve(element);
          }
          observer.disconnect();
        };
      }, [whileInView, viewport?.once, viewport?.margin, viewport?.amount]);
      const animationSources = [
        initial === false ? void 0 : initial,
        animate,
        exit,
        whileHover,
        whileTap,
        whileFocus,
        whileDrag,
        whileInView
      ];
      const numericKeySet = /* @__PURE__ */ new Set();
      const stringKeySet = /* @__PURE__ */ new Set();
      for (const source of animationSources) {
        if (!source) continue;
        for (const key in source) {
          const value = source[key];
          if (typeof value === "number") numericKeySet.add(key);
          else if (typeof value === "string") stringKeySet.add(key);
        }
      }
      for (const key in style) {
        if (typeof style[key] === "number") numericKeySet.add(key);
      }
      for (const key of stringKeySet) numericKeySet.delete(key);
      const numericKeys = Array.from(numericKeySet).sort();
      const stringKeys = Array.from(stringKeySet).sort();
      const channelKeysOf = (key, value) => {
        if (!stringKeySet.has(key)) return [key];
        const keys = [];
        for (let i = 0; i < value.template.size; i++) keys.push(hiddenChannelKey(key, i));
        return keys;
      };
      const getTransformIdentity = (key) => {
        if (!TRANSFORM_KEY_SET.has(key)) return void 0;
        for (const source of animationSources) {
          const value = getValue(source, key);
          if (typeof value !== "string") continue;
          const { template } = parseAnimatableValue(value);
          if (template.kinds.length === 1 && template.kinds[0] === "n") {
            return `${template.parts[0]}${key.startsWith("scale") ? 1 : 0}${template.parts[1]}`;
          }
        }
        return void 0;
      };
      const getBaseValue = (key) => {
        if (stringKeySet.has(key)) {
          return getValue(animate, key) ?? getValue(style, key) ?? getTransformIdentity(key);
        }
        const value = getValue(animate, key) ?? getValue(style, key);
        return typeof value === "number" ? value : DEFAULT_VALUES2[key] ?? 0;
      };
      const channelKeys = [...numericKeys];
      for (const key of stringKeys) {
        let size = 0;
        for (const source of [...animationSources, style]) {
          const value = getValue(source, key);
          if (value !== void 0) size = Math.max(size, parseAnimatableValue(value).template.size);
        }
        for (let i = 0; i < size; i++) channelKeys.push(hiddenChannelKey(key, i));
      }
      channelKeys.sort();
      const channelKeysSignature = channelKeys.join("|");
      const getTargetStyle = () => {
        if (!isPresent && exit) {
          return exit;
        }
        let target = animate ? { ...animate } : {};
        if (whileInView && isInViewport) {
          target = { ...target, ...whileInView };
        }
        if (whileFocus && isFocused) {
          target = { ...target, ...whileFocus };
        }
        if (whileHover && isHovered) {
          target = { ...target, ...whileHover };
        }
        if (whileDrag && isDragging) {
          target = { ...target, ...whileDrag };
        }
        if (whileTap && isPressed) {
          target = { ...target, ...whileTap };
        }
        return target;
      };
      const getTargetValues = () => {
        const target = getTargetStyle();
        const result = {};
        for (const key of numericKeys) {
          const value = getValue(target, key);
          result[key] = typeof value === "number" ? value : getBaseValue(key);
        }
        for (const key of stringKeys) {
          const value = getValue(target, key) ?? getBaseValue(key);
          if (value !== void 0) result[key] = value;
        }
        return result;
      };
      const getInitialValues = () => {
        const target = getTargetValues();
        if (skipInitial || reducedMotion || !initial) return target;
        const result = { ...target };
        for (const key of [...numericKeys, ...stringKeys]) {
          const value = getValue(initial, key);
          if (value !== void 0) result[key] = value;
        }
        return result;
      };
      const [animatedState, setAnimatedState] = useState18(() => {
        const values = parseAnimatableRecord(getInitialValues());
        return { values, channels: channelValuesOf(values, channelKeysOf) };
      });
      const appliedRef = useRef27(animatedState.values);
      const getTargetValuesRef = useRef27(getTargetValues);
      getTargetValuesRef.current = getTargetValues;
      const channelKeysOfRef = useRef27(channelKeysOf);
      channelKeysOfRef.current = channelKeysOf;
      const channelKeysRef = useRef27(channelKeys);
      channelKeysRef.current = channelKeys;
      const reducedMotionRef = useRef27(reducedMotion);
      reducedMotionRef.current = reducedMotion;
      const shownRef = useRef27(animatedState);
      const showState = useCallback16(
        (values, channels) => {
          const shown = shownRef.current;
          if (shown.values === values && sameChannels2(shown.channels, channels)) return;
          const state = { values, channels };
          shownRef.current = state;
          setAnimatedState(state);
        },
        []
      );
      const applyTarget = useCallback16(
        (targetValues, instant) => {
          const spring2 = springRef.current;
          const next = parseAnimatableRecord(targetValues);
          const plan = planTransition(appliedRef.current, next, channelKeysOfRef.current, instant);
          appliedRef.current = next;
          lastTargetRef.current = { signature: animatableSignature(targetValues), values: next };
          if (spring2) {
            if (hasKeys(plan.jump)) spring2.jump(plan.jump);
            if (hasKeys(plan.set)) spring2.set(plan.set);
          }
          if (plan.structural || hasKeys(plan.jump)) {
            showState(next, spring2 ? spring2.get() : {});
          }
        },
        [showState]
      );
      useEffect19(() => {
        const keys = channelKeysRef.current;
        if (keys.length === 0) {
          return;
        }
        const startValues = {};
        for (const key of keys) startValues[key] = 0;
        Object.assign(
          startValues,
          pickKeys(channelValuesOf(appliedRef.current, channelKeysOfRef.current), keys)
        );
        if (hasMountedRef.current) Object.assign(startValues, pickKeys(latestValuesRef.current, keys));
        hasMountedRef.current = true;
        const isMount = !hasCommittedRef.current;
        isDestroyedRef.current = false;
        const spring2 = createSpringGroup5(startValues, springConfig);
        unsubscribeRef.current = spring2.subscribe((values) => {
          latestValuesRef.current = values;
          if (!isDestroyedRef.current) {
            showState(appliedRef.current, values);
          }
        });
        springRef.current = spring2;
        const targetValues = getTargetValuesRef.current();
        const signature = animatableSignature(targetValues);
        const targetChannels = channelValuesOf(
          parseAnimatableRecord(targetValues),
          channelKeysOfRef.current
        );
        const appliedValues = {};
        for (const key in appliedRef.current) appliedValues[key] = appliedRef.current[key].raw;
        const needsAnimation = animatableSignature(appliedValues) !== signature || Object.keys(targetChannels).some((key) => startValues[key] !== targetChannels[key]);
        lastTargetRef.current = { signature, values: parseAnimatableRecord(targetValues) };
        let rafId = null;
        if (needsAnimation) {
          if (reducedMotionRef.current || !isMount) {
            applyTarget(targetValues, reducedMotionRef.current);
          } else {
            rafId = safeRequestAnimationFrame(() => {
              rafId = null;
              if (isDestroyedRef.current) return;
              applyTarget(getTargetValuesRef.current(), reducedMotionRef.current);
            });
          }
        }
        return () => {
          isDestroyedRef.current = true;
          if (rafId !== null) safeCancelAnimationFrame(rafId);
          if (unsubscribeRef.current) {
            unsubscribeRef.current();
            unsubscribeRef.current = null;
          }
          spring2.destroy();
          springRef.current = null;
        };
      }, [springConfig.stiffness, springConfig.damping, springConfig.mass, channelKeysSignature]);
      useEffect19(() => {
        hasCommittedRef.current = true;
        const spring2 = springRef.current;
        const targetValues = getTargetValues();
        if (reducedMotion && spring2 && spring2.isAnimating() && lastTargetRef.current) {
          spring2.jump(channelValuesOf(lastTargetRef.current.values, channelKeysOf));
        }
        if (lastTargetRef.current?.signature === animatableSignature(targetValues)) return;
        applyTarget(targetValues, reducedMotion);
      });
      const onAnimationCompleteRef = useRef27(onAnimationComplete);
      onAnimationCompleteRef.current = onAnimationComplete;
      const hasExit = Boolean(exit);
      useEffect19(() => {
        if (isPresent || !safeToRemove || hasCalledSafeToRemove.current) return;
        const complete = () => {
          if (hasCalledSafeToRemove.current) return;
          hasCalledSafeToRemove.current = true;
          safeToRemove();
          onAnimationCompleteRef.current?.();
        };
        const spring2 = springRef.current;
        if (!hasExit || !spring2 || spring2.isDestroyed()) {
          complete();
          return;
        }
        let unsubscribe = null;
        unsubscribe = spring2.subscribe(() => {
          if (spring2.isAnimating()) return;
          unsubscribe?.();
          unsubscribe = null;
          complete();
        });
        if (hasCalledSafeToRemove.current) {
          unsubscribe?.();
          unsubscribe = null;
        }
        return () => {
          unsubscribe?.();
        };
      }, [isPresent, hasExit, safeToRemove, springConfig.stiffness, springConfig.damping, springConfig.mass, channelKeysSignature]);
      useEffect19(() => {
        if (isPresent) {
          hasCalledSafeToRemove.current = false;
        }
      }, [isPresent]);
      const endPress = useCallback16(() => {
        isPressedRef.current = false;
        setIsPressed(false);
        removeGlobalPressListenersRef.current?.();
        removeGlobalPressListenersRef.current = null;
      }, []);
      useEffect19(() => {
        return () => {
          removeGlobalPressListenersRef.current?.();
          removeGlobalPressListenersRef.current = null;
        };
      }, []);
      const handlePointerEnter = useCallback16((e) => {
        lastPointerTypeRef.current = e.pointerType || null;
        propsOnPointerEnter?.(e);
      }, [propsOnPointerEnter]);
      const handleMouseEnter = useCallback16((e) => {
        if (lastPointerTypeRef.current !== "touch") {
          if (whileHover) setIsHovered(true);
          onHoverStart?.(e);
        }
        propsOnMouseEnter?.(e);
      }, [whileHover, onHoverStart, propsOnMouseEnter]);
      const handleMouseLeave = useCallback16((e) => {
        if (lastPointerTypeRef.current !== "touch") {
          if (whileHover) setIsHovered(false);
          if (isPressedRef.current) {
            isPressedRef.current = false;
            setIsPressed(false);
          }
          onHoverEnd?.(e);
        }
        propsOnMouseLeave?.(e);
      }, [whileHover, onHoverEnd, propsOnMouseLeave]);
      const handlePointerDown = useCallback16((e) => {
        if (e.pointerType) lastPointerTypeRef.current = e.pointerType;
        isPressedRef.current = true;
        pressDragCountRef.current = getDragCount();
        if (whileTap) setIsPressed(true);
        if (isBrowser && !removeGlobalPressListenersRef.current) {
          const handleGlobalPointerUp = (event) => {
            if (!removeGlobalPressListenersRef.current) return;
            endPress();
            onTapCancelRef.current?.(event);
          };
          window.addEventListener("pointerup", handleGlobalPointerUp);
          window.addEventListener("pointercancel", handleGlobalPointerUp);
          removeGlobalPressListenersRef.current = () => {
            window.removeEventListener("pointerup", handleGlobalPointerUp);
            window.removeEventListener("pointercancel", handleGlobalPointerUp);
          };
        }
        onTapStart?.(e);
        propsOnPointerDown?.(e);
      }, [whileTap, onTapStart, propsOnPointerDown, endPress, getDragCount]);
      const handlePointerUp = useCallback16((e) => {
        if (isPressedRef.current) {
          endPress();
          if (getDragCount() !== pressDragCountRef.current) {
            onTapCancel?.(e);
          } else {
            onTap?.(e);
          }
        }
        propsOnPointerUp?.(e);
      }, [onTap, onTapCancel, propsOnPointerUp, endPress, getDragCount]);
      const handlePointerCancel = useCallback16((e) => {
        if (isPressedRef.current || removeGlobalPressListenersRef.current) {
          endPress();
          onTapCancel?.(e);
        }
        propsOnPointerCancel?.(e);
      }, [onTapCancel, propsOnPointerCancel, endPress]);
      const handleFocus = useCallback16((e) => {
        if (whileFocus) setIsFocused(true);
        propsOnFocus?.(e);
      }, [whileFocus, propsOnFocus]);
      const handleBlur = useCallback16((e) => {
        if (whileFocus) setIsFocused(false);
        propsOnBlur?.(e);
      }, [whileFocus, propsOnBlur]);
      const staticStyle = Object.fromEntries(
        Object.entries(style).filter(([_, v]) => typeof v !== "number")
      );
      const animatedValues = composeAnimatableRecord(
        animatedState.values,
        animatedState.channels,
        channelKeysOf
      );
      const eventHandlers = {
        onMouseEnter: propsOnMouseEnter,
        onMouseLeave: propsOnMouseLeave,
        onPointerEnter: propsOnPointerEnter,
        onPointerDown: propsOnPointerDown,
        onPointerUp: propsOnPointerUp,
        onPointerCancel: propsOnPointerCancel,
        onFocus: propsOnFocus,
        onBlur: propsOnBlur
      };
      if (whileHover || onHoverStart || onHoverEnd) {
        eventHandlers.onPointerEnter = handlePointerEnter;
        eventHandlers.onMouseEnter = handleMouseEnter;
        eventHandlers.onMouseLeave = handleMouseLeave;
      }
      if (whileTap || onTapStart || onTap || onTapCancel) {
        eventHandlers.onPointerDown = handlePointerDown;
        eventHandlers.onPointerUp = handlePointerUp;
        eventHandlers.onPointerCancel = handlePointerCancel;
      }
      const isDragListener = Boolean(drag) && dragListener;
      if (isDragListener) {
        const onPointerDown = eventHandlers.onPointerDown;
        eventHandlers.onPointerDown = (e) => {
          if (!e.button) startDrag(e.nativeEvent);
          onPointerDown?.(e);
        };
      }
      if (whileFocus) {
        eventHandlers.onFocus = handleFocus;
        eventHandlers.onBlur = handleBlur;
      }
      const elementStyle = {
        // Keep touch input from scrolling the page instead of dragging
        ...isDragListener ? { touchAction: drag === "x" ? "pan-y" : drag === "y" ? "pan-x" : "none" } : void 0,
        ...staticStyle,
        ...buildStyle(animatedValues, staticStyle.transform)
      };
      if (dragOffset.x !== 0 || dragOffset.y !== 0) {
        const rest = elementStyle.transform && elementStyle.transform !== "none" ? ` ${elementStyle.transform}` : "";
        elementStyle.transform = `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0px)${rest}`;
      }
      return React3.createElement(
        tag,
        {
          ...props,
          ...eventHandlers,
          ref: setRef,
          style: elementStyle
        },
        children
      );
    }
  );
  AnimatedComponent.displayName = `Animated.${String(tag)}`;
  const MemoizedComponent = memo(AnimatedComponent);
  MemoizedComponent.displayName = `Animated.${String(tag)}`;
  return MemoizedComponent;
}
var Animated = {
  div: createAnimatedComponent("div"),
  span: createAnimatedComponent("span"),
  button: createAnimatedComponent("button"),
  a: createAnimatedComponent("a"),
  p: createAnimatedComponent("p"),
  h1: createAnimatedComponent("h1"),
  h2: createAnimatedComponent("h2"),
  h3: createAnimatedComponent("h3"),
  h4: createAnimatedComponent("h4"),
  h5: createAnimatedComponent("h5"),
  h6: createAnimatedComponent("h6"),
  ul: createAnimatedComponent("ul"),
  ol: createAnimatedComponent("ol"),
  li: createAnimatedComponent("li"),
  section: createAnimatedComponent("section"),
  article: createAnimatedComponent("article"),
  header: createAnimatedComponent("header"),
  footer: createAnimatedComponent("footer"),
  nav: createAnimatedComponent("nav"),
  main: createAnimatedComponent("main"),
  aside: createAnimatedComponent("aside"),
  img: createAnimatedComponent("img"),
  svg: createAnimatedComponent("svg"),
  path: createAnimatedComponent("path"),
  circle: createAnimatedComponent("circle"),
  rect: createAnimatedComponent("rect"),
  g: createAnimatedComponent("g")
};

// src/adapters/react/components/Trail.tsx
import * as React4 from "react";
import { useEffect as useEffect20, useRef as useRef28, useState as useState19 } from "react";
import { createTrail } from "@oxog/springkit";
import { Fragment as Fragment4, jsx as jsx3 } from "react/jsx-runtime";
var DEFAULT_TRAIL_CONFIG = {};
var Trail = ({
  items,
  keys,
  from,
  to,
  config: configProp,
  reverse = false,
  children
}) => {
  const config = useStableSpringConfig(configProp, DEFAULT_TRAIL_CONFIG);
  const stateRef = useRef28(null);
  const [values, setValues] = useState19(
    () => items.map(() => ({ ...from }))
  );
  const fromRef = useRef28(from);
  fromRef.current = from;
  const toRef = useRef28(to);
  toRef.current = to;
  const reverseRef = useRef28(reverse);
  reverseRef.current = reverse;
  const valueKeysSignature = Object.keys(to).join("|");
  const toSignature = Object.keys(to).map((key) => `${key}:${to[key]}`).join("|");
  useEffect20(() => {
    const count = items.length;
    const fromValues = fromRef.current;
    const toValues = toRef.current;
    const keys2 = Object.keys(toValues);
    let state = stateRef.current;
    if (!state || state.config !== config || state.keysSignature !== valueKeysSignature) {
      state?.segments.forEach((segment) => segment.trails.forEach((trail) => trail.destroy()));
      state = { config, keysSignature: valueKeysSignature, segments: [] };
      stateRef.current = state;
    }
    const segments = state.segments;
    const capacity = segments.reduce((total, segment) => total + segment.size, 0);
    if (capacity < count) {
      const size = count - capacity;
      const segment = { size, trails: /* @__PURE__ */ new Map(), current: {} };
      for (const key of keys2) {
        const start = fromValues[key] ?? toValues[key] ?? 0;
        const trail = createTrail(size, config);
        trail.jump(start);
        segment.trails.set(key, trail);
        segment.current[key] = new Array(size).fill(start);
      }
      segments.push(segment);
      for (const key of keys2) {
        const target = toValues[key];
        if (typeof target === "number") segment.trails.get(key)?.set(target);
      }
    }
    const publish = () => {
      const isReversed = reverseRef.current;
      const all = {};
      for (const key of keys2) {
        all[key] = segments.flatMap((segment) => segment.current[key] ?? []);
      }
      setValues(
        Array.from({ length: count }, (_, index) => {
          const itemValues = { ...fromValues };
          const trailIndex = isReversed ? count - 1 - index : index;
          for (const key of keys2) {
            itemValues[key] = all[key]?.[trailIndex] ?? fromValues[key] ?? toValues[key] ?? 0;
          }
          return itemValues;
        })
      );
    };
    const unsubscribes = [];
    for (const segment of segments) {
      segment.trails.forEach((trail, key) => {
        unsubscribes.push(
          trail.subscribe((vals) => {
            segment.current[key] = vals;
            publish();
          })
        );
      });
    }
    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [items.length, config, valueKeysSignature]);
  useEffect20(() => {
    return () => {
      stateRef.current?.segments.forEach(
        (segment) => segment.trails.forEach((trail) => trail.destroy())
      );
      stateRef.current = null;
    };
  }, []);
  const isFirstUpdateRef = useRef28(true);
  useEffect20(() => {
    if (isFirstUpdateRef.current) {
      isFirstUpdateRef.current = false;
      return;
    }
    const toValues = toRef.current;
    stateRef.current?.segments.forEach((segment) => {
      segment.trails.forEach((trail, key) => {
        const target = toValues[key];
        if (typeof target === "number") trail.set(target);
      });
    });
  }, [toSignature]);
  return /* @__PURE__ */ jsx3(Fragment4, { children: items.map((item, index) => {
    const itemValues = values[index] ?? from;
    return /* @__PURE__ */ jsx3(React4.Fragment, { children: children(itemValues, item, index) }, keys(item, index));
  }) });
};

// src/adapters/react/components/AnimatePresence.tsx
import {
  useRef as useRef31,
  useState as useState20,
  useLayoutEffect as useLayoutEffect2,
  useEffect as useEffect22,
  useCallback as useCallback19,
  Children as Children2,
  isValidElement as isValidElement2,
  cloneElement as cloneElement2
} from "react";

// src/adapters/react/components/PresenceChild.tsx
import { useMemo as useMemo6, useCallback as useCallback18, useRef as useRef30, useEffect as useEffect21 } from "react";

// src/adapters/react/components/PopChild.tsx
import * as React5 from "react";
import { useRef as useRef29, useCallback as useCallback17, cloneElement } from "react";
import { jsx as jsx4 } from "react/jsx-runtime";
var PopChildMeasure = class extends React5.Component {
  getSnapshotBeforeUpdate(prevProps) {
    const element = this.props.elementRef.current;
    if (prevProps.isPresent && !this.props.isPresent && element && typeof HTMLElement !== "undefined" && element instanceof HTMLElement) {
      const computed = getComputedStyle(element);
      this.props.layoutRef.current = {
        // `top`/`left` position the margin box, offsetTop/Left the border box
        top: element.offsetTop - (parseFloat(computed.marginTop) || 0),
        left: element.offsetLeft - (parseFloat(computed.marginLeft) || 0),
        width: element.offsetWidth,
        height: element.offsetHeight
      };
    }
    return null;
  }
  // Required alongside getSnapshotBeforeUpdate
  componentDidUpdate() {
  }
  render() {
    return this.props.children;
  }
};
function getElementRef(element) {
  if (parseInt(React5.version, 10) >= 19) {
    return element.props.ref;
  }
  return element.ref ?? void 0;
}
var POP_PROPERTIES = ["position", "top", "left", "width", "height", "box-sizing"];
function PopChild({
  children,
  isPresent
}) {
  const elementRef = useRef29(null);
  const layoutRef = useRef29(null);
  const childRef = getElementRef(children);
  const setRef = useCallback17(
    (node) => {
      elementRef.current = node;
      if (typeof childRef === "function") {
        childRef(node);
      } else if (childRef && typeof childRef === "object") {
        childRef.current = node;
      }
    },
    [childRef]
  );
  useIsomorphicLayoutEffect(() => {
    if (isPresent) return;
    const element = elementRef.current;
    const layout = layoutRef.current;
    if (!element || !layout) return;
    const { style } = element;
    const previous = POP_PROPERTIES.map(
      (property) => [property, style.getPropertyValue(property), style.getPropertyPriority(property)]
    );
    const values = {
      position: "absolute",
      top: `${layout.top}px`,
      left: `${layout.left}px`,
      width: `${layout.width}px`,
      height: `${layout.height}px`,
      "box-sizing": "border-box"
    };
    for (const property of POP_PROPERTIES) {
      style.setProperty(property, values[property], "important");
    }
    return () => {
      for (const [property, value, priority] of previous) {
        if (value) style.setProperty(property, value, priority);
        else style.removeProperty(property);
      }
    };
  }, [isPresent]);
  return /* @__PURE__ */ jsx4(PopChildMeasure, { isPresent, elementRef, layoutRef, children: cloneElement(children, { ref: setRef }) });
}

// src/adapters/react/components/PresenceChild.tsx
import { jsx as jsx5 } from "react/jsx-runtime";
var DEFAULT_EXIT_TIMEOUT = 1e4;
function PresenceChild({
  id,
  children,
  isPresent,
  onExitComplete,
  custom,
  exitTimeout = DEFAULT_EXIT_TIMEOUT,
  initial,
  popLayout = false
}) {
  const presenceIdRef = useRef30(id);
  const onExitCompleteRef = useRef30(onExitComplete);
  presenceIdRef.current = id;
  onExitCompleteRef.current = onExitComplete;
  const safeToRemove = useCallback18(() => {
    onExitCompleteRef.current(presenceIdRef.current);
  }, []);
  const hasExitHandlerRef = useRef30(false);
  const contextValue = useMemo6(
    () => ({
      id,
      isPresent,
      get safeToRemove() {
        hasExitHandlerRef.current = true;
        return safeToRemove;
      },
      custom,
      initial
    }),
    [id, isPresent, safeToRemove, custom, initial]
  );
  useEffect21(() => {
    if (isPresent) return;
    if (!hasExitHandlerRef.current) {
      safeToRemove();
      return;
    }
    if (exitTimeout <= 0) return;
    const timeout = setTimeout(safeToRemove, exitTimeout);
    return () => clearTimeout(timeout);
  }, [isPresent, safeToRemove, exitTimeout]);
  return /* @__PURE__ */ jsx5(PresenceContext.Provider, { value: contextValue, children: popLayout ? /* @__PURE__ */ jsx5(PopChild, { isPresent, children }) : children });
}

// src/adapters/react/components/AnimatePresence.tsx
import { Fragment as Fragment5, jsx as jsx6 } from "react/jsx-runtime";
var useIsomorphicLayoutEffect2 = typeof window !== "undefined" ? useLayoutEffect2 : useEffect22;
function getChildKey(child) {
  return child.key !== null ? String(child.key) : "";
}
function getChildrenMap(children) {
  const map = {};
  Children2.forEach(children, (child) => {
    if (isValidElement2(child)) {
      const key = getChildKey(child);
      if (key) {
        map[key] = child;
      }
    }
  });
  return map;
}
function AnimatePresence({
  children,
  custom,
  initial = true,
  mode = "sync",
  onExitComplete
}) {
  const isInitialMount = useRef31(true);
  const [exitingChildren, setExitingChildren] = useState20({});
  const prevChildrenRef = useRef31({});
  const prevOrderRef = useRef31([]);
  const exitingRef = useRef31({});
  const onExitCompleteRef = useRef31(onExitComplete);
  onExitCompleteRef.current = onExitComplete;
  const currentChildren = getChildrenMap(children);
  const currentKeys = [];
  Children2.forEach(children, (child) => {
    if (isValidElement2(child)) {
      const key = getChildKey(child);
      if (key && !currentKeys.includes(key)) currentKeys.push(key);
    }
  });
  const prevOrder = prevOrderRef.current;
  const derivedExiting = {};
  for (const key in exitingChildren) {
    const child = exitingChildren[key];
    if (child && !(key in currentChildren)) derivedExiting[key] = child;
  }
  for (const key in prevChildrenRef.current) {
    const child = prevChildrenRef.current[key];
    if (child && !(key in currentChildren) && prevOrder.includes(key)) {
      derivedExiting[key] = child;
    }
  }
  const showEntering = mode !== "wait" || Object.keys(derivedExiting).length === 0;
  const renderedOrder = showEntering ? [...currentKeys] : currentKeys.filter((key) => prevOrder.includes(key));
  const exitingKeys = Object.keys(derivedExiting).sort(
    (a, b) => prevOrder.indexOf(a) - prevOrder.indexOf(b)
  );
  for (const key of exitingKeys) {
    let insertAt = 0;
    for (let i = prevOrder.indexOf(key) - 1; i >= 0; i--) {
      const index = renderedOrder.indexOf(prevOrder[i]);
      if (index !== -1) {
        insertAt = index + 1;
        break;
      }
    }
    renderedOrder.splice(insertAt, 0, key);
  }
  useIsomorphicLayoutEffect2(() => {
    exitingRef.current = derivedExiting;
    prevChildrenRef.current = currentChildren;
    prevOrderRef.current = renderedOrder;
    const prevKeys = Object.keys(exitingChildren);
    const nextKeys = Object.keys(derivedExiting);
    if (prevKeys.length !== nextKeys.length || nextKeys.some((key) => exitingChildren[key] !== derivedExiting[key])) {
      setExitingChildren(derivedExiting);
    }
    if (isInitialMount.current) {
      isInitialMount.current = false;
    }
  });
  const handleExitComplete = useCallback19((key) => {
    if (!(key in exitingRef.current)) return;
    const next = { ...exitingRef.current };
    delete next[key];
    exitingRef.current = next;
    setExitingChildren((prev) => {
      if (!(key in prev)) return prev;
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
    if (Object.keys(next).length === 0) {
      onExitCompleteRef.current?.();
    }
  }, []);
  if (showEntering) {
    Children2.forEach(children, (child) => {
      if (isValidElement2(child) && !getChildKey(child)) {
        console.warn(
          'AnimatePresence: Every child must have a unique "key" prop.'
        );
      }
    });
  }
  const skipInitial = isInitialMount.current && initial === false;
  const allChildren = [];
  for (const key of renderedOrder) {
    const exitingChild = derivedExiting[key];
    const child = exitingChild ?? currentChildren[key];
    if (!child) continue;
    allChildren.push(
      /* @__PURE__ */ jsx6(
        PresenceChild,
        {
          id: key,
          isPresent: !exitingChild,
          onExitComplete: handleExitComplete,
          custom,
          initial: skipInitial ? false : void 0,
          popLayout: mode === "popLayout",
          children: cloneElement2(child, { key })
        },
        `presence-${key}`
      )
    );
  }
  return /* @__PURE__ */ jsx6(Fragment5, { children: allChildren });
}

// src/adapters/react/components/Reorder.tsx
import * as React6 from "react";
import {
  createContext as createContext5,
  useContext as useContext7,
  useRef as useRef32,
  useState as useState21,
  useEffect as useEffect23,
  useCallback as useCallback20,
  useMemo as useMemo7
} from "react";
import { createSpringValue as createSpringValue5 } from "@oxog/springkit";
var DEFAULT_REORDER_CONFIG = { stiffness: 300, damping: 30 };
var ReorderContext = createContext5(null);
function useReorderContext() {
  const context = useContext7(ReorderContext);
  if (!context) {
    throw new Error("Reorder.Item must be used within a Reorder.Group");
  }
  return context;
}
function ReorderGroupComponent({
  values,
  onReorder,
  axis = "y",
  config = DEFAULT_REORDER_CONFIG,
  className,
  style,
  children,
  as: Component2 = "ul",
  layoutDuration = 200
}, ref) {
  const itemsRef = useRef32(/* @__PURE__ */ new Map());
  const sizesRef = useRef32(/* @__PURE__ */ new Map());
  const [draggingValue, setDraggingValue] = useState21(null);
  const [offsets, setOffsetsState] = useState21(/* @__PURE__ */ new Map());
  const offsetsRef = useRef32(offsets);
  const setOffsets = useCallback20((next) => {
    offsetsRef.current = next;
    setOffsetsState(next);
  }, []);
  const dragStartIndexRef = useRef32(-1);
  const currentOrderRef = useRef32(values);
  const onReorderRef = useRef32(onReorder);
  onReorderRef.current = onReorder;
  useEffect23(() => {
    currentOrderRef.current = values;
  }, [values]);
  const registerItem = useCallback20((value, element) => {
    itemsRef.current.set(value, element);
    const rect = element.getBoundingClientRect();
    sizesRef.current.set(value, axis === "y" ? rect.height : rect.width);
  }, [axis]);
  const unregisterItem = useCallback20((value) => {
    itemsRef.current.delete(value);
    sizesRef.current.delete(value);
  }, []);
  const handleDragStart = useCallback20((value) => {
    setDraggingValue(value);
    dragStartIndexRef.current = currentOrderRef.current.indexOf(value);
    itemsRef.current.forEach((element, itemValue) => {
      const rect = element.getBoundingClientRect();
      sizesRef.current.set(itemValue, axis === "y" ? rect.height : rect.width);
    });
  }, [axis]);
  const handleDrag = useCallback20((value, offset) => {
    const currentIndex = currentOrderRef.current.indexOf(value);
    if (currentIndex === -1) return;
    const sizes = sizesRef.current;
    const order = [...currentOrderRef.current];
    const newOffsets = /* @__PURE__ */ new Map();
    let accumulatedOffset = 0;
    const itemSize = sizes.get(value) || 0;
    if (offset > 0) {
      for (let i = currentIndex + 1; i < order.length; i++) {
        const otherValue = order[i];
        if (otherValue === void 0) continue;
        const otherSize = sizes.get(otherValue) || 0;
        accumulatedOffset += otherSize;
        if (offset > accumulatedOffset - otherSize / 2) {
          newOffsets.set(otherValue, -itemSize);
        } else {
          newOffsets.set(otherValue, 0);
        }
      }
    } else if (offset < 0) {
      for (let i = currentIndex - 1; i >= 0; i--) {
        const otherValue = order[i];
        if (otherValue === void 0) continue;
        const otherSize = sizes.get(otherValue) || 0;
        accumulatedOffset -= otherSize;
        if (offset < accumulatedOffset + otherSize / 2) {
          newOffsets.set(otherValue, itemSize);
        } else {
          newOffsets.set(otherValue, 0);
        }
      }
    }
    setOffsets(newOffsets);
  }, [setOffsets]);
  const handleDragEnd = useCallback20((value) => {
    const currentIndex = currentOrderRef.current.indexOf(value);
    if (currentIndex === -1) {
      setDraggingValue(null);
      setOffsets(/* @__PURE__ */ new Map());
      return;
    }
    const order = [...currentOrderRef.current];
    let targetIndex = currentIndex;
    offsetsRef.current.forEach((offset, otherValue) => {
      const otherIndex = order.indexOf(otherValue);
      if (offset < 0 && otherIndex > currentIndex) {
        targetIndex = Math.max(targetIndex, otherIndex);
      } else if (offset > 0 && otherIndex < currentIndex) {
        targetIndex = Math.min(targetIndex, otherIndex);
      }
    });
    if (targetIndex !== currentIndex) {
      const newOrder = [...order];
      const [removed] = newOrder.splice(currentIndex, 1);
      if (removed !== void 0) {
        newOrder.splice(targetIndex, 0, removed);
        onReorderRef.current(newOrder);
      }
    }
    setDraggingValue(null);
    setOffsets(/* @__PURE__ */ new Map());
  }, [setOffsets]);
  const moveItem = useCallback20((value, toIndex) => {
    const order = [...currentOrderRef.current];
    const fromIndex = order.indexOf(value);
    if (fromIndex === -1) return;
    const clampedIndex = Math.max(0, Math.min(order.length - 1, toIndex));
    if (clampedIndex === fromIndex) return;
    order.splice(fromIndex, 1);
    order.splice(clampedIndex, 0, value);
    onReorderRef.current(order);
  }, []);
  const getDraggingValue = useCallback20(() => draggingValue, [draggingValue]);
  const getItemOffset = useCallback20((value) => offsets.get(value) || 0, [offsets]);
  const contextValue = useMemo7(() => ({
    values,
    axis,
    config,
    registerItem,
    unregisterItem,
    onDragStart: handleDragStart,
    onDrag: handleDrag,
    onDragEnd: handleDragEnd,
    moveItem,
    getDraggingValue,
    getItemOffset,
    layoutDuration
  }), [
    values,
    axis,
    config,
    registerItem,
    unregisterItem,
    handleDragStart,
    handleDrag,
    handleDragEnd,
    moveItem,
    getDraggingValue,
    getItemOffset,
    layoutDuration
  ]);
  return React6.createElement(
    ReorderContext.Provider,
    { value: contextValue },
    React6.createElement(
      Component2,
      {
        ref,
        className,
        role: "listbox",
        "aria-label": "Reorderable list",
        "aria-orientation": axis === "x" ? "horizontal" : "vertical",
        style: {
          listStyle: "none",
          padding: 0,
          margin: 0,
          ...style
        }
      },
      children
    )
  );
}
function ReorderItemComponent({
  value,
  className,
  style,
  children,
  as: Component2 = "li",
  dragEnabled = true,
  onDragStart,
  onDragEnd
}, ref) {
  const context = useReorderContext();
  const { registerItem, unregisterItem } = context;
  const elementRef = useRef32(null);
  const springRef = useRef32(null);
  const [offset, setOffset] = useState21(0);
  const [isDragging, setIsDragging] = useState21(false);
  const isDraggingRef = useRef32(false);
  const dragStartPos = useRef32({ x: 0, y: 0 });
  const dragOffset = useRef32(0);
  const setRef = useCallback20((node) => {
    elementRef.current = node;
    if (typeof ref === "function") {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
  }, [ref]);
  useEffect23(() => {
    const element = elementRef.current;
    if (element) registerItem(value, element);
    return () => {
      unregisterItem(value);
    };
  }, [value, registerItem, unregisterItem]);
  useEffect23(() => {
    return () => {
      springRef.current?.destroy();
      springRef.current = null;
    };
  }, []);
  const targetOffset = context.getItemOffset(value);
  const springConfig = context.config;
  const index = context.values.indexOf(value);
  const indexRef = useRef32(index);
  useEffect23(() => {
    const moved = indexRef.current !== index;
    indexRef.current = index;
    if (isDragging) return;
    if (!springRef.current) {
      springRef.current = createSpringValue5(0, {
        ...springConfig,
        onUpdate: setOffset
      });
    }
    if (moved) {
      springRef.current.jump(targetOffset);
      setOffset(targetOffset);
    } else {
      springRef.current.set(targetOffset);
    }
  }, [targetOffset, isDragging, springConfig, index]);
  const handlePointerDown = useCallback20((e) => {
    if (!dragEnabled) return;
    e.preventDefault();
    e.stopPropagation();
    isDraggingRef.current = true;
    setIsDragging(true);
    springRef.current?.stop();
    onDragStart?.();
    context.onDragStart(value);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    dragOffset.current = 0;
    const element = elementRef.current;
    if (element && typeof element.setPointerCapture === "function") {
      try {
        element.setPointerCapture(e.pointerId);
      } catch {
      }
    }
  }, [dragEnabled, context, value, onDragStart]);
  const handlePointerMove = useCallback20((e) => {
    if (!isDraggingRef.current) return;
    dragOffset.current = context.axis === "y" ? e.clientY - dragStartPos.current.y : e.clientX - dragStartPos.current.x;
    context.onDrag(value, dragOffset.current);
    setOffset(dragOffset.current);
  }, [context, value]);
  const handlePointerUp = useCallback20((e) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const element = elementRef.current;
    if (element && typeof element.releasePointerCapture === "function") {
      try {
        element.releasePointerCapture(e.pointerId);
      } catch {
      }
    }
    setIsDragging(false);
    onDragEnd?.();
    context.onDragEnd(value);
    springRef.current?.jump(0);
    setOffset(0);
    dragOffset.current = 0;
  }, [context, value, onDragEnd]);
  const transformProp = context.axis === "y" ? `translateY(${offset}px)` : `translateX(${offset}px)`;
  const handleKeyDown = useCallback20((e) => {
    if (!dragEnabled) return;
    const currentIndex = context.values.indexOf(value);
    if (currentIndex === -1) return;
    let newIndex = currentIndex;
    const isVertical = context.axis === "y";
    switch (e.key) {
      case "ArrowUp":
        if (isVertical && currentIndex > 0) {
          newIndex = currentIndex - 1;
          e.preventDefault();
        }
        break;
      case "ArrowDown":
        if (isVertical && currentIndex < context.values.length - 1) {
          newIndex = currentIndex + 1;
          e.preventDefault();
        }
        break;
      case "ArrowLeft":
        if (!isVertical && currentIndex > 0) {
          newIndex = currentIndex - 1;
          e.preventDefault();
        }
        break;
      case "ArrowRight":
        if (!isVertical && currentIndex < context.values.length - 1) {
          newIndex = currentIndex + 1;
          e.preventDefault();
        }
        break;
      case "Home":
        newIndex = 0;
        e.preventDefault();
        break;
      case "End":
        newIndex = context.values.length - 1;
        e.preventDefault();
        break;
    }
    if (newIndex !== currentIndex) {
      context.moveItem(value, newIndex);
    }
  }, [dragEnabled, context, value]);
  return React6.createElement(
    Component2,
    {
      ref: setRef,
      className,
      role: "option",
      "aria-selected": isDragging,
      "aria-grabbed": isDragging,
      tabIndex: dragEnabled ? 0 : -1,
      style: {
        transform: transformProp,
        transition: !isDragging && context.layoutDuration > 0 ? `transform ${context.layoutDuration}ms ease-out` : void 0,
        cursor: dragEnabled ? isDragging ? "grabbing" : "grab" : void 0,
        userSelect: "none",
        touchAction: "none",
        zIndex: isDragging ? 1 : 0,
        position: "relative",
        ...style
      },
      onPointerDown: dragEnabled ? handlePointerDown : void 0,
      onPointerMove: dragEnabled ? handlePointerMove : void 0,
      onPointerUp: dragEnabled ? handlePointerUp : void 0,
      onPointerCancel: dragEnabled ? handlePointerUp : void 0,
      onKeyDown: dragEnabled ? handleKeyDown : void 0
    },
    children
  );
}
var ReorderGroupWithRef = React6.forwardRef(ReorderGroupComponent);
ReorderGroupWithRef.displayName = "Reorder.Group";
var ReorderItemWithRef = React6.forwardRef(ReorderItemComponent);
ReorderItemWithRef.displayName = "Reorder.Item";
var ReorderGroup = ReorderGroupWithRef;
var ReorderItem = ReorderItemWithRef;
var Reorder = {
  Group: ReorderGroup,
  Item: ReorderItem
};

// src/adapters/react/components/SpringText.tsx
import * as React7 from "react";
import { useRef as useRef33, useEffect as useEffect24, useState as useState22, useMemo as useMemo8, memo as memo2 } from "react";
import { createSpringValue as createSpringValue6, delay as delay5 } from "@oxog/springkit";
import { jsx as jsx7, jsxs } from "react/jsx-runtime";
var graphemeSegmenter;
function splitCharacters(text) {
  if (graphemeSegmenter === void 0) {
    const Segmenter = typeof Intl !== "undefined" ? Intl.Segmenter : void 0;
    graphemeSegmenter = typeof Segmenter === "function" ? new Segmenter(void 0, { granularity: "grapheme" }) : null;
  }
  if (graphemeSegmenter) {
    return Array.from(graphemeSegmenter.segment(text), (part) => part.segment);
  }
  return Array.from(text);
}
function splitText(text, mode) {
  switch (mode) {
    case "words":
      return text.split(/(\s+)/);
    case "lines":
      return text.split("\n");
    case "characters":
    default:
      return splitCharacters(text);
  }
}
var DEFAULT_TEXT_CONFIG = { stiffness: 200, damping: 20 };
var SpringText = memo2(function SpringText2({
  children,
  mode = "characters",
  stagger = 30,
  from = "bottom",
  config: configProp,
  initialOpacity = 0,
  initialOffset = 20,
  animateOnMount = true,
  trigger,
  onComplete,
  className,
  style
}) {
  const config = useStableSpringConfig(configProp, DEFAULT_TEXT_CONFIG);
  const elements = useMemo8(() => splitText(children, mode), [children, mode]);
  const [animatedValues, setAnimatedValues] = useState22(
    () => new Array(elements.length).fill(animateOnMount ? 0 : 1)
  );
  const onCompleteRef = useRef33(onComplete);
  onCompleteRef.current = onComplete;
  const prevTriggerRef = useRef33(trigger);
  useEffect24(() => {
    const triggerChanged = prevTriggerRef.current !== trigger;
    prevTriggerRef.current = trigger;
    const shouldAnimate = animateOnMount || triggerChanged;
    if (elements.length === 0) return;
    if (!shouldAnimate) {
      setAnimatedValues(new Array(elements.length).fill(1));
      return;
    }
    let cancelled = false;
    const cancelDelays = /* @__PURE__ */ new Set();
    let completed = 0;
    setAnimatedValues(new Array(elements.length).fill(0));
    const springs = elements.map(
      (_, index) => createSpringValue6(0, {
        ...config,
        onUpdate: (value) => {
          if (cancelled) return;
          setAnimatedValues((prev) => {
            const next = [...prev];
            next[index] = value;
            return next;
          });
        },
        onComplete: () => {
          if (cancelled) return;
          completed++;
          if (completed === springs.length) {
            onCompleteRef.current?.();
          }
        }
      })
    );
    springs.forEach((spring2, index) => {
      const ms = index * stagger;
      if (!(ms > 0)) {
        spring2.set(1);
        return;
      }
      const cancel = delay5(ms, () => {
        cancelDelays.delete(cancel);
        if (cancelled) return;
        spring2.set(1);
      });
      cancelDelays.add(cancel);
    });
    return () => {
      cancelled = true;
      cancelDelays.forEach((cancel) => cancel());
      springs.forEach((s) => s.destroy());
    };
  }, [elements, stagger, config, animateOnMount, trigger]);
  const getTransform = (progress) => {
    const offset = (1 - progress) * initialOffset;
    switch (from) {
      case "left":
        return `translateX(${-offset}px)`;
      case "right":
        return `translateX(${offset}px)`;
      case "top":
        return `translateY(${-offset}px)`;
      case "bottom":
        return `translateY(${offset}px)`;
      case "center":
        return `scale(${0.5 + progress * 0.5})`;
      default:
        return `translateY(${offset}px)`;
    }
  };
  return /* @__PURE__ */ jsx7("span", { className, style, children: elements.map((element, index) => {
    const progress = animatedValues[index] ?? 0;
    const opacity = initialOpacity + (1 - initialOpacity) * progress;
    if (element.match(/^\s+$/)) {
      return /* @__PURE__ */ jsx7("span", { children: element }, index);
    }
    return /* @__PURE__ */ jsx7(
      "span",
      {
        style: {
          display: "inline-block",
          opacity,
          transform: getTransform(progress),
          whiteSpace: mode === "lines" ? "pre" : void 0
        },
        children: element
      },
      index
    );
  }) });
});
var SpringNumber = memo2(function SpringNumber2({
  value,
  decimals = 0,
  format,
  config = { stiffness: 100, damping: 20 },
  prefix = "",
  suffix = "",
  className,
  style
}) {
  const [displayValue, setDisplayValue] = useState22(value);
  const springRef = useRef33(null);
  const lastValueRef = useRef33(value);
  useEffect24(() => {
    springRef.current = createSpringValue6(value, {
      ...config,
      onUpdate: setDisplayValue
    });
    return () => {
      springRef.current?.destroy();
      springRef.current = null;
    };
  }, []);
  useEffect24(() => {
    if (springRef.current && value !== lastValueRef.current) {
      springRef.current.set(value);
      lastValueRef.current = value;
    }
  }, [value]);
  const formattedValue = useMemo8(() => {
    if (format) {
      return format(displayValue);
    }
    return displayValue.toFixed(decimals);
  }, [displayValue, decimals, format]);
  return /* @__PURE__ */ jsxs("span", { className, style, children: [
    prefix,
    formattedValue,
    suffix
  ] });
});
var TypeWriter = memo2(function TypeWriter2({
  children,
  speed = 50,
  delay: delay6 = 0,
  cursor = true,
  cursorChar = "|",
  loop = false,
  pauseAtEnd = 1e3,
  deleteSpeed = 30,
  onComplete,
  className,
  style
}) {
  const [displayText, setDisplayText] = useState22("");
  const [showCursor, setShowCursor] = useState22(cursor);
  const [_isDeleting, setIsDeleting] = useState22(false);
  const timeoutRef = useRef33(null);
  const onCompleteRef = useRef33(onComplete);
  onCompleteRef.current = onComplete;
  useEffect24(() => {
    const characters = splitCharacters(children);
    let currentIndex = 0;
    let isDeleteMode = false;
    const tick = () => {
      if (!isDeleteMode) {
        if (currentIndex <= characters.length) {
          setDisplayText(characters.slice(0, currentIndex).join(""));
          currentIndex++;
          timeoutRef.current = window.setTimeout(tick, speed);
        } else {
          onCompleteRef.current?.();
          if (loop) {
            timeoutRef.current = window.setTimeout(() => {
              isDeleteMode = true;
              setIsDeleting(true);
              tick();
            }, pauseAtEnd);
          }
        }
      } else {
        if (currentIndex > 0) {
          currentIndex--;
          setDisplayText(characters.slice(0, currentIndex).join(""));
          timeoutRef.current = window.setTimeout(tick, deleteSpeed);
        } else {
          isDeleteMode = false;
          setIsDeleting(false);
          timeoutRef.current = window.setTimeout(tick, speed);
        }
      }
    };
    timeoutRef.current = window.setTimeout(tick, delay6);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [children, speed, delay6, loop, pauseAtEnd, deleteSpeed]);
  useEffect24(() => {
    if (!cursor) return;
    const blink = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 500);
    return () => clearInterval(blink);
  }, [cursor]);
  return /* @__PURE__ */ jsxs("span", { className, style, children: [
    displayText,
    cursor && /* @__PURE__ */ jsx7("span", { style: { opacity: showCursor ? 1 : 0 }, children: cursorChar })
  ] });
});
var SplitText = memo2(function SplitText2({
  children,
  mode = "characters",
  render,
  className,
  style
}) {
  const elements = useMemo8(() => splitText(children, mode), [children, mode]);
  return /* @__PURE__ */ jsx7("span", { className, style, children: elements.map((element, index) => /* @__PURE__ */ jsx7(React7.Fragment, { children: render(element, index, elements.length) }, index)) });
});

// src/adapters/react/components/Magnetic.tsx
import {
  useRef as useRef34,
  useEffect as useEffect25,
  useState as useState23,
  useCallback as useCallback21,
  memo as memo3,
  forwardRef as forwardRef4
} from "react";
import { createSpringValue as createSpringValue7 } from "@oxog/springkit";

// src/adapters/react/utils/dom.ts
function onPointerLeaveWindow(handler) {
  if (typeof document === "undefined") return () => {
  };
  const listener = (event) => {
    if (event.relatedTarget === null) handler();
  };
  document.addEventListener("mouseout", listener, { passive: true });
  return () => document.removeEventListener("mouseout", listener);
}

// src/adapters/react/components/Magnetic.tsx
import { jsx as jsx8 } from "react/jsx-runtime";
var DEFAULT_MAGNETIC_CONFIG = { stiffness: 200, damping: 20 };
var DEFAULT_CURSOR_CONFIG = { stiffness: 150, damping: 15 };
var Magnetic = memo3(forwardRef4(
  function Magnetic2({
    children,
    strength = 0.3,
    range = 100,
    config: configProp,
    enabled = true,
    scaleOnHover = 1,
    maxOffset = 50,
    className,
    style,
    onAttract,
    onRelease
  }, ref) {
    const config = useStableSpringConfig(configProp, DEFAULT_MAGNETIC_CONFIG);
    const reduceMotion = useShouldReduceMotion();
    const isActive = enabled && !reduceMotion;
    const innerRef = useRef34(null);
    const combinedRef = (node) => {
      innerRef.current = node;
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    };
    const springXRef = useRef34(null);
    const springYRef = useRef34(null);
    const springScaleRef = useRef34(null);
    const [transform, setTransform] = useState23({ x: 0, y: 0, scale: 1 });
    const isAttractedRef = useRef34(false);
    useEffect25(() => {
      springXRef.current = createSpringValue7(0, {
        ...config,
        onUpdate: (x) => setTransform((t) => ({ ...t, x }))
      });
      springYRef.current = createSpringValue7(0, {
        ...config,
        onUpdate: (y) => setTransform((t) => ({ ...t, y }))
      });
      springScaleRef.current = createSpringValue7(1, {
        ...config,
        onUpdate: (scale) => setTransform((t) => ({ ...t, scale }))
      });
      return () => {
        springXRef.current?.destroy();
        springYRef.current?.destroy();
        springScaleRef.current?.destroy();
      };
    }, [config]);
    const onAttractRef = useRef34(onAttract);
    const onReleaseRef = useRef34(onRelease);
    onAttractRef.current = onAttract;
    onReleaseRef.current = onRelease;
    const handleMouseMove = useCallback21(
      (e) => {
        if (!isActive || !innerRef.current) return;
        const rect = innerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const distanceX = e.clientX - centerX;
        const distanceY = e.clientY - centerY;
        const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
        if (distance < range) {
          const factor = 1 - distance / range;
          let offsetX = distanceX * strength * factor;
          let offsetY = distanceY * strength * factor;
          offsetX = Math.max(-maxOffset, Math.min(maxOffset, offsetX));
          offsetY = Math.max(-maxOffset, Math.min(maxOffset, offsetY));
          springXRef.current?.set(offsetX);
          springYRef.current?.set(offsetY);
          if (scaleOnHover !== 1) {
            const scaleFactor = 1 + (scaleOnHover - 1) * factor;
            springScaleRef.current?.set(scaleFactor);
          }
          if (!isAttractedRef.current) {
            isAttractedRef.current = true;
            onAttractRef.current?.();
          }
        } else {
          springXRef.current?.set(0);
          springYRef.current?.set(0);
          springScaleRef.current?.set(1);
          if (isAttractedRef.current) {
            isAttractedRef.current = false;
            onReleaseRef.current?.();
          }
        }
      },
      [isActive, range, strength, maxOffset, scaleOnHover]
    );
    const handleMouseLeave = useCallback21(() => {
      springXRef.current?.set(0);
      springYRef.current?.set(0);
      springScaleRef.current?.set(1);
      if (isAttractedRef.current) {
        isAttractedRef.current = false;
        onReleaseRef.current?.();
      }
    }, []);
    useEffect25(() => {
      if (!isActive) {
        handleMouseLeave();
        if (reduceMotion) {
          springXRef.current?.jump(0);
          springYRef.current?.jump(0);
          springScaleRef.current?.jump(1);
          setTransform({ x: 0, y: 0, scale: 1 });
        }
        return;
      }
      window.addEventListener("mousemove", handleMouseMove, { passive: true });
      const removeLeaveListener = onPointerLeaveWindow(handleMouseLeave);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        removeLeaveListener();
      };
    }, [isActive, reduceMotion, handleMouseMove, handleMouseLeave]);
    return /* @__PURE__ */ jsx8(
      "div",
      {
        ref: combinedRef,
        className,
        style: {
          display: "inline-block",
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          willChange: "transform",
          ...style
        },
        children
      }
    );
  }
));
var MagneticGroup = memo3(function MagneticGroup2({
  children,
  repel: _repel = false,
  repelStrength: _repelStrength = 0.2,
  className,
  style
}) {
  return /* @__PURE__ */ jsx8("div", { className, style, children });
});
var MagneticCursor = memo3(function MagneticCursor2({
  children,
  size = 30,
  config: configProp,
  offset,
  visible = true,
  zIndex = 9999,
  className,
  style
}) {
  const config = useStableSpringConfig(configProp, DEFAULT_CURSOR_CONFIG);
  const offsetX = offset?.x ?? 0;
  const offsetY = offset?.y ?? 0;
  const [position, setPosition] = useState23({ x: 0, y: 0 });
  const springXRef = useRef34(null);
  const springYRef = useRef34(null);
  useEffect25(() => {
    springXRef.current = createSpringValue7(0, {
      ...config,
      onUpdate: (x) => setPosition((p) => ({ ...p, x }))
    });
    springYRef.current = createSpringValue7(0, {
      ...config,
      onUpdate: (y) => setPosition((p) => ({ ...p, y }))
    });
    return () => {
      springXRef.current?.destroy();
      springYRef.current?.destroy();
    };
  }, [config]);
  useEffect25(() => {
    const handleMouseMove = (e) => {
      springXRef.current?.set(e.clientX + offsetX);
      springYRef.current?.set(e.clientY + offsetY);
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [offsetX, offsetY]);
  if (!visible) return null;
  return /* @__PURE__ */ jsx8(
    "div",
    {
      className,
      style: {
        position: "fixed",
        left: position.x - size / 2,
        top: position.y - size / 2,
        width: size,
        height: size,
        pointerEvents: "none",
        zIndex,
        ...style
      },
      children: children ?? /* @__PURE__ */ jsx8(
        "div",
        {
          style: {
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            border: "2px solid currentColor",
            opacity: 0.5
          }
        }
      )
    }
  );
});
function useMagnetic(options = {}) {
  const {
    strength = 0.3,
    range = 100,
    config: configOption,
    enabled = true,
    maxOffset = 50
  } = options;
  const config = useStableSpringConfig(configOption, DEFAULT_MAGNETIC_CONFIG);
  const reduceMotion = useShouldReduceMotion();
  const isActive = enabled && !reduceMotion;
  const ref = useRef34(null);
  const springXRef = useRef34(null);
  const springYRef = useRef34(null);
  const [position, setPosition] = useState23({ x: 0, y: 0 });
  const isAttractedRef = useRef34(false);
  const [isAttracted, setIsAttracted] = useState23(false);
  useEffect25(() => {
    springXRef.current = createSpringValue7(0, {
      ...config,
      onUpdate: (x) => setPosition((p) => ({ ...p, x }))
    });
    springYRef.current = createSpringValue7(0, {
      ...config,
      onUpdate: (y) => setPosition((p) => ({ ...p, y }))
    });
    return () => {
      springXRef.current?.destroy();
      springYRef.current?.destroy();
    };
  }, [config]);
  useEffect25(() => {
    if (!isActive) {
      if (reduceMotion) {
        springXRef.current?.jump(0);
        springYRef.current?.jump(0);
        setPosition({ x: 0, y: 0 });
      } else {
        springXRef.current?.set(0);
        springYRef.current?.set(0);
      }
      if (isAttractedRef.current) {
        isAttractedRef.current = false;
        setIsAttracted(false);
      }
      return;
    }
    const handleMouseMove = (e) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const distanceX = e.clientX - centerX;
      const distanceY = e.clientY - centerY;
      const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
      if (distance < range) {
        const factor = 1 - distance / range;
        let offsetX = distanceX * strength * factor;
        let offsetY = distanceY * strength * factor;
        offsetX = Math.max(-maxOffset, Math.min(maxOffset, offsetX));
        offsetY = Math.max(-maxOffset, Math.min(maxOffset, offsetY));
        springXRef.current?.set(offsetX);
        springYRef.current?.set(offsetY);
        if (!isAttractedRef.current) {
          isAttractedRef.current = true;
          setIsAttracted(true);
        }
      } else {
        springXRef.current?.set(0);
        springYRef.current?.set(0);
        if (isAttractedRef.current) {
          isAttractedRef.current = false;
          setIsAttracted(false);
        }
      }
    };
    const handleMouseLeave = () => {
      springXRef.current?.set(0);
      springYRef.current?.set(0);
      if (isAttractedRef.current) {
        isAttractedRef.current = false;
        setIsAttracted(false);
      }
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    const removeLeaveListener = onPointerLeaveWindow(handleMouseLeave);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      removeLeaveListener();
    };
  }, [isActive, reduceMotion, range, strength, maxOffset]);
  const reset = useCallback21(() => {
    springXRef.current?.set(0);
    springYRef.current?.set(0);
    isAttractedRef.current = false;
    setIsAttracted(false);
  }, []);
  return {
    ref,
    x: position.x,
    y: position.y,
    isAttracted,
    reset
  };
}

// src/adapters/react/components/Parallax.tsx
import * as React8 from "react";
import {
  useRef as useRef35,
  useEffect as useEffect26,
  useState as useState24,
  useCallback as useCallback22,
  useMemo as useMemo9,
  memo as memo4,
  forwardRef as forwardRef5,
  createContext as createContext6,
  useContext as useContext8
} from "react";
import { createSpringValue as createSpringValue8 } from "@oxog/springkit";
import { jsx as jsx9, jsxs as jsxs2 } from "react/jsx-runtime";
var DEFAULT_PARALLAX_CONFIG = { stiffness: 100, damping: 20 };
var DEFAULT_MOUSE_PARALLAX_CONFIG = { stiffness: 100, damping: 15 };
var DEFAULT_TILT_CONFIG = { stiffness: 300, damping: 20 };
var Parallax = memo4(forwardRef5(
  function Parallax2({
    children,
    speed = 0.5,
    direction = "vertical",
    config: configProp,
    enabled = true,
    offset,
    rootMargin = "100px",
    as: Component2 = "div",
    className,
    style
  }, ref) {
    const config = useStableSpringConfig(configProp, DEFAULT_PARALLAX_CONFIG);
    const reduceMotion = useShouldReduceMotion();
    const isActive = enabled && !reduceMotion;
    const offsetX = offset?.x ?? 0;
    const offsetY = offset?.y ?? 0;
    const innerRef = useRef35(null);
    const combinedRef = (node) => {
      innerRef.current = node;
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    };
    const springXRef = useRef35(null);
    const springYRef = useRef35(null);
    const [transform, setTransform] = useState24({ x: offsetX, y: offsetY });
    const [isInView, setIsInView] = useState24(false);
    useEffect26(() => {
      springXRef.current = createSpringValue8(offsetX, {
        ...config,
        onUpdate: (x) => setTransform((t) => ({ ...t, x }))
      });
      springYRef.current = createSpringValue8(offsetY, {
        ...config,
        onUpdate: (y) => setTransform((t) => ({ ...t, y }))
      });
      return () => {
        springXRef.current?.destroy();
        springYRef.current?.destroy();
      };
    }, [config, offsetX, offsetY]);
    useEffect26(() => {
      if (!innerRef.current) return;
      if (typeof IntersectionObserver === "undefined") {
        setIsInView(true);
        return;
      }
      const observer = new IntersectionObserver(
        ([entry]) => {
          setIsInView(entry?.isIntersecting ?? false);
        },
        { rootMargin }
      );
      observer.observe(innerRef.current);
      return () => observer.disconnect();
    }, [rootMargin]);
    useEffect26(() => {
      if (reduceMotion) {
        springXRef.current?.jump(offsetX);
        springYRef.current?.jump(offsetY);
        setTransform({ x: offsetX, y: offsetY });
        return;
      }
      if (!isActive || !isInView) return;
      const handleScroll = () => {
        if (!innerRef.current) return;
        const rect = innerRef.current.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const windowWidth = window.innerWidth;
        const centerY = (rect.top + rect.height / 2 - windowHeight / 2) / windowHeight;
        const centerX = (rect.left + rect.width / 2 - windowWidth / 2) / windowWidth;
        if (direction === "vertical" || direction === "both") {
          const yOffset = centerY * speed * 200 + offsetY;
          springYRef.current?.set(yOffset);
        }
        if (direction === "horizontal" || direction === "both") {
          const xOffset = centerX * speed * 200 + offsetX;
          springXRef.current?.set(xOffset);
        }
      };
      handleScroll();
      window.addEventListener("scroll", handleScroll, { passive: true });
      window.addEventListener("resize", handleScroll, { passive: true });
      return () => {
        window.removeEventListener("scroll", handleScroll);
        window.removeEventListener("resize", handleScroll);
      };
    }, [isActive, reduceMotion, isInView, speed, direction, offsetX, offsetY]);
    const transformStyle = useMemo9(() => {
      const parts = [];
      if (direction === "vertical" || direction === "both") {
        parts.push(`translateY(${transform.y}px)`);
      }
      if (direction === "horizontal" || direction === "both") {
        parts.push(`translateX(${transform.x}px)`);
      }
      return parts.join(" ") || "none";
    }, [direction, transform]);
    return React8.createElement(
      Component2,
      {
        ref: combinedRef,
        className,
        style: {
          transform: transformStyle,
          willChange: "transform",
          ...style
        }
      },
      children
    );
  }
));
var MouseParallax = memo4(forwardRef5(
  function MouseParallax2({
    children,
    strength = 20,
    inverted = false,
    config: configProp,
    enabled = true,
    container,
    resetOnLeave = true,
    as: Component2 = "div",
    className,
    style
  }, ref) {
    const config = useStableSpringConfig(configProp, DEFAULT_MOUSE_PARALLAX_CONFIG);
    const reduceMotion = useShouldReduceMotion();
    const springXRef = useRef35(null);
    const springYRef = useRef35(null);
    const [transform, setTransform] = useState24({ x: 0, y: 0 });
    useEffect26(() => {
      springXRef.current = createSpringValue8(0, {
        ...config,
        onUpdate: (x) => setTransform((t) => ({ ...t, x }))
      });
      springYRef.current = createSpringValue8(0, {
        ...config,
        onUpdate: (y) => setTransform((t) => ({ ...t, y }))
      });
      return () => {
        springXRef.current?.destroy();
        springYRef.current?.destroy();
      };
    }, [config]);
    useEffect26(() => {
      if (reduceMotion) {
        springXRef.current?.jump(0);
        springYRef.current?.jump(0);
        setTransform({ x: 0, y: 0 });
        return;
      }
      if (!enabled) return;
      const target = container?.current ?? null;
      const useWindow = target === null;
      const handleMouseMove = (e) => {
        let centerX;
        let centerY;
        let width;
        let height;
        if (target) {
          const rect = target.getBoundingClientRect();
          centerX = e.clientX - rect.left - rect.width / 2;
          centerY = e.clientY - rect.top - rect.height / 2;
          width = rect.width;
          height = rect.height;
        } else {
          centerX = e.clientX - window.innerWidth / 2;
          centerY = e.clientY - window.innerHeight / 2;
          width = window.innerWidth;
          height = window.innerHeight;
        }
        const normalizedX = centerX / width * 2;
        const normalizedY = centerY / height * 2;
        const factor = inverted ? -1 : 1;
        const offsetX = normalizedX * strength * factor;
        const offsetY = normalizedY * strength * factor;
        springXRef.current?.set(offsetX);
        springYRef.current?.set(offsetY);
      };
      const handleMouseLeave = () => {
        if (resetOnLeave) {
          springXRef.current?.set(0);
          springYRef.current?.set(0);
        }
      };
      let removeWindowLeaveListener = null;
      if (useWindow) {
        window.addEventListener("mousemove", handleMouseMove, { passive: true });
        removeWindowLeaveListener = onPointerLeaveWindow(handleMouseLeave);
      } else {
        target.addEventListener("mousemove", handleMouseMove, { passive: true });
        target.addEventListener("mouseleave", handleMouseLeave, { passive: true });
      }
      return () => {
        if (useWindow) {
          window.removeEventListener("mousemove", handleMouseMove);
          removeWindowLeaveListener?.();
        } else {
          target.removeEventListener("mousemove", handleMouseMove);
          target.removeEventListener("mouseleave", handleMouseLeave);
        }
      };
    }, [enabled, reduceMotion, container, strength, inverted, resetOnLeave]);
    return React8.createElement(
      Component2,
      {
        ref,
        className,
        style: {
          transform: `translate(${transform.x}px, ${transform.y}px)`,
          willChange: "transform",
          ...style
        }
      },
      children
    );
  }
));
var TiltCard = memo4(forwardRef5(
  function TiltCard2({
    children,
    maxTilt = 20,
    perspective = 1e3,
    scale = 1,
    config: configProp,
    enabled = true,
    glare = false,
    glareOpacity = 0.2,
    className,
    style,
    onTilt
  }, ref) {
    const config = useStableSpringConfig(configProp, DEFAULT_TILT_CONFIG);
    const reduceMotion = useShouldReduceMotion();
    const isActive = enabled && !reduceMotion;
    const innerRef = useRef35(null);
    const combinedRef = (node) => {
      innerRef.current = node;
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    };
    const springTiltXRef = useRef35(null);
    const springTiltYRef = useRef35(null);
    const springScaleRef = useRef35(null);
    const springGlareRef = useRef35(null);
    const [tilt, setTilt] = useState24({ x: 0, y: 0, scale: 1, glareX: 50, glareY: 50, glareOpacity: 0 });
    useEffect26(() => {
      springTiltXRef.current = createSpringValue8(0, {
        ...config,
        onUpdate: (x) => setTilt((t) => ({ ...t, x }))
      });
      springTiltYRef.current = createSpringValue8(0, {
        ...config,
        onUpdate: (y) => setTilt((t) => ({ ...t, y }))
      });
      springScaleRef.current = createSpringValue8(1, {
        ...config,
        onUpdate: (s) => setTilt((t) => ({ ...t, scale: s }))
      });
      springGlareRef.current = createSpringValue8(0, {
        ...config,
        onUpdate: (o) => setTilt((t) => ({ ...t, glareOpacity: o }))
      });
      return () => {
        springTiltXRef.current?.destroy();
        springTiltYRef.current?.destroy();
        springScaleRef.current?.destroy();
        springGlareRef.current?.destroy();
      };
    }, [config]);
    const handleMouseMove = useCallback22(
      (e) => {
        if (!isActive || !innerRef.current) return;
        const rect = innerRef.current.getBoundingClientRect();
        const centerX = (e.clientX - rect.left) / rect.width - 0.5;
        const centerY = (e.clientY - rect.top) / rect.height - 0.5;
        const tiltX = centerY * maxTilt * -1;
        const tiltY = centerX * maxTilt;
        springTiltXRef.current?.set(tiltX);
        springTiltYRef.current?.set(tiltY);
        springScaleRef.current?.set(scale);
        if (glare) {
          springGlareRef.current?.set(glareOpacity);
          setTilt((t) => ({
            ...t,
            glareX: (centerX + 0.5) * 100,
            glareY: (centerY + 0.5) * 100
          }));
        }
        onTilt?.(tiltX, tiltY);
      },
      [isActive, maxTilt, scale, glare, glareOpacity, onTilt]
    );
    const handleMouseLeave = useCallback22(() => {
      springTiltXRef.current?.set(0);
      springTiltYRef.current?.set(0);
      springScaleRef.current?.set(1);
      springGlareRef.current?.set(0);
    }, []);
    useEffect26(() => {
      if (!reduceMotion) return;
      springTiltXRef.current?.jump(0);
      springTiltYRef.current?.jump(0);
      springScaleRef.current?.jump(1);
      springGlareRef.current?.jump(0);
      setTilt((t) => ({ ...t, x: 0, y: 0, scale: 1, glareOpacity: 0 }));
    }, [reduceMotion]);
    return /* @__PURE__ */ jsx9(
      "div",
      {
        ref: combinedRef,
        className,
        style: {
          perspective: `${perspective}px`,
          ...style
        },
        onMouseMove: handleMouseMove,
        onMouseLeave: handleMouseLeave,
        children: /* @__PURE__ */ jsxs2(
          "div",
          {
            style: {
              transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${tilt.scale})`,
              transformStyle: "preserve-3d",
              width: "100%",
              height: "100%"
            },
            children: [
              children,
              glare && /* @__PURE__ */ jsx9(
                "div",
                {
                  style: {
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, white, transparent)`,
                    opacity: tilt.glareOpacity,
                    borderRadius: "inherit"
                  }
                }
              )
            ]
          }
        )
      }
    );
  }
));
var ParallaxContext = createContext6(null);
var ParallaxContainer = memo4(function ParallaxContainer2({
  children,
  pages = 1,
  className,
  style
}) {
  const containerRef = useRef35(null);
  const [scrollProgress, setScrollProgress] = useState24(0);
  useEffect26(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const el = containerRef.current;
      if (!el) return;
      const scrollTop = el.scrollTop;
      const maxScroll = el.scrollHeight - el.clientHeight;
      setScrollProgress(maxScroll > 0 ? scrollTop / maxScroll : 0);
    };
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);
  const contextValue = useMemo9(
    () => ({ scrollProgress, containerRef, pages }),
    [scrollProgress, pages]
  );
  return /* @__PURE__ */ jsx9(ParallaxContext.Provider, { value: contextValue, children: /* @__PURE__ */ jsx9(
    "div",
    {
      ref: containerRef,
      className,
      style: {
        height: "100vh",
        overflow: "auto",
        position: "relative",
        ...style
      },
      children: /* @__PURE__ */ jsx9("div", { style: { height: `${pages * 100}vh`, position: "relative" }, children })
    }
  ) });
});
var ParallaxLayer = memo4(function ParallaxLayer2({
  children,
  offset = 0,
  speed = 1,
  horizontal = false,
  sticky,
  className,
  style
}) {
  const context = useContext8(ParallaxContext);
  const [transform, setTransform] = useState24({ x: 0, y: 0 });
  useEffect26(() => {
    if (!context) return;
    const pageHeight = 100;
    const scrolledPages = context.scrollProgress * Math.max(0, context.pages - 1);
    if (sticky) {
      const stickyPage = Math.min(Math.max(scrolledPages, sticky.start), Math.max(sticky.start, sticky.end));
      setTransform({ x: 0, y: stickyPage * pageHeight });
    } else {
      const base = offset * pageHeight;
      const parallaxOffset = scrolledPages * pageHeight * (1 - speed);
      if (horizontal) {
        setTransform({ x: parallaxOffset, y: base });
      } else {
        setTransform({ x: 0, y: base + parallaxOffset });
      }
    }
  }, [context?.scrollProgress, context?.pages, offset, speed, horizontal, sticky?.start, sticky?.end]);
  return /* @__PURE__ */ jsx9(
    "div",
    {
      className,
      style: {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100vh",
        transform: `translate(${transform.x}vh, ${transform.y}vh)`,
        willChange: "transform",
        ...style
      },
      children
    }
  );
});
function useParallaxContext() {
  return useContext8(ParallaxContext);
}

// src/adapters/react/components/LazyMotion.tsx
import * as React9 from "react";
import { createContext as createContext7, useContext as useContext9, useState as useState25, useEffect as useEffect27, useMemo as useMemo10 } from "react";
var domAnimation = {
  animations: true,
  gestures: true
};
var domMax = {
  animations: true,
  gestures: true,
  layout: true,
  svg: true,
  scroll: true
};
var domMin = {
  animations: true
};
var LazyMotionContext = createContext7({
  features: domMax,
  isStrict: false,
  isLoaded: true
});
function useLazyMotion() {
  return useContext9(LazyMotionContext);
}
function useMotionFeature(feature) {
  const { features, isLoaded } = useLazyMotion();
  return isLoaded && (features[feature] ?? false);
}
function LazyMotion({
  features,
  strict = false,
  children
}) {
  const [loadedFeatures, setLoadedFeatures] = useState25(
    typeof features === "function" ? null : features
  );
  const [isLoaded, setIsLoaded] = useState25(typeof features !== "function");
  useEffect27(() => {
    if (typeof features !== "function") {
      setLoadedFeatures(features);
      setIsLoaded(true);
      return;
    }
    let cancelled = false;
    features().then(
      (loaded) => {
        if (cancelled) return;
        setLoadedFeatures(loaded);
        setIsLoaded(true);
      },
      (error) => {
        if (cancelled) return;
        console.error("[SpringKit] LazyMotion: failed to load features", error);
        setLoadedFeatures({});
        setIsLoaded(true);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [features]);
  const contextValue = useMemo10(() => ({
    features: loadedFeatures ?? {},
    isStrict: strict,
    isLoaded
  }), [loadedFeatures, strict, isLoaded]);
  return React9.createElement(
    LazyMotionContext.Provider,
    { value: contextValue },
    children
  );
}
function MotionFeatureGuard({
  feature,
  children,
  fallback = null
}) {
  const isAvailable = useMotionFeature(feature);
  return React9.createElement(
    React9.Fragment,
    null,
    isAvailable ? children : fallback
  );
}
function createAsyncFeatures(config) {
  return async () => {
    const result = {};
    await Promise.all(
      Object.entries(config).map(async ([key, value]) => {
        const featureKey = key;
        if (typeof value === "function") {
          await value();
          result[featureKey] = true;
        } else {
          result[featureKey] = value;
        }
      })
    );
    return result;
  };
}
function mergeFeatures(...bundles) {
  return bundles.reduce((acc, bundle) => ({
    ...acc,
    ...bundle
  }), {});
}

// src/adapters/react/index.ts
import {
  MotionValue as MotionValue5,
  createMotionValue as createMotionValue5,
  transformValue,
  transformMapRange
} from "@oxog/springkit";
export {
  AnimatePresence,
  Animated,
  LayoutGroupContext,
  LayoutGroupProvider,
  LazyMotion,
  Magnetic,
  MagneticCursor,
  MagneticGroup,
  MotionConfig,
  MotionFeatureGuard,
  MotionValue5 as MotionValue,
  MouseParallax,
  Parallax,
  ParallaxContainer,
  ParallaxLayer,
  PresenceChild,
  PresenceContext,
  Reorder,
  SharedLayoutContextReact,
  SharedLayoutProvider,
  SplitText,
  Spring,
  SpringNumber,
  SpringText,
  TiltCard,
  Trail,
  TypeWriter,
  VariantContext,
  VariantProvider,
  createAsyncFeatures,
  createMotionComponent,
  createMotionValue5 as createMotionValue,
  domAnimation,
  domMax,
  domMin,
  getReducedMotionPreference,
  isBrowser,
  isServer,
  transformMapRange as mapRange,
  mergeFeatures,
  safeCancelAnimationFrame,
  safeRequestAnimationFrame,
  shouldSkipAnimation,
  transformValue,
  useAnimate,
  useAnimationFrame,
  useAutoLayout,
  useBounce,
  useChain,
  useClamp,
  useCombinedTransform,
  useDelay,
  useDifference,
  useDrag,
  useDragControls,
  useElastic,
  useFlip,
  useFocus,
  useForceUpdate,
  useGesture,
  useGestureAnimation,
  useGestureState,
  useGravity,
  useGyroscope,
  useHover,
  useInView,
  useInViewCallback,
  useInViewMultiple,
  useInstantTransition,
  useInteractionState,
  useIsPresent,
  useIsomorphicLayoutEffect,
  useLayoutGroup,
  useLayoutId,
  useLayoutMeasure,
  useLazyMotion,
  useMagnetic,
  useMomentum,
  useMorph,
  useMorphRef,
  useMorphSequence,
  useMotionConfig,
  useMotionFeature,
  useMotionTemplate,
  useMotionValue,
  useMotionValueEvent,
  useMotionValueState,
  useMotionValueSync,
  useMotionValues,
  useParallax,
  useParallaxContext,
  usePointer,
  usePresence,
  usePresenceCustom,
  useProduct,
  useReducedMotion,
  useReducedMotionConfig,
  useReducedMotionValue,
  useScroll,
  useScrollLinkedValue,
  useScrollProgress,
  useScrollTrigger,
  useScrollVelocity,
  useShouldAnimate,
  useSmooth,
  useSnap,
  useSpring,
  useSpringState,
  useSpringTransform,
  useSpringValue,
  useSprings,
  useStaggerChildren,
  useSum,
  useTap,
  useTime,
  useTimeline,
  useTimelineState,
  useTrail,
  useTransform,
  useVariantContext,
  useVariants,
  useVelocity,
  useVelocityTransform,
  useWillChange
};
