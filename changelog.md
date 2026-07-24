# UtilityCraft Tiered Machinery v1.1.6

This update brings UtilityCraft Tiered Machinery onto the new UtilityCraft system, with major performance improvements and smoother machine behavior.

## SUMMARY

- Updated Tiered Machinery to use the new UtilityCraft machine system.
- Optimized machine behavior to reduce script load and improve world performance.
- Replaced DoriosAPI with the current DoriosCore and DoriosLib runtime.
- Added per-face item I/O and the standard UtilityCraft machine panels.
- Updated compatibility to UtilityCraft 3.5.0+.

## CHANGES

### Systems

- Migrated Tiered Machinery to the updated UtilityCraft backend systems.
- Updated machine logic to align with the newer UtilityCraft processing and transfer architecture.
- Improved behavior consistency between Tiered Machinery machines and base UtilityCraft machines.
- Added one aggregate input mode and one aggregate output mode for every tier.
- Added Upgrades, I/O, and Information tabs to all machine screens.

### Performance

- Reduced unnecessary machine checks during normal operation.
- Improved update handling to lower script cost in worlds with many machines.
- Cached immutable slot layouts and recipe sources instead of rebuilding them every machine tick.

## BUG FIXES

- Fixed issues caused by older machine behavior not matching the new UtilityCraft system.

## COMPATIBILITY

- Requires UtilityCraft 3.5.0 or newer.
