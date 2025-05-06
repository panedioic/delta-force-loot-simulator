import * as PIXI from "pixi.js";
import { Game } from "./game";

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
        bg.beginFill(0xffffff, 0.3);
        bg.drawRoundedRect(0, 0, 240, 32, 10); // 背景稍微大于按钮和文字
        bg.endFill();
        this.container.addChild(bg);

        // 上一个区域按钮
        const prevButton = new PIXI.Graphics();
        prevButton.beginFill(0xcccccc);
        prevButton.drawRoundedRect(6, 4, 40, 24, 5);
        prevButton.endFill();
        prevButton.interactive = true;
        // prevButton.buttonMode = true;

        const prevText = new PIXI.Text("←", {
            fontSize: 20,
            fill: 0x333333,
            fontWeight: "bold",
        });
        prevText.anchor.set(0.5);
        prevText.position.set(24, 13);
        prevButton.addChild(prevText);

        // 下一个区域按钮
        const nextButton = new PIXI.Graphics();
        nextButton.beginFill(0xcccccc);
        nextButton.drawRoundedRect(58, 4, 40, 24, 5);
        nextButton.endFill();
        nextButton.interactive = true;
        // nextButton.buttonMode = true;

        const nextText = new PIXI.Text("→", {
            fontSize: 20,
            fill: 0x333333,
            fontWeight: "bold",
        });
        nextText.anchor.set(0.5);
        nextText.position.set(76, 13);
        nextButton.addChild(nextText);

        // 区域指示文本
        this.regionText = new PIXI.Text(
            `区域 ${this.game.currentRightRegion + 1}/${this.game.totalRightRegion}`,
            {
                fontFamily: "Arial",
                fontSize: 22,
                fill: 0xffffff,
                fontWeight: "bold",
                stroke: { color: "#000000", width: 3 },
            },
        );
        this.regionText.anchor.set(0.5);
        this.regionText.position.set(160, 15);

        // 按钮事件
        prevButton.on("pointerdown", () => {
            if (this.game.currentRightRegion > 0) {
                this.switchRegion(this.game.currentRightRegion - 1);
            }
        });

        nextButton.on("pointerdown", () => {
            if (this.game.currentRightRegion < this.game.totalRightRegion - 1) {
                this.switchRegion(this.game.currentRightRegion + 1);
            }
        });

        this.container.addChild(prevButton);
        this.container.addChild(nextButton);
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

        this.regionText.text = `区域 ${this.game.currentRightRegion + 1}/${this.game.totalRightRegion}`;
        if (this.switchRegionCallback) {
            this.switchRegionCallback(this.game.currentRightRegion);
        }
    }

    addToStage() {
        this.game.app.stage.addChild(this.container);
    }
}
