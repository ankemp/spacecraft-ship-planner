---
title: Centralized Icons
description: Force all SVG icons to be defined in src/components/Icon.tsx instead of inline
activation: always_on
---

# Centralized Icons Rule

All SVG icons must be defined in @/src/components/Icon.tsx rather than being written inline as SVG markup within other component files (such as @/src/components/Overlay.tsx).

## Constraints
- **Centralized Placement**: Any new SVG icon must be added to @/src/components/Icon.tsx.
- **Icon Suffix**: Exported icon components must use the `Icon` suffix (e.g., `GripIcon`, `TrashIcon`, `ShareIcon`).
- **Reuse**: Import and reuse existing icons from @/src/components/Icon.tsx rather than duplicating SVG markup.
- **Consistent Styling**: Maintain consistent scaling, stroke width, and CSS color classes (`currentColor`) inside @/src/components/Icon.tsx.
