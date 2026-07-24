// @ts-check

import * as DoriosLib from "DoriosLib/index.js";
import { EnergyStorage, Machine, registerIOInterface } from "DoriosCore/index.js";
import { crusherRecipes } from "../../config/recipes/crusher.js";
import { furnaceRecipes } from "../../config/recipes/furnace.js";
import { pressRecipes } from "../../config/recipes/press.js";

const DEFAULT_COST = 800;
const PROGRESS_TYPE = "progress_down_big_bar";

const RECIPES = Object.freeze({
  crusher: crusherRecipes,
  furnace: furnaceRecipes,
  presser: pressRecipes,
});

const MACHINE_TYPES = Object.freeze(["crusher", "electro_press", "incinerator"]);
const TIER_LAYOUTS = Object.freeze({
  basic: {
    inputSlots: range(3, 5),
    outputSlots: range(11, 13),
    ioButtonSlots: range(14, 19),
  },
  advanced: {
    inputSlots: range(3, 7),
    outputSlots: range(15, 19),
    ioButtonSlots: range(20, 25),
  },
  expert: {
    inputSlots: range(3, 9),
    outputSlots: range(19, 25),
    ioButtonSlots: range(26, 31),
  },
  ultimate: {
    inputSlots: range(3, 11),
    outputSlots: range(23, 31),
    ioButtonSlots: range(32, 37),
  },
});

/** @type {Map<string, RuntimeMachineConfig>} */
const runtimeConfigs = new Map();

/** @type {Map<string, SingleInputRecipes|undefined>} */
const recipeSources = new Map();

for (const [tier, layout] of Object.entries(TIER_LAYOUTS)) {
  for (const machineType of MACHINE_TYPES) {
    registerIOInterface(`utilitycraft:${tier}_${machineType}`, {
      items: {
        buttonSlots: layout.ioButtonSlots,
        anyInputSlots: layout.inputSlots,
        anyOutputSlots: layout.outputSlots,
        modes: [
          { id: "disabled" },
          { id: "input_1", inputSlots: layout.inputSlots },
          { id: "output_1", outputSlots: layout.outputSlots },
        ],
      },
    });
  }
}

