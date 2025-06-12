import * as PIXI from "pixi.js";
import { Item } from "./item";
import { Game } from "./game";
import { DEFAULT_CELL_SIZE } from "./config";
import { Subgrid } from "./subgrid";

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
    backgroundGrid: Subgrid;

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
        this.backgroundGrid = new Subgrid(
            this.game, 1, 1, 128, 1, true, this.countable, ["Null"], 'Null'
        );
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
        this.additiveSize = { x: 0, y: 0}
        try {
            for (const element of this.layout) {
                const [width, height, x, y] = element;
                const subgrid = new Subgrid(
                    this.game,
                    width,
                    height,
                    this.cellSize,
                    this.aspect,
                    this.fullfill,
                    this.countable,
                    this.acceptedTypes,
                    ''
                );
                subgrid.container.position.set(x * this.cellSize, y * this.cellSize);
                this.subgrids.push(subgrid);
                this.container.addChild(subgrid.container);
                const oldAdditiveSize = this.additiveSize;
                this.additiveSize = {
                    x: Math.max(oldAdditiveSize.x, (x + width) * this.cellSize),
                    y: Math.max(oldAdditiveSize.y, (y + height) * this.cellSize)
                }
            }
        } catch ( error ) {
            console.log('GridContainer 初始化 Subgrid 时出现错误！错误对象：', this);
            console.error(error);
        }
    }

    /**
     * Add the grid to the stage.
     * @param {PIXI.Container} stage - The stage to add the grid to
     * */
    addToStage(stage: PIXI.Container) {
        stage.addChild(this.container);
    }

    /**
     * Add a item to the grid.
     * @param {Block} obj - The item to add
     * @param {number} col - The column position of the block
     * @param {number} row - The row position of the block
     * */
    addItem(obj: Item) {
        for (const subgrid of this.subgrids) {
            if (subgrid.addItem(obj)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Set the visibility of the grid.
     * @param {boolean} visible - The visibility of the grid
     * */
    setVisible(visible: boolean) {
        this.container.visible = visible;
    }

    clearItem() {
        for (const subgrid of this.subgrids) {
            subgrid.clearItem();
        }
    }
}
