import * as DoriosLib from "DoriosLib/index.js";

/**
 * Registers every Tiered Machinery recipe tagged `utilitycraft_workbench`
 * with UtilityCraft's Crafter through the shared DoriosLib registry.
 */
const crafterRecipeBatches = [
  {
    "steel_plate,advanced_chip,steel_plate,advanced_chip,basic_crusher,advanced_chip,energized_iron_plate,redstone_block,energized_iron_plate": {
      output: "utilitycraft:advanced_crusher",
      amount: 1,
    },
    "steel_ingot,basic_chip,steel_ingot,basic_chip,crusher,basic_chip,iron_ingot,redstone_block,iron_ingot": {
      output: "utilitycraft:basic_crusher",
      amount: 1,
    },
    "steel_plate,expert_chip,steel_plate,expert_chip,advanced_crusher,expert_chip,diamond_dust,redstone_block,diamond_dust": {
      output: "utilitycraft:expert_crusher",
      amount: 1,
    },
    "steel_plate,ultimate_chip,steel_plate,ultimate_chip,expert_crusher,ultimate_chip,netherite_plate,redstone_block,netherite_plate": {
      output: "utilitycraft:ultimate_crusher",
      amount: 1,
    },
    "steel_plate,advanced_chip,steel_plate,advanced_chip,basic_electro_press,advanced_chip,energized_iron_plate,redstone_block,energized_iron_plate": {
      output: "utilitycraft:advanced_electro_press",
      amount: 1,
    },
    "steel_ingot,basic_chip,steel_ingot,basic_chip,electro_press,basic_chip,iron_ingot,redstone_block,iron_ingot": {
      output: "utilitycraft:basic_electro_press",
      amount: 1,
    },
    "steel_plate,expert_chip,steel_plate,expert_chip,advanced_electro_press,expert_chip,diamond_dust,redstone_block,diamond_dust": {
      output: "utilitycraft:expert_electro_press",
      amount: 1,
    },
    "steel_plate,ultimate_chip,steel_plate,ultimate_chip,expert_electro_press,ultimate_chip,netherite_plate,redstone_block,netherite_plate": {
      output: "utilitycraft:ultimate_electro_press",
      amount: 1,
    },
    "steel_plate,advanced_chip,steel_plate,advanced_chip,basic_incinerator,advanced_chip,energized_iron_plate,redstone_block,energized_iron_plate": {
      output: "utilitycraft:advanced_incinerator",
      amount: 1,
    },
    "steel_ingot,basic_chip,steel_ingot,basic_chip,incinerator,basic_chip,iron_ingot,redstone_block,iron_ingot": {
      output: "utilitycraft:basic_incinerator",
      amount: 1,
    },
    "steel_plate,expert_chip,steel_plate,expert_chip,advanced_incinerator,expert_chip,diamond_dust,redstone_block,diamond_dust": {
      output: "utilitycraft:expert_incinerator",
      amount: 1,
    },
    "steel_plate,ultimate_chip,steel_plate,ultimate_chip,expert_incinerator,ultimate_chip,netherite_plate,redstone_block,netherite_plate": {
      output: "utilitycraft:ultimate_incinerator",
      amount: 1,
    },
  },
];

for (const batch of crafterRecipeBatches) {
  DoriosLib.registry.registerCrafterRecipe(batch);
}

