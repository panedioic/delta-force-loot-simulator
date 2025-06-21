import * as PIXI from "pixi.js";
import { Item } from "./item";
import { Game } from "./game";
import { DEFAULT_CELL_SIZE } from "./config";
import { Subgrid } from "./subgrid";
import { Region } from "./region";

/**
 * This class represents a grid in the game.
 * @param {Game} game - The game instance
 * @param {PIXI.Container} stage - The stage to add the grid to
 */
export class GridContainer {
    game: Game;
    title: string;
    cellSize: number;
    aspect: number;
    info: any;
    fullfill: boolean;
    countable: boolean;
    acceptedTypes: string[];
    margin: number[];
    container: PIXI.Container;
    layout: [number, number, number, number][];
    subgrids: Subgrid[];
    dragable: boolean;
    maxWidth: number;
    parentRegion: Region | Item | null = null;
    enabled: boolean = true;

    // 用于防止出现大小的bug
    additiveSize: { x: number; y: number };

    constructor(
        game: Game,
        title: string,
        layout: [number, number, number, number][],
        maxWidth: number,
        dragable: boolean,
        cellSize: number,
        aspect: number,
        fullfill: boolean,
        countable: boolean,
        accept: string[],
    ) {
        this.game = game;
        this.title = title;
        this.layout =  layout || [
            [1, 1, 0, 0], [1, 1, 1.05, 0], [1, 1, 2.1, 0], [1, 1, 3.15, 0], [1, 1, 4.2, 0], [5, 2, 0.1, 1.05]
        ];
        this.maxWidth = maxWidth || 5;
        this.dragable = dragable || false;
        this.countable = countable || false;

        this.cellSize = cellSize || DEFAULT_CELL_SIZE;
        this.aspect = aspect || 1.0;
        this.fullfill = fullfill || false;
        this.acceptedTypes = accept || []; // 默认接受所有类型

        this.margin = [4, 4, 4, 4]; // 上下左右边距
        this.container = new PIXI.Container();
        // this.container.addChild(this.backgroundGrid.container);
        this.additiveSize = { x: 0, y: 0}

        this.subgrids = [];
        this.initSubgrids();
    }

    /**
     * Initialize the grid by creating the grid background and lines.
     */
    initSubgrids() {
        // 清除现有的子网格
        for (const subgrid of this.subgrids) {
            this.container.removeChild(subgrid.container);
        }
        this.subgrids = [];
        try {
            for (const element of this.layout) {
                const [width, height, _x, _y] = element;
                const subgrid = new Subgrid({
                    size: {width: width, height: height},
                    cellSize: this.cellSize,
                    aspect: this.aspect,
                    fullfill: this.fullfill,
                    countable: this.countable,
                    accept: this.acceptedTypes,
                    title: 's-' + this.subgrids.length
                });
                this.subgrids.push(subgrid);
            }
        } catch ( error ) {
            console.log('GridContainer 初始化 Subgrid 时出现错误！错误对象：', this);
            console.error(error);
        }
        this.refreshUI();
    }

    refreshUI() {
        this.additiveSize = { x: 0, y: 0}
        for (let i = 0; i < this.subgrids.length; i++) {
            // console.log('bbb',this.subgrids[i]);
            this.subgrids[i].parentRegion = this.parentRegion;
            this.subgrids[i].container.position.set(this.layout[i][2] * this.cellSize, this.layout[i][3] * this.cellSize);
            this.container.addChild(this.subgrids[i].container);
            const oldAdditiveSize = this.additiveSize;
            this.additiveSize = {
                x: Math.max(oldAdditiveSize.x, (this.layout[i][0] + this.layout[i][2]) * this.cellSize),
                y: Math.max(oldAdditiveSize.y, (this.layout[i][1] + this.layout[i][3]) * this.cellSize)
            }
            this.subgrids[i].onItemDraggedIn = (item: Item, _col: number, _row: number) => {
                this.onContainerItemDraggedIn(item);
            }
        }
    }

    public refreshUIRecursive() {
        this.refreshUI();
        for (const subgrid of this.subgrids) {
            subgrid.refreshUIRecursive();
        }
    }

    onContainerItemDraggedIn(draggedItem: Item) {
        const checkTypes = ['backpack', 'chestRigs', 'Backpack', 'ChestRigs'];
        // console.log('draggedItem', draggedItem);
        if(checkTypes.includes(draggedItem.type)) {
            // console.log('onContainerItemDraggedIn', draggedItem);
            if (Object.keys(draggedItem.subgrids).length === 0) {
                return;
            }
            for (const subgrid of Object.values(draggedItem.subgrids)) {
                for (const item of Object.values(subgrid.blocks)) {
                    this.addItem(item);
                }
            }
            draggedItem.subgrids = {};
            draggedItem.refreshUI();
        }
    }

    
    /**
     * 添加一个物品（所有的 addItem 都不会从原先所在的 Inventory、Grid 中移除，需要手动实现）
     * @param item 要添加的物品
     * @returns 是否添加成功
     */
    addItem(obj: Item) {
        for (const subgrid of this.subgrids) {
            if (subgrid.addItem(obj)) {
                return true;
            }
        }
        return false;
    }

    setEnabled(enabled: boolean) {
        this.enabled = enabled;
        this.container.visible = enabled;
        for (const subgrid of this.subgrids) {
            subgrid.setEnabled(enabled);
        }
        this.refreshUI();
    }

    clearItem() {
        for (const subgrid of this.subgrids) {
            subgrid.clearItem();
        }
    }

    destroy() {
        for (const subgrid of this.subgrids) {
            subgrid.destroy();
        }
        this.clearItem();
        this.container.destroy();
    }
}
