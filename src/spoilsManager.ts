import * as PIXI from "pixi.js";
import { Game } from "./game";
import { Inventory } from "./invntory";
import { Block } from "./block";
import { Subgrid } from "./subgrid";



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
            console.log('bbb')
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
                        const item = new Block(
                            this.game,
                            subgrid,
                            info.type,
                            info,
                        );
                        subgrid.addBlock(item, col, row);
                        // console.log('fff', subgrid)

                        items.shift(); // 移除已放置的方块类型
                    }
                }
            }
        } else {
            // TODO

        }
    }


}