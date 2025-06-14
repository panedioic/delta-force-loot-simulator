import * as PIXI from "pixi.js";
import { Game } from "./game";

export class GridTitle {
    game: Game;
    title: string;
    width: number;
    height: number;
    cellSize: number;
    aspect: number;
    margin: number[];
    container: PIXI.Container;

    constructor(
        game: Game,
        title: string,
        cellSize: number,
        aspect: number,
    ) {
        this.game = game;
        this.title = title;
        this.width = 1;
        this.height = 1;
        this.cellSize = cellSize;
        this.aspect = aspect;

        this.margin = [4, 4, 4, 4]; // 上下左右边距

        this.container = new PIXI.Container();

        this.initUI();
    }

    /**
     * Initialize the UI components
     * */
    initUI() {
        // 创建网格背景
        const graphics = new PIXI.Graphics();

        // 半透明背景
        graphics.rect(
            0,
            0,
            this.width * this.cellSize * this.aspect,
            this.height * this.cellSize,
        );
        graphics.fill({ color: 0x1f2121, alpha: 0.3 });

        // 网格线
        // graphics.lineStyle(2, 0x666666);

        // 外围边框
        graphics.rect(
            0,
            0,
            this.width * this.cellSize * this.aspect,
            this.height * this.cellSize,
        ); // 使用 this.cellSize

        graphics.stroke({ width: 2, color: 0x666666 });
        const titleText = new PIXI.Text({
            text: this.title,
            style: {
                fontFamily: "Arial",
                fontSize: 20,
                fill: 0xffffff,
                stroke: { color: "black", width: 3 },
            },
        });
        titleText.anchor.set(0);
        titleText.position.set(4, 4);
        graphics.addChild(titleText);
        

        this.container.addChild(graphics);
    }

    /**
     * Set the position of the grid.
     * @param {number} x - The x coordinate
     * @param {number} y - The y coordinate
     * */
    setPosition(x: number, y: number) {
        this.container.position.set(x, y);
    }

    setEnabled(enabled: boolean) {
        this.container.visible = enabled;
    }

    destroy() {
        this.container.destroy();
    }
}
