
import * as PIXI from "pixi.js";

export class InfoDialog {
    private container: PIXI.Container;
    private background: PIXI.Graphics;
    private isDragging: boolean = false;
    private dragStartPos: PIXI.Point = new PIXI.Point();
    private dialogStartPos: PIXI.Point = new PIXI.Point();

    constructor(private app: PIXI.Application) {
        this.container = new PIXI.Container();
        this.container.visible = false;
        this.initDialog();
        this.app.stage.addChild(this.container);
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
        closeBtn.rect(-15, -15, 30, 30);
        closeBtn.fill({ color: 0xff3333 });
        closeBtn.position.set(570, 30);
        closeBtn.eventMode = 'static';
        closeBtn.cursor = 'pointer';
        closeBtn.on('pointerdown', () => this.hide());
        this.container.addChild(closeBtn);

        const closeMark = new PIXI.Graphics();
        closeMark.stroke({ width: 3, color: 0xffffff });
        closeMark.moveTo(-8, -8);
        closeMark.lineTo(8, 8);
        closeMark.moveTo(-8, 8);
        closeMark.lineTo(8, -8);
        closeBtn.addChild(closeMark);

        // Title
        const title = new PIXI.Text({
            text: "三角洲舔包模拟器",
            style: {
                fontSize: 24,
                fill: 0xffffff,
                fontWeight: "bold"
            }
        });
        title.position.set(30, 30);
        this.container.addChild(title);

        // Content
        const content = [
            "游戏介绍：",
            "这是一个模拟三角洲部队战利品管理的游戏。通过拖拽方式管理你的装备和战利品。",
            "",
            "玩法说明：",
            "1. 拖动物品到合适的格子中存放",
            "2. 按R键可以旋转物品",
            "3. 合理安排空间以获得最大收益",
            "",
            "项目地址：https://github.com/panedioic",
            "作者主页：https://github.com/panedioic",
            "讨论群：123456789"
        ].join("\n");

        const contentText = new PIXI.Text({
            text: content,
            style: {
                fontSize: 16,
                fill: 0xffffff,
                lineHeight: 24
            }
        });
        contentText.position.set(30, 80);
        this.container.addChild(contentText);

        // Make dialog draggable
        this.background.eventMode = 'static';
        this.background.cursor = 'move';
        this.background
            .on('pointerdown', this.onDragStart.bind(this))
            .on('pointermove', this.onDragMove.bind(this))
            .on('pointerup', this.onDragEnd.bind(this))
            .on('pointerupoutside', this.onDragEnd.bind(this));
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
                this.dialogStartPos.y + dy
            );
        }
    }

    private onDragEnd() {
        this.isDragging = false;
    }

    show() {
        this.container.visible = true;
        this.container.position.set(
            (this.app.screen.width - 600) / 2,
            (this.app.screen.height - 400) / 2
        );
    }

    hide() {
        this.container.visible = false;
    }
}
