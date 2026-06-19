# Potato Mode (Low Spec Mode) & Performance Guidelines

Potato Mode is a global performance setting designed to reduce CPU and GPU overhead, making the spacecraft shipbuilder run smoothly on lower-spec machines or devices with limited WebGL context allocations.

## Context

Most web browsers limit the number of active WebGL contexts to between 8 and 16 globally. Each React Three Fiber `<Canvas>` element instantiates its own WebGL renderer and context. 
If we render multiple 3D previews simultaneously (e.g. 10 shape selections in a sidebar palette), we quickly hit this browser limit, causing contexts to crash (`WebGL context lost`) and degrading performance.

Potato Mode resolves this by conditionally replacing heavy 3D previews with lightweight 2D representations.

---

## Technical Implementations & Optimizations

### 1. 2D Previews Fallback
In [Shape3DPreview.tsx](file:///c:/Users/Andrew/workspace/spacecraft-shipbuilder/src/components/Shape3DPreview.tsx), we check the `potatoMode` flag from the ship store:
```typescript
const potatoMode = useShipStore(s => s.potatoMode);
```
If active, we bypass the R3F `<Canvas>` render completely and return a clean, static, vector-based SVG `<Shape2DPreview>`:
```typescript
if (potatoMode) {
  return <Shape2DPreview shapeId={shapeId} color={color} className={className} />;
}
```
This reduces the page's WebGL context footprint from **11+ contexts down to exactly 1 context** (just the main 3D builder viewport).

### 2. Disabling Reflection Maps & Environment
In the main 3D scene [Scene.tsx](file:///c:/Users/Andrew/workspace/spacecraft-shipbuilder/src/components/Scene.tsx), we conditionally omit the environment mapping helper:
```tsx
{!potatoMode && <Environment preset="city" />}
```
This saves GPU texture allocation and reflection/roughness shading passes for all materials.

### 3. Rendering On-Demand
The R3F `<Canvas>` uses `frameloop="demand"`. The `Invalidator` component bridges Zustand state to R3F's `invalidate()`. If you add new state that should visually update the 3D scene, subscribe to it in `Invalidator` to avoid continuous per-frame renders.

---

## Guidelines for Future Development

When adding animations, particle effects, heavy shading effects, or additional 3D helper controls, you **MUST**:

1. **Gate it behind `potatoMode`**: If the feature is cosmetic or non-essential, wrap it in `{!potatoMode && <MyFeature />}` or an equivalent check. Currently gated features include:
   - Rotating menu shapes
   - R3F `<Environment>` preset lighting
   - Complex BFS connectivity analysis (skipped or limited in Potato Mode)
2. **Avoid per-frame React state updates**: Never call `setState` or Zustand `set` inside `useFrame`. Use `useRef` for frame-level values and only push to React state when the value is semantically meaningful (e.g., cursor grid cell changed).
3. **Keep `saveAutosave` off the hot path**: The autosave helper is intentionally debounced (500ms) and deferred to `requestIdleCallback`. Do NOT add synchronous `localStorage.setItem` calls in the middle of user interactions.
4. **Memoize expensive derived state**: Selectors like `selectBOM` and `selectDerivedStats` (which include a BFS) are wrapped in `useMemo` keyed on `blocks`. If you add new expensive selectors, follow this pattern.
5. **Provide Fallbacks**:
   - For **animations / spins**: Completely freeze rotation or disable the update ticks.
   - For **particles / thruster plumes**: Reduce particle counts by 90% or omit them entirely.
   - For **effects (shadows, reflections)**: Turn off dynamic lighting shadows or omit environment maps.
   - For **3D sub-canvases**: Switch to lightweight SVG/HTML templates.

---

## Performance & Optimization Architecture

### Known Performance Architecture

| Concern | Current Solution |
|---|---|
| GPU draw calls | One mesh per block (N draw calls). **Next big win**: `InstancedMesh` batching. |
| CPU collision checks | Bounding boxes cached on `BlockInstance.bounds`; only re-computed on mutation |
| Stats panel recalculation | `useMemo` on `blocks` reference; BFS skipped in Potato Mode |
| Autosave I/O | Debounced 500ms + `requestIdleCallback` |
| R3F rendering | `frameloop="demand"` + `Invalidator` — renders only on state change |
| Block re-renders on tool change | `canInteract` bool prop passed from Scene; Blocks don't subscribe to `activeTool`/`movingBlock` |
For future performance enhancements and known issues (such as implementing `InstancedMesh`), please refer to [TODO.md](file:///c:/Users/Andrew/workspace/spacecraft-shipbuilder/TODO.md).
