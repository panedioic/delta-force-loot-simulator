import * as PIXI from "pixi.js";
import { Game } from "./game";
import { Item } from "./item";
import { Subgrid } from "./subgrid";
import { GridContainer } from "./gridContainer";
import { Inventory } from "./invntory";

export class SpoilsManager {
    game: Game;

    container: PIXI.Container;
    inventories: Inventory[];
    current: number;

    constructor(
        game: Game,
        x: number,
        y: number,
        numBox: number,
        numPerson: number
    ) {
        this.game = game;

        this.container = new PIXI.Container();
        this.container.position.set(x, y);
        this.inventories = [];
        this.current = 0;

        this.initInventories(numBox, numPerson);
        this.game.app.stage.addChild(this.container);
    }

    initInventories(nb: number, np: number) {
        for (let i = 0; i < nb; i += 1) {
            const inventory = new Inventory(
                this.game,
                false,
                false,
                0,
                0
            );
            // console.log('bbb')
            this.inventories.push(inventory);
            this.container.addChild(inventory.container);
            inventory.setEnabled(false);
            this.initInventoryItem(inventory, 0);
        }
        for (let i = 0; i < np; i += 1) {
            const inventory = new Inventory(
                this.game,
                false,
                true,
                0,
                0
            );
            this.inventories.push(inventory);
            this.container.addChild(inventory.container);
            inventory.setEnabled(false);
            this.initInventoryItem(inventory, 1);
        }
        if (nb + np > 0) {
            this.inventories[0].setEnabled(true);
        }
    }

    switchTo(target: number) {
        // console.log('Trying to switch to', target);
        if(target >= this.inventories.length) {
            console.error("[Error] switch target out of range!");
            return;
        }
        this.inventories[this.current].setEnabled(false);
        this.inventories[target].setEnabled(true);
        this.current = target;
    }

    
    initInventoryItem(inv: number | Inventory, type: number) {
        const inventory = inv instanceof Inventory ? inv : this.inventories[inv];
        const item_infos = this.game.BLOCK_TYPES;
        // console.log(item_infos)

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
                            this.game,
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
                    subgrid: 'Primary weapon 1',
                    probability: 0.9,
                },
                {
                    type: 'secondaryWeapon',
                    subgrid: 'Secondary',
                    probability: 0.3,
                },
                {
                    type: 'primaryWeapon',
                    subgrid: 'Primary weapon 2',
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
                    subgrid: 'Chest rig',
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
                    const acceptable_infos = this.game.BLOCK_TYPES.filter(item => item.type === task.type);
                    const info = acceptable_infos[Math.floor(Math.random() * acceptable_infos.length)];
                    const item = new Item(
                        this.game,
                        subgrid,
                        info.type,
                        info,
                    );
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
                    const infos = this.game.BLOCK_TYPES;
                    const info = infos[Math.floor(Math.random() * infos.length)];
                    // console.log('info', task.type, info, gridContainer);
                    const item = new Item(
                        this.game,
                        null,
                        info.type,
                        info,
                    );
                    gridContainer.addItem(item);
                }
            }
        }
    }


}