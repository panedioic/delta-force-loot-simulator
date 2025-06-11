import * as PIXI from "pixi.js";

/**
 * 区域切换UI组件
 * @param {Function} switchLeftCallback
 * @param {Function} switchRightCallback
 * */
export class RegionSwitchUI {
    private switchLeftCallback: Function;
    private switchRightCallback: Function;

    container: PIXI.Container;
    regionText: PIXI.Text;

    constructor(
        switchLeftCallback: Function,
        switchRightCallback: Function,
    ) {
        this.switchLeftCallback = switchLeftCallback;
        this.switchRightCallback = switchRightCallback;

        this.container = new PIXI.Container();
        this.regionText = new PIXI.Text();
        this.initUI();
    }

    /**
     * Initialize the UI components
     * */
    initUI() {
        // 背景
        const bg = new PIXI.Graphics();
        bg.roundRect(0, 0, 240, 32, 10); // 背景稍微大于按钮和文字
        bg.fill({ color: 0xffffff, alpha: 0.3 });
        this.container.addChild(bg);

        // 上一个区域按钮
        const prevButton = new PIXI.Graphics();
        prevButton.roundRect(6, 4, 40, 24, 5);
        prevButton.fill({ color: 0xcccccc });
        prevButton.eventMode = "static";
        prevButton.cursor = "pointer";
        this.container.addChild(prevButton);

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
        this.container.addChild(prevText);

        // 下一个区域按钮
        const nextButton = new PIXI.Graphics();
        nextButton.roundRect(58, 4, 40, 24, 5);
        nextButton.fill({ color: 0xcccccc });
        nextButton.eventMode = "static";
        nextButton.cursor = "pointer";
        this.container.addChild(nextButton);

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
        this.container.addChild(nextText);

        // 区域指示文本
        this.regionText = new PIXI.Text({
            text: `区域 ${0}/${0}`,
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
            this.switchLeftCallback();
        });

        nextButton.on("pointerdown", () => {
            this.switchRightCallback();
        });

        this.container.addChild(this.regionText);
    }
    
    updateText(text: string) {
        this.regionText.text = text;
    }
}
