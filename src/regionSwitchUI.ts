import * as PIXI from "pixi.js";
import { Game } from "./game";
import { SpoilsManager } from "./spoilsManager";

/**
 * 区域切换UI组件
 * @param {Game} game - The game instance
 * @param {number} x - The x coordinate of the UI
 * @param {number} y - The y coordinate of the UI
 * @param {Function} switchRegionCallback - The callback function to be called when the region is switched
 * */
export class RegionSwitchUI {
    private game: Game;
    private x: number;
    private y: number;
    private switchRegionCallback: Function;
    container: PIXI.Container;
    regionText: PIXI.Text;

    constructor(
        game: Game,
        x: number,
        y: number,
        switchRegionCallback: Function,
    ) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.switchRegionCallback = switchRegionCallback;

        this.container = new PIXI.Container();
        this.regionText = new PIXI.Text();
        this.initUI();
    }

    /**
     * Initialize the UI components
     * */
    initUI() {
        const baseX = this.x;
        const baseY = this.y;
        this.container.position.set(baseX, baseY);

        // 背景
        const bg = new PIXI.Graphics();
        bg.roundRect(0, 0, 240, 32, 10); // 背景稍微大于按钮和文字
        bg.fill({ color: 0xffffff, alpha: 0.3 });
        this.container.addChild(bg);

        // 上一个区域按钮
        const prevButton = new PIXI.Graphics();
        prevButton.roundRect(6, 4, 40, 24, 5);
        prevButton.fill({ color: 0xcccccc });
        // prevButton.interactive = true;
        prevButton.eventMode = "static";
        prevButton.cursor = "pointer";
        this.container.addChild(prevButton);
        // prevButton.buttonMode = true;

        const prevText = new PIXI.Text({
            text: "←",
            style: {
                fontSize: 20,
                fill: 0x333333,
                fontWeight: "bold",
            },
        });
        prevText.anchor.set(0.5);
        prevText.position.set(24, 13);
        // prevButton.addChild(prevText);
        this.container.addChild(prevText);

        // 下一个区域按钮
        const nextButton = new PIXI.Graphics();
        nextButton.roundRect(58, 4, 40, 24, 5);
        nextButton.fill({ color: 0xcccccc });
        // nextButton.interactive = true;
        nextButton.eventMode = "static";
        nextButton.cursor = "pointer";
        this.container.addChild(nextButton);
        // nextButton.buttonMode = true;

        const nextText = new PIXI.Text({
            text: "→",
            style: {
                fontSize: 20,
                fill: 0x333333,
                fontWeight: "bold",
            },
        });
        nextText.anchor.set(0.5);
        nextText.position.set(76, 13);
        // nextButton.addChild(nextText);
        this.container.addChild(nextText);

        // 区域指示文本
        const sm = this.game.spoilsManager as SpoilsManager;
        this.regionText = new PIXI.Text({
            text: `区域 ${sm.current + 1}/${sm.inventories.length}`,
            style: {
                fontFamily: "Arial",
                fontSize: 22,
                fill: 0xffffff,
                fontWeight: "bold",
                stroke: { color: "#000000", width: 3 },
            },
        });
        this.regionText.anchor.set(0.5);
        this.regionText.position.set(160, 15);

        // 按钮事件
        prevButton.on("pointerdown", () => {
            const sm = this.game.spoilsManager as SpoilsManager;
            if (sm.current > 0) {
                sm.switchTo(sm.current - 1);
                this.regionText.text = `区域 ${sm.current + 1}/${sm.inventories.length}`;
            }
        });

        nextButton.on("pointerdown", () => {
            const sm = this.game.spoilsManager as SpoilsManager;
            if (sm.current < sm.inventories.length - 1) {
                sm.switchTo(sm.current + 1);
                this.regionText.text = `区域 ${sm.current + 1}/${sm.inventories.length}`;
            }
            // console.log(sm.current)
        });

        this.container.addChild(this.regionText);
    }

    /**
     * Switch to the specified region
     * @param {number} index - The index of the region to switch to
     * */
    switchRegion(index: number) {
        // console.log(`切换到区域 ${index + 1}`);
        const spoilsStartIdx =
            this.game.grids.length - this.game.totalRightRegion;
        this.game.grids[
            spoilsStartIdx + this.game.currentRightRegion
        ].setVisible(false);
        this.game.currentRightRegion = index;
        this.game.grids[
            spoilsStartIdx + this.game.currentRightRegion
        ].setVisible(true);

        const sm = this.game.spoilsManager as SpoilsManager;
        this.regionText.text = `区域 ${sm.current + 1}/${sm.inventories.length}`;
        if (this.switchRegionCallback) {
            this.switchRegionCallback(this.game.currentRightRegion);
        }
    }

    addToStage() {
        this.game.app.stage.addChild(this.container);
    }
}
