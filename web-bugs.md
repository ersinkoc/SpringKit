# SpringKit Website - Examples Bug Report

Generated: 2025-01-08
Scan: Complete website folder review
Focus: Examples and demo pages

---

## Executive Summary

This report details potential issues found in the SpringKit website examples. Issues are categorized by severity:
- **High Priority**: Runtime errors, memory leaks, crashes
- **Medium Priority**: Type safety, performance issues
- **Low Priority**: Accessibility, code quality

---

## Table of Contents

1. [Missing Error Handling](#1-missing-error-handling)
2. [React Hook Usage Problems](#2-react-hook-usage-problems)
3. [TypeScript Issues and Type Mismatches](#3-typescript-issues-and-type-mismatches)
4. [Performance Issues and Anti-patterns](#4-performance-issues-and-anti-patterns)
5. [Missing Cleanup Issues](#5-missing-cleanup-issues)
6. [Accessibility Issues](#6-accessibility-issues)
7. [API Usage Mismatches](#7-api-usage-mismatches)
8. [Code Inconsistencies](#8-code-inconsistencies)
9. [Missing Boundary Checks](#9-missing-boundary-checks)
10. [Memory Leaks Potential](#10-memory-leaks-potential)
11. [React StrictMode Compatibility](#11-react-strictmode-compatibility)
12. [State Management Issues](#12-state-management-issues)

---

## 1. Missing Error Handling

### 1.1 GesturesDemo.tsx:131-135
**File**: `website/src/pages/examples/GesturesDemo.tsx`
**Severity**: High
**Type**: Runtime Error Prevention

```typescript
onMouseEnter={(e) => {
  handlers.onMouseEnter?.()
  setHoverCount((c) => c + 1)
}}
```

**Issue**: If `handlers.onMouseEnter` throws an error, it crashes the component and prevents state updates.

**Fix**:
```typescript
onMouseEnter={(e) => {
  try {
    handlers.onMouseEnter?.()
  } catch (error) {
    console.error('[GesturesDemo] Mouse enter handler error:', error)
  }
  setHoverCount((c) => c + 1)
}}
```

---

### 1.2 SVGMorphDemo.tsx:136-140
**File**: `website/src/pages/examples/SVGMorphDemo.tsx`
**Severity**: High
**Type**: DOM Operation Safety

```typescript
const unsubscribe = morphRef.current.subscribe((path) => {
  if (pathRef.current) {
    pathRef.current.setAttribute('d', path)
  }
})
```

**Issue**: If `setAttribute` fails (invalid path data), unhandled error occurs.

**Fix**:
```typescript
const unsubscribe = morphRef.current.subscribe((path) => {
  if (pathRef.current) {
    try {
      pathRef.current.setAttribute('d', path)
    } catch (error) {
      console.error('[SVGMorphDemo] Failed to set path attribute:', error)
    }
  }
})
```

---

## 2. React Hook Usage Problems

### 2.1 BounceElasticDemo.tsx:88-95
**File**: `website/src/pages/examples/BounceElasticDemo.tsx`
**Severity**: Medium
**Type**: Hook Dependency Array

```typescript
useEffect(() => {
  if (!value) return
  const unsubscribe = value.subscribe((v) => {
    setYPos(v)
  })
  return unsubscribe
}, [value])
```

**Issue**: `setYPos` is missing from dependency array. While setState is stable, linters flag this.

**Fix**:
```typescript
useEffect(() => {
  if (!value) return
  const unsubscribe = value.subscribe((v) => {
    setYPos(v)
  })
  return unsubscribe
}, [value, setYPos])
```

---

### 2.2 TimelineDemo.tsx:113-116
**File**: `website/src/pages/examples/TimelineDemo.tsx`
**Severity**: Medium
**Type**: Cleanup Safety

```typescript
return () => {
  timeline.kill()
}
```

**Issue**: `timeline.kill()` could throw; cleanup functions shouldn't throw.

**Fix**:
```typescript
return () => {
  try {
    timeline.kill()
  } catch (error) {
    console.error('[TimelineDemo] Cleanup error:', error)
  }
}
```

---

## 3. TypeScript Issues and Type Mismatches

### 3.1 PhysicsPresetsDemo.tsx:37
**File**: `website/src/pages/examples/PhysicsPresetsDemo.tsx`
**Severity**: Medium
**Type**: Type Safety

```typescript
const config = presets[preset]
```

**Issue**: Even though `preset` is typed as `keyof typeof presets`, the access could still be undefined at runtime.

**Fix**:
```typescript
const config = presets[preset] ?? presets.gentle
```

---

### 3.2 VariantsDemo.tsx:186-187
**File**: `website/src/pages/examples/VariantsDemo.tsx`
**Severity**: Low
**Type**: Type Consistency

```typescript
opacity: values.opacity ?? 1,
scale: values.scale ?? 1,
```

**Issue**: Using nullish coalescing suggests nullable values, but types might not reflect this properly.

**Fix**: Ensure the interface explicitly marks these as optional:
```typescript
interface VariantValues {
  opacity?: number
  scale?: number
  // ...
}
```

---

## 4. Performance Issues and Anti-patterns

### 4.1 SVGMorphDemo.tsx:175-185
**File**: `website/src/pages/examples/SVGMorphDemo.tsx`
**Severity**: Medium
**Type**: Performance

```typescript
items.forEach((item, i) => {
  const delay = delays[i] * 1000
  if (delay > maxDelay) maxDelay = delay

  setTimeout(() => {
    animate(
      item,
      { scale: 1, opacity: 1 },
      { stiffness: 300, damping: 15 }
    )
  }, delay)
})
```

**Issue**: Creating multiple setTimeout callbacks (potentially dozens) could impact performance.

**Fix**: Use a single scheduled animation loop or stagger helper:
```typescript
const maxDelay = Math.max(...delays) * 1000
items.forEach((item, i) => {
  setTimeout(() => {
    animate(item, { scale: 1, opacity: 1 }, { stiffness: 300, damping: 15 })
  }, delays[i] * 1000)
})
```

---

### 4.2 StaggerPatternsDemo.tsx:156-190
**File**: `website/src/pages/examples/StaggerPatternsDemo.tsx`
**Severity**: Low
**Type**: Optimization

```typescript
const items = isGridPattern
  ? gridRefs.current.filter(Boolean)
  : itemRefs.current.filter(Boolean)
```

**Issue**: Filter operation runs on every animation trigger.

**Fix**: Memoize the filtered arrays:
```typescript
const gridItems = useMemo(() => gridRefs.current.filter(Boolean), [gridRefs.current])
const listItems = useMemo(() => itemRefs.current.filter(Boolean), [itemRefs.current])
```

---

## 5. Missing Cleanup Issues

### 5.1 SVGMorphDemo.tsx:209-215
**File**: `website/src/pages/examples/SVGMorphDemo.tsx`
**Severity**: Medium
**Type**: Race Condition

```typescript
useEffect(() => {
  return () => {
    if (autoCycleRef.current) {
      clearInterval(autoCycleRef.current)
    }
  }
}, [])
```

**Issue**: If component unmounts during auto-cycle, state updates could occur after unmount.

**Fix**: Add a mounted flag:
```typescript
const mountedRef = useRef(true)

useEffect(() => {
  mountedRef.current = true
  return () => {
    mountedRef.current = false
    if (autoCycleRef.current) {
      clearInterval(autoCycleRef.current)
    }
  }
}, [])

// In the interval callback:
if (mountedRef.current) {
  setStateUpdates()
}
```

---

### 5.2 BounceElasticDemo.tsx:104-109
**File**: `website/src/pages/examples/BounceElasticDemo.tsx`
**Severity**: Medium
**Type**: Memory Leak

```typescript
const handleBounce = () => {
  if (isBouncing) return
  setIsBouncing(true)
  drop(0, 0) // Drop from top
  setTimeout(() => setIsBouncing(false), 2000)
}
```

**Issue**: Timeout isn't tracked or cleaned up if component unmounts.

**Fix**:
```typescript
const timeoutRef = useRef<NodeJS.Timeout>()

const handleBounce = () => {
  if (isBouncing) return
  setIsBouncing(true)
  drop(0, 0)
  timeoutRef.current = setTimeout(() => setIsBouncing(false), 2000)
}

useEffect(() => {
  return () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }
}, [])
```

---

## 6. Accessibility Issues

### 6.1 GesturesDemo.tsx:185-197
**File**: `website/src/pages/examples/GesturesDemo.tsx`
**Severity**: Medium
**Type**: ARIA Attributes

```typescript
<button
  {...handlers}
  onClick={handleClick}
  className="..."
>
```

**Issue**: Interactive buttons lack ARIA labels for screen readers.

**Fix**:
```typescript
<button
  {...handlers}
  onClick={handleClick}
  aria-label="Gesture demo button"
  className="..."
>
```

---

### 6.2 Multiple Demo Files
**File**: Various demo files
**Severity**: Low
**Type**: Keyboard Navigation

**Issue**: Many interactive elements lack keyboard navigation support (tabIndex, keyboard handlers).

**Fix Pattern**:
```typescript
<button
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }}
  tabIndex={0}
>
```

---

## 7. API Usage Mismatches

### 7.1 GettingStarted.tsx:140-144
**File**: `website/src/docs/GettingStarted.tsx`
**Severity**: High
**Type**: Documentation Accuracy

```typescript
const anim = spring(0, 100, {
  ...springPresets.bounce,  // or gentle, wobbly, stiff, etc.
  onUpdate: (value) => {
    element.style.transform = `translateX(${value}px)`
  },
})
```

**Issue**: Documentation shows `springPresets.bounce` but needs verification against actual exports.

**Fix**: Verify the actual API and update documentation:
```typescript
import { springPresets } from '@oxog/springkit'
// or
import { presets } from '@oxog/springkit'
```

---

## 8. Code Inconsistencies

### 8.1 TimelineDemo.tsx:70-277
**File**: `website/src/pages/examples/TimelineDemo.tsx`
**Severity**: Low
**Type**: Naming Collision

**Issue**: Two functions with the same name in the same file (lines 70 and 268).

**Fix**: Rename the duplicate function to avoid confusion.

---

## 9. Missing Boundary Checks

### 9.1 BounceElasticDemo.tsx:100-101
**File**: `website/src/pages/examples/BounceElasticDemo.tsx`
**Severity**: Low
**Type**: Input Validation

```typescript
drop(0, 0) // Drop from top
```

**Issue**: Hardcoded values without validation against container bounds.

**Fix**:
```typescript
const drop = (y: number) => {
  const maxHeight = containerRef.current?.clientHeight ?? 500
  const clampedY = Math.max(0, Math.min(y, maxHeight))
  // ...
}
```

---

## 10. Memory Leaks Potential

### 10.1 SVGMorphDemo.tsx:121
**File**: `website/src/pages/examples/SVGMorphDemo.tsx`
**Severity**: High
**Type**: Resource Management

```typescript
const autoCycleRef = useRef<NodeJS.Timeout | null>(null)
```

**Issue**: Intervals and timeouts aren't consistently cleared in all code paths.

**Fix**: Implement a comprehensive cleanup pattern:
```typescript
useEffect(() => {
  const cleanup = () => {
    if (autoCycleRef.current) {
      clearInterval(autoCycleRef.current)
      autoCycleRef.current = null
    }
  }

  return cleanup
}, [])
```

---

## 11. React StrictMode Compatibility

### 11.1 Multiple Demo Files
**File**: Various demo files
**Severity**: Medium
**Type**: React 18+ Compatibility

**Issue**: Several demos don't account for React StrictMode's double-rendering effect in development.

**Fix Pattern**: Follow the pattern from `CLAUDE.md`:
```typescript
if (valueRef.current === null || valueRef.current.isDestroyed()) {
  valueRef.current = createMotionValue(0)
}
```

---

## 12. State Management Issues

### 12.1 VariantsDemo.tsx:152-154
**File**: `website/src/pages/examples/VariantsDemo.tsx`
**Severity**: Medium
**Type**: Stale Closure

```typescript
const morphTo = (shape: keyof typeof shapePaths) => {
  if (!morphRef.current) return
  setCurrentShape(shape)
  morphRef.current.morphTo(shapePaths[shape])
}
```

**Issue**: `shapePaths[shape]` could be stale if `shapePaths` changes.

**Fix**: Use useCallback with proper dependencies:
```typescript
const morphTo = useCallback((shape: keyof typeof shapePaths) => {
  if (!morphRef.current) return
  setCurrentShape(shape)
  morphRef.current.morphTo(shapePaths[shape])
}, [shapePaths])
```

---

## Priority Summary

### High Priority Fixes (Recommended)

1. **Error handling in event handlers** - Prevents crashes
2. **Memory leak prevention** - Ensures long-term stability
3. **Timeout/interval cleanup** - Prevents resource leaks
4. **API documentation verification** - Ensures accuracy

### Medium Priority Fixes

1. **TypeScript type safety** - Improves developer experience
2. **React StrictMode compatibility** - Better development experience
3. **Performance optimizations** - Smoother animations
4. **Accessibility improvements** - Better user experience

### Low Priority Fixes

1. **Code consistency** - Maintainability
2. **Boundary checks** - Edge case handling
3. **Naming conventions** - Code clarity

---

## Recommended Action Plan

1. Start with error handling wrappers (Section 1)
2. Add comprehensive timeout/interval cleanup (Section 5)
3. Verify and fix API documentation (Section 7)
4. Address React StrictMode issues (Section 11)
5. Improve TypeScript types (Section 3)
6. Add accessibility attributes (Section 6)
7. Optimize performance bottlenecks (Section 4)

---

## File Checklist

- [ ] `GesturesDemo.tsx` - Error handling, accessibility
- [ ] `SVGMorphDemo.tsx` - Error handling, cleanup, performance
- [ ] `BounceElasticDemo.tsx` - Hook dependencies, timeout cleanup
- [ ] `TimelineDemo.tsx` - Cleanup safety, naming
- [ ] `PhysicsPresetsDemo.tsx` - Type safety
- [ ] `VariantsDemo.tsx` - Type consistency, stale closures
- [ ] `StaggerPatternsDemo.tsx` - Performance optimization
- [ ] `GettingStarted.tsx` - API verification

---

*End of Report*
