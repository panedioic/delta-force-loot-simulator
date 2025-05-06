import * as PIXI from "pixi.js";
import { Game } from "./game";

export class Timer {
    private game: Game;
    private x: number;
    private y: number;
    private timer: number;
    private isRunning: boolean;
    private timerText: PIXI.Text;
    private ticker: PIXI.Ticker;
    private onStartCallback: Function;
    private onPauseCallback: Function;

    constructor(
        game: Game,
        x: number,
        y: number,
        onStartCallback: Function,
        onPauseCallback: Function,
    ) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.timer = 0; // 计时器时间（以毫秒为单位）
        this.isRunning = false;
        this.timerText = new PIXI.Text();
        this.ticker = new PIXI.Ticker(); // 使用 PixiJS 的 Ticker
        this.onStartCallback = onStartCallback;
        this.onPauseCallback = onPauseCallback;

        this.initUI();
    }

    /**
     * Initialize the UI components
     * */
    initUI() {
        // 创建计时器容器
        const container = new PIXI.Container();
        container.position.set(this.x, this.y);

        // 创建计时器背景
        const bg = new PIXI.Graphics();
        bg.beginFill(0xffffff);
        bg.drawRoundedRect(0, 0, 220, 100, 10); // 背景大小
        bg.endFill();
        container.addChild(bg);

        // 创建计时器文本
        this.timerText = new PIXI.Text("00:00:00", {
            fontFamily: "Arial",
            fontSize: 20,
            fill: 0x333333,
            fontWeight: "bold",
        });
        this.timerText.position.set(20, 15); // 文本位置
        container.addChild(this.timerText);

        // 创建开始按钮
        const startButton = this.createButton("开始", 20, 60, () => {
            if (!this.isRunning) {
                this.start();
                if (this.onStartCallback) this.onStartCallback();
            }
        });

        // 创建暂停按钮
        const pauseButton = this.createButton("暂停", 90, 60, () => {
            if (this.isRunning) {
                this.pause();
                if (this.onPauseCallback) this.onPauseCallback();
            }
        });

        container.addChild(startButton, pauseButton);
        this.game.app.stage.addChild(container);
    }

    /**
     * Create a button with the specified label, position, and click handler
     * @param {string} label - The label of the button
     * @param {number} x - The x coordinate of the button
     * @param {number} y - The y coordinate of the button
     * @param {Function} onClick - The click handler for the button
     * @returns {PIXI.Container} - The button container
     * */
    createButton(label: string, x: number, y: number, onClick: Function) {
        const button = new PIXI.Container();

        // 按钮背景
        const bg = new PIXI.Graphics();
        bg.beginFill(0xcccccc);
        bg.drawRoundedRect(0, 0, 60, 30, 5);
        bg.endFill();
        bg.interactive = true;
        // bg.buttonMode = true;
        // Inside the createButton function
        bg.on("pointerdown", () => {
            onClick(); // Call the provided onClick function
        });

        // 按钮文本
        const text = new PIXI.Text(label, {
            fontFamily: "Arial",
            fontSize: 14,
            fill: 0x333333,
            fontWeight: "bold",
        });
        text.anchor.set(0.5);
        text.position.set(30, 15);

        button.addChild(bg, text);
        button.position.set(x, y);

        return button;
    }

    start() {
        this.isRunning = true;
        const startTime = performance.now() - this.timer;

        // 使用 Ticker 更新计时器
        this.ticker.add(() => {
            this.timer = performance.now() - startTime;
            this.updateTimerText();
        });
        this.ticker.start();
    }

    pause() {
        this.isRunning = false;
        this.ticker.stop(); // 停止 Ticker
    }

    updateTimerText() {
        const totalMilliseconds = Math.floor(this.timer);
        const minutes = String(Math.floor(totalMilliseconds / 60000)).padStart(
            2,
            "0",
        );
        const seconds = String(
            Math.floor((totalMilliseconds % 60000) / 1000),
        ).padStart(2, "0");
        const milliseconds = String(
            Math.floor((totalMilliseconds % 1000) / 10),
        ).padStart(2, "0");
        this.timerText.text = `${minutes}:${seconds}:${milliseconds}`;
    }
}
