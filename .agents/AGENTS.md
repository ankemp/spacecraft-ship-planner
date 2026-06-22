# Project Rules & Guidelines

## Shipbuilding Specification Compliance

Whenever you are implementing, modifying, or refactoring shipbuilding features, UI stats panels, building constraints, or math calculations, you MUST consult and adhere strictly to the rules documented in [IN_GAME_SPEC.md](../IN_GAME_SPEC.md).

Key areas of alignment:
- **Connectivity & Adjacency**: All blocks must form a single contiguous structure connected via face-to-face contact to the cockpit/core.
- **Orientation**: Maintain the 3 binary flips (Flip X, Flip Y, Flip Z) system; do not introduce arbitrary 90-degree rotations if they violate the spec.
- **Resource Formulas**: Implement the global efficiency calculation for SP, the power depletion logic, and global heat pool calculations as defined in the spec.
- **Structural Integrity**: Calculate and display the Frame to Weight ratio as a measure of integrity.
- **Thruster Mechanics**: Combine boost stats additively rather than overriding them, and ensure Force and Thrust are handled correctly.
- **Block Shapes**: Treat shapes as cosmetic variations without affecting collision dimensions or block stats.

---

## Performance & Potato Mode Compliance

Whenever adding new features, UI controls, or 3D animations, you MUST strictly adhere to the guidelines, checklists, and performance architecture detailed in [POTATO_MODE.md](../POTATO_MODE.md).

Key compliance rules:
- **Gate cosmetic/non-essential features** (e.g. menu shapes, environment presets, complex analysis) behind the `potatoMode` flag.
- **Avoid per-frame React state updates** inside `useFrame` (use `useRef` for frame-level tracking).
- **Keep `saveAutosave` off the hot path** (ensure it remains debounced and deferred).
- **Memoize expensive derived state** (e.g., BFS-based selectors) keyed on the blocks reference.
- **Render on demand** by subscribing state changes that affect 3D visuals to the R3F `<Canvas>` `Invalidator`.

