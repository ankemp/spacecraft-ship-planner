# Potato Mode (Low Spec Mode) Guidelines

Potato Mode is a global performance setting designed to reduce CPU and GPU overhead, making the spacecraft shipbuilder run smoothly on lower-spec machines or devices with limited WebGL context allocations.

## Context

Most web browsers limit the number of active WebGL contexts to between 8 and 16 globally. Each React Three Fiber `<Canvas>` element instantiates its own WebGL renderer and context. 
If we render multiple 3D previews simultaneously (e.g. 10 shape selections in a sidebar palette), we quickly hit this browser limit, causing contexts to crash (`WebGL context lost`) and degrading performance.

Potato Mode resolves this by conditionally replacing heavy 3D previews with lightweight 2D representations.

---

## Technical Implementations

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

### 2. Disabling Reflection Maps
In the main 3D scene [Scene.tsx](file:///c:/Users/Andrew/workspace/spacecraft-shipbuilder/src/components/Scene.tsx), we conditionally omit the environment mapping helper:
```tsx
{!potatoMode && <Environment preset="city" />}
```
This saves GPU texture allocation and reflection/roughness shading passes for all materials.

---

## Guidelines for Future Development

When adding animations, particle effects, heavy shading effects, or additional 3D helper controls:

1. **Check the Flag**: Always select `potatoMode` from the store:
   ```typescript
   const potatoMode = useShipStore(s => s.potatoMode);
   ```
2. **Provide Fallbacks**:
   - For **animations / spins**: Completely freeze rotation or disable the update ticks.
   - For **particles / thruster plumes**: Reduce particle counts by 90% or omit them entirely.
   - For **effects (shadows, reflections)**: Turn off dynamic lighting shadows or omit environment maps.
   - For **3D sub-canvases**: Switch to lightweight SVG/HTML templates.
