This hotfix restores machine inventory interaction and improves item-transfer compatibility with UtilityCraft.

> [!WARNING]
> Requires UtilityCraft 3.6.1 or newer.

## BLOCKS

- **Tiered Machines**
    - Added a passive Default I/O mode that allows external transfers through the registered input and output slots without automatically moving items.
    - Disabled faces now block external item transfers as well as automatic I/O.

## UI/UX

- Updated I/O mode descriptions to distinguish Default from Disabled.
- Updated Quick Info labels while preserving each item's and block's addon attribution.

## BUG FIXES

- Fixed opening inventories on all 12 tiered machines after Minecraft's interaction changes; sneaking selects the block for mining.
- Fixed interface button presses being restored before their actions could be detected.
