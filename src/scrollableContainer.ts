import * as PIXI from "pixi.js";
import { Game } from "./game";
import { Grid } from "./grid";
import { GridTitle } from "./gridTitle";

/**
 * 可滚动的容器组件
 * @param {Game} game - The game instance
 * @param {number} x - The x coordinate of the container
 * @param {number} y - The y coordinate of the container
 * @param {number} width - The width of the container
 * @param {number} height - The height of the container
 * */
export class ScrollableContainer {
    private game: Game;
    private x: number;
    private y: number;
    private width: number;
    private height: number;
    private nowAddingX: number;
    private nowAddingY: number;
    private newLineY: number;
    container: PIXI.Container;
    content: PIXI.Container;

    constructor(
        game: Game,
        x: number,
        y: number,
        width: number,
        height: number,
    ) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;

        this.nowAddingX = 0;
        this.nowAddingY = 0;
        this.newLineY = 0;

        this.container = new PIXI.Container();
        this.container.position.set(this.x, this.y);

        // 创建遮罩
        const mask = new PIXI.Graphics();
        mask.beginFill(0xffffff);
        mask.drawRect(0, 0, this.width, this.height);
        mask.endFill();
        this.container.addChild(mask);
        this.container.mask = mask;

        const bg = new PIXI.Graphics();
        bg.beginFill(0xffffff, 0.1);
        bg.drawRect(0, 0, this.width, this.height);
        bg.endFill();
        this.container.addChild(bg);

        // 创建内容容器
        this.content = new PIXI.Container();
        this.container.addChild(this.content);

        // 添加滚动事件
        this.container.interactive = true;
        this.container.on("wheel", this.onScroll.bind(this));
    }

    /**
     * Handle the scroll event
     * @param {PIXI.FederatedMouseEvent} event - The scroll event
     * */
    onScroll(event: any) {
        const delta = event.deltaY; // 获取滚动的方向和距离
        this.content.y -= delta; // 根据滚动方向调整内容位置

        // 限制滚动范围
        this.content.y = Math.min(0, this.content.y); // 不允许向下滚动超出顶部
        this.content.y = Math.max(
            this.height - this.content.height - 128,
            this.content.y,
        ); // 不允许向上滚动超出底部
    }

    /**
     * Add a child to the content container
     * @param {PIXI.DisplayObject} child - The child to add
     * */
    addChild(child: any) {
        this.content.addChild(child);
    }

    /**
     * Add an object(Grid or GridTitle) to the scrollable container.
     * @param {object} obj - The object to add
     */
    addObject(obj: Grid | GridTitle) {
        const width = obj.width * obj.cellSize * obj.aspect;
        const height = obj.height * obj.cellSize;
        // console.log(width, height)
        if (
            this.nowAddingX + obj.margin[2] + width + obj.margin[3] >
            this.width
        ) {
            this.nowAddingX = 0;
            this.nowAddingY = this.newLineY;
        }
        obj.container.position.set(
            this.nowAddingX + obj.margin[2],
            this.nowAddingY + obj.margin[0],
        );
        obj.setPosition(
            this.nowAddingX + obj.margin[2],
            this.nowAddingY + obj.margin[0],
        );
        this.nowAddingX += width + obj.margin[2] + obj.margin[3];
        this.newLineY = Math.max(
            this.newLineY,
            this.nowAddingY + height + obj.margin[0] + obj.margin[1],
        );
        this.content.addChild(obj.container);
    }

    /**
     * Add the container to the stage
     * */
    addToStage() {
        this.game.app.stage.addChild(this.container);
    }
}
