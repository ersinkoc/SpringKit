"use client";

// src/adapters/react/hooks/useSpring.ts
import { useEffect, useRef, useState, useCallback } from "react";
import { createSpringGroup } from "@oxog/springkit";
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
  const springRef = useRef(null);
  const isMounted = useRef(false);
  const configRef = useRef(config);
  const prevValuesRef = useRef(values);
  configRef.current = config;
  if (!springRef.current || springRef.current.isDestroyed()) {
    springRef.current = createSpringGroup(values, config);
    prevValuesRef.current = values;
  }
  const getSpringValues = useCallback(() => {
    const spring = springRef.current;
    if (!spring) return values;
    return spring.get();
  }, []);
  const [currentValues, setCurrentValues] = useState(getSpringValues);
  useEffect(() => {
    isMounted.current = true;
    const spring = springRef.current;
    if (!spring) return;
    const unsubscribe = spring.subscribe((newValues) => {
      if (isMounted.current) {
        setCurrentValues(newValues);
      }
    });
    return () => {
      isMounted.current = false;
      unsubscribe();
    };
  }, []);
  useEffect(() => {
    const spring = springRef.current;
    if (!spring) return;
    if (!shallowEqual(values, prevValuesRef.current)) {
      prevValuesRef.current = values;
      spring.set(values, configRef.current);
    }
  });
  useEffect(() => {
    return () => {
      springRef.current?.destroy();
      springRef.current = null;
    };
  }, []);
  return currentValues;
}

// src/adapters/react/hooks/useSpringValue.ts
import { useEffect as useEffect2, useRef as useRef2 } from "react";
import { createSpringValue } from "@oxog/springkit";
function useSpringValue(initial, config = {}) {
  const springRef = useRef2(null);
  if (!springRef.current || springRef.current.isDestroyed()) {
    springRef.current = createSpringValue(initial, config);
  }
  useEffect2(() => {
    return () => springRef.current?.destroy();
  }, []);
  return springRef.current;
}

