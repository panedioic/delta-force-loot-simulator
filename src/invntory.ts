import * as PIXI from "pixi.js";
import { Game } from "./game";
import { GridTitle } from "./gridTitle";
import { Subgrid } from "./subgrid";
import { GridContainer } from "./gridContainer";
import { DEFAULT_CELL_SIZE } from "./config";
import { Item } from "./item";

/**
 * Inventory, contain multiple gridcontainers.
 * @param {Game} game - The game instance
 * @param {number} x - The x coordinate of the container
 * @param {number} y - The y coordinate of the container
 * @param {number} width - The width of the container
 * @param {number} height - The height of the container
 * */
export class Inventory {
    private game: Game;
    private x: number;
    private y: number;
    private width: number;
    private height: number;
    container: PIXI.Container;
    contents: { [key: string]: GridTitle | Subgrid | GridContainer };
    countable: boolean;
    scrollable: boolean;
    baseY: number;
    maxHeight: number;
    enabled: boolean;

    constructor(
        game: Game,
        countable: boolean,
        scrollable: boolean,
        x: number,
        y: number,
    ) {
        this.game = game;
        this.countable = countable;
        this.scrollable = scrollable;
        this.x = x;
        this.y = y;
        this.width = 514;
        this.height = 580;

        this.baseY = 0;
        this.maxHeight = 128;
        this.enabled = true;

        this.contents = {};
        this.container = new PIXI.Container();
        this.container.position.set(this.x, this.y);

        this.initUI();
        this.initContent();
        this.refreshUI();

        // console.log(this.contents)

        // add to stage
        this.game.app.stage.addChild(this.container);
    }
    
    initUI () {
        // 创建遮罩
        const mask = new PIXI.Graphics();
        mask.rect(0, 0, this.width, this.height);
        mask.fill({ color: 0xffffff });
        this.container.addChild(mask);
        this.container.mask = mask;

        const bg = new PIXI.Graphics();
        bg.rect(0, 0, this.width, this.height);
        bg.fill({ color: 0xffffff, alpha: 0.1 });
        this.container.addChild(bg);

        // 添加滚动事件
        this.container.interactive = true;
        this.container.on("wheel", this.onScroll.bind(this));
    }

    initContent() {
        if (this.scrollable) {
            for (const info of this.game.GRID_INFO) {
                // this.createObject(info);
                if (info.type === 'Grid') {
                        const subgrid = new Subgrid(
                            this.game,
                            1,
                            1,
                            info.cellsize,
                            info.aspect,
                            info.fullfill,
                            this.countable,
                            info.accept,
                            info.name
                        );
                        this.contents[info.name] = subgrid;
                        this.container.addChild(subgrid.container);
                } else if (info.type === 'GridTitle') {
                    const gridTitle = new GridTitle(
                        this.game,
                        info.name,
                        36,
                        13.8
                    );
                    this.contents[info.name] = gridTitle;
                    this.container.addChild(gridTitle.container);
                } else if (info.type === 'GridContainer') {
                    const gridContainer = new GridContainer(
                        this.game,
                        info.name,
                        [],
                        4,
                        false,
                        DEFAULT_CELL_SIZE,
                        1,
                        false,
                        this.countable,
                        []
                    );
                    this.contents[info.name] = gridContainer;
                    this.container.addChild(gridContainer.container);
                }
            }
            // 定义口袋
            (this.contents['pocket'] as GridContainer).layout = [
                [1, 1, 0, 0], [1, 1, 1.05, 0], [1, 1, 2.1, 0], [1, 1, 3.15, 0], [1, 1, 4.2, 0]
            ];
            (this.contents['pocket'] as GridContainer).initSubgrids();
            // 定义安全箱
            (this.contents['ContainerSecure'] as GridContainer).layout = [
                [3, 3, 0, 0]
            ];
            (this.contents['ContainerSecure'] as GridContainer).initSubgrids();
            // 胸挂回调函数
            (this.contents['Chest rig'] as Subgrid).onBlockMoved = (item, _col, _row) => {
                // console.log('there', item.subgridLayout);
                (this.contents['ContainerChestRigs'] as GridContainer).layout = item.subgridLayout;
                (this.contents['ContainerChestRigs'] as GridContainer).initSubgrids();
                this.refreshUI();
            }
            (this.contents['Chest rig'] as Subgrid).onBlockRemoved = (_) => {
                (this.contents['ContainerChestRigs'] as GridContainer).layout = [];
                (this.contents['ContainerChestRigs'] as GridContainer).initSubgrids();
                this.refreshUI();
            }
            // 背包回调函数
            (this.contents['Backpack'] as Subgrid).onBlockMoved = (item, _col, _row) => {
                // console.log('there');
                (this.contents['ContainerBackpack'] as GridContainer).layout = item.subgridLayout;
                (this.contents['ContainerBackpack'] as GridContainer).initSubgrids();
                this.refreshUI();
            }
            (this.contents['Backpack'] as Subgrid).onBlockRemoved = (_) => {
                (this.contents['ContainerBackpack'] as GridContainer).layout = [];
                (this.contents['ContainerBackpack'] as GridContainer).initSubgrids();
                this.refreshUI();
            }
        } else {
            const spoilsBox = new Subgrid(
                this.game,
                7,
                8,
                72,
                1,
                false,
                false,
                [],
                "spoilsBox"
            );
            this.contents["spoilsBox"] = spoilsBox;
            this.container.addChild(spoilsBox.container);
        }
    }

