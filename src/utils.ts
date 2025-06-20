/**
 * 工具函数集合
 */

import { GridContainer } from "./gridContainer";
import { Inventory } from "./invntory";
import { Item } from "./item";
import { Region } from "./region";
import { Subgrid } from "./subgrid";
import { TotalValueDisplay } from "./totalValueDisplay";

/**
 * 生成指定范围内的随机整数
 * @param min 最小值
 * @param max 最大值
 * @returns 随机整数
 */
export const getRandomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * 为一个 inventory 初始化一些物资
 * @param inventory 待初始化的 inventory
 * @param type 0 为普通容器，1 为玩家盒子
 * @returns 
 */
export const initInventory = (inventory: Inventory, type: number=0, preset_infos: any | null = null) => {
    if (preset_infos) {
        for (const preset of preset_infos.content) {
            const grid = inventory.contents[preset.title];
            // console.log(grid)
            for (const item_info of preset.content) {
                const item_name = item_info.name;
                const item_type = window.game.itemManager.getItemInfoByName(item_name);
                if (item_type) {
                    if (grid instanceof Subgrid) {
                        const item = new Item(item_type);
                        if(item_type.subgridLayout) {
                            item.subgridLayout = item_type.subgridLayout;
                        }
                        grid.addItem(item, 0, 0);
                        if (item_info.ammo) {
                            for (const ammoObject of item_info.ammo) {
                                item.ammo[ammoObject.name] = ammoObject.stack
                            }
                        }
                        if (item_info.accessories) {
                            for (const accessory of item_info.accessories) {
                                // const accessory_type = item_infos.find(i => i.name === accessory.name);
                                const accessory_type = window.game.itemManager.getItemInfoByName(accessory.name);
                                // console.log('bbb\n', accessory, accessory_type)
                                const gun_subgrid_name = Object.keys(item.subgrids).find(
                                    key => item.subgrids[key].acceptedTypes.includes(accessory_type.type) &&
                                    item.subgrids[key].blocks.length === 0
                                );
                                if (!gun_subgrid_name) {
                                    continue;
                                }
                                const gun_subgrid = item.subgrids[gun_subgrid_name];
                                // console.log('aaa\n', gun_subgrid, accessory_type)
                                if (gun_subgrid) {
                                    const accessory_item = new Item(accessory_type);
                                    gun_subgrid.addItem(accessory_item, 0, 0);
                                }
                            }
                            // console.log(item_info, item)
                        }
                        if (item_info.stack) {
                            item.currentStactCount = item_info.stack;
                        }
                        item.refreshUI();
                    } else if (grid instanceof GridContainer) {
                        const item_position = item_info.position;
                        const subgrid = grid.subgrids[item_position[0]];
                        const item = new Item(item_type);
                        if(item_type.subgridLayout) {
                            item.subgridLayout = item_type.subgridLayout;
                        }
                        const pos_x = item_position[1];
                        const pos_y = item_position[2];
                        if (item_position[3] === 1) {
                            const tmp = item.cellWidth;
                            item.cellWidth = item.cellHeight;
                            item.cellHeight = tmp;
                        }
                        subgrid.addItem(item, pos_y, pos_x);
                        if (item_info.ammo) {
                            for (const ammoObject of item_info.ammo) {
                                item.ammo[ammoObject.name] = ammoObject.stack
                            }
                        }
                        if (item_info.accessories) {
                            for (const accessory of item_info.accessories) {
                                // const accessory_type = item_infos.find(i => i.name === accessory.name);
                                const accessory_type = window.game.itemManager.getItemInfoByName(accessory.name);
                                const gun_subgrid = item.subgrids['accessory_type.type'];
                                if (gun_subgrid) {
                                    const accessory_item = new Item(accessory_type);
                                    gun_subgrid.addItem(accessory_item, 0, 0);
                                }
                            }
                        }
                        if (item_info.stack) {
                            item.currentStactCount = item_info.stack;
                        }
                        item.refreshUI();
                    }
                }
            }
        }
        return;
    }

    // console.log('1111', type)
    if (type === 0) {
        // Spoils box
        const subgrid = inventory.contents['spoilsBox'] as Subgrid;
        const blocksNum = Math.floor(Math.random() * 10) + 1; // 随机生成0到9个方块
        let items = [];
        for (let i = 0; i < blocksNum; i++) {
            const info = window.game.itemManager.getRandomItemWithPreset('default');
            items.push(info);
        }

        for (let row = 0; row < 7; row++) {
            for (let col = 0; col < 8; col++) {
                // console.log('ddd', items.length)
                if(items.length === 0) {
                    return;
                }
                const info = items[0];
                const checkSize = {
                    cellWidth: info.length,
                    cellHeight: info.width,
                    col: col,
                    row: row,
                }
                const bOverlap = subgrid.checkForOverlap(checkSize, col, row);
                const bBoundary = subgrid.checkBoundary(checkSize, col, row);
                // console.log('eee', bOverlap, bBoundary)
                if (!bOverlap && bBoundary) {
                    // console.log("aaa", blockType, item);
                    // 使用 Block 类创建方块
                    const block = new Item(info);
                    if(info.subgridLayout) {
                        block.subgridLayout = info.subgridLayout;
                    }
                    subgrid.addItem(block, col, row);

                    items.shift(); // 移除已放置的方块类型
                    if (items.length === 0) {
                        // console.log(this.blocks);
                        return;
                    }
                }
            }
        }
    } else {
        // TODO
        const tasks1 = [
            {
                type: 'primaryWeapon',
                grades: [1, 0, 0, 0, 0, 0, 0, 0],
                subgrid: 'PrimaryWeapon1',
                probability: 0.9,
            },
            {
                type: 'secondaryWeapon',
                grades: [1, 0, 0, 0, 0, 0, 0, 0],
                subgrid: 'Secondary',
                probability: 0.3,
            },
            {
                type: 'primaryWeapon',
                grades: [1, 0, 0, 0, 0, 0, 0, 0],
                subgrid: 'PrimaryWeapon2',
                probability: 0.6,
            },
            {
                type: 'helmet',
                grades: [0, 0.1, 0.1, 0.3, 0.3, 0.15, 0.05, 0],
                subgrid: 'Helmet',
                probability: 0.7,
            },
            {
                type: 'armor',
                grades: [0, 0.1, 0.1, 0.3, 0.3, 0.15, 0.05, 0],
                subgrid: 'Armor',
                probability: 0.9,
            },
            {
                type: 'chestRigs',
                grades: [0, 0.1, 0.2, 0.2, 0.4, 0.1, 0, 0],
                subgrid: 'ChestRig',
                probability: 1,
            },
            {
                type: 'backpack',
                grades: [0, 0.1, 0.2, 0.2, 0.3, 0.1, 0.1, 0],
                subgrid: 'Backpack',
                probability: 1,
            },
        ]
        for (const task of tasks1) {
            if (Math.random() < task.probability) {
                const subgrid = inventory.contents[task.subgrid] as Subgrid;
                const probObject: { [key: string]: { prob: number, grades: number[] } } = {};
                probObject[task.type] = {
                    prob: 1,
                    grades: task.grades
                }
                const info = window.game.itemManager.getRandomItem(probObject);
                // console.log(probObject)
                const item = new Item(info);
                // console.log(subgrid)
                // console.log(task)
                // if (info.primaryClass === 'gun') {
                //     console.log(info, inventory.title, item)
                // }
                subgrid.addItem(item);
                // if (info.primaryClass === 'gun') {
                //     console.log(info, 'added')
                // }
            }
        }
        // 口袋、背包、胸挂特殊处理
        const tasks2 = [
            {
                type: 'pocket',
                container: 'pocket',
                stop_probability: 0.12,
                prerequisite: null,
            },
            {
                type: 'chestRigs',
                container: 'ContainerChestRigs',
                stop_probability: 0.08,
                prerequisite: 'ChestRig',
            },
            {
                type: 'backpack',
                container: 'ContainerBackpack',
                stop_probability: 0.1,
                prerequisite: 'Backpack',
            },
        ];
        for (const task of tasks2) {
            while(true) {
                if (Math.random() < task.stop_probability) {
                    break;
                }
                if (task.prerequisite && !inventory.contents[task.prerequisite]) {
                    break;
                }
                const gridContainer = inventory.contents[task.container] as GridContainer;
                const info = window.game.itemManager.getRandomItemWithPreset('default');
                // console.log('info', task.type, info, gridContainer);
                const item = new Item(info);
                gridContainer.addItem(item);
            }
        }
    }
}

