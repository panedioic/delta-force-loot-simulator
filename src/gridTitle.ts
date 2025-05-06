import * as PIXI from "pixi.js";
import { Game } from "./game";

export class GridTitle {
    game: Game;
    private x: number;
    private y: number;
    width: number;
    height: number;
    cellSize: number;
    aspect: number;
    margin: number[];
    container: PIXI.Container;

    constructor(
        game: Game,
        x: number,
        y: number,
        cellSize: number,
        aspect: number,
    ) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 1;
        this.height = 1;
        this.cellSize = cellSize;
        this.aspect = aspect;

        this.margin = [4, 4, 4, 4]; // 上下左右边距

        this.container = new PIXI.Container();
        this.container.position.set(this.x, this.y);

        this.initUI();
    }

    /**
     * Initialize the UI components
     * */
    initUI() {
        // 创建网格背景
        const graphics = new PIXI.Graphics();

        // 半透明背景
        graphics.beginFill(0x1f2121, 0.3);
        graphics.drawRect(
            0,
            0,
            this.width * this.cellSize * this.aspect,
            this.height * this.cellSize,
        );
        graphics.endFill();

        // 网格线
        graphics.lineStyle(2, 0x666666);

        // 外围边框
        graphics.lineStyle(3, 0x666666);
        graphics.drawRect(
            0,
            0,
            this.width * this.cellSize * this.aspect,
            this.height * this.cellSize,
        ); // 使用 this.cellSize
        graphics.stroke({ width: 3, color: 0x666666 });

        this.container.addChild(graphics);
    }

    /**
     * Set the position of the grid.
     * @param {number} x - The x coordinate
     * @param {number} y - The y coordinate
     * */
    setPosition(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.container.position.set(this.x, this.y);
    }
}
