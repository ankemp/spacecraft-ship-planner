# Project TODOs & Known Issues

This document tracks known issues, technical debt, and recommended next steps for performance, features, and code health.

## Performance & Optimization

### InstancedMesh Batching
- **Description**: Currently, we render one mesh per block instance (resulting in N draw calls). This is a bottleneck for very large ships.
- **Action**: Group all blocks of the same geometry/color into a single `THREE.InstancedMesh` so N blocks = 1 GPU draw call.
- **Scope**: Requires refactoring [Block.tsx](file:///c:/Users/Andrew/workspace/spacecraft-shipbuilder/src/components/Block.tsx) and [Scene.tsx](file:///c:/Users/Andrew/workspace/spacecraft-shipbuilder/src/components/Scene.tsx) significantly.
- **Reference**: See performance guidelines in [POTATO_MODE.md](file:///c:/Users/Andrew/workspace/spacecraft-shipbuilder/POTATO_MODE.md).
