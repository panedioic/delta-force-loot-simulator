import * as PIXI from "pixi.js";
import { Game } from "./game";

export class InfoDialog {
    private game: Game;
    private x: number;
    private y: number;
    private container: PIXI.Container;
    private background: PIXI.Graphics;
    private isDragging: boolean = false;
    private dragStartPos: PIXI.Point = new PIXI.Point();
    private dialogStartPos: PIXI.Point = new PIXI.Point();

    constructor(game: Game, x: number, y: number) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.container = new PIXI.Container();
        this.container.visible = false;
        this.background = new PIXI.Graphics();
        this.initDialog();
        this.game.app.stage.addChild(this.container);
    }

    initUI() {
        const UIContainer = new PIXI.Container();
        UIContainer.position.set(this.x, this.y);

        const bg = new PIXI.Graphics();
        bg.roundRect(0, 0, 220, 50, 10);
        bg.fill({ color: 0xffffff, alpha: 1.0 });
        UIContainer.addChild(bg);

        const infoText = new PIXI.Text({
            text: "游戏说明:",
            style: {
                fontFamily: "Arial",
                fontSize: 24,
                fill: 0x333333,
                fontWeight: "bold",
            },
        });
        infoText.anchor.set(0.5);
        infoText.position.set(65, 25);
        UIContainer.addChild(infoText);

        const infoBtn = new PIXI.Graphics();
        infoBtn.roundRect(0, 0, 80, 30, 5);
        infoBtn.fill({ color: 0x4caf50 });
        infoBtn.position.set(130, 10);
        infoBtn.eventMode = "static";
        infoBtn.cursor = "pointer";
        infoBtn.on("pointerdown", () => this.show());
        UIContainer.addChild(infoBtn);

        const clickMeText = new PIXI.Text({
            text: "Click me!",
            style: {
                fontSize: 14,
                fill: 0xffffff,
            },
        });
        clickMeText.anchor.set(0.5);
        clickMeText.position.set(130 + 40, 10 + 15);
        // infoBtn.addChild(clickMeText);
        UIContainer.addChild(clickMeText);

        this.game.app.stage.addChild(UIContainer);
    }

    private initDialog() {
        // Background
        this.background = new PIXI.Graphics();
        this.background.rect(0, 0, 600, 400);
        this.background.fill({ color: 0x242f39, alpha: 0.95 });
        this.background.stroke({ width: 2, color: 0x666666 });
        this.container.addChild(this.background);

        // Close button
        const closeBtn = new PIXI.Graphics();
        closeBtn.roundRect(-15, -15, 30, 30, 5);
        closeBtn.fill({ color: 0xff3333 });
        closeBtn.position.set(570, 30);
        closeBtn.eventMode = "static";
        closeBtn.cursor = "pointer";
        closeBtn.on("pointerdown", () => this.hide());
        this.container.addChild(closeBtn);

        const closeMark = new PIXI.Graphics();
        closeMark.stroke({ width: 3, color: 0xffffff });
        closeMark.moveTo(-8, -8);
        closeMark.lineTo(8, 8);
        closeMark.moveTo(-8, 8);
        closeMark.lineTo(8, -8);
        // closeBtn.addChild(closeMark);
        // 不知道为什么，上面的x显示不出来
        const closeMark2 = new PIXI.Text({
            text: "×",
            style: {
                fontSize: 28,
                fill: 0xffffff,
            },
        });
        closeMark2.anchor.set(0.5);
        closeMark2.position.set(570, 30);
        // closeBtn.addChild(closeMark2);
        this.container.addChild(closeMark2);

        // Title
        const title = new PIXI.Text({
            text: "三角洲舔包模拟器",
            style: {
                fontSize: 24,
                fill: 0xffffff,
                fontWeight: "bold",
            },
        });
        title.position.set(30, 30);
        this.container.addChild(title);

        // Content
        const content = [
            "游戏介绍：",
            "三角洲行动的舔包模拟器。通过拖拽方式管理你的装备和收集品。",
            "",
            "玩法说明：",
            "1. 拖动物品到合适的格子中存放",
            "2. 按R键可以旋转物品",
            "3. 合理安排空间以获得最大收益",
            "",
            "游戏版本：0.2.1",
            "项目地址：https://github.com/panedioic/delta-force-loot-simulator",
            "讨论群：还没有建好（",
        ].join("\n");

        const contentText = new PIXI.Text({
            text: content,
            style: {
                fontSize: 16,
                fill: 0xffffff,
                lineHeight: 24,
            },
        });
        contentText.position.set(30, 80);
        this.container.addChild(contentText);

        // Make dialog draggable
        this.background.eventMode = "static";
        this.background.cursor = "move";
        this.background
            .on("pointerdown", this.onDragStart.bind(this))
            .on("pointermove", this.onDragMove.bind(this))
            .on("pointerup", this.onDragEnd.bind(this))
            .on("pointerupoutside", this.onDragEnd.bind(this));
    }

    private onDragStart(event: PIXI.FederatedPointerEvent) {
        this.isDragging = true;
        this.dragStartPos = event.global.clone();
        this.dialogStartPos = this.container.position.clone();
    }

    private onDragMove(event: PIXI.FederatedPointerEvent) {
        if (this.isDragging) {
            const newPosition = event.global;
            const dx = newPosition.x - this.dragStartPos.x;
            const dy = newPosition.y - this.dragStartPos.y;
            this.container.position.set(
                this.dialogStartPos.x + dx,
                this.dialogStartPos.y + dy,
            );
        }
    }

    private onDragEnd() {
        this.isDragging = false;
    }

    show() {
        this.container.visible = true;
        this.container.position.set(
            (this.game.app.screen.width - 600) / 2,
            (this.game.app.screen.height - 400) / 2,
        );
        this.game.app.stage.addChild(this.container); // Bring to top layer
    }

    hide() {
        this.container.visible = false;
    }
}