DoriosLib.registry.blockComponent("utilitycraft:complex_machine", {
  /**
   * @param {import("@minecraft/server").BlockComponentPlayerPlaceBeforeEvent} event
   * @param {{ params: MachineSettings }} context
   */
  beforeOnPlayerPlace(event, { params: settings }) {
    const config = {
      ...settings,
      entity: {
        ...settings.entity,
        type: settings.entity.type ?? "machine",
      },
    };

    Machine.spawnEntity(event, config);
  },

  /**
   * @param {import("@minecraft/server").BlockComponentTickEvent} event
   * @param {{ params: MachineSettings }} context
   */
  onTick(event, { params: settings }) {
    const { block } = event;
    const machine = new Machine(block, settings);
    if (!machine.valid) return;
    if (!ensureInventorySize(machine, settings.entity.inventory_size)) return;

    const config = getRuntimeConfig(block.typeId, settings);
    const recipes = getRecipes(block);

    machine.processIO();

    let isWorking = false;
    let firstRecipeCost;
    const channelLines = ["§r§eSlot Information", ""];

    if (recipes) {
      for (const channel of config.channels) {
        const result = processChannel(machine, channel, recipes);

        isWorking ||= result.isWorking;
        firstRecipeCost ??= result.recipeCost;

        if (result.resetProgress) {
          if (machine.getProgress(channel.index) !== 0) {
            machine.setProgress(0, {
              slot: channel.progressSlot,
              type: PROGRESS_TYPE,
              index: channel.index,
              display: machine.shouldUpdateUI,
            });
          } else if (machine.shouldUpdateUI) {
            machine.displayProgress({
              slot: channel.progressSlot,
              type: PROGRESS_TYPE,
              index: channel.index,
            });
          }
        } else if (machine.shouldUpdateUI) {
          machine.displayProgress({
            slot: channel.progressSlot,
            type: PROGRESS_TYPE,
            index: channel.index,
          });
        }

        if (!machine.shouldUpdateUI) continue;

        if (result.warning) {
          channelLines.push(`§r§7${channel.index + 1}: §e${result.warning}`);
        } else if (result.outputTypeId) {
          channelLines.push(
            `§r§7${channel.index + 1}: ${DoriosLib.text.formatIdentifier(result.outputTypeId)} x${result.outputAmount}`,
          );
        }
      }
    } else {
      for (const channel of config.channels) {
        if (machine.getProgress(channel.index) !== 0) {
          machine.setProgress(0, {
            slot: channel.progressSlot,
            type: PROGRESS_TYPE,
            index: channel.index,
            display: machine.shouldUpdateUI,
          });
        } else if (machine.shouldUpdateUI) {
          machine.displayProgress({
            slot: channel.progressSlot,
            type: PROGRESS_TYPE,
            index: channel.index,
          });
        }
      }
    }

    const status = isWorking
      ? "§2Working"
      : !recipes
        ? "§eNo Recipes"
        : machine.energy.get() <= 0
          ? "§eNo Energy"
          : "§eIdle";

    if (isWorking) {
      machine.on();
    } else {
      machine.off();
    }

    if (!machine.shouldUpdateUI) return;

    const recipeCost = firstRecipeCost ?? settings.machine.energy_cost ?? DEFAULT_COST;
    const boosts = machine.boosts;
    const energy = machine.energy;
    const machineLines = [
      "§r§eMachine Information",
      `§r§7Status: ${status}`,
      "",
      `§r§aSpeed §7x${boosts.speed.toFixed(2)}`,
      `§r§aEfficiency §7${((1 / boosts.consumption) * 100).toFixed(0)}%`,
      `§r§aCost §7${EnergyStorage.formatEnergyToText(recipeCost * boosts.consumption)}`,
      "",
      "§r§eEnergy Information",
      "",
      `§r§bPercentage §f${Math.floor(energy.getPercent())}%`,
      `§r§bStored §f${EnergyStorage.formatEnergyToText(energy.get())}`,
      `§r§bCapacity §f${EnergyStorage.formatEnergyToText(energy.cap)}`,
      `§r§bRate §f${EnergyStorage.formatEnergyToText(Math.floor(machine.baseRate))}/t`,
    ];

    machine.setLabel(machineLines.join("\n"), 1);
    machine.setLabel(channelLines.join("\n"), 2);
    machine.displayEnergy();
  },

  onPlayerBreak(event) {
    Machine.onDestroy(event);
  },
});

/**
 * Processes one independent input -> progress -> output channel.
 *
 * @param {Machine} machine
 * @param {RuntimeChannel} channel
 * @param {SingleInputRecipes} recipes
 * @returns {ChannelResult}
 */
function processChannel(machine, channel, recipes) {
  const { inputSlot, outputSlot, index } = channel;
  const inputItem = machine.container.getItem(inputSlot);

  if (!inputItem) return { resetProgress: true, isWorking: false, warning: "No Input" };

  const recipe = recipes[inputItem.typeId];
  if (!recipe) return { resetProgress: true, isWorking: false, warning: "Invalid Recipe" };

  const outputItem = machine.container.getItem(outputSlot);
  if (outputItem && outputItem.typeId !== recipe.output) {
    return { resetProgress: true, isWorking: false, warning: "Output Conflict" };
  }

  const outputAmount = recipe.amount ?? 1;
  const requiredAmount = recipe.required ?? 1;
  const spaceLeft = (outputItem?.maxAmount ?? 64) - (outputItem?.amount ?? 0);

  if (outputAmount > spaceLeft) {
    return { resetProgress: true, isWorking: false, warning: "Output Full" };
  }
  if (inputItem.amount < requiredAmount) {
    return { resetProgress: true, isWorking: false, warning: `Needs ${requiredAmount} Items` };
  }

  const recipeCost = recipe.cost ?? DEFAULT_COST;
  const processBatch = Math.max(1, Math.floor(machine.boosts.process_batch));
  const consumption = machine.boosts.consumption;
  const maxCrafts = Math.floor(Math.min(spaceLeft / outputAmount, inputItem.amount / requiredAmount));

  if (machine.getEnergyCost(index) !== recipeCost) {
    machine.setEnergyCost(recipeCost, index);
  }

  let progress = machine.getProgress(index);
  const maxProgress = Math.ceil(maxCrafts / processBatch) * recipeCost;
  const progressCapacity = Math.max(0, maxProgress - progress);
  const energyConsumed = Math.min(
    machine.energy.get(),
    machine.rate,
    progressCapacity * consumption,
  );

  if (energyConsumed > 0) {
    machine.energy.consume(energyConsumed);
    progress += energyConsumed / consumption;
    machine.setProgress(progress, { index, display: false });
  }

  const completedBatches = Math.floor(progress / recipeCost);
  const craftCount = Math.min(completedBatches * processBatch, maxCrafts);

  if (craftCount > 0) {
    const producedAmount = craftCount * outputAmount;

    if (outputItem) {
      DoriosLib.entity.changeItemAmount(machine.entity, { slot: outputSlot, amount: producedAmount });
    } else {
      DoriosLib.entity.setNewItem(machine.entity, {
        slot: outputSlot,
        typeId: recipe.output,
        amount: producedAmount,
      });
    }

    const completedCost = Math.ceil(craftCount / processBatch) * recipeCost;
    progress -= completedCost;
    machine.setProgress(progress, { index, display: false });
    DoriosLib.entity.changeItemAmount(machine.entity, {
      slot: inputSlot,
      amount: -(craftCount * requiredAmount),
    });
  }

  return {
    resetProgress: false,
    isWorking: energyConsumed > 0 || craftCount > 0,
    warning: energyConsumed <= 0 && craftCount <= 0 && machine.energy.get() <= 0 ? "No Energy" : undefined,
    recipeCost,
    outputTypeId: recipe.output,
    outputAmount,
  };
}

