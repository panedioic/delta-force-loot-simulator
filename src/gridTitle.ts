import * as PIXI from "pixi.js";

export class GridTitle {
    title: string;
    width: number;
    height: number;
    cellSize: number;
    aspect: number;
    margin: number[];
    container: PIXI.Container;
    info: any;
    
    constructor(
        info: any,
        title: string,
        cellSize: number,
        aspect: number,
    ) {
        this.title = title;
        this.width = 1;
        this.height = 1;
        this.cellSize = cellSize;
        this.aspect = aspect;

        this.margin = [4, 4, 4, 4]; // 上下左右边距

        this.container = new PIXI.Container();

        this.info = info;

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

        // 外围边框
        graphics.rect(
            0,
            0,
            this.width * this.cellSize * this.aspect,
            this.height * this.cellSize,
        );
        graphics.stroke({ width: 2, color: 0x666666 });
        this.container.addChild(graphics);

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
        this.container.addChild(titleText);
    }

    public refreshUI() {
        // 目前没有需要做的
    }

    public refreshUIRecursive() {
        this.refreshUI();
    }

    setEnabled(enabled: boolean) {
        this.container.visible = enabled;
    }

    destroy() {
        this.container.destroy();
    }
}