export const updateTotalValueDisplay = () => {
    if(!window.game.playerRegion) return;
    if(!window.game.playerRegion.components['totalValueDisplay']) return;
    const totalValueDisplay = window.game.playerRegion.components['totalValueDisplay'] as TotalValueDisplay;
    totalValueDisplay.updateTotalValue();
}

export const initSpoilsRegion = (position: {x: number, y: number}, presets: any | null = null) => {
    const region = new Region(position, {
        title: "战利品",
        width: 508,
        height: 632,
        titleColor: 0xff0000,
        titleAlpha: 0.3,
        componentWidth: 0,
        backgroundColor: 0xffffff,
        backgroundAlpha: 0.1,
        countable: false,
    });
    if (presets) {
        // console.log(presets)
        for ( const preset of presets.data) {
            const inventory_type = preset.type === 'playerContainer' ? 1 : 0;
            const inventory = region.addInventory(inventory_type, false);
            initInventory(inventory, inventory_type, preset);
            inventory.setEnabled(false);
        }
    } else {
        for (let i = 0; i < window.game.defaultSpoilsRegionNumber; i += 1) {
            region.addInventory(0, true);
        }
        for (let i = 0; i < window.game.defaultPlayerRegionNumber; i += 1) {
            region.addInventory(1, true);
        }
    }
    region.switchTo(0);
    region.addSwitcherUI();

    return region;
}