/**
 * @param {string} blockTypeId
 * @param {MachineSettings} settings
 * @returns {RuntimeMachineConfig}
 */
function getRuntimeConfig(blockTypeId, settings) {
  const cached = runtimeConfigs.get(blockTypeId);
  if (cached) return cached;

  const inputSlots = expandSlots(settings.entity.input_slots);
  const progressSlots = expandSlots(settings.entity.progress_slots);
  const outputSlots = expandSlots(settings.entity.output_slots);
  const channelCount = Math.min(inputSlots.length, progressSlots.length, outputSlots.length);

  if (channelCount === 0 || inputSlots.length !== progressSlots.length || inputSlots.length !== outputSlots.length) {
    console.warn(`[Tiered Machinery] Invalid channel layout for ${blockTypeId}`);
  }

  const config = {
    channels: Array.from({ length: channelCount }, (_, index) => ({
      index,
      inputSlot: inputSlots[index],
      progressSlot: progressSlots[index],
      outputSlot: outputSlots[index],
    })),
  };

  runtimeConfigs.set(blockTypeId, config);
  return config;
}

/**
 * Expands entities created by the legacy runtime so existing placed machines
 * gain the six slots reserved by the new per-face I/O interface.
 *
 * @param {Machine} machine
 * @param {number} expectedSize
 * @returns {boolean}
 */
function ensureInventorySize(machine, expectedSize) {
  if (machine.container.size >= expectedSize) return true;

  try {
    machine.entity.triggerEvent(`utilitycraft:inventory_${expectedSize}`);
  } catch {}

  return false;
}

/**
 * @param {import("@minecraft/server").Block} block
 * @returns {SingleInputRecipes|undefined}
 */
function getRecipes(block) {
  if (recipeSources.has(block.typeId)) return recipeSources.get(block.typeId);

  const params = block.getComponent("utilitycraft:machine_recipes")?.customComponentParameters?.params;
  const recipes = params?.type ? RECIPES[params.type] : params;
  recipeSources.set(block.typeId, recipes);
  return recipes;
}

/** @param {number} start @param {number} end @returns {number[]} */
function range(start, end) {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

/**
 * Expands an inclusive two-number range while preserving explicit slot lists.
 *
 * @param {number[]|undefined} slots
 * @returns {number[]}
 */
function expandSlots(slots) {
  if (!Array.isArray(slots)) return [];
  if (slots.length !== 2) return [...slots];
  return range(slots[0], slots[1]);
}

/**
 * @typedef {Object} RuntimeChannel
 * @property {number} index
 * @property {number} inputSlot
 * @property {number} progressSlot
 * @property {number} outputSlot
 */

/** @typedef {{ channels: RuntimeChannel[] }} RuntimeMachineConfig */

/**
 * @typedef {Object} ChannelResult
 * @property {boolean} resetProgress
 * @property {boolean} isWorking
 * @property {string} [warning]
 * @property {number} [recipeCost]
 * @property {string} [outputTypeId]
 * @property {number} [outputAmount]
 */
