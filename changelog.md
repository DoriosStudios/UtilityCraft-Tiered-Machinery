# UtilityCraft: Tiered Machinery v1.2.0

This is the complete changelog for the changes introduced after v1.1.6.

## SUMMARY

- Completely redesigned every Tiered Machinery interface to match the UtilityCraft 3.5.0 UI system.
- Added embedded Recipe Books to every Crusher and Electro Press tier.
- Added configurable per-face item I/O to all Crushers, Electro Presses, and Incinerators.
- Added dedicated Upgrades, Input/Output, and Information panels to every machine screen.
- Reworked the shared tiered-machine runtime for more consistent parallel processing and safer inventory handling.
- Added full per-face machine textures for every tier, including distinct active and inactive states.
- Migrated the addon from DoriosAPI to DoriosLib 2.0.0 and the latest DoriosCore systems.

## USER INTERFACE

### Machine UI Overhaul

- Rebuilt the interfaces for all Basic, Advanced, Expert, and Ultimate machines.
- Added dedicated layouts for Crushers, Electro Presses, and Incinerators instead of using one generic tier layout.
- Added the shared UtilityCraft top bar and expandable right-side panels.
- Added dedicated Upgrades, Input/Output, and Information tabs to all 12 machine variants.
- Added clearer energy, progress, input, output, and upgrade displays.
- Added colored slot backgrounds to make machine inputs, outputs, and upgrades easier to identify.
- Added tier-aware layouts that scale cleanly with each machine's number of parallel processing channels.
- Added machine information pages explaining processing behavior, I/O groups, and accepted upgrades.
- Updated the screens to remain usable while a Recipe Book or side panel is open.

### Recipe Books

- Added an embedded Crusher Recipe Book to the Basic, Advanced, Expert, and Ultimate Crushers.
- Added an embedded Electro Press Recipe Book to the Basic, Advanced, Expert, and Ultimate Electro Presses.
- Added machine and recipe tabs so players can switch views without closing the interface.
- Added recipe input and output overlays that connect the selected recipe to the machine's first processing channel.
- Added shared Recipe Book panels, connectors, toggle states, hover states, and layout handling from UtilityCraft.

### Localization

- Added localized machine descriptions and item I/O mode text.
- Updated the new UI text in English, Spanish (Spain and Mexico), and Portuguese (Brazil and Portugal).

## MACHINE INPUT/OUTPUT

- Added configurable item I/O to every Crusher, Electro Press, and Incinerator tier.
- Added separate settings for the top, left, front, right, bottom, and back faces.
- Added `Disabled`, `Input`, and `Output` modes for every machine face.
- Input mode exposes every processing-channel input slot for the selected machine.
- Output mode exposes every processing-channel output slot for the selected machine.
- Made I/O direction-aware so the configuration follows the machine's actual rotation.
- Expanded machine inventories with dedicated internal slots for the six face controls.
- Replaced the legacy special-container input mapping with the shared DoriosCore I/O interface.

## MACHINES AND PROCESSING

- Consolidated Crusher, Electro Press, and Incinerator behavior into one shared tier-aware processing system.
- Preserved independent input, progress, and output handling for every parallel processing channel.
- Added explicit Speed and Energy Upgrade slots to every machine tier.
- Updated machine initialization to use the current UtilityCraft machine entity type and runtime settings.
- Cached immutable tier layouts and recipe sources instead of rebuilding them during every machine update.
- Improved recipe lookup, output-space validation, item consumption, and progress updates.
- Improved machine status handling for missing recipes, insufficient energy, blocked outputs, and completed operations.
- Updated energy, progress, and resource displays to use the latest DoriosCore APIs.

## VISUAL CHANGES

- Replaced the older generic machine geometry with full-block geometry.
- Added individual north, south, east, west, top, and bottom textures to every machine.
- Added separate active and inactive per-face textures for all four tiers of Crushers, Electro Presses, and Incinerators.
- Updated texture registration and machine block permutations for the expanded texture set.
- Improved visual consistency between the placed block, its facing direction, and the face shown in the I/O panel.

## CREATOR CHANGES

### DoriosLib

- Added DoriosLib 2.0.0 as the addon's shared creator library.
- Removed the deprecated DoriosAPI runtime and migrated Tiered Machinery to explicit DoriosLib module imports.
- Added public modules for blocks, containers, dependencies, entities, items, math, messages, players, registries, text, time, utilities, and configuration.
- Added shared registry helpers for block components and machine recipe registration.
- Added unified container helpers for resolving inventories, finding valid input and output slots, inserting items, and safely removing inputs.
- Added dependency discovery and validation through the DoriosLib runtime.

### DoriosCore

- Added `ContainerSessionManager` for tracking active machine container sessions.
- Added `InterfaceManager` and the shared container-button interface system.
- Added `registerIOInterface()`, `registerIOInterfaceForBlockTag()`, `ensureBlockIOInterface()`, and `hasRegisteredIOInterface()`.
- Added item, liquid, and gas I/O definitions with per-face modes, persistent configuration, revision tracking, and direction-aware resolution.
- Added unified item, liquid, and gas container helpers.
- Added `MachineUpgradeRegistry` and shared upgrade-processing support.
- Added indexed progress, energy-cost, status, warning, output-tracking, and resource-lore helpers.
- Expanded `EnergyStorage`, `FluidStorage`, `GasStorage`, `Machine`, `BasicMachine`, and multiblock APIs.
- Added updated DoriosCore type declarations and editor configuration for the new runtime APIs.

## PERFORMANCE AND TECHNICAL CHANGES

- Reduced repeated slot-layout, recipe-source, and machine-configuration work during machine ticks.
- Updated machine and generator internals to the current DoriosCore storage and processing architecture.
- Added a generator script for keeping all tier-specific UI layouts consistent.
- Updated build aliases and bundling configuration for DoriosCore and DoriosLib.
- Updated the Behavior Pack and Resource Pack manifests for the current UtilityCraft dependency and scripting modules.

## BUG FIXES

- Fixed legacy machine behavior that no longer matched the current UtilityCraft runtime.
- Fixed item input and output resolution by moving all tiered machines to the shared I/O definitions.
- Fixed machine faces and active-state textures displaying inconsistently after rotation.
- Fixed several UI toggle, panel, and layout conflicts when switching between machine, Recipe Book, upgrade, I/O, and information views.
- Improved protection against consuming inputs when the corresponding output cannot be inserted.

## COMPATIBILITY

- Registered every Tiered Machinery recipe tagged `utilitycraft_workbench` with UtilityCraft's Crafter through DoriosLib.
- Requires UtilityCraft 3.5.0 or newer.
- Updated for the current DoriosCore and DoriosLib runtime used by UtilityCraft 3.5.0.
