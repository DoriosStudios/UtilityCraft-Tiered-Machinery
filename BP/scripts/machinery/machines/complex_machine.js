import { Machine, EnergyStorage } from 'DoriosCore/index.js'
import { crusherRecipes } from "../../config/recipes/crusher.js";
import { furnaceRecipes } from "../../config/recipes/furnace.js";
import { pressRecipes } from "../../config/recipes/press.js";

const UTILITYCRAFT_RECIPES = {
    'crusher': crusherRecipes,
    'furnace': furnaceRecipes,
    'presser': pressRecipes
}

const DEFAULT_COST = 800
const PROGRESS_TYPE = "progress_down_big_bar"

DoriosAPI.register.blockComponent('complex_machine', {
    /**
     * Runs before the machine is placed by the player.
     * 
     * @param {import('@minecraft/server').BlockComponentPlayerPlaceBeforeEvent} e
     * @param {{ params: MachineSettings }} ctx
     */
    beforeOnPlayerPlace(e, { params: settings }) {
        const config = settings
        config.entity.input_range = settings.entity.input_slots
        config.entity.output_range = settings.entity.output_slots
        config.entity.type = "machine"
        Machine.spawnEntity(e, config, () => {
            const machine = new Machine(e.block, { ...config, ignoreTick: true });
            machine.entity.setItem(1, 'utilitycraft:progress_down_big_bar_00', 1, " ")
            machine.entity.setItem(2, 'utilitycraft:progress_down_big_bar_00', 1, " ")
            // Progress Bars
            const PROGRESS_SLOTS = expandRange(settings.entity.progress_slots)
            PROGRESS_SLOTS.forEach(slot => {
                machine.entity.setItem(slot, 'utilitycraft:progress_down_big_bar_00')
            })
        });
    },

    /**
     * Executes each tick for the machine.
     * 
     * @param {import('@minecraft/server').BlockComponentTickEvent} e
     * @param {{ params: MachineSettings }} ctx
     */
    onTick(e, { params: settings }) {
        const machine = new Machine(e.block, settings);
        if (!machine.valid) return

        const INPUT_SLOTS = expandRange(settings.entity.input_slots)
        const PROGRESS_SLOTS = expandRange(settings.entity.progress_slots)
        const OUTPUT_SLOTS = expandRange(settings.entity.output_slots)
        const shouldUpdateUI = machine.shouldUpdateUI

        if (machine.hasOutputItems()) {
            machine.transferItems()
        }

        const recipesComponent = e.block.getComponent("utilitycraft:machine_recipes")?.customComponentParameters?.params
        let recipes;
        if (recipesComponent.type) {
            recipes = UTILITYCRAFT_RECIPES[recipesComponent.type]
        } else {
            recipes = recipesComponent
        }

        let status = "§ePaused"
        let on = false
        const slotsLabel = shouldUpdateUI ? [
            ``,
            `§r§eSlots Information`,
            ``
        ] : undefined

        const energy = machine.energy
        if (recipes && energy.get() > 0) {
            for (let index = 0; index < INPUT_SLOTS.length; index++) {
                const slotConfig = {
                    input_slot: INPUT_SLOTS[index],
                    output_slot: OUTPUT_SLOTS[index]
                }
                const slotData = processSlot(machine, slotConfig, recipes, index)
                // Machine State
                if (slotData.on) on = true
                // Progress Handling
                if (slotData.resetProgress) {
                    if (machine.getProgress(index) !== 0) {
                        machine.setProgress(0, { slot: PROGRESS_SLOTS[index], type: PROGRESS_TYPE, index: index, display: shouldUpdateUI })
                    } else if (shouldUpdateUI) {
                        machine.displayProgress({ slot: PROGRESS_SLOTS[index], type: PROGRESS_TYPE, index: index })
                    }
                } else if (shouldUpdateUI) {
                    machine.displayProgress({ slot: PROGRESS_SLOTS[index], type: PROGRESS_TYPE, index: index })
                }
                // Recipe label
                const recipe = slotData.recipe
                if (slotData.warning) {
                    if (shouldUpdateUI) {
                        slotsLabel.push(`§r§7${index + 1}: ${slotData.warning}`)
                    }
                } else if (recipe) {
                    const recipeCost = recipe.cost ?? 800
                    machine.setEnergyCost(recipeCost, index)

                    if (shouldUpdateUI) {
                        const outputName = DoriosAPI.utils.formatIdToText(recipe.output)
                        const outputAmount = recipe.amount ?? 1
                        slotsLabel.push(`§r§7${index + 1}: ${outputName} x${outputAmount}`)
                    }
                }
            }
        } else {
            status = "§eNo Recipes"
        }

        if (on) {
            status = "§2Working"
            machine.on()
        } else {
            if (energy.get() <= 0) {
                status = "§eNo Energy"
            } else {
                status = "§eIdle"
            }
            machine.off()
        }

        if (shouldUpdateUI) {
            const boosts = machine.boosts
            const infoLabel = [
                `§r§eMachine Information`,
                `§7Status: §2${status}`,
                "",
                `§aSpeed §7x${boosts.speed.toFixed(2)}`,
                `§aEfficiency §7${((1 / boosts.consumption) * 100).toFixed(0)}%%`,
                `§aCost §7${EnergyStorage.formatEnergyToText(machine.getEnergyCost() * boosts.consumption)}`,
                "",
                `§r§eEnergy Information`,
                "",
                `§bPercentage §f${Math.floor(energy.getPercent())}%%`,
                `§bStored §f${EnergyStorage.formatEnergyToText(energy.get())}`,
                `§bCapacity §f${EnergyStorage.formatEnergyToText(energy.cap)}`,
                `§bRate §f${EnergyStorage.formatEnergyToText(Math.floor(machine.baseRate))}/t`,
            ];

            machine.setLabel([infoLabel.join('\n'), slotsLabel.join('\n')], 1)
            machine.displayEnergy();
        }
    },

    onPlayerBreak(e) {
        Machine.onDestroy(e);
    }
});

