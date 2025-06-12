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
    const item_infos = window.game.BLOCK_TYPES;
    if (preset_infos) {
        for (const preset of preset_infos.content) {
            const grid = inventory.contents[preset.title];
            // console.log(grid)
            for (const item_info of preset.content) {
                const item_name = item_info.name;
                const item_type = item_infos.find(item => item.name === item_name);
                if (item_type) {
                    if (grid instanceof Subgrid) {
                        const item = new Item(
                            window.game,
                            grid,
                            item_type.type,
                            item_type,
                        );
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
                                const accessory_type = item_infos.find(i => i.name === accessory.name);
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
                                    const accessory_item = new Item(
                                        window.game,
                                        gun_subgrid,
                                        accessory_type.type,
                                        accessory_type
                                    );
                                    gun_subgrid.addItem(accessory_item, 0, 0);
                                }
                            }
                            console.log(item_info, item)
                        }
                        if (item_info.stack) {
                            item.currentStactCount = item_info.stack;
                        }
                        item.refreshUI();
                    } else if (grid instanceof GridContainer) {
                        const item_position = item_info.position;
                        const subgrid = grid.subgrids[item_position[0]];
                        const item = new Item(
                            window.game,
                            subgrid,
                            item_type.type,
                            item_type
                        );
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
                                const accessory_type = item_infos.find(i => i.name === accessory.name);
                                const gun_subgrid = item.subgrids['accessory_type.type'];
                                if (gun_subgrid) {
                                    const accessory_item = new Item(
                                        window.game,
                                        gun_subgrid,
                                        accessory_type.type,
                                        accessory_type
                                    );
                                    gun_subgrid.addItem(accessory_item, 0, 0);
                                }
                            }
                        }
                        if (item_info.stack) {
                            item.currentStactCount = item_info.stack;
                        }
                    }
                }
            }
        }
        return;
    }

    if (type === 0) {
        // Spoils box
        const subgrid = inventory.contents['spoilsBox'] as Subgrid;
        const blocksNum = Math.floor(Math.random() * 10); // 随机生成0到9个方块
        let items = [];
        for (let i = 0; i < blocksNum; i++) {
            const info = item_infos[Math.floor(Math.random() * item_infos.length)];
            items.push(info);
        }

        for (let row = 0; row < 7; row++) {
            for (let col = 0; col < 8; col++) {
                // console.log('ddd', items.length)
                if(items.length === 0) {
                    return;
                }
                const info = items[0];
                const bOverlap = subgrid.checkForOverlap(info, col, row);
                const bBoundary = subgrid.checkBoundary(info, col, row);
                // console.log('eee', bOverlap, bBoundary)
                if (!bOverlap && bBoundary) {
                    // console.log("aaa", blockType, item);
                    // 使用 Block 类创建方块
                    const block = new Item(
                        window.game,
                        subgrid,
                        info.type,
                        info,
                    );
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
                subgrid: 'PrimaryWeapon1',
                probability: 0.9,
            },
            {
                type: 'secondaryWeapon',
                subgrid: 'Secondary',
                probability: 0.3,
            },
            {
                type: 'primaryWeapon',
                subgrid: 'PrimaryWeapon2',
                probability: 0.6,
            },
            {
                type: 'helmet',
                subgrid: 'Helmet',
                probability: 0.7,
            },
            {
                type: 'armor',
                subgrid: 'Armor',
                probability: 0.9,
            },
            {
                type: 'chestRigs',
                subgrid: 'ChestRig',
                probability: 1,
            },
            {
                type: 'backpack',
                subgrid: 'Backpack',
                probability: 1,
            },
        ]
        for (const task of tasks1) {
            if (Math.random() < task.probability) {
                const subgrid = inventory.contents[task.subgrid] as Subgrid;
                const acceptable_infos = window.game.BLOCK_TYPES.filter(item => item.type === task.type);
                const info = acceptable_infos[Math.floor(Math.random() * acceptable_infos.length)];
                const item = new Item(
                    window.game,
                    subgrid,
                    info.type,
                    info,
                );
                // console.log(subgrid)
                // console.log(task)
                subgrid.addItem(item);
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
                prerequisite: 'Backpack',
            },
            {
                type: 'backpack',
                container: 'ContainerBackpack',
                stop_probability: 0.1,
                prerequisite: 'Chest rig',
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
                const infos = window.game.BLOCK_TYPES;
                const info = infos[Math.floor(Math.random() * infos.length)];
                // console.log('info', task.type, info, gridContainer);
                const item = new Item(
                    window.game,
                    null,
                    info.type,
                    info,
                );
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
    });
    if (presets) {
        console.log(presets)
        for ( const preset of presets.data) {
            const inventory_type = preset.type === 'playerContainer' ? 1 : 0;
            const inventory = region.addInventory(inventory_type, false);
            initInventory(inventory, inventory_type, preset);
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