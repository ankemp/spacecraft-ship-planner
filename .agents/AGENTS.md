# Project Rules & Guidelines

## Shipbuilding Specification Compliance

Whenever you are implementing, modifying, or refactoring shipbuilding features, UI stats panels, building constraints, or math calculations, you MUST consult and adhere strictly to the rules documented in [IN_GAME_SPEC.md](file:///c:/Users/Andrew/workspace/spacecraft-shipbuilder/IN_GAME_SPEC.md).

Key areas of alignment:
- **Connectivity & Adjacency**: All blocks must form a single contiguous structure connected via face-to-face contact to the cockpit/core.
- **Orientation**: Maintain the 3 binary flips (Flip X, Flip Y, Flip Z) system; do not introduce arbitrary 90-degree rotations if they violate the spec.
- **Resource Formulas**: Implement the global efficiency calculation for SP, the power depletion logic, and global heat pool calculations as defined in the spec.
- **Structural Integrity**: Calculate and display the Frame to Weight ratio as a measure of integrity.
- **Thruster Mechanics**: Combine boost stats additively rather than overriding them, and ensure Force and Thrust are handled correctly.
- **Block Shapes**: Treat shapes as cosmetic variations without affecting collision dimensions or block stats.