/**
 * Processes a single machine slot configuration.
 *
 * This function handles the full processing logic for one logical channel
 * of a machine (input → progress → output).
 *
 * Responsibilities may include:
 * - Validating input item against provided recipes.
 * - Checking output compatibility and available space.
 * - Handling energy consumption.
 * - Managing progress accumulation and completion.
 * - Producing output and consuming input when craft completes.
 *
 * Designed to support multi-line machines (3, 5, 7, 9+ channels),
 * where each channel is processed independently per tick.
 *
 * @param {Machine} machine Instance of the Machine class handling energy, progress, and inventory logic.
 * @param {{ 
 *   input_slot: number, 
 *   progress_slot: number, 
 *   output_slot: number 
 * }} slotConfig Slot configuration object defining the inventory indices used by this processing channel.
 * 
 * @param {Object.<string, {
 *   output: string,
 *   amount?: number,
 *   required?: number,
 *   cost?: number
 * }>} recipes Recipe map where:
 *   - key → input item typeId
 *   - value → recipe configuration object
 * @param {Number} index Slot index.
 *
 * @returns {{
 *   warning: String,
 *   recipe?: Object,
 *   resetProgress?: boolean,
 *   on?: boolean
 * }} Result object describing the state of this processing channel after execution.
 */
function processSlot(machine, slotConfig, recipes, index) {
    const inv = machine.container;
    const { input_slot, output_slot } = slotConfig

    // Get the input slot (slot 3 in this case)
    const inputItem = inv.getItem(input_slot);
    if (!inputItem) {
        return { resetProgress: true, warning: "No Input" }
    }

    // Validate recipe based on the input item
    const recipe = recipes[inputItem?.typeId];
    if (!recipe) {
        return { resetProgress: true, warning: "No Recipe" }
    }

    // Get the output slot (usually the last one)
    const outputItem = inv.getItem(output_slot);
    // Output slot must either match the recipe result or be empty
    if (outputItem && outputItem.typeId !== recipe.output) {
        return { resetProgress: true, warning: "Output Conflic", recipe: recipe }
    }

    // Check how many items can still fit in the output slot
    const spaceLeft = (outputItem?.maxAmount ?? 64) - (outputItem?.amount ?? 0);
    const recipeAmount = recipe.amount ?? 1
    if (recipeAmount > spaceLeft) {
        return { resetProgress: true, warning: "Output Full", recipe: recipe }
    }

    // Check if there are enough items in the input slot
    const required = recipe.required ?? 1;
    if (inputItem.amount < required) {
        return { resetProgress: true, warning: "Missing Input", recipe: recipe }
    }

    let progress = machine.getProgress(index);
    const energyCost = recipe.cost ?? DEFAULT_COST;

    const maxAmountToCraft = Math.floor(Math.min(spaceLeft / recipeAmount, inputItem.amount / required))
    const consumption = machine.boosts.consumption
    const maxProgress = maxAmountToCraft * energyCost;
    const progressCapacity = Math.max(0, maxProgress - progress);
    const energyToConsume = Math.min(machine.energy.get(), machine.rate, progressCapacity * consumption);

    if (energyToConsume > 0) {
        machine.energy.consume(energyToConsume);
        progress += energyToConsume / consumption;
        machine.setProgress(progress, { display: false, index });
    }

    const processCount = Math.min(
        Math.floor(progress / energyCost),
        maxAmountToCraft
    );
    if (processCount > 0) {
        // Add the processed items to the output
        if (!outputItem) {
            machine.entity.setItem(output_slot, recipe.output, processCount * recipeAmount);
        } else {
            machine.entity.changeItemAmount(output_slot, processCount * recipeAmount);
        }

        // Deduct progress and input items while preserving leftover progress.
        progress -= processCount * energyCost;
        machine.setProgress(progress, { display: false, index });
        machine.entity.changeItemAmount(input_slot, -processCount * required);
    }

    return { on: true, recipe: recipe }
}

function expandRange(rangeArray) {
    if (!Array.isArray(rangeArray)) return [];

    // Caso normal (ya es lista expandida)
    if (rangeArray.length > 2) return rangeArray;

    const [start, end] = rangeArray;

    if (start === undefined || end === undefined) return rangeArray;

    const result = [];
    for (let i = start; i <= end; i++) {
        result.push(i);
    }

    return result;
}