    refreshUI() {
        let currentY = this.baseY + 8;
        let currentX = 8;
        let maxHeight = 156;

        for (const info of this.game.GRID_INFO) {
            const item = this.contents[info.name];
        //     console.log(item);
        //     if(item instanceof GridContainer && item.subgrids.length > 0) {
        //     console.log(item.subgrids[0].container.position)
        //     console.log(item.container.position)
        // }
        // console.log('now pos:', currentX, currentY, info.name)
            if (item instanceof GridTitle) {
                // 标题位置设置
                item.container.position.set(8, currentY);
                currentY += item.container.height + 8; // 标题后添加间距
            } else if (item instanceof Subgrid) {
                // 特殊物品的位置处理
                if (item.acceptedTypes.includes("primaryWeapon")) {
                    item.container.position.set(8, currentY);
                } else if (item.acceptedTypes.includes("secondaryWeapon")) {
                    item.container.position.set(348, currentY);
                    currentY += 136;
                } else if (item.acceptedTypes.includes("knife")) {
                    item.container.position.set(348, currentY);
                    currentY += 136;
                } else if (item.acceptedTypes.includes("helmet")) {
                    item.container.position.set(8, currentY);
                } else if (item.acceptedTypes.includes("armor")) {
                    item.container.position.set(260, currentY);
                    currentY += 144;
                } else {
                    // 普通容器的位置设置
                    item.container.position.set(currentX, currentY);
                    maxHeight = item.additiveSize.y + 8;
                    currentX += item.additiveSize.x + 8;
                    if (!item.fullfill) {
                        currentY += maxHeight;
                        maxHeight = 0;
                        currentX = 8;
                    }
                }
            } else if (item instanceof GridContainer) {
                item.container.position.set(currentX, currentY);
                maxHeight = Math.max(maxHeight, item.additiveSize.y + 8);
                currentX += item.additiveSize.x + 8;
                if (!item.fullfill) {
                    currentY += maxHeight;
                    maxHeight = 0;
                    currentX = 8;
                }
            }
        }
        this.maxHeight = (currentY) - this.baseY - 580;
    }

    /**
     * Handle the scroll event
     * @param {PIXI.FederatedMouseEvent} event - The scroll event
     * */
    onScroll(event: any) {
        const delta = event.deltaY; // 获取滚动的方向和距离
        this.baseY -= delta; // 根据滚动方向调整内容位置

        // clamp
        if (this.baseY > 0) {
            this.baseY = 0;
        } else if (this.baseY < -(this.maxHeight)) {
            this.baseY = -this.maxHeight
        }
        this.refreshUI();
        // console.log(this.baseY)
    }

    setEnabled(enabled: boolean) {
        this.enabled = enabled;
        // 遍历所有的subgrid并设置启用状态
        for (const key in this.contents) {
            const item = this.contents[key];
            if (item instanceof Subgrid) {
                item.setEnabled(enabled);
            }
        }
        this.container.visible = enabled;
    }

    addItem(item: Item) {
        let bAdded = false;
        for (const subgrid of Object.values(this.contents)) {
            if (subgrid instanceof GridTitle) {
                continue;
            }
            bAdded = subgrid.addItem(item);
            if (bAdded) {
                break;
            }
        }
        return bAdded;
    }
}
