import * as PIXI from "pixi.js";

export class Timer {
    private timer: number;
    private isRunning: boolean;
    private timerText: PIXI.Text;
    private ticker: PIXI.Ticker;

    public container: PIXI.Container;
    public additiveSize: {
        x: number,
        y: number
    } = {
        x: 220,
        y: 100
    }

    constructor(
    ) {
        this.timer = 0; // 计时器时间（以毫秒为单位）
        this.isRunning = false;
        this.timerText = new PIXI.Text();
        this.ticker = new PIXI.Ticker(); // 使用 PixiJS 的 Ticker

        this.container = new PIXI.Container();

        this.initUI();
    }

    /**
     * Initialize the UI components
     * */
    initUI() {
        // 创建计时器背景
        const bg = new PIXI.Graphics();
        bg.roundRect(0, 0, 220, 100, 10); // 背景大小
        bg.fill({ color: 0xffffff });
        this.container.addChild(bg);

        // 创建计时器文本
        this.timerText = new PIXI.Text({
            text: "00:00:00",
            style: {
                fontFamily: "Arial",
                fontSize: 20,
                fill: 0x333333,
                fontWeight: "bold",
            },
        });
        this.timerText.position.set(20, 15); // 文本位置
        this.container.addChild(this.timerText);

        // 创建开始按钮
        const startButton = this.createButton("开始", 20, 60, () => {
            if (!this.isRunning) {
                this.start();
                window.game.isGameStarted = true;
            }
        });
        startButton.eventMode = 'static';
        startButton.cursor = 'pointer';

        // 创建暂停按钮
        const pauseButton = this.createButton("暂停", 90, 60, () => {
            if (this.isRunning) {
                this.pause();
                window.game.isGameStarted = false;
            }
        });
        pauseButton.eventMode = 'static';
        pauseButton.cursor = 'pointer';

        this.container.addChild(startButton, pauseButton);
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
        bg.roundRect(0, 0, 60, 30, 5);
        bg.fill(0x4CAF50);
        
        // 按钮文本
        const text = new PIXI.Text({
            text: label,
            style: {
                fontFamily: "Arial",
                fontSize: 14,
                fill: 0xffffff,
            },
        });
        text.anchor.set(0.5);
        text.position.set(30, 15);

        button.addChild(bg, text);
        button.position.set(x, y);

        // 添加按钮交互
        button.eventMode = 'static';
        button.cursor = 'pointer';
        button.on('pointerdown', () => onClick());
        button.on('pointerover', () => {
            bg.tint = 0x45A049;
        });
        button.on('pointerout', () => {
            bg.tint = 0xFFFFFF;
        });

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