// src/adapters/react/hooks/useSprings.ts
import { useEffect as useEffect3, useRef as useRef3, useState as useState2, useCallback as useCallback2 } from "react";
import { createSpringGroup as createSpringGroup2 } from "@oxog/springkit";
function useSprings(count, items, defaultConfig = {}) {
  const springsRef = useRef3([]);
  const isMountedRef = useRef3(false);
  const itemsRef = useRef3(items);
  itemsRef.current = items;
  const getInitialValues = useCallback2(() => {
    const result = [];
    for (let i = 0; i < count; i++) {
      const item = itemsRef.current(i);
      result.push(item.from ?? item.values);
    }
    return result;
  }, [count]);
  const [currentValues, setCurrentValues] = useState2(getInitialValues);
  useEffect3(() => {
    isMountedRef.current = true;
    springsRef.current.forEach((s) => s?.destroy());
    springsRef.current = [];
    const timeoutIds = [];
    const unsubscribers = [];
    for (let i = 0; i < count; i++) {
      const item = itemsRef.current(i);
      const initialValues = item.from ?? item.values;
      const spring = createSpringGroup2(initialValues, {
        ...defaultConfig,
        ...item.config
      });
      springsRef.current.push(spring);
      const index = i;
      const unsubscribe = spring.subscribe((values) => {
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
      const timeoutId = setTimeout(() => {
        spring.set(item.values);
      }, item.delay ?? 0);
      timeoutIds.push(timeoutId);
    }
    return () => {
      isMountedRef.current = false;
      unsubscribers.forEach((unsub) => unsub());
      timeoutIds.forEach(clearTimeout);
      springsRef.current.forEach((s) => s?.destroy());
    };
  }, [count, defaultConfig]);
  return currentValues;
}

// src/adapters/react/hooks/useTrail.ts
import { useEffect as useEffect4, useRef as useRef4, useState as useState3 } from "react";
import { createSpringValue as createSpringValue2 } from "@oxog/springkit";
function useTrail(count, values, config = {}) {
  const springsRef = useRef4(null);
  const isMountedRef = useRef4(false);
  const [currentValues, setCurrentValues] = useState3(
    () => Array.from({ length: count }, () => ({ ...values }))
  );
  const isFirstRender = useRef4(true);
  const prevValuesRef = useRef4(JSON.stringify(values));
  const timeoutsRef = useRef4([]);
  useEffect4(() => {
    isMountedRef.current = true;
    const keys = Object.keys(values);
    const springs = /* @__PURE__ */ new Map();
    const existingSprings = springsRef.current;
    keys.forEach((key) => {
      const propSprings = [];
      const initialValue = values[key];
      const existingPropSprings = existingSprings?.get(key);
      for (let i = 0; i < count; i++) {
        const existingSpring = existingPropSprings?.[i];
        const spring = existingSpring && !existingSpring.isDestroyed() ? existingSpring : createSpringValue2(initialValue, config);
        propSprings.push(spring);
      }
      springs.set(key, propSprings);
    });
    springsRef.current = springs;
    const unsubscribers = [];
    springs.forEach((propSprings, _key) => {
      propSprings.forEach((spring, index) => {
        const unsub = spring.subscribe(() => {
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
      springs.forEach((propSprings) => {
        propSprings.forEach((spring) => spring.destroy());
      });
      springs.clear();
      springsRef.current = null;
    };
  }, [count, config.stiffness, config.damping, config.mass]);
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
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    keys.forEach((key) => {
      const propSprings = springsRef.current?.get(key);
      if (!propSprings) return;
      const targetValue = values[key];
      propSprings.forEach((spring, index) => {
        const timeoutId = setTimeout(() => {
          spring.set(targetValue, config);
        }, index * staggerDelay);
        timeoutsRef.current.push(timeoutId);
      });
    });
    return () => {
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
    };
  }, [JSON.stringify(values), config.stiffness, config.damping]);
  return currentValues;
}

// src/adapters/react/hooks/useDrag.ts
import { useEffect as useEffect5, useRef as useRef5, useState as useState4 } from "react";
import { createDragSpring } from "@oxog/springkit";
function useDrag(config = {}) {
  const dragSpringRef = useRef5(null);
  const positionRef = useRef5({ x: 0, y: 0 });
  const [element, setElement] = useState4(null);
  const [isDragging, setIsDragging] = useState4(false);
  const [, forceUpdate] = useState4({});
  const configRef = useRef5(config);
  const rafIdRef = useRef5(null);
  const pendingUpdateRef = useRef5(false);
  configRef.current = config;
  const refCallback = (el) => {
    setElement(el);
  };
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
    }
    return () => {
      isActive = false;
      dragSpringRef.current?.destroy();
      dragSpringRef.current = null;
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [element]);
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
import { useRef as useRef6 } from "react";
function useGesture(handlers) {
  const stateRef = useRef6({
    isDragging: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0
  });
  const onPointerDown = (e) => {
    stateRef.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY
    };
    try {
      handlers.onDragStart?.(e);
    } catch (error) {
      console.error("[SpringKit] Gesture onDragStart error:", error);
    }
  };
  const onPointerMove = (e) => {
    if (!stateRef.current.isDragging) return;
    const deltaX = e.clientX - stateRef.current.startX;
    const deltaY = e.clientY - stateRef.current.startY;
    try {
      handlers.onDrag?.({ x: deltaX, y: deltaY });
    } catch (error) {
      console.error("[SpringKit] Gesture onDrag error:", error);
    }
    stateRef.current.currentX = e.clientX;
    stateRef.current.currentY = e.clientY;
  };
  const onPointerUp = () => {
    stateRef.current.isDragging = false;
  };
  const onPointerCancel = () => {
    stateRef.current.isDragging = false;
  };
  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel
  };
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
import { useRef as useRef7, useCallback as useCallback3, useEffect as useEffect6 } from "react";
import { createSpringValue as createSpringValue3 } from "@oxog/springkit";
function useAnimate() {
  const scopeRef = useRef7(null);
  const springsRef = useRef7(/* @__PURE__ */ new Map());
  const valuesRef = useRef7(/* @__PURE__ */ new Map());
  const isAnimatingRef = useRef7(false);
  const cleanupRef = useRef7([]);
  const rafIdsRef = useRef7(/* @__PURE__ */ new Set());
  const timeoutIdsRef = useRef7(/* @__PURE__ */ new Set());
  const isDestroyedRef = useRef7(false);
  useEffect6(() => {
    isDestroyedRef.current = false;
  }, []);
  const _getPropertyStyle = useCallback3((_property, _value) => {
    return null;
  }, []);
  const applyStyles = useCallback3(() => {
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
  const animate = useCallback3(async (target, options = {}) => {
    const { config = {}, delay = 0, onComplete } = options;
    try {
      if (delay > 0) {
        await new Promise((resolve) => {
          const timeoutId = setTimeout(() => {
            timeoutIdsRef.current.delete(timeoutId);
            resolve();
          }, delay);
          timeoutIdsRef.current.add(timeoutId);
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
            return new Promise((resolve) => {
              if (isDestroyedRef.current) {
                resolve();
                return;
              }
              try {
                let spring = springsRef.current.get(property);
                if (!spring) {
                  spring = createSpringValue3(valuesRef.current.get(property) ?? 0, config);
                  springsRef.current.set(property, spring);
                  const unsubscribe = spring.subscribe((v) => {
                    if (!isDestroyedRef.current) {
                      valuesRef.current.set(property, v);
                      applyStyles();
                    }
                  });
                  cleanupRef.current.push(unsubscribe);
                }
                if (config.stiffness || config.damping || config.mass) {
                  spring.setConfig(config);
                }
                spring.set(targetValue);
                let rafId = null;
                const checkComplete = () => {
                  if (rafId !== null) {
                    rafIdsRef.current.delete(rafId);
                  }
                  if (isDestroyedRef.current || !spring || !spring.isAnimating()) {
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
  }, [applyStyles]);
  const controls = {
    stop: useCallback3(() => {
      springsRef.current.forEach((spring) => {
        spring.stop();
      });
      isAnimatingRef.current = false;
    }, []),
    get: useCallback3((property) => {
      return valuesRef.current.get(property);
    }, []),
    isAnimating: useCallback3(() => {
      return isAnimatingRef.current;
    }, [])
  };
  useEffect6(() => {
    const rafIds = rafIdsRef.current;
    const timeoutIds = timeoutIdsRef.current;
    const cleanup = cleanupRef.current;
    const springs = springsRef.current;
    return () => {
      isDestroyedRef.current = true;
      rafIds.forEach((id) => cancelAnimationFrame(id));
      rafIds.clear();
      timeoutIds.forEach((id) => clearTimeout(id));
      timeoutIds.clear();
      cleanup.forEach((c) => c());
      springs.forEach((spring) => spring.destroy());
      springs.clear();
    };
  }, []);
  return [scopeRef, animate, controls];
}

// src/adapters/react/hooks/useMotionValue.ts
import { useRef as useRef8, useEffect as useEffect7, useState as useState5 } from "react";
import { createMotionValue } from "@oxog/springkit";
function useMotionValue(initialValue, options) {
  const motionValueRef = useRef8(null);
  if (motionValueRef.current === null || motionValueRef.current.isDestroyed()) {
    motionValueRef.current = createMotionValue(initialValue, options);
  }
  useEffect7(() => {
    return () => {
      motionValueRef.current?.destroy();
    };
  }, []);
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
  const motionValuesRef = useRef8(null);
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
  useEffect7(() => {
    return () => {
      if (motionValuesRef.current) {
        const current = motionValuesRef.current;
        for (const key in current) {
          if (Object.prototype.hasOwnProperty.call(current, key)) {
            current[key].destroy();
          }
        }
      }
    };
  }, []);
  return motionValuesRef.current;
}

// src/adapters/react/hooks/useTransform.ts
import { useRef as useRef9, useEffect as useEffect8, useMemo, useCallback as useCallback4 } from "react";
import { createMotionValue as createMotionValue2 } from "@oxog/springkit";
function useVelocity(source) {
  const velocityRef = useRef9(null);
  const frameRef = useRef9(null);
  const lastVelocityRef = useRef9(0);
  const isRunningRef = useRef9(false);
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
  useEffect8(() => {
    return () => {
      velocityRef.current?.destroy();
    };
  }, []);
  return velocityRef.current;
}
function useMotionValueEvent(value, event, callback) {
  const callbackRef = useRef9(callback);
  callbackRef.current = callback;
  useEffect8(() => {
    if (event === "change") {
      return value.subscribe((v) => callbackRef.current(v));
    }
    return value.on(event, () => callbackRef.current(value.get()));
  }, [value, event]);
}
function useTransform(source, inputRangeOrTransform, outputRange, options) {
  const derivedRef = useRef9(null);
  const unsubscribeRef = useRef9(null);
  const transformFn = useMemo(() => {
    if (typeof inputRangeOrTransform === "function") {
      return inputRangeOrTransform;
    }
    if (!outputRange) {
      throw new Error("useTransform: outputRange is required when using range mapping");
    }
    const inputRange = inputRangeOrTransform;
    if (typeof outputRange[0] === "number") {
      return (value) => {
        let i = 0;
        for (; i < inputRange.length - 1; i++) {
          const nextVal = inputRange[i + 1];
          if (nextVal !== void 0 && value <= nextVal) break;
        }
        const inputMin = inputRange[i] ?? 0;
        const inputMax = inputRange[Math.min(i + 1, inputRange.length - 1)] ?? 1;
        const outputMin = outputRange[i] ?? 0;
        const outputMax = outputRange[Math.min(i + 1, outputRange.length - 1)] ?? 1;
        let t = inputMax !== inputMin ? (value - inputMin) / (inputMax - inputMin) : 0;
        if (options?.ease) {
          t = options.ease(t);
        }
        if (options?.clamp) {
          t = Math.max(0, Math.min(1, t));
        }
        return outputMin + t * (outputMax - outputMin);
      };
    }
    return (value) => {
      let i = 0;
      for (; i < inputRange.length - 1; i++) {
        const nextVal = inputRange[i + 1];
        if (nextVal !== void 0 && value <= nextVal) break;
      }
      const inCurr = inputRange[i] ?? 0;
      const inNext = inputRange[i + 1] ?? 1;
      const t = inNext !== inCurr ? (value - inCurr) / (inNext - inCurr) : 0;
      return t < 0.5 ? outputRange[i] : outputRange[i + 1];
    };
  }, [inputRangeOrTransform, outputRange, options?.clamp, options?.ease]);
  if (derivedRef.current === null) {
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
  useEffect8(() => {
    return () => {
      derivedRef.current?.destroy();
    };
  }, []);
  return derivedRef.current;
}
function useCombinedTransform(sources, transform) {
  const derivedRef = useRef9(null);
  const unsubscribesRef = useRef9([]);
  const getCurrentValues = () => {
    return sources.map((source) => source.get());
  };
  if (derivedRef.current === null) {
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
  useEffect8(() => {
    return () => {
      derivedRef.current?.destroy();
    };
  }, []);
  return derivedRef.current;
}
function useVelocityTransform(source, transform) {
  const derivedRef = useRef9(null);
  const frameRef = useRef9(null);
  const isRunningRef = useRef9(false);
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
  useEffect8(() => {
    return () => {
      derivedRef.current?.destroy();
    };
  }, []);
  return derivedRef.current;
}
function useSpringTransform(source, inputRange, outputRange, springConfig) {
  const derivedRef = useRef9(null);
  const unsubscribeRef = useRef9(null);
  const transform = useMemo(() => {
    return (value) => {
      let i = 0;
      for (; i < inputRange.length - 1; i++) {
        const nextVal = inputRange[i + 1];
        if (nextVal !== void 0 && value <= nextVal) break;
      }
      const inCurr = inputRange[i] ?? 0;
      const inNext = inputRange[i + 1] ?? 1;
      const outCurr = outputRange[i] ?? 0;
      const outNext = outputRange[i + 1] ?? 1;
      const t = (value - inCurr) / (inNext - inCurr);
      return outCurr + t * (outNext - outCurr);
    };
  }, [inputRange, outputRange]);
  if (derivedRef.current === null) {
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
  useEffect8(() => {
    return () => {
      derivedRef.current?.destroy();
    };
  }, []);
  return derivedRef.current;
}
function useMotionTemplate(strings, ...values) {
  const templateRef = useRef9(null);
  const unsubscribesRef = useRef9([]);
  const valuesRef = useRef9(values);
  valuesRef.current = values;
  const stringsRef = useRef9(strings);
  stringsRef.current = strings;
  const buildString = useCallback4(() => {
    let result = "";
    stringsRef.current.forEach((str, i) => {
      result += str;
      if (i < valuesRef.current.length) {
        result += String(valuesRef.current[i]?.get() ?? "");
      }
    });
    return result;
  }, []);
  if (templateRef.current === null) {
    templateRef.current = createMotionValue2(buildString());
  }
  const valuesLength = values.length;
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
  }, [valuesLength, buildString]);
  useEffect8(() => {
    return () => {
      templateRef.current?.destroy();
    };
  }, []);
  return templateRef.current;
}
function useTime() {
  const timeRef = useRef9(null);
  const frameRef = useRef9(null);
  const startTimeRef = useRef9(null);
  if (timeRef.current === null) {
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
  useEffect8(() => {
    return () => {
      timeRef.current?.destroy();
    };
  }, []);
  return timeRef.current;
}
function useAnimationFrame(callback) {
  const callbackRef = useRef9(callback);
  const frameRef = useRef9(null);
  const lastTimeRef = useRef9(null);
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
  const willChangeRef = useRef9(null);
  const frameRef = useRef9(null);
  const wasAnimatingRef = useRef9(false);
  const isDestroyedRef = useRef9(false);
  const sourcesRef = useRef9(sources);
  sourcesRef.current = sources;
  const propertiesRef = useRef9(properties);
  propertiesRef.current = properties;
  if (willChangeRef.current === null) {
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
  useEffect8(() => {
    return () => {
      willChangeRef.current?.destroy();
    };
  }, []);
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
  const smoothedRef = useRef9(null);
  const currentRef = useRef9(source.get());
  if (smoothedRef.current === null) {
    smoothedRef.current = createMotionValue2(source.get());
  }
  useEffect8(() => {
    const unsub = source.subscribe((target) => {
      currentRef.current = currentRef.current + (target - currentRef.current) * factor;
      smoothedRef.current?.jump(currentRef.current);
    });
    return unsub;
  }, [source, factor]);
  useEffect8(() => {
    return () => {
      smoothedRef.current?.destroy();
    };
  }, []);
  return smoothedRef.current;
}
function useDelay(source, frames) {
  const delayedRef = useRef9(null);
  const bufferRef = useRef9([]);
  if (delayedRef.current === null) {
    delayedRef.current = createMotionValue2(source.get());
    bufferRef.current = Array(frames).fill(source.get());
  }
  useEffect8(() => {
    const unsub = source.subscribe((value) => {
      bufferRef.current.push(value);
      const delayed = bufferRef.current.shift();
      if (delayed !== void 0) {
        delayedRef.current?.jump(delayed);
      }
    });
    return unsub;
  }, [source, frames]);
  useEffect8(() => {
    return () => {
      delayedRef.current?.destroy();
    };
  }, []);
  return delayedRef.current;
}

// src/adapters/react/hooks/useDragControls.ts
import { useRef as useRef10, useCallback as useCallback5 } from "react";
function useDragControls() {
  const isDraggingRef = useRef10(false);
  const listenerRef = useRef10(null);
  const stopRef = useRef10(null);
  const start = useCallback5((event, options) => {
    isDraggingRef.current = true;
    event.preventDefault();
    if (listenerRef.current) {
      const pointerEvent = "nativeEvent" in event ? event.nativeEvent : event;
      listenerRef.current(pointerEvent, options);
    }
  }, []);
  const stop = useCallback5(() => {
    isDraggingRef.current = false;
    if (stopRef.current) {
      stopRef.current();
    }
  }, []);
  const isDragging = useCallback5(() => {
    return isDraggingRef.current;
  }, []);
  const controls = {
    start,
    stop,
    isDragging,
    _setDragHandler: (handler) => {
      listenerRef.current = handler;
    },
    _setStopHandler: (handler) => {
      stopRef.current = handler;
    },
    _notifyDragEnd: () => {
      isDraggingRef.current = false;
    }
  };
  return controls;
}

// src/adapters/react/hooks/useInstantTransition.ts
import { useCallback as useCallback6, useRef as useRef11, useTransition, startTransition } from "react";
import { useState as useState6 } from "react";
function useInstantTransition() {
  const [isPending, _setIsPending] = useTransition();
  const startInstantTransition = useCallback6((callback) => {
    startTransition(() => {
      callback();
    });
  }, []);
  return [startInstantTransition, isPending];
}
function useForceUpdate() {
  const [, setTick] = useState6(0);
  return useCallback6(() => {
    setTick((t) => t + 1);
  }, []);
}
function useLayoutMeasure() {
  const beforeRef = useRef11(null);
  const measureBefore = useCallback6((element) => {
    if (element) {
      beforeRef.current = element.getBoundingClientRect();
    }
  }, []);
  const measureAfter = useCallback6((element) => {
    if (element) {
      return element.getBoundingClientRect();
    }
    return null;
  }, []);
  const getLayoutDelta = useCallback6((element) => {
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
import { useState as useState7, useRef as useRef12, useEffect as useEffect10 } from "react";

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

// src/adapters/react/hooks/useInView.ts
function useInView(options = {}) {
  const {
    once = false,
    amount = "some",
    margin = "0px",
    root
  } = options;
  const ref = useRef12(null);
  const [inView, setInView] = useState7(false);
  const [entry, setEntry] = useState7();
  const hasTriggered = useRef12(false);
  useEffect10(() => {
    if (!isBrowser) return;
    const element = ref.current;
    if (!element) return;
    if (once && hasTriggered.current) return;
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
  }, [once, amount, margin, root]);
  return { ref, inView, entry };
}
function useInViewCallback(callback, options = {}) {
  const ref = useRef12(null);
  const callbackRef = useRef12(callback);
  const hasTriggered = useRef12(false);
  callbackRef.current = callback;
  const { once = false, amount = "some", margin = "0px", root } = options;
  useEffect10(() => {
    if (!isBrowser) return;
    const element = ref.current;
    if (!element) return;
    if (once && hasTriggered.current) return;
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
  }, [once, amount, margin, root]);
  return ref;
}
function useInViewMultiple(options = {}) {
  const elementsRef = useRef12(/* @__PURE__ */ new Map());
  const [inViewMap, setInViewMap] = useState7(/* @__PURE__ */ new Map());
  const observerRef = useRef12(null);
  const { once = false, amount = "some", margin = "0px", root } = options;
  useEffect10(() => {
    if (!isBrowser) return;
    let threshold;
    if (amount === "some") {
      threshold = 0;
    } else if (amount === "all") {
      threshold = 1;
    } else {
      threshold = amount;
    }
    observerRef.current = new IntersectionObserver(
      (entries) => {
        setInViewMap((prev) => {
          const next = new Map(prev);
          entries.forEach((entry) => {
            const id = entry.target.dataset.inviewId;
            if (id) {
              next.set(id, entry.isIntersecting);
              if (entry.isIntersecting && once) {
                observerRef.current?.unobserve(entry.target);
              }
            }
          });
          return next;
        });
      },
      {
        root: root?.current ?? null,
        rootMargin: margin,
        threshold
      }
    );
    elementsRef.current.forEach((element) => {
      observerRef.current?.observe(element);
    });
    return () => {
      observerRef.current?.disconnect();
    };
  }, [once, amount, margin, root]);
  const setRef = (id, element) => {
    if (element) {
      element.dataset.inviewId = id;
      elementsRef.current.set(id, element);
      observerRef.current?.observe(element);
    } else {
      const existing = elementsRef.current.get(id);
      if (existing) {
        observerRef.current?.unobserve(existing);
        elementsRef.current.delete(id);
        setInViewMap((prev) => {
          const next = new Map(prev);
          next.delete(id);
          return next;
        });
      }
    }
  };
  const getInView = (id) => {
    return inViewMap.get(id) ?? false;
  };
  return { setRef, getInView, inViewMap };
}

// src/adapters/react/hooks/useScroll.ts
import { useRef as useRef13, useEffect as useEffect11 } from "react";
import { createMotionValue as createMotionValue3 } from "@oxog/springkit";
function useScroll(options = {}) {
  const { target, container, offset = ["start start", "end end"], axis = "y" } = options;
  const scrollXRef = useRef13(null);
  const scrollYRef = useRef13(null);
  const scrollXProgressRef = useRef13(null);
  const scrollYProgressRef = useRef13(null);
  if (scrollXRef.current === null || scrollXRef.current.isDestroyed()) {
    scrollXRef.current = createMotionValue3(0);
    scrollYRef.current = createMotionValue3(0);
    scrollXProgressRef.current = createMotionValue3(0);
    scrollYProgressRef.current = createMotionValue3(0);
  }
  useEffect11(() => {
    if (!isBrowser) return;
    const scrollX = scrollXRef.current;
    const scrollY = scrollYRef.current;
    const scrollXProgress = scrollXProgressRef.current;
    const scrollYProgress = scrollYProgressRef.current;
    const scrollContainer = container?.current ?? (target?.current ?? window);
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
    const calculateTargetProgress = () => {
      const targetEl = target?.current;
      if (!targetEl) {
        calculateProgress();
        return;
      }
      const position = getScrollPosition();
      scrollX.jump(position.x);
      scrollY.jump(position.y);
      const rect = targetEl.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const [startOffset, endOffset] = offset;
      const startPoint = parseOffset(startOffset, rect, viewportHeight, viewportWidth, "start");
      const endPoint = parseOffset(endOffset, rect, viewportHeight, viewportWidth, "end");
      const current = axis === "y" ? rect.top : rect.left;
      const range = endPoint - startPoint;
      const progress = range !== 0 ? (startPoint - current) / range : 0;
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
        if (target?.current) {
          calculateTargetProgress();
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
  }, [target, container, offset, axis]);
  useEffect11(() => {
    return () => {
      scrollXRef.current?.destroy();
      scrollYRef.current?.destroy();
      scrollXProgressRef.current?.destroy();
      scrollYProgressRef.current?.destroy();
    };
  }, []);
  return {
    scrollX: scrollXRef.current,
    scrollY: scrollYRef.current,
    scrollXProgress: scrollXProgressRef.current,
    scrollYProgress: scrollYProgressRef.current
  };
}
function parseOffset(offset, rect, viewportHeight, _viewportWidth, _type) {
  const parts = offset.split(" ");
  const elementPart = parts[0] || "start";
  const viewportPart = parts[1] || "start";
  let elementPos;
  if (elementPart === "start") {
    elementPos = rect.top;
  } else if (elementPart === "center") {
    elementPos = rect.top + rect.height / 2;
  } else if (elementPart === "end") {
    elementPos = rect.bottom;
  } else if (elementPart.endsWith("px")) {
    elementPos = rect.top + parseFloat(elementPart);
  } else if (elementPart.endsWith("%")) {
    elementPos = rect.top + rect.height * parseFloat(elementPart) / 100;
  } else {
    elementPos = rect.top;
  }
  let viewportPos;
  if (viewportPart === "start") {
    viewportPos = 0;
  } else if (viewportPart === "center") {
    viewportPos = viewportHeight / 2;
  } else if (viewportPart === "end") {
    viewportPos = viewportHeight;
  } else if (viewportPart.endsWith("px")) {
    viewportPos = parseFloat(viewportPart);
  } else if (viewportPart.endsWith("%")) {
    viewportPos = viewportHeight * parseFloat(viewportPart) / 100;
  } else {
    viewportPos = 0;
  }
  return viewportPos - elementPos;
}
function useScrollVelocity(axis = "y") {
  const velocityRef = useRef13(null);
  const lastScrollRef = useRef13(0);
  const lastTimeRef = useRef13(Date.now());
  if (velocityRef.current === null || velocityRef.current.isDestroyed()) {
    velocityRef.current = createMotionValue3(0);
  }
  useEffect11(() => {
    if (!isBrowser) return;
    const velocity = velocityRef.current;
    const handleScroll = () => {
      const now = Date.now();
      const currentScroll = axis === "y" ? window.scrollY || window.pageYOffset : window.scrollX || window.pageXOffset;
      const deltaTime = now - lastTimeRef.current;
      const deltaScroll = currentScroll - lastScrollRef.current;
      if (deltaTime > 0) {
        velocity.jump(deltaScroll / deltaTime * 1e3);
      }
      lastScrollRef.current = currentScroll;
      lastTimeRef.current = now;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [axis]);
  useEffect11(() => {
    return () => {
      velocityRef.current?.destroy();
    };
  }, []);
  return velocityRef.current;
}

// src/adapters/react/hooks/useGestureState.ts
import {
  useState as useState8,
  useRef as useRef14,
  useEffect as useEffect12
} from "react";
function useGestureState(options = {}) {
  const {
    hover = true,
    press = true,
    focus = true,
    drag = false
  } = options;
  const ref = useRef14(null);
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
  useEffect12(() => {
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
  const ref = useRef14(null);
  const [isHovered, setIsHovered] = useState8(false);
  const handlers = {
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false)
  };
  return { ref, isHovered, handlers };
}
function useTap() {
  const ref = useRef14(null);
  const [isPressed, setIsPressed] = useState8(false);
  const handlers = {
    onMouseDown: () => setIsPressed(true),
    onMouseUp: () => setIsPressed(false),
    onMouseLeave: () => setIsPressed(false),
    onTouchStart: () => setIsPressed(true),
    onTouchEnd: () => setIsPressed(false)
  };
  useEffect12(() => {
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
  const ref = useRef14(null);
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
import { useState as useState9, useEffect as useEffect13 } from "react";
function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState9(false);
  useEffect13(() => {
    if (!isBrowser) return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    const handleChange = (event) => {
      setPrefersReducedMotion(event.matches);
    };
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);
  return prefersReducedMotion;
}
function getReducedMotionPreference() {
  if (!isBrowser) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
function useReducedMotionConfig(configs) {
  const prefersReducedMotion = useReducedMotion();
  return prefersReducedMotion ? configs.reduced : configs.default;
}
function useShouldAnimate() {
  return !useReducedMotion();
}
function useReducedMotionValue(animatedValue, reducedValue) {
  const prefersReducedMotion = useReducedMotion();
  return prefersReducedMotion ? reducedValue : animatedValue;
}

// src/adapters/react/hooks/useScrollLinked.ts
import { useRef as useRef15, useState as useState10 } from "react";
import {
  createScrollProgress,
  createParallax,
  createScrollTrigger,
  createScrollLinkedValue
} from "@oxog/springkit";
function useScrollProgress(options = {}) {
  const { target, offset, smooth } = options;
  const [progress, setProgress] = useState10(0);
  const [info, setInfo] = useState10({
    progress: 0,
    scrollY: 0,
    velocity: 0,
    direction: 0,
    isInView: true,
    visibleRatio: 1
  });
  const scrollProgressRef = useRef15(null);
  useIsomorphicLayoutEffect(() => {
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
  }, [target?.current, offset?.[0], offset?.[1], smooth]);
  return {
    progress,
    info,
    scrollProgress: scrollProgressRef.current
  };
}
function useParallax(options = {}) {
  const ref = useRef15(null);
  const [offset, setOffset] = useState10(0);
  useIsomorphicLayoutEffect(() => {
    if (!ref.current) return;
    const parallax = createParallax(ref.current, options);
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
  }, [options.speed, options.direction, options.rootMargin]);
  return { ref, offset };
}
function useScrollTrigger(options = {}) {
  const ref = useRef15(null);
  const [isActive, setIsActive] = useState10(false);
  const [progress, setProgress] = useState10(0);
  const [hasEntered, setHasEntered] = useState10(false);
  useIsomorphicLayoutEffect(() => {
    if (!ref.current) return;
    const trigger = createScrollTrigger(ref.current, {
      ...options,
      onEnter: () => setHasEntered(true),
      onProgress: (info) => {
        setIsActive(info.progress > 0 && info.progress < 1);
        setProgress(info.progress);
      }
    });
    return () => trigger.destroy();
  }, [
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
  const [value, setValue] = useState10(config.outputRange[0] ?? 0);
  useIsomorphicLayoutEffect(() => {
    if (!scrollProgress) return;
    const linkedValue = createScrollLinkedValue(scrollProgress, config);
    const unsubscribe = linkedValue.subscribe((newValue) => {
      setValue(newValue);
    });
    return () => {
      unsubscribe();
      linkedValue.destroy();
    };
  }, [scrollProgress, config.inputRange, config.outputRange, config.clamp, config.smooth]);
  return value;
}

// src/adapters/react/hooks/useTimeline.ts
import { useRef as useRef16, useCallback as useCallback7, useMemo as useMemo2 } from "react";
import {
  createTimeline
} from "@oxog/springkit";
function useTimeline(options = {}) {
  const timelineRef = useRef16(null);
  useIsomorphicLayoutEffect(() => {
    const timeline = createTimeline(options);
    timelineRef.current = timeline;
    return () => {
      timeline.kill();
    };
  }, []);
  const play = useCallback7(() => {
    timelineRef.current?.play();
  }, []);
  const pause = useCallback7(() => {
    timelineRef.current?.pause();
  }, []);
  const resume = useCallback7(() => {
    timelineRef.current?.resume();
  }, []);
  const reverse = useCallback7(() => {
    timelineRef.current?.reverse();
  }, []);
  const restart = useCallback7(() => {
    timelineRef.current?.restart();
  }, []);
  const seek = useCallback7((progress) => {
    timelineRef.current?.seek(progress);
  }, []);
  const kill = useCallback7(() => {
    timelineRef.current?.kill();
  }, []);
  const returnValue = useMemo2(() => {
    const result = {
      timeline: timelineRef.current,
      play,
      pause,
      resume,
      reverse,
      restart,
      seek,
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
  }, [play, pause, resume, reverse, restart, seek, kill]);
  return returnValue;
}
function useTimelineState(timeline) {
  const progressRef = useRef16(0);
  const isPlayingRef = useRef16(false);
  const isPausedRef = useRef16(true);
  const isReversedRef = useRef16(false);
  useIsomorphicLayoutEffect(() => {
    if (!timeline) return;
    const updateState = () => {
      progressRef.current = timeline.progress();
      isPlayingRef.current = timeline.isPlaying();
      isPausedRef.current = !timeline.isPlaying();
      isReversedRef.current = timeline.isReversed();
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
  return {
    get progress() {
      return progressRef.current;
    },
    get isPlaying() {
      return isPlayingRef.current;
    },
    get isPaused() {
      return isPausedRef.current;
    },
    get isReversed() {
      return isReversedRef.current;
    }
  };
}

// src/adapters/react/hooks/useMorph.ts
import { useState as useState11, useRef as useRef17, useCallback as useCallback8 } from "react";
import {
  createMorph,
  createMorphSequence
} from "@oxog/springkit";
function useMorph(initialPath, options = {}) {
  const [path, setPath] = useState11(initialPath);
  const [progress, setProgressState] = useState11(0);
  const morphRef = useRef17(null);
  const isMountedRef = useRef17(false);
  const optionsRef = useRef17(options);
  optionsRef.current = options;
  useIsomorphicLayoutEffect(() => {
    isMountedRef.current = true;
    const currentOptions = optionsRef.current;
    const morph = createMorph(initialPath, {
      ...currentOptions,
      onProgress: (p) => {
        if (!isMountedRef.current) return;
        setProgressState(p);
        currentOptions.onProgress?.(p);
      }
    });
    const unsubscribe = morph.subscribe((newPath) => {
      if (!isMountedRef.current) return;
      setPath(newPath);
    });
    morphRef.current = morph;
    return () => {
      isMountedRef.current = false;
      unsubscribe();
      morph.destroy();
    };
  }, [initialPath]);
  const morphTo = useCallback8((targetPath) => {
    morphRef.current?.morphTo(targetPath);
  }, []);
  const setProgress = useCallback8((p) => {
    morphRef.current?.setProgress(p);
  }, []);
  return {
    path,
    progress,
    morphTo,
    setProgress,
    controller: morphRef.current
  };
}
function useMorphSequence(paths, options = {}) {
  const [path, setPath] = useState11(paths[0] ?? "");
  const [currentIndex, setCurrentIndex] = useState11(0);
  const isMountedRef = useRef17(false);
  const sequenceRef = useRef17(null);
  const optionsRef = useRef17(options);
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
  const morphToIndex = useCallback8((index) => {
    sequenceRef.current?.morphToIndex(index);
  }, []);
  const morphToNext = useCallback8(() => {
    sequenceRef.current?.morphToNext();
  }, []);
  const morphToPrevious = useCallback8(() => {
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
  const morphRef = useRef17(null);
  const elementRef = useRef17(null);
  const unsubscribeRef = useRef17(null);
  const pathRef = useCallback8(
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
        ...options,
        onProgress: (p) => {
          setProgressState(p);
          options.onProgress?.(p);
        }
      });
      unsubscribeRef.current = morph.subscribe((path) => {
        element.setAttribute("d", path);
      });
      morphRef.current = morph;
    },
    // options used only on initialization
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [initialPath]
  );
  const morphTo = useCallback8((targetPath) => {
    morphRef.current?.morphTo(targetPath);
  }, []);
  const setProgress = useCallback8((p) => {
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
import { useRef as useRef18, useCallback as useCallback9, createContext as createContext2 } from "react";
import * as React from "react";
import {
  createLayoutGroup,
  createSharedLayoutContext,
  createAutoLayout,
  measureElement,
  flip
} from "@oxog/springkit";
var LayoutGroupContext = createContext2(null);
var SharedLayoutContextReact = createContext2(null);
function useLayoutGroup(options = {}) {
  const layoutGroupRef = useRef18(null);
  useIsomorphicLayoutEffect(() => {
    const layoutGroup = createLayoutGroup(options);
    layoutGroupRef.current = layoutGroup;
    return () => {
      layoutGroup.destroy();
    };
  }, []);
  const register = useCallback9((id, element) => {
    layoutGroupRef.current?.register(id, element);
  }, []);
  const unregister = useCallback9((id, element) => {
    layoutGroupRef.current?.unregister(id, element);
  }, []);
  const update = useCallback9(() => {
    layoutGroupRef.current?.update();
  }, []);
  const forceUpdate = useCallback9(() => {
    layoutGroupRef.current?.forceUpdate();
  }, []);
  return {
    register,
    unregister,
    update,
    forceUpdate,
    layoutGroup: layoutGroupRef.current
  };
}
function useLayoutId(layoutId, options = {}) {
  const { group, ...config } = options;
  const elementRef = useRef18(null);
  const localGroupRef = useRef18(null);
  useIsomorphicLayoutEffect(() => {
    if (!group) {
      localGroupRef.current = createLayoutGroup(config);
      return () => {
        localGroupRef.current?.destroy();
      };
    }
  }, [group]);
  const ref = useCallback9(
    (element) => {
      const activeGroup = group ?? localGroupRef.current;
      if (elementRef.current && activeGroup) {
        activeGroup.unregister(layoutId, elementRef.current);
      }
      elementRef.current = element;
      if (element && activeGroup) {
        activeGroup.register(layoutId, element);
      }
    },
    [layoutId, group]
  );
  const update = useCallback9(() => {
    const activeGroup = group ?? localGroupRef.current;
    activeGroup?.update();
  }, [group]);
  return { ref, update };
}
function useFlip(options = {}) {
  const elementRef = useRef18(null);
  const lastMeasurementRef = useRef18(null);
  const ref = useCallback9((element) => {
    if (element) {
      lastMeasurementRef.current = measureElement(element);
    }
    elementRef.current = element;
  }, []);
  const flipFn = useCallback9(async (mutate) => {
    if (!elementRef.current) return;
    await flip(elementRef.current, mutate ?? (() => {
    }), options);
    lastMeasurementRef.current = measureElement(elementRef.current);
  }, [options]);
  const measure = useCallback9(() => {
    if (!elementRef.current) return null;
    return measureElement(elementRef.current);
  }, []);
  return { ref, flip: flipFn, measure };
}
function useAutoLayout(options = {}) {
  const autoLayoutRef = useRef18(null);
  const containerRef = useCallback9((element) => {
    if (autoLayoutRef.current) {
      autoLayoutRef.current.destroy();
      autoLayoutRef.current = null;
    }
    if (element) {
      autoLayoutRef.current = createAutoLayout(options);
    }
  }, []);
  const update = useCallback9(() => {
    autoLayoutRef.current?.update();
  }, []);
  const forceUpdate = useCallback9(() => {
    autoLayoutRef.current?.forceUpdate();
  }, []);
  return { containerRef, update, forceUpdate };
}
function LayoutGroupProvider({
  children,
  config
}) {
  const layoutGroupRef = useRef18(null);
  useIsomorphicLayoutEffect(() => {
    layoutGroupRef.current = createLayoutGroup(config);
    return () => {
      layoutGroupRef.current?.destroy();
    };
  }, []);
  return React.createElement(
    LayoutGroupContext.Provider,
    { value: layoutGroupRef.current },
    children
  );
}
function SharedLayoutProvider({
  children
}) {
  const sharedContextRef = useRef18(null);
  useIsomorphicLayoutEffect(() => {
    sharedContextRef.current = createSharedLayoutContext();
    return () => {
      sharedContextRef.current?.destroy();
    };
  }, []);
  return React.createElement(
    SharedLayoutContextReact.Provider,
    { value: sharedContextRef.current },
    children
  );
}

// src/adapters/react/hooks/useVariants.ts
import { useRef as useRef19, useCallback as useCallback10, useMemo as useMemo3, createContext as createContext3, useContext as useContext2 } from "react";
import * as React2 from "react";
import {
  getVariant,
  calculateStaggerDelays
} from "@oxog/springkit";
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
  const currentVariantRef = useRef19(void 0);
  const isAnimatingRef = useRef19(false);
  const targetVariant = useMemo3(() => {
    if (typeof animate === "string") {
      return animate;
    }
    if (inherit && parentContext.variant) {
      return parentContext.variant;
    }
    return void 0;
  }, [animate, inherit, parentContext.variant]);
  const initialValues = useMemo3(() => {
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
  const targetValues = useMemo3(() => {
    if (typeof animate === "object") {
      return animate;
    }
    if (targetVariant && variants) {
      return getVariant(variants, targetVariant, custom).values;
    }
    return initialValues;
  }, [animate, targetVariant, variants, custom, initialValues]);
  const transition = useMemo3(() => {
    if (targetVariant && variants) {
      return getVariant(variants, targetVariant, custom).transition;
    }
    return parentContext.transition || {};
  }, [targetVariant, variants, custom, parentContext.transition]);
  const staggerDelay = useMemo3(() => {
    if (parentContext.staggerIndex !== void 0 && transition.staggerChildren) {
      return parentContext.staggerIndex * transition.staggerChildren + (transition.delayChildren || 0);
    }
    return transition.delay || 0;
  }, [parentContext.staggerIndex, transition]);
  const toNumber = (val, fallback) => {
    if (val === void 0) return fallback;
    if (typeof val === "number") return val;
    const parsed = parseFloat(val);
    return isNaN(parsed) ? fallback : parsed;
  };
  const computeSpringValues = useCallback10((values, fallbackValues) => ({
    x: toNumber(values.x ?? fallbackValues?.x, 0),
    y: toNumber(values.y ?? fallbackValues?.y, 0),
    scale: values.scale ?? fallbackValues?.scale ?? 1,
    scaleX: values.scaleX ?? fallbackValues?.scaleX ?? 1,
    scaleY: values.scaleY ?? fallbackValues?.scaleY ?? 1,
    rotate: values.rotate ?? fallbackValues?.rotate ?? 0,
    opacity: values.opacity ?? fallbackValues?.opacity ?? 1
  }), []);
  const initialSpringValues = useMemo3(
    () => computeSpringValues(initialValues),
    [initialValues, computeSpringValues]
  );
  const animatedTargetValues = useMemo3(
    () => computeSpringValues(targetValues, initialValues),
    [targetValues, initialValues, computeSpringValues]
  );
  const hasInitializedRef = useRef19(false);
  const springValues = useSpring(
    hasInitializedRef.current ? animatedTargetValues : initialSpringValues,
    {
      stiffness: springConfig?.stiffness ?? transition.spring?.stiffness ?? 100,
      damping: springConfig?.damping ?? transition.spring?.damping ?? 15,
      mass: springConfig?.mass ?? transition.spring?.mass ?? 1
    }
  );
  useIsomorphicLayoutEffect(() => {
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
    }
  }, []);
  useIsomorphicLayoutEffect(() => {
    if (targetVariant && targetVariant !== currentVariantRef.current) {
      currentVariantRef.current = targetVariant;
      isAnimatingRef.current = true;
      const capturedVariant = targetVariant;
      const capturedCallback = onAnimationComplete;
      const damping = springConfig?.damping ?? 15;
      const mass = springConfig?.mass ?? 1;
      const estimatedDuration = Math.max(200, Math.min(2e3, 8 * mass / damping * 1e3));
      const totalDelay = staggerDelay + estimatedDuration;
      const timer = setTimeout(() => {
        isAnimatingRef.current = false;
        capturedCallback?.(capturedVariant);
      }, totalDelay);
      return () => clearTimeout(timer);
    }
  }, [targetVariant, staggerDelay, onAnimationComplete, springConfig?.stiffness, springConfig?.damping, springConfig?.mass]);
  const setVariant = useCallback10((name) => {
    currentVariantRef.current = name;
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
  const value = useMemo3(
    () => ({ variant, custom, transition }),
    [variant, custom, transition]
  );
  return React2.createElement(VariantContext.Provider, { value }, children);
}
function useStaggerChildren(options) {
  const {
    count,
    staggerChildren = 100,
    delayChildren = 0,
    staggerDirection = 1
  } = options;
  const delays = useMemo3(() => {
    return calculateStaggerDelays(count, {
      staggerChildren,
      delayChildren,
      staggerDirection
    });
  }, [count, staggerChildren, delayChildren, staggerDirection]);
  const getDelay = useCallback10(
    (index) => delays[index] || 0,
    [delays]
  );
  const getChildProps = useCallback10(
    (index) => ({
      style: { transitionDelay: `${getDelay(index)}ms` }
    }),
    [getDelay]
  );
  return { getDelay, getChildProps, delays };
}
function createMotionComponent(_element, _options = {}) {
  throw new Error(
    "createMotionComponent is not yet implemented. Use useVariants hook or Animated component instead."
  );
}

// src/adapters/react/hooks/usePhysics.ts
import { useRef as useRef20, useEffect as useEffect14, useCallback as useCallback11, useState as useState12 } from "react";
import { createMotionValue as createMotionValue4 } from "@oxog/springkit";
import { createSpringValue as createSpringValue4 } from "@oxog/springkit";
function useSpringState(initialValue = 0, options = {}) {
  const { initial = initialValue, onChange, ...springConfig } = options;
  const [state, setState] = useState12(initial);
  const springRef = useRef20(null);
  const motionValueRef = useRef20(null);
  if (springRef.current === null || springRef.current.isDestroyed()) {
    springRef.current = createSpringValue4(initial, {
      ...springConfig,
      onUpdate: (value) => {
        setState(value);
        onChange?.(value);
      }
    });
  }
  if (motionValueRef.current === null || motionValueRef.current.isDestroyed()) {
    motionValueRef.current = createMotionValue4(initial);
  }
  useEffect14(() => {
    const unsub = springRef.current?.subscribe((v) => {
      motionValueRef.current?.jump(v);
    });
    return () => unsub?.();
  }, []);
  useEffect14(() => {
    return () => {
      springRef.current?.destroy();
      springRef.current = null;
    };
  }, []);
  const setValue = useCallback11((value) => {
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
  const valueRef = useRef20(null);
  const velocityRef = useRef20(null);
  const frameRef = useRef20(null);
  const isActiveRef = useRef20(false);
  if (valueRef.current === null || valueRef.current.isDestroyed()) {
    valueRef.current = createMotionValue4(0);
  }
  if (velocityRef.current === null || velocityRef.current.isDestroyed()) {
    velocityRef.current = createMotionValue4(0);
  }
  const applyBounds = useCallback11((val) => {
    if (!bounds) return val;
    let result = val;
    if (bounds.min !== void 0) result = Math.max(bounds.min, result);
    if (bounds.max !== void 0) result = Math.min(bounds.max, result);
    return result;
  }, [bounds]);
  const tick = useCallback11(() => {
    if (!isActiveRef.current) return;
    const currentVelocity = velocityRef.current?.get() ?? 0;
    const currentValue = valueRef.current?.get() ?? 0;
    const newVelocity = currentVelocity * friction;
    const newValue = applyBounds(currentValue + newVelocity);
    valueRef.current?.jump(newValue);
    velocityRef.current?.jump(newVelocity);
    if (Math.abs(newVelocity) < minVelocity) {
      isActiveRef.current = false;
      velocityRef.current?.jump(0);
      onRest?.();
      return;
    }
    if (bounds) {
      if (bounds.min !== void 0 && newValue <= bounds.min || bounds.max !== void 0 && newValue >= bounds.max) {
        isActiveRef.current = false;
        velocityRef.current?.jump(0);
        onRest?.();
        return;
      }
    }
    frameRef.current = requestAnimationFrame(tick);
  }, [friction, minVelocity, bounds, applyBounds, onRest]);
  const push = useCallback11((velocity) => {
    if (!Number.isFinite(velocity)) return;
    velocityRef.current?.jump(velocity);
    isActiveRef.current = true;
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(tick);
  }, [tick]);
  const stop = useCallback11(() => {
    isActiveRef.current = false;
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
    }
    velocityRef.current?.jump(0);
  }, []);
  const set = useCallback11((value) => {
    if (!Number.isFinite(value)) return;
    valueRef.current?.jump(applyBounds(value));
  }, [applyBounds]);
  useEffect14(() => {
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
    spring = { stiffness: 300, damping: 30 }
  } = options;
  const motionValueRef = useRef20(null);
  const springRef = useRef20(null);
  if (motionValueRef.current === null || motionValueRef.current.isDestroyed()) {
    motionValueRef.current = createMotionValue4(0);
  }
  if (springRef.current === null || springRef.current.isDestroyed()) {
    springRef.current = createSpringValue4(0, {
      ...spring,
      onUpdate: (v) => motionValueRef.current?.jump(v)
    });
  }
  const rawValueRef = useRef20(0);
  const applyElasticity = useCallback11((input) => {
    const sign = input >= 0 ? 1 : -1;
    const absInput = Math.abs(input);
    const factor = 1 - absInput / (maxStretch * 2) * (1 - elasticity);
    return sign * absInput * Math.max(0.1, factor);
  }, [elasticity, maxStretch]);
  const stretch = useCallback11((amount) => {
    if (!Number.isFinite(amount)) return;
    rawValueRef.current = amount;
    const elasticValue = applyElasticity(amount);
    motionValueRef.current?.jump(elasticValue);
  }, [applyElasticity]);
  const release = useCallback11(() => {
    rawValueRef.current = 0;
    springRef.current?.set(0);
  }, []);
  const set = useCallback11((value) => {
    if (!Number.isFinite(value)) return;
    rawValueRef.current = value;
    springRef.current?.set(value);
  }, []);
  useEffect14(() => {
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
  const motionValueRef = useRef20(null);
  if (motionValueRef.current === null || motionValueRef.current.isDestroyed()) {
    motionValueRef.current = createMotionValue4(ceiling);
  }
  const motionValue = motionValueRef.current;
  const velocityRef = useRef20(0);
  const frameRef = useRef20(null);
  const isActiveRef = useRef20(false);
  const tick = useCallback11(() => {
    if (!isActiveRef.current) return;
    const currentValue = motionValue.get();
    velocityRef.current += gravity;
    velocityRef.current *= 1 - dampening;
    let newValue = currentValue + velocityRef.current;
    if (newValue >= floor) {
      newValue = floor;
      velocityRef.current = -velocityRef.current * restitution;
      if (Math.abs(velocityRef.current) < 0.5) {
        isActiveRef.current = false;
        velocityRef.current = 0;
        motionValue.jump(floor);
        return;
      }
    }
    if (newValue <= ceiling) {
      newValue = ceiling;
      velocityRef.current = -velocityRef.current * restitution;
    }
    motionValue.jump(newValue);
    frameRef.current = requestAnimationFrame(tick);
  }, [motionValue, gravity, dampening, floor, ceiling, restitution]);
  const drop = useCallback11((fromY = ceiling, initialVelocity = 0) => {
    const safeFromY = Number.isFinite(fromY) ? fromY : ceiling;
    const safeVelocity = Number.isFinite(initialVelocity) ? initialVelocity : 0;
    motionValue.jump(safeFromY);
    velocityRef.current = safeVelocity;
    isActiveRef.current = true;
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(tick);
  }, [motionValue, ceiling, tick]);
  const bounce = useCallback11((velocity) => {
    if (!Number.isFinite(velocity)) return;
    velocityRef.current = velocity;
    isActiveRef.current = true;
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(tick);
  }, [tick]);
  const stop = useCallback11(() => {
    isActiveRef.current = false;
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    velocityRef.current = 0;
  }, []);
  useEffect14(() => {
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
  const xRef = useRef20(null);
  const yRef = useRef20(null);
  if (xRef.current === null || xRef.current.isDestroyed()) {
    xRef.current = createMotionValue4(0);
  }
  if (yRef.current === null || yRef.current.isDestroyed()) {
    yRef.current = createMotionValue4(0);
  }
  const xMotion = xRef.current;
  const yMotion = yRef.current;
  const velocityRef = useRef20({ x: 0, y: 0 });
  const frameRef = useRef20(null);
  const isActiveRef = useRef20(false);
  const tick = useCallback11(() => {
    if (!isActiveRef.current) return;
    const currentX = xMotion.get();
    const currentY = yMotion.get();
    velocityRef.current.x += gravity.x;
    velocityRef.current.y += gravity.y;
    velocityRef.current.x *= 1 - drag;
    velocityRef.current.y *= 1 - drag;
    let newX = currentX + velocityRef.current.x;
    let newY = currentY + velocityRef.current.y;
    if (bounds) {
      if (bounds.left !== void 0 && newX <= bounds.left) {
        newX = bounds.left;
        velocityRef.current.x = -velocityRef.current.x * bounciness;
      }
      if (bounds.right !== void 0 && newX >= bounds.right) {
        newX = bounds.right;
        velocityRef.current.x = -velocityRef.current.x * bounciness;
      }
      if (bounds.top !== void 0 && newY <= bounds.top) {
        newY = bounds.top;
        velocityRef.current.y = -velocityRef.current.y * bounciness;
      }
      if (bounds.bottom !== void 0 && newY >= bounds.bottom) {
        newY = bounds.bottom;
        velocityRef.current.y = -velocityRef.current.y * bounciness;
        if (Math.abs(velocityRef.current.y) < 0.5 && Math.abs(velocityRef.current.x) < 0.1) {
          velocityRef.current.y = 0;
        }
      }
    }
    xMotion.jump(newX);
    yMotion.jump(newY);
    const totalVelocity = Math.abs(velocityRef.current.x) + Math.abs(velocityRef.current.y);
    const isAtRestOnGround = bounds?.bottom !== void 0 && Math.abs(newY - bounds.bottom) < 0.5 && totalVelocity < 0.01;
    if (totalVelocity > 0.01 || !isAtRestOnGround) {
      frameRef.current = requestAnimationFrame(tick);
    } else {
      isActiveRef.current = false;
    }
  }, [xMotion, yMotion, gravity, drag, bounds, bounciness]);
  const launch = useCallback11((velocity) => {
    const safeX = Number.isFinite(velocity.x) ? velocity.x : 0;
    const safeY = Number.isFinite(velocity.y) ? velocity.y : 0;
    velocityRef.current = { x: safeX, y: safeY };
    isActiveRef.current = true;
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(tick);
  }, [tick]);
  const setPosition = useCallback11((pos) => {
    const safeX = Number.isFinite(pos.x) ? pos.x : xMotion.get();
    const safeY = Number.isFinite(pos.y) ? pos.y : yMotion.get();
    xMotion.jump(safeX);
    yMotion.jump(safeY);
  }, [xMotion, yMotion]);
  const stop = useCallback11(() => {
    isActiveRef.current = false;
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    velocityRef.current = { x: 0, y: 0 };
  }, []);
  const start = useCallback11(() => {
    if (!isActiveRef.current) {
      isActiveRef.current = true;
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(tick);
    }
  }, [tick]);
  useEffect14(() => {
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
  const valuesRef = useRef20({});
  const springsRef = useRef20({});
  const [currentStep, setCurrentStep] = useState12(-1);
  const [isPlaying, setIsPlaying] = useState12(false);
  const timeoutRef = useRef20(null);
  useEffect14(() => {
    const allKeys = /* @__PURE__ */ new Set();
    steps.forEach((step) => {
      Object.keys(step.to).forEach((key) => allKeys.add(key));
    });
    allKeys.forEach((key) => {
      if (!valuesRef.current[key] || valuesRef.current[key].isDestroyed()) {
        const initial = initialValues[key] ?? 0;
        valuesRef.current[key] = createMotionValue4(initial);
        springsRef.current[key] = createSpringValue4(initial, {
          onUpdate: (v) => valuesRef.current[key]?.jump(v)
        });
      }
    });
    const springs = springsRef.current;
    return () => {
      Object.values(springs).forEach((s) => s.destroy());
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);
  const runStep = useCallback11((stepIndex) => {
    if (stepIndex >= steps.length) {
      setIsPlaying(false);
      setCurrentStep(-1);
      return;
    }
    const step = steps[stepIndex];
    if (!step) return;
    const execute = () => {
      setCurrentStep(stepIndex);
      Object.entries(step.to).forEach(([key, value]) => {
        const spring = springsRef.current[key];
        if (spring) {
          if (step.config) {
            spring.setConfig(step.config);
          }
          spring.set(value);
        }
      });
      const estimatedDuration = step.config?.stiffness ? Math.max(300, 1e3 / (step.config.stiffness / 100)) : 500;
      timeoutRef.current = window.setTimeout(() => {
        runStep(stepIndex + 1);
      }, estimatedDuration);
    };
    if (step.delay && step.delay > 0) {
      timeoutRef.current = window.setTimeout(execute, step.delay);
    } else {
      execute();
    }
  }, [steps]);
  const play = useCallback11(() => {
    if (isPlaying) return;
    setIsPlaying(true);
    runStep(0);
  }, [isPlaying, runStep]);
  const reset = useCallback11(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsPlaying(false);
    setCurrentStep(-1);
    Object.keys(valuesRef.current).forEach((key) => {
      const initial = initialValues[key] ?? 0;
      springsRef.current[key]?.jump(initial);
    });
  }, [initialValues]);
  const stop = useCallback11(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsPlaying(false);
  }, []);
  useEffect14(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
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
  const xRef = useRef20(null);
  const yRef = useRef20(null);
  const rawXRef = useRef20(0);
  const rawYRef = useRef20(0);
  const [isHovering, setIsHovering] = useState12(false);
  const frameRef = useRef20(null);
  if (xRef.current === null || xRef.current.isDestroyed()) xRef.current = createMotionValue4(0);
  if (yRef.current === null || yRef.current.isDestroyed()) yRef.current = createMotionValue4(0);
  useEffect14(() => {
    const element = target?.current ?? window;
    const handleMove = (e) => {
      let newX;
      let newY;
      if (target?.current) {
        const rect = target.current.getBoundingClientRect();
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
      const smoothLoop = () => {
        const currentX = xRef.current?.get() ?? 0;
        const currentY = yRef.current?.get() ?? 0;
        const newX = currentX + (rawXRef.current - currentX) * smooth;
        const newY = currentY + (rawYRef.current - currentY) * smooth;
        xRef.current?.jump(newX);
        yRef.current?.jump(newY);
        frameRef.current = requestAnimationFrame(smoothLoop);
      };
      frameRef.current = requestAnimationFrame(smoothLoop);
    }
    if (hoverOnly && target?.current) {
      target.current.addEventListener("pointermove", handleMove);
      target.current.addEventListener("pointerenter", handleEnter);
      target.current.addEventListener("pointerleave", handleLeave);
    } else {
      element.addEventListener("pointermove", handleMove);
      if (target?.current) {
        target.current.addEventListener("pointerenter", handleEnter);
        target.current.addEventListener("pointerleave", handleLeave);
      }
    }
    const targetElement = target?.current;
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
  }, [target, smooth, hoverOnly]);
  useEffect14(() => {
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
  const tiltXRef = useRef20(null);
  const tiltYRef = useRef20(null);
  const rawXRef = useRef20(0);
  const rawYRef = useRef20(0);
  const [isSupported, setIsSupported] = useState12(false);
  const frameRef = useRef20(null);
  if (tiltXRef.current === null || tiltXRef.current.isDestroyed()) tiltXRef.current = createMotionValue4(0);
  if (tiltYRef.current === null || tiltYRef.current.isDestroyed()) tiltYRef.current = createMotionValue4(0);
  const clampValue = useCallback11((value) => {
    return Math.max(-clamp, Math.min(clamp, value * multiplier));
  }, [clamp, multiplier]);
  useEffect14(() => {
    const hasOrientation = "DeviceOrientationEvent" in window;
    const smoothLoop = () => {
      const currentX = tiltXRef.current?.get() ?? 0;
      const currentY = tiltYRef.current?.get() ?? 0;
      const newX = currentX + (rawXRef.current - currentX) * smooth;
      const newY = currentY + (rawYRef.current - currentY) * smooth;
      tiltXRef.current?.jump(newX);
      tiltYRef.current?.jump(newY);
      frameRef.current = requestAnimationFrame(smoothLoop);
    };
    frameRef.current = requestAnimationFrame(smoothLoop);
    if (hasOrientation) {
      const handleOrientation = (e) => {
        setIsSupported(true);
        rawXRef.current = clampValue(e.gamma ?? 0);
        rawYRef.current = clampValue(e.beta ?? 0);
      };
      window.addEventListener("deviceorientation", handleOrientation);
      return () => {
        if (frameRef.current) cancelAnimationFrame(frameRef.current);
        window.removeEventListener("deviceorientation", handleOrientation);
      };
    } else {
      const handleMouse = (e) => {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        rawXRef.current = clampValue((e.clientX - centerX) / centerX * 45);
        rawYRef.current = clampValue((e.clientY - centerY) / centerY * 45);
      };
      window.addEventListener("mousemove", handleMouse);
      return () => {
        if (frameRef.current) cancelAnimationFrame(frameRef.current);
        window.removeEventListener("mousemove", handleMouse);
      };
    }
  }, [clampValue, smooth]);
  useEffect14(() => {
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

// src/adapters/react/components/Spring.tsx
import { useEffect as useEffect15, useRef as useRef21, useState as useState13 } from "react";
import { createSpringGroup as createSpringGroup3 } from "@oxog/springkit";
import { Fragment, jsx } from "react/jsx-runtime";
var Spring = ({
  from,
  to,
  config = {},
  onRest,
  children
}) => {
  const springRef = useRef21(null);
  const [values, setValues] = useState13(from);
  useEffect15(() => {
    const spring = createSpringGroup3(from, config);
    spring.subscribe(setValues);
    springRef.current = spring;
    requestAnimationFrame(() => {
      spring.set(to, { ...config, onRest });
    });
    return () => spring.destroy();
  }, []);
  useEffect15(() => {
    springRef.current?.set(to, { ...config, onRest });
  }, [to, config, onRest]);
  return /* @__PURE__ */ jsx(Fragment, { children: children(values) });
};

// src/adapters/react/components/Animated.tsx
import * as React3 from "react";
import { useEffect as useEffect16, useRef as useRef22, useState as useState14, useContext as useContext3, useCallback as useCallback12, memo } from "react";
import { createSpringGroup as createSpringGroup4 } from "@oxog/springkit";
function extractNumericValues(style) {
  const result = {};
  for (const key in style) {
    if (typeof style[key] === "number") {
      result[key] = style[key];
    }
  }
  return result;
}
function extractStringValues(style) {
  const result = {};
  for (const key in style) {
    if (typeof style[key] === "string") {
      result[key] = style[key];
    }
  }
  return result;
}
function createAnimatedComponent(tag) {
  const AnimatedComponent = React3.forwardRef(
    ({
      children,
      style = {},
      config = {},
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
      onMouseEnter: propsOnMouseEnter,
      onMouseLeave: propsOnMouseLeave,
      onPointerDown: propsOnPointerDown,
      onPointerUp: propsOnPointerUp,
      onPointerCancel: propsOnPointerCancel,
      onFocus: propsOnFocus,
      onBlur: propsOnBlur,
      ...props
    }, forwardedRef) => {
      const springRef = useRef22(null);
      const unsubscribeRef = useRef22(null);
      const elementRef = useRef22(null);
      const [animatedStyle, setAnimatedStyle] = useState14({});
      const isFirstRender = useRef22(true);
      const hasCalledSafeToRemove = useRef22(false);
      const isDestroyedRef = useRef22(false);
      const [isHovered, setIsHovered] = useState14(false);
      const [isPressed, setIsPressed] = useState14(false);
      const [isFocused, setIsFocused] = useState14(false);
      const [isDragging, _setIsDragging] = useState14(false);
      const [isInViewport, setIsInViewport] = useState14(false);
      const hasTriggeredInView = useRef22(false);
      const presenceContext = useContext3(PresenceContext);
      const isPresent = presenceContext?.isPresent ?? true;
      const safeToRemove = presenceContext?.safeToRemove;
      const setRef = useCallback12((node) => {
        elementRef.current = node;
        if (typeof forwardedRef === "function") {
          forwardedRef(node);
        } else if (forwardedRef) {
          forwardedRef.current = node;
        }
      }, [forwardedRef]);
      useEffect16(() => {
        if (!whileInView || !isBrowser) return;
        const element = elementRef.current;
        if (!element) return;
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
      const getTargetStyle = useCallback12(() => {
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
        if (Object.keys(target).length === 0) {
          return Object.fromEntries(
            Object.entries(style).filter((entry) => typeof entry[1] === "number")
          );
        }
        return target;
      }, [isPresent, exit, animate, style, whileHover, whileTap, whileFocus, whileDrag, whileInView, isHovered, isPressed, isFocused, isDragging, isInViewport]);
      const getInitialStyle = useCallback12(() => {
        if (initial === false) {
          return getTargetStyle();
        }
        if (initial) {
          return initial;
        }
        return getTargetStyle();
      }, [initial, getTargetStyle]);
      useEffect16(() => {
        const initialStyle = getInitialStyle();
        const numericInitial = extractNumericValues(initialStyle);
        if (Object.keys(numericInitial).length === 0) {
          return;
        }
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
          unsubscribeRef.current = null;
        }
        if (springRef.current) {
          springRef.current.destroy();
          springRef.current = null;
        }
        isDestroyedRef.current = false;
        const spring = createSpringGroup4(numericInitial, config);
        unsubscribeRef.current = spring.subscribe((values) => {
          if (!isDestroyedRef.current) {
            setAnimatedStyle(values);
          }
        });
        springRef.current = spring;
        if (initial && initial !== false && animate) {
          const numericAnimate = extractNumericValues(animate);
          const needsAnimation = Object.keys(numericAnimate).some(
            (key) => numericInitial[key] !== numericAnimate[key]
          );
          if (needsAnimation) {
            requestAnimationFrame(() => {
              if (springRef.current && !isDestroyedRef.current) {
                springRef.current.set(numericAnimate);
              }
            });
          }
        }
        return () => {
          isDestroyedRef.current = true;
          if (unsubscribeRef.current) {
            unsubscribeRef.current();
            unsubscribeRef.current = null;
          }
          spring.destroy();
        };
      }, [config.stiffness, config.damping]);
      useEffect16(() => {
        if (!springRef.current) return;
        if (isFirstRender.current) {
          isFirstRender.current = false;
          return;
        }
        const targetStyle = getTargetStyle();
        const numericTarget = extractNumericValues(targetStyle);
        springRef.current.set(numericTarget);
      }, [isPresent, animate, exit, getTargetStyle, initial, isHovered, isPressed, isFocused, isInViewport]);
      useEffect16(() => {
        if (!isPresent && exit && safeToRemove && !hasCalledSafeToRemove.current) {
          let innerTimeout = null;
          let cancelled = false;
          const checkComplete = () => {
            if (cancelled) return;
            const values = springRef.current;
            if (values) {
              innerTimeout = setTimeout(() => {
                if (!cancelled && !hasCalledSafeToRemove.current) {
                  hasCalledSafeToRemove.current = true;
                  safeToRemove();
                  onAnimationComplete?.();
                }
              }, 500);
            }
          };
          const timeout = setTimeout(checkComplete, 50);
          return () => {
            cancelled = true;
            clearTimeout(timeout);
            if (innerTimeout !== null) {
              clearTimeout(innerTimeout);
            }
          };
        }
      }, [isPresent, exit, safeToRemove, onAnimationComplete]);
      useEffect16(() => {
        if (isPresent) {
          hasCalledSafeToRemove.current = false;
        }
      }, [isPresent]);
      const handleMouseEnter = useCallback12((e) => {
        if (whileHover) setIsHovered(true);
        onHoverStart?.(e);
        propsOnMouseEnter?.(e);
      }, [whileHover, onHoverStart, propsOnMouseEnter]);
      const handleMouseLeave = useCallback12((e) => {
        if (whileHover) setIsHovered(false);
        if (whileTap) setIsPressed(false);
        onHoverEnd?.(e);
        propsOnMouseLeave?.(e);
      }, [whileHover, whileTap, onHoverEnd, propsOnMouseLeave]);
      const handlePointerDown = useCallback12((e) => {
        if (whileTap) setIsPressed(true);
        onTapStart?.(e);
        propsOnPointerDown?.(e);
      }, [whileTap, onTapStart, propsOnPointerDown]);
      const handlePointerUp = useCallback12((e) => {
        if (whileTap && isPressed) {
          setIsPressed(false);
          onTap?.(e);
        }
        propsOnPointerUp?.(e);
      }, [whileTap, isPressed, onTap, propsOnPointerUp]);
      const handlePointerCancel = useCallback12((e) => {
        if (whileTap && isPressed) {
          setIsPressed(false);
          onTapCancel?.(e);
        }
        propsOnPointerCancel?.(e);
      }, [whileTap, isPressed, onTapCancel, propsOnPointerCancel]);
      const handleFocus = useCallback12((e) => {
        if (whileFocus) setIsFocused(true);
        propsOnFocus?.(e);
      }, [whileFocus, propsOnFocus]);
      const handleBlur = useCallback12((e) => {
        if (whileFocus) setIsFocused(false);
        propsOnBlur?.(e);
      }, [whileFocus, propsOnBlur]);
      const globalListenersActiveRef = useRef22(false);
      useEffect16(() => {
        if (!whileTap || !isPressed) {
          globalListenersActiveRef.current = false;
          return;
        }
        globalListenersActiveRef.current = true;
        const handleGlobalPointerUp = () => {
          setIsPressed(false);
        };
        window.addEventListener("pointerup", handleGlobalPointerUp);
        window.addEventListener("pointercancel", handleGlobalPointerUp);
        return () => {
          window.removeEventListener("pointerup", handleGlobalPointerUp);
          window.removeEventListener("pointercancel", handleGlobalPointerUp);
          globalListenersActiveRef.current = false;
        };
      }, [whileTap, isPressed]);
      useEffect16(() => {
        return () => {
          if (globalListenersActiveRef.current) {
            globalListenersActiveRef.current = false;
          }
        };
      }, []);
      const staticStyle = Object.fromEntries(
        Object.entries(style).filter(([_, v]) => typeof v !== "number")
      );
      const gestureStringStyles = {};
      if (whileInView && isInViewport) {
        Object.assign(gestureStringStyles, extractStringValues(whileInView));
      }
      if (whileFocus && isFocused) {
        Object.assign(gestureStringStyles, extractStringValues(whileFocus));
      }
      if (whileHover && isHovered) {
        Object.assign(gestureStringStyles, extractStringValues(whileHover));
      }
      if (whileDrag && isDragging) {
        Object.assign(gestureStringStyles, extractStringValues(whileDrag));
      }
      if (whileTap && isPressed) {
        Object.assign(gestureStringStyles, extractStringValues(whileTap));
      }
      const eventHandlers = {};
      if (whileHover || onHoverStart || onHoverEnd) {
        eventHandlers.onMouseEnter = handleMouseEnter;
        eventHandlers.onMouseLeave = handleMouseLeave;
      }
      if (whileTap || onTapStart || onTap || onTapCancel) {
        eventHandlers.onPointerDown = handlePointerDown;
        eventHandlers.onPointerUp = handlePointerUp;
        eventHandlers.onPointerCancel = handlePointerCancel;
      }
      if (whileFocus) {
        eventHandlers.onFocus = handleFocus;
        eventHandlers.onBlur = handleBlur;
      }
      return React3.createElement(
        tag,
        {
          ...props,
          ...eventHandlers,
          ref: setRef,
          style: { ...staticStyle, ...animatedStyle, ...gestureStringStyles }
        },
        children
      );
    }
  );
  AnimatedComponent.displayName = `Animated.${String(tag)}`;
  return memo(AnimatedComponent);
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
import { useEffect as useEffect17, useRef as useRef23, useState as useState15 } from "react";
import { createTrail } from "@oxog/springkit";
import { Fragment as Fragment3, jsx as jsx2 } from "react/jsx-runtime";
var Trail = ({
  items,
  keys,
  from,
  to,
  config = {},
  reverse = false,
  children
}) => {
  const trailRef = useRef23(null);
  const [values, setValues] = useState15(
    () => items.map(() => ({ ...from }))
  );
  useEffect17(() => {
    const trail = createTrail(items.length, config);
    const unsubscribe = trail.subscribe((vals) => {
      setValues(vals.map((v) => ({ ...to, x: v })));
    });
    trailRef.current = trail;
    const firstValue = Object.values(to)[0];
    trail.set(firstValue);
    return () => {
      unsubscribe();
      trail.destroy();
    };
  }, [items.length, config.stiffness, config.damping]);
  useEffect17(() => {
    const firstValue = Object.values(to)[0];
    trailRef.current?.set(firstValue);
  }, [to]);
  return /* @__PURE__ */ jsx2(Fragment3, { children: items.map((item, index) => {
    const itemValues = values[index];
    if (!itemValues) {
      console.warn(`[SpringKit] Trail: No values found for item at index ${index}`);
      return null;
    }
    return /* @__PURE__ */ jsx2(React4.Fragment, { children: children(itemValues, item, reverse ? items.length - 1 - index : index) }, keys(item, index));
  }) });
};

// src/adapters/react/components/AnimatePresence.tsx
import {
  useRef as useRef25,
  useState as useState16,
  useLayoutEffect as useLayoutEffect2,
  useEffect as useEffect19,
  Children,
  isValidElement,
  cloneElement
} from "react";

// src/adapters/react/components/PresenceChild.tsx
import { useMemo as useMemo4, useCallback as useCallback13, useRef as useRef24, useEffect as useEffect18 } from "react";
import { jsx as jsx3 } from "react/jsx-runtime";
var DEFAULT_EXIT_TIMEOUT = 1e4;
function PresenceChild({
  id,
  children,
  isPresent,
  onExitComplete,
  custom,
  exitTimeout = DEFAULT_EXIT_TIMEOUT
}) {
  const presenceIdRef = useRef24(id);
  presenceIdRef.current = id;
  const safeToRemove = useCallback13(() => {
    onExitComplete(presenceIdRef.current);
  }, [onExitComplete]);
  const contextValue = useMemo4(
    () => ({
      id,
      isPresent,
      safeToRemove,
      custom
    }),
    [id, isPresent, safeToRemove, custom]
  );
  const hasExitedRef = useRef24(false);
  const hasCalledRemoveRef = useRef24(false);
  useEffect18(() => {
    if (isPresent) {
      hasExitedRef.current = false;
      hasCalledRemoveRef.current = false;
      return;
    }
    if (hasExitedRef.current) return;
    hasExitedRef.current = true;
    if (exitTimeout <= 0) return;
    const timeout = setTimeout(() => {
      if (!hasCalledRemoveRef.current) {
        hasCalledRemoveRef.current = true;
        safeToRemove();
      }
    }, exitTimeout);
    return () => clearTimeout(timeout);
  }, [isPresent, safeToRemove, exitTimeout]);
  return /* @__PURE__ */ jsx3(PresenceContext.Provider, { value: contextValue, children });
}

// src/adapters/react/components/AnimatePresence.tsx
import { Fragment as Fragment4, jsx as jsx4 } from "react/jsx-runtime";
var useIsomorphicLayoutEffect2 = typeof window !== "undefined" ? useLayoutEffect2 : useEffect19;
function getChildKey(child) {
  return child.key !== null ? String(child.key) : "";
}
function getChildrenMap(children) {
  const map = {};
  Children.forEach(children, (child) => {
    if (isValidElement(child)) {
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
  const isInitialMount = useRef25(true);
  const [exitingChildren, setExitingChildren] = useState16({});
  const prevChildrenRef = useRef25({});
  const [, forceUpdate] = useState16(0);
  const pendingExitCount = useRef25(0);
  const currentChildren = getChildrenMap(children);
  useIsomorphicLayoutEffect2(() => {
    const prevChildren = prevChildrenRef.current;
    const newExiting = {};
    for (const key in prevChildren) {
      if (!(key in currentChildren)) {
        const prevChild = prevChildren[key];
        if (prevChild) {
          newExiting[key] = prevChild;
        }
      }
    }
    if (Object.keys(newExiting).length > 0) {
      setExitingChildren((prev) => ({ ...prev, ...newExiting }));
      pendingExitCount.current += Object.keys(newExiting).length;
    }
    prevChildrenRef.current = currentChildren;
    if (isInitialMount.current) {
      isInitialMount.current = false;
    }
  });
  const handleExitComplete = (key) => {
    setExitingChildren((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
    if (pendingExitCount.current > 0) {
      pendingExitCount.current--;
    }
    if (pendingExitCount.current === 0 && onExitComplete) {
      onExitComplete();
    }
    if (mode === "wait") {
      forceUpdate((n) => n + 1);
    }
  };
  const showEntering = mode !== "wait" || Object.keys(exitingChildren).length === 0;
  const allChildren = [];
  for (const key in exitingChildren) {
    const exitingChild = exitingChildren[key];
    if (!exitingChild) continue;
    allChildren.push(
      /* @__PURE__ */ jsx4(
        PresenceChild,
        {
          id: key,
          isPresent: false,
          onExitComplete: handleExitComplete,
          custom,
          children: cloneElement(exitingChild, {
            key
          })
        },
        `presence-${key}`
      )
    );
  }
  if (showEntering) {
    Children.forEach(children, (child) => {
      if (isValidElement(child)) {
        const key = getChildKey(child);
        if (!key) {
          console.warn(
            'AnimatePresence: Every child must have a unique "key" prop.'
          );
          return;
        }
        const shouldAnimate = !(isInitialMount.current && initial === false);
        allChildren.push(
          /* @__PURE__ */ jsx4(
            PresenceChild,
            {
              id: key,
              isPresent: true,
              onExitComplete: handleExitComplete,
              custom,
              children: cloneElement(child, {
                key,
                // Pass down animation state - child components can use this
                ...shouldAnimate ? {} : { "data-initial-skip": true }
              })
            },
            `presence-${key}`
          )
        );
      }
    });
  }
  return /* @__PURE__ */ jsx4(Fragment4, { children: allChildren });
}

// src/adapters/react/components/MotionConfig.tsx
import { createContext as createContext4, useContext as useContext4, useMemo as useMemo5 } from "react";
import { jsx as jsx5 } from "react/jsx-runtime";
var defaultContext = {
  config: {},
  reducedMotion: "user",
  initial: true,
  isReducedMotion: false
};
var MotionContext = createContext4(defaultContext);
function useMotionConfig() {
  return useContext4(MotionContext);
}
function checkReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}
function MotionConfig({
  config = {},
  reducedMotion = "user",
  initial = true,
  children
}) {
  const parentContext = useContext4(MotionContext);
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
        isReducedMotion = checkReducedMotion();
    }
    return {
      config: { ...parentContext.config, ...config },
      reducedMotion,
      initial,
      isReducedMotion
    };
  }, [config, reducedMotion, initial, parentContext.config]);
  return /* @__PURE__ */ jsx5(MotionContext.Provider, { value, children });
}

// src/adapters/react/components/Reorder.tsx
import * as React5 from "react";
import {
  createContext as createContext5,
  useContext as useContext5,
  useRef as useRef26,
  useState as useState17,
  useEffect as useEffect20,
  useCallback as useCallback14,
  useMemo as useMemo6
} from "react";
import { createSpringValue as createSpringValue5 } from "@oxog/springkit";
var ReorderContext = createContext5(null);
function useReorderContext() {
  const context = useContext5(ReorderContext);
  if (!context) {
    throw new Error("Reorder.Item must be used within a Reorder.Group");
  }
  return context;
}
function ReorderGroupComponent({
  values,
  onReorder,
  axis = "y",
  config = { stiffness: 300, damping: 30 },
  className,
  style,
  children,
  as: Component = "ul",
  layoutDuration = 200
}, ref) {
  const itemsRef = useRef26(/* @__PURE__ */ new Map());
  const sizesRef = useRef26(/* @__PURE__ */ new Map());
  const [draggingValue, setDraggingValue] = useState17(null);
  const [offsets, setOffsets] = useState17(/* @__PURE__ */ new Map());
  const dragStartIndexRef = useRef26(-1);
  const currentOrderRef = useRef26(values);
  useEffect20(() => {
    currentOrderRef.current = values;
  }, [values]);
  const registerItem = useCallback14((value, element) => {
    itemsRef.current.set(value, element);
    const rect = element.getBoundingClientRect();
    sizesRef.current.set(value, axis === "y" ? rect.height : rect.width);
  }, [axis]);
  const unregisterItem = useCallback14((value) => {
    itemsRef.current.delete(value);
    sizesRef.current.delete(value);
  }, []);
  const handleDragStart = useCallback14((value) => {
    setDraggingValue(value);
    dragStartIndexRef.current = currentOrderRef.current.indexOf(value);
  }, []);
  const handleDrag = useCallback14((value, offset) => {
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
        if (!otherValue) continue;
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
        if (!otherValue) continue;
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
  }, []);
  const handleDragEnd = useCallback14((value) => {
    const currentIndex = currentOrderRef.current.indexOf(value);
    if (currentIndex === -1) {
      setDraggingValue(null);
      setOffsets(/* @__PURE__ */ new Map());
      return;
    }
    const order = [...currentOrderRef.current];
    let targetIndex = currentIndex;
    offsets.forEach((offset, otherValue) => {
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
        onReorder(newOrder);
      }
    }
    setDraggingValue(null);
    setOffsets(/* @__PURE__ */ new Map());
  }, [offsets, onReorder]);
  const getDraggingValue = useCallback14(() => draggingValue, [draggingValue]);
  const getItemOffset = useCallback14((value) => offsets.get(value) || 0, [offsets]);
  const contextValue = useMemo6(() => ({
    values,
    axis,
    config,
    registerItem,
    unregisterItem,
    onDragStart: handleDragStart,
    onDrag: handleDrag,
    onDragEnd: handleDragEnd,
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
    getDraggingValue,
    getItemOffset,
    layoutDuration
  ]);
  return React5.createElement(
    ReorderContext.Provider,
    { value: contextValue },
    React5.createElement(
      Component,
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
  as: Component = "li",
  dragEnabled = true,
  onDragStart,
  onDragEnd
}, ref) {
  const context = useReorderContext();
  const elementRef = useRef26(null);
  const springRef = useRef26(null);
  const [offset, setOffset] = useState17(0);
  const [isDragging, setIsDragging] = useState17(false);
  const dragStartPos = useRef26({ x: 0, y: 0 });
  const dragOffset = useRef26(0);
  const setRef = useCallback14((node) => {
    elementRef.current = node;
    if (typeof ref === "function") {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
    if (node) {
      context.registerItem(value, node);
    } else {
      context.unregisterItem(value);
    }
  }, [ref, context, value]);
  useEffect20(() => {
    return () => {
      context.unregisterItem(value);
      springRef.current?.destroy();
    };
  }, [context, value]);
  useEffect20(() => {
    if (isDragging) return;
    const targetOffset = context.getItemOffset(value);
    if (!springRef.current) {
      springRef.current = createSpringValue5(0, {
        ...context.config,
        onUpdate: setOffset
      });
    }
    springRef.current.set(targetOffset);
  }, [context, value, isDragging]);
  const handlePointerDown = useCallback14((e) => {
    if (!dragEnabled) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    onDragStart?.();
    context.onDragStart(value);
    const rect = elementRef.current?.getBoundingClientRect();
    dragStartPos.current = {
      x: e.clientX - (rect?.left ?? 0),
      y: e.clientY - (rect?.top ?? 0)
    };
    dragOffset.current = 0;
    if (elementRef.current) {
      elementRef.current.setPointerCapture(e.pointerId);
    }
  }, [dragEnabled, context, value, onDragStart]);
  const handlePointerMove = useCallback14((e) => {
    if (!isDragging) return;
    const rect = elementRef.current?.getBoundingClientRect();
    if (!rect) return;
    const currentPos = context.axis === "y" ? e.clientY : e.clientX;
    const startPos = context.axis === "y" ? (elementRef.current?.offsetTop ?? 0) + dragStartPos.current.y : (elementRef.current?.offsetLeft ?? 0) + dragStartPos.current.x;
    dragOffset.current = currentPos - startPos - (context.axis === "y" ? rect.height / 2 : rect.width / 2);
    context.onDrag(value, dragOffset.current);
    setOffset(dragOffset.current);
  }, [isDragging, context, value]);
  const handlePointerUp = useCallback14((e) => {
    if (!isDragging) return;
    if (elementRef.current) {
      elementRef.current.releasePointerCapture(e.pointerId);
    }
    setIsDragging(false);
    onDragEnd?.();
    context.onDragEnd(value);
    setOffset(0);
    dragOffset.current = 0;
  }, [isDragging, context, value, onDragEnd]);
  const transformProp = context.axis === "y" ? `translateY(${offset}px)` : `translateX(${offset}px)`;
  const handleKeyDown = useCallback14((e) => {
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
      context.onDragStart(value);
      const offset2 = (newIndex - currentIndex) * 50;
      context.onDrag(value, offset2);
      context.onDragEnd(value);
    }
  }, [dragEnabled, context, value]);
  return React5.createElement(
    Component,
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
var ReorderGroup = React5.forwardRef(ReorderGroupComponent);
var ReorderItem = React5.forwardRef(ReorderItemComponent);
var Reorder = {
  Group: ReorderGroup,
  Item: ReorderItem
};

// src/adapters/react/components/SpringText.tsx
import * as React6 from "react";
import { useRef as useRef27, useEffect as useEffect21, useState as useState18, useMemo as useMemo7, memo as memo2 } from "react";
import { createSpringValue as createSpringValue6 } from "@oxog/springkit";
import { jsx as jsx6, jsxs } from "react/jsx-runtime";
var SpringText = memo2(function SpringText2({
  children,
  mode = "characters",
  stagger = 30,
  from = "bottom",
  config = { stiffness: 200, damping: 20 },
  initialOpacity = 0,
  initialOffset = 20,
  animateOnMount = true,
  trigger,
  onComplete,
  className,
  style
}) {
  const [elements, setElements] = useState18([]);
  const [animatedValues, setAnimatedValues] = useState18([]);
  const springsRef = useRef27([]);
  const completedRef = useRef27(0);
  useEffect21(() => {
    let parts;
    switch (mode) {
      case "words":
        parts = children.split(/(\s+)/);
        break;
      case "lines":
        parts = children.split("\n");
        break;
      case "characters":
      default:
        parts = children.split("");
    }
    setElements(parts);
    setAnimatedValues(new Array(parts.length).fill(0));
  }, [children, mode]);
  useEffect21(() => {
    if (elements.length === 0) return;
    springsRef.current.forEach((s) => s.destroy());
    springsRef.current = [];
    completedRef.current = 0;
    const springs = elements.map((_, index) => {
      const spring = createSpringValue6(0, {
        ...config,
        onUpdate: (value) => {
          setAnimatedValues((prev) => {
            const next = [...prev];
            next[index] = value;
            return next;
          });
        }
      });
      return spring;
    });
    springsRef.current = springs;
    if (animateOnMount || trigger !== void 0) {
      springs.forEach((spring, index) => {
        setTimeout(() => {
          spring.set(1);
          const checkComplete = () => {
            if (!spring.isAnimating()) {
              completedRef.current++;
              if (completedRef.current === elements.length) {
                onComplete?.();
              }
            } else {
              requestAnimationFrame(checkComplete);
            }
          };
          setTimeout(checkComplete, 50);
        }, index * stagger);
      });
    }
    return () => {
      springs.forEach((s) => s.destroy());
    };
  }, [elements, stagger, config, animateOnMount, trigger, onComplete]);
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
  return /* @__PURE__ */ jsx6("span", { className, style, children: elements.map((element, index) => {
    const progress = animatedValues[index] ?? 0;
    const opacity = initialOpacity + (1 - initialOpacity) * progress;
    if (element.match(/^\s+$/)) {
      return /* @__PURE__ */ jsx6("span", { children: element }, index);
    }
    return /* @__PURE__ */ jsx6(
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
  const [displayValue, setDisplayValue] = useState18(value);
  const springRef = useRef27(null);
  const lastValueRef = useRef27(value);
  useEffect21(() => {
    springRef.current = createSpringValue6(value, {
      ...config,
      onUpdate: setDisplayValue
    });
    return () => {
      springRef.current?.destroy();
      springRef.current = null;
    };
  }, []);
  useEffect21(() => {
    if (springRef.current && value !== lastValueRef.current) {
      springRef.current.set(value);
      lastValueRef.current = value;
    }
  }, [value]);
  const formattedValue = useMemo7(() => {
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
  delay = 0,
  cursor = true,
  cursorChar = "|",
  loop = false,
  pauseAtEnd = 1e3,
  deleteSpeed = 30,
  onComplete,
  className,
  style
}) {
  const [displayText, setDisplayText] = useState18("");
  const [showCursor, setShowCursor] = useState18(cursor);
  const [_isDeleting, setIsDeleting] = useState18(false);
  const timeoutRef = useRef27(null);
  useEffect21(() => {
    let currentIndex = 0;
    let isDeleteMode = false;
    const tick = () => {
      if (!isDeleteMode) {
        if (currentIndex <= children.length) {
          setDisplayText(children.slice(0, currentIndex));
          currentIndex++;
          timeoutRef.current = window.setTimeout(tick, speed);
        } else {
          onComplete?.();
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
          setDisplayText(children.slice(0, currentIndex));
          timeoutRef.current = window.setTimeout(tick, deleteSpeed);
        } else {
          isDeleteMode = false;
          setIsDeleting(false);
          timeoutRef.current = window.setTimeout(tick, speed);
        }
      }
    };
    timeoutRef.current = window.setTimeout(tick, delay);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [children, speed, delay, loop, pauseAtEnd, deleteSpeed, onComplete]);
  useEffect21(() => {
    if (!cursor) return;
    const blink = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 500);
    return () => clearInterval(blink);
  }, [cursor]);
  return /* @__PURE__ */ jsxs("span", { className, style, children: [
    displayText,
    cursor && /* @__PURE__ */ jsx6("span", { style: { opacity: showCursor ? 1 : 0 }, children: cursorChar })
  ] });
});
var SplitText = memo2(function SplitText2({
  children,
  mode = "characters",
  render,
  className,
  style
}) {
  const elements = useMemo7(() => {
    switch (mode) {
      case "words":
        return children.split(/(\s+)/);
      case "lines":
        return children.split("\n");
      case "characters":
      default:
        return children.split("");
    }
  }, [children, mode]);
  return /* @__PURE__ */ jsx6("span", { className, style, children: elements.map((element, index) => /* @__PURE__ */ jsx6(React6.Fragment, { children: render(element, index, elements.length) }, index)) });
});

// src/adapters/react/components/Magnetic.tsx
import {
  useRef as useRef28,
  useEffect as useEffect22,
  useState as useState19,
  useCallback as useCallback15,
  memo as memo3,
  forwardRef as forwardRef3
} from "react";
import { createSpringValue as createSpringValue7 } from "@oxog/springkit";
import { jsx as jsx7 } from "react/jsx-runtime";
var Magnetic = memo3(forwardRef3(
  function Magnetic2({
    children,
    strength = 0.3,
    range = 100,
    config = { stiffness: 200, damping: 20 },
    enabled = true,
    scaleOnHover = 1,
    maxOffset = 50,
    className,
    style,
    onAttract,
    onRelease
  }, ref) {
    const innerRef = useRef28(null);
    const combinedRef = (node) => {
      innerRef.current = node;
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    };
    const springXRef = useRef28(null);
    const springYRef = useRef28(null);
    const springScaleRef = useRef28(null);
    const [transform, setTransform] = useState19({ x: 0, y: 0, scale: 1 });
    const isAttractedRef = useRef28(false);
    useEffect22(() => {
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
    const onAttractRef = useRef28(onAttract);
    const onReleaseRef = useRef28(onRelease);
    onAttractRef.current = onAttract;
    onReleaseRef.current = onRelease;
    const handleMouseMove = useCallback15(
      (e) => {
        if (!enabled || !innerRef.current) return;
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
      [enabled, range, strength, maxOffset, scaleOnHover]
    );
    const handleMouseLeave = useCallback15(() => {
      springXRef.current?.set(0);
      springYRef.current?.set(0);
      springScaleRef.current?.set(1);
      if (isAttractedRef.current) {
        isAttractedRef.current = false;
        onReleaseRef.current?.();
      }
    }, []);
    useEffect22(() => {
      if (!enabled) return;
      window.addEventListener("mousemove", handleMouseMove, { passive: true });
      window.addEventListener("mouseleave", handleMouseLeave, { passive: true });
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseleave", handleMouseLeave);
      };
    }, [enabled, handleMouseMove, handleMouseLeave]);
    return /* @__PURE__ */ jsx7(
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
  return /* @__PURE__ */ jsx7("div", { className, style, children });
});
var MagneticCursor = memo3(function MagneticCursor2({
  children,
  size = 30,
  config = { stiffness: 150, damping: 15 },
  offset = { x: 0, y: 0 },
  visible = true,
  zIndex = 9999,
  className,
  style
}) {
  const [position, setPosition] = useState19({ x: 0, y: 0 });
  const springXRef = useRef28(null);
  const springYRef = useRef28(null);
  useEffect22(() => {
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
  useEffect22(() => {
    const handleMouseMove = (e) => {
      springXRef.current?.set(e.clientX + offset.x);
      springYRef.current?.set(e.clientY + offset.y);
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [offset]);
  if (!visible) return null;
  return /* @__PURE__ */ jsx7(
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
      children: children ?? /* @__PURE__ */ jsx7(
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
    config = { stiffness: 200, damping: 20 },
    enabled = true,
    maxOffset = 50
  } = options;
  const ref = useRef28(null);
  const springXRef = useRef28(null);
  const springYRef = useRef28(null);
  const [position, setPosition] = useState19({ x: 0, y: 0 });
  const isAttractedRef = useRef28(false);
  const [isAttracted, setIsAttracted] = useState19(false);
  useEffect22(() => {
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
  useEffect22(() => {
    if (!enabled) return;
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
    window.addEventListener("mouseleave", handleMouseLeave, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [enabled, range, strength, maxOffset]);
  const reset = useCallback15(() => {
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
import * as React7 from "react";
import {
  useRef as useRef29,
  useEffect as useEffect23,
  useState as useState20,
  useCallback as useCallback16,
  useMemo as useMemo8,
  memo as memo4,
  forwardRef as forwardRef4,
  createContext as createContext6,
  useContext as useContext6
} from "react";
import { createSpringValue as createSpringValue8 } from "@oxog/springkit";
import { jsx as jsx8, jsxs as jsxs2 } from "react/jsx-runtime";
var Parallax = memo4(forwardRef4(
  function Parallax2({
    children,
    speed = 0.5,
    direction = "vertical",
    config = { stiffness: 100, damping: 20 },
    enabled = true,
    offset = {},
    rootMargin = "100px",
    as: Component = "div",
    className,
    style
  }, ref) {
    const innerRef = useRef29(null);
    const combinedRef = (node) => {
      innerRef.current = node;
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    };
    const springXRef = useRef29(null);
    const springYRef = useRef29(null);
    const [transform, setTransform] = useState20({ x: offset.x ?? 0, y: offset.y ?? 0 });
    const [isInView, setIsInView] = useState20(false);
    useEffect23(() => {
      springXRef.current = createSpringValue8(offset.x ?? 0, {
        ...config,
        onUpdate: (x) => setTransform((t) => ({ ...t, x }))
      });
      springYRef.current = createSpringValue8(offset.y ?? 0, {
        ...config,
        onUpdate: (y) => setTransform((t) => ({ ...t, y }))
      });
      return () => {
        springXRef.current?.destroy();
        springYRef.current?.destroy();
      };
    }, [config, offset.x, offset.y]);
    useEffect23(() => {
      if (!innerRef.current) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          setIsInView(entry?.isIntersecting ?? false);
        },
        { rootMargin }
      );
      observer.observe(innerRef.current);
      return () => observer.disconnect();
    }, [rootMargin]);
    useEffect23(() => {
      if (!enabled || !isInView) return;
      const handleScroll = () => {
        if (!innerRef.current) return;
        const rect = innerRef.current.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const windowWidth = window.innerWidth;
        const centerY = (rect.top + rect.height / 2 - windowHeight / 2) / windowHeight;
        const centerX = (rect.left + rect.width / 2 - windowWidth / 2) / windowWidth;
        if (direction === "vertical" || direction === "both") {
          const yOffset = centerY * speed * 200 + (offset.y ?? 0);
          springYRef.current?.set(yOffset);
        }
        if (direction === "horizontal" || direction === "both") {
          const xOffset = centerX * speed * 200 + (offset.x ?? 0);
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
    }, [enabled, isInView, speed, direction, offset]);
    const transformStyle = useMemo8(() => {
      const parts = [];
      if (direction === "vertical" || direction === "both") {
        parts.push(`translateY(${transform.y}px)`);
      }
      if (direction === "horizontal" || direction === "both") {
        parts.push(`translateX(${transform.x}px)`);
      }
      return parts.join(" ") || "none";
    }, [direction, transform]);
    return React7.createElement(
      Component,
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
var MouseParallax = memo4(forwardRef4(
  function MouseParallax2({
    children,
    strength = 20,
    inverted = false,
    config = { stiffness: 100, damping: 15 },
    enabled = true,
    container,
    resetOnLeave = true,
    as: Component = "div",
    className,
    style
  }, ref) {
    const springXRef = useRef29(null);
    const springYRef = useRef29(null);
    const [transform, setTransform] = useState20({ x: 0, y: 0 });
    useEffect23(() => {
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
    useEffect23(() => {
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
      if (useWindow) {
        window.addEventListener("mousemove", handleMouseMove, { passive: true });
        window.addEventListener("mouseleave", handleMouseLeave, { passive: true });
      } else {
        target.addEventListener("mousemove", handleMouseMove, { passive: true });
        target.addEventListener("mouseleave", handleMouseLeave, { passive: true });
      }
      return () => {
        if (useWindow) {
          window.removeEventListener("mousemove", handleMouseMove);
          window.removeEventListener("mouseleave", handleMouseLeave);
        } else {
          target.removeEventListener("mousemove", handleMouseMove);
          target.removeEventListener("mouseleave", handleMouseLeave);
        }
      };
    }, [enabled, container, strength, inverted, resetOnLeave]);
    return React7.createElement(
      Component,
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
var TiltCard = memo4(forwardRef4(
  function TiltCard2({
    children,
    maxTilt = 20,
    perspective = 1e3,
    scale = 1,
    config = { stiffness: 300, damping: 20 },
    enabled = true,
    glare = false,
    glareOpacity = 0.2,
    className,
    style,
    onTilt
  }, ref) {
    const innerRef = useRef29(null);
    const combinedRef = (node) => {
      innerRef.current = node;
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    };
    const springTiltXRef = useRef29(null);
    const springTiltYRef = useRef29(null);
    const springScaleRef = useRef29(null);
    const springGlareRef = useRef29(null);
    const [tilt, setTilt] = useState20({ x: 0, y: 0, scale: 1, glareX: 50, glareY: 50, glareOpacity: 0 });
    useEffect23(() => {
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
    const handleMouseMove = useCallback16(
      (e) => {
        if (!enabled || !innerRef.current) return;
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
      [enabled, maxTilt, scale, glare, glareOpacity, onTilt]
    );
    const handleMouseLeave = useCallback16(() => {
      springTiltXRef.current?.set(0);
      springTiltYRef.current?.set(0);
      springScaleRef.current?.set(1);
      springGlareRef.current?.set(0);
    }, []);
    return /* @__PURE__ */ jsx8(
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
              glare && /* @__PURE__ */ jsx8(
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
  const containerRef = useRef29(null);
  const [scrollProgress, setScrollProgress] = useState20(0);
  useEffect23(() => {
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
  const contextValue = useMemo8(
    () => ({ scrollProgress, containerRef }),
    [scrollProgress]
  );
  return /* @__PURE__ */ jsx8(ParallaxContext.Provider, { value: contextValue, children: /* @__PURE__ */ jsx8(
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
      children: /* @__PURE__ */ jsx8("div", { style: { height: `${pages * 100}vh`, position: "relative" }, children })
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
  const context = useContext6(ParallaxContext);
  const [transform, setTransform] = useState20({ x: 0, y: 0 });
  useEffect23(() => {
    if (!context) return;
    const progress = context.scrollProgress;
    const pageHeight = 100;
    if (sticky) {
      const stickyRange = sticky.end - sticky.start;
      if (progress >= sticky.start && progress <= sticky.end && stickyRange > 0) {
        const _stickyProgress = (progress - sticky.start) / stickyRange;
        setTransform({
          x: 0,
          y: sticky.start * pageHeight
        });
      } else if (progress < sticky.start) {
        setTransform({ x: 0, y: offset * pageHeight });
      } else {
        setTransform({ x: 0, y: sticky.end * pageHeight });
      }
    } else {
      const base = offset * pageHeight;
      const parallaxOffset = progress * pageHeight * (1 - speed);
      if (horizontal) {
        setTransform({ x: parallaxOffset, y: base });
      } else {
        setTransform({ x: 0, y: base + parallaxOffset });
      }
    }
  }, [context?.scrollProgress, offset, speed, horizontal, sticky]);
  return /* @__PURE__ */ jsx8(
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
  return useContext6(ParallaxContext);
}

// src/adapters/react/components/LazyMotion.tsx
import * as React8 from "react";
import { createContext as createContext7, useContext as useContext7, useState as useState21, useEffect as useEffect24, useMemo as useMemo9 } from "react";
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
  return useContext7(LazyMotionContext);
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
  const [loadedFeatures, setLoadedFeatures] = useState21(
    typeof features === "function" ? null : features
  );
  const [isLoaded, setIsLoaded] = useState21(typeof features !== "function");
  useEffect24(() => {
    if (typeof features === "function") {
      features().then((loaded) => {
        setLoadedFeatures(loaded);
        setIsLoaded(true);
      });
    } else {
      setLoadedFeatures(features);
      setIsLoaded(true);
    }
  }, [features]);
  const contextValue = useMemo9(() => ({
    features: loadedFeatures ?? {},
    isStrict: strict,
    isLoaded
  }), [loadedFeatures, strict, isLoaded]);
  if (!isLoaded) {
    return React8.createElement(React8.Fragment, null, null);
  }
  return React8.createElement(
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
  return React8.createElement(
    React8.Fragment,
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
