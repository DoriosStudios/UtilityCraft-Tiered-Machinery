import { mkdir, writeFile } from "node:fs/promises";

const UI_DIRECTORY = new URL("../RP/ui/", import.meta.url);

const MACHINES = Object.freeze({
  crusher: {
    info: "ui.utilitycraft:info.tiered.crusher",
    textureFolder: "crusher",
  },
  electro_press: {
    info: "ui.utilitycraft:info.tiered.electro_press",
    textureFolder: "electro_press",
  },
  incinerator: {
    info: "ui.utilitycraft:info.tiered.incinerator",
    textureFolder: "incinerator",
  },
});

const TIERS = Object.freeze({
  basic: {
    inputSlots: range(3, 5),
    progressSlots: range(8, 10),
    outputSlots: range(11, 13),
    upgradeSlots: [6, 7],
    ioSlots: range(14, 19),
    offsets: [-14, 10, 34],
  },
  advanced: {
    inputSlots: range(3, 7),
    progressSlots: range(10, 14),
    outputSlots: range(15, 19),
    upgradeSlots: [8, 9],
    ioSlots: range(20, 25),
    offsets: [-38, -14, 10, 34, 58],
  },
  expert: {
    inputSlots: range(3, 9),
    progressSlots: range(12, 18),
    outputSlots: range(19, 25),
    upgradeSlots: [10, 11],
    ioSlots: range(26, 31),
    offsets: [-59, -36, -13, 10, 33, 56, 79],
  },
  ultimate: {
    inputSlots: range(3, 11),
    progressSlots: range(14, 22),
    outputSlots: range(23, 31),
    upgradeSlots: [12, 13],
    ioSlots: range(32, 37),
    offsets: [-62, -44, -26, -8, 10, 28, 46, 64, 82],
  },
});

await mkdir(UI_DIRECTORY, { recursive: true });

const uiDefinitions = [];
const chestVariables = [];

for (const [tier, layout] of Object.entries(TIERS)) {
  for (const [machine, definition] of Object.entries(MACHINES)) {
    const namespace = `${tier}_${machine}`;
    const fileName = `${namespace}.json`;

    await writeJson(new URL(fileName, UI_DIRECTORY), createMachineUi(namespace, tier, machine, definition, layout));
    uiDefinitions.push(`ui/${fileName}`);
    chestVariables.push({
      requires: `($temp_container_title = 'entity.utilitycraft:${namespace}.name')`,
      $screen_content: `${namespace}.utility_panel`,
      $screen_bg_content: "common.screen_background",
    });
  }
}

await writeJson(new URL("_ui_defs.json", UI_DIRECTORY), { ui_defs: uiDefinitions });
await writeJson(new URL("chest_screen.json", UI_DIRECTORY), {
  namespace: "chest",
  small_chest_screen: {
    "$temp_container_title|default": "$container_title",
    modifications: chestVariables.map((value) => ({
      array_name: "variables",
      operation: "insert_back",
      value: [value],
    })),
  },
});

function createMachineUi(namespace, tier, machine, definition, layout) {
  const controls = [
    {
      "machine_name@uc.machine_name": {
        offset: [0, -2],
      },
    },
    {
      "panel@uc.machine_side_panel": {},
    },
    {
      "machine_label@uc.text_label": {
        collection_index: 1,
        anchor_from: "top_left",
        anchor_to: "top_left",
        size: [74, 70],
        $text_scale: 0.55,
        offset: [-78, 2],
      },
    },
    {
      "channels_label@uc.text_label": {
        collection_index: 2,
        anchor_from: "top_left",
        anchor_to: "top_left",
        size: [74, 78],
        $text_scale: 0.55,
        offset: [-78, 80],
      },
    },
  ];

  for (const [index, offset] of layout.offsets.entries()) {
    controls.push({
      "item@uc.input_slot": {
        anchor_from: "top_middle",
        anchor_to: "top_middle",
        offset: [offset, 9],
        collection_index: layout.inputSlots[index],
      },
    });
  }

  for (const [index, offset] of layout.offsets.entries()) {
    controls.push({
      "machinery@uc.progress_display": {
        anchor_from: "top_middle",
        anchor_to: "top_middle",
        offset: [offset, 22],
        collection_index: layout.progressSlots[index],
      },
    });
  }

  for (const [index, offset] of layout.offsets.entries()) {
    controls.push({
      "item@uc.input_slot": {
        anchor_from: "top_middle",
        anchor_to: "top_middle",
        offset: [offset, 51],
        collection_index: layout.outputSlots[index],
        $slot_background_texture: "textures/ui/slots/output_1_slot",
      },
    });
  }

  const textureRoot = `textures/blocks/${definition.textureFolder}/${tier}_${machine}_off`;
  controls.push(
    {
      "upgrades_tab@uc.upgrades_tab": {
        $upgrade_index_1: layout.upgradeSlots[0],
        $upgrade_index_2: layout.upgradeSlots[1],
      },
    },
    {
      "io_tab@uc.io_tab": {
        $io_items_modes_description: "ui.utilitycraft:io.tiered_machine.items",
        $io_top_texture: `${textureRoot}_up`,
        $io_left_texture: `${textureRoot}_west`,
        $io_front_texture: `${textureRoot}_north`,
        $io_right_texture: `${textureRoot}_east`,
        $io_bottom_texture: `${textureRoot}_down`,
        $io_back_texture: `${textureRoot}_south`,
        $io_item_top_index: layout.ioSlots[0],
        $io_item_left_index: layout.ioSlots[1],
        $io_item_front_index: layout.ioSlots[2],
        $io_item_right_index: layout.ioSlots[3],
        $io_item_bottom_index: layout.ioSlots[4],
        $io_item_back_index: layout.ioSlots[5],
      },
    },
    {
      "info_tab@uc.info_tab": {
        $info_description: definition.info,
      },
    },
    {
      "energy_bar@uc.energy_bar": {
        offset: [97, 64],
        $bar_bg_texture: "textures/ui/toggle_button/right_bg",
      },
    },
  );

  return {
    namespace,
    [`${namespace}_top`]: {
      type: "collection_panel",
      anchor_from: "center",
      anchor_to: "center",
      size: [162, 72],
      offset: [-10, -40],
      collection_name: "container_items",
      $item_collection_name: "container_items",
      controls,
    },
    utility_panel: {
      type: "panel",
      controls: [
        { "container_gamepad_helpers@common.container_gamepad_helpers": {} },
        { "flying_item_renderer@common.flying_item_renderer": { layer: 40 } },
        { "selected_item_details_factory@common.selected_item_details_factory": {} },
        { "item_lock_notification_factory@common.item_lock_notification_factory": {} },
        {
          "root_panel@common.root_panel": {
            layer: 1,
            controls: [
              { "common_panel@common.common_panel": {} },
              {
                chest_panel: {
                  type: "panel",
                  layer: 5,
                  controls: [
                    { [`${namespace}_top@${namespace}.${namespace}_top`]: {} },
                    { "inventory_panel_bottom_half_with_label@common.inventory_panel_bottom_half_with_label": {} },
                    { "hotbar_grid@common.hotbar_grid_template": {} },
                    { "inventory_take_progress_icon_button@common.inventory_take_progress_icon_button": {} },
                  ],
                },
              },
              { "inventory_selected_icon_button@common.inventory_selected_icon_button": {} },
              { "gamepad_cursor@common.gamepad_cursor_button": {} },
            ],
          },
        },
      ],
    },
  };
}

function range(start, end) {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

async function writeJson(url, value) {
  await writeFile(url, `${JSON.stringify(value, null, 2)}\n`);
}
