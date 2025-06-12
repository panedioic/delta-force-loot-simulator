import * as PIXI from "pixi.js";
import { Game } from "./game";
import { Item } from "./item";
import { Subgrid } from "./subgrid";
import { GAME_WIDTH, GAME_HEIGHT } from "./config";

interface ButtonConfig {
    text: string;
    callback: () => void;
}

export class ItemInfoPanel {
    private game: Game;
    private item: Item;
    private container: PIXI.Container;
    private background: PIXI.Graphics;
    private contentContainer: PIXI.Container;
    private maskGraphics: PIXI.Graphics = new PIXI.Graphics();
    private buttons: PIXI.Container[] = [];
    private subgrids: Subgrid[] = [];
    private isDragging: boolean = false;
    private dragStartPos = { x: 0, y: 0, mouseX: 0, mouseY: 0 };
    private scrollY: number = 0;
    private maxScrollY: number = 0;
    private dragOverlay: PIXI.Graphics | null;
    private maxHeight: number;
    private ammoType: string;
    private splitPanel: PIXI.Container | null = null;
    private selectedSplitAmount: number = 1;

    private readonly WIDTH = 420;
    private readonly HEIGHT = 636;
    private readonly TITLE_HEIGHT = 40;
    private readonly IMAGE_HEIGHT = 220;
    private readonly BUTTON_WIDTH = 186;
    private readonly BUTTON_HEIGHT = 46;
    private readonly BUTTON_GAP = 4;
    private readonly SUBGRID_SIZE = 72;
    private readonly AMMO_START_POS_X = 24;
    private readonly SPLIT_PANEL_WIDTH = 300;
    private readonly SPLIT_PANEL_HEIGHT = 200;

    constructor(game: Game, item: Item, x: number, y: number, buttonConfigs: ButtonConfig[]) {
        this.game = game;
        this.item = item;
        this.ammoType = '';

        this.dragOverlay = null;

        // 如果物品可堆叠，添加拆分按钮
        if (this.item.maxStackCount > 1 && this.item.currentStactCount > 1) {
            const splitButton: ButtonConfig = {
                text: "拆分",
                callback: () => this.showSplitPanel()
            };
            buttonConfigs.push(splitButton);
        }

        // 如果是枪械，应该有卸载子弹功能
        if (this.item.ammoType) {
            const unloadButton: ButtonConfig = {
                text: "卸载子弹",
                callback: () => this.item.unloadAmmo()
            };
            buttonConfigs.push(unloadButton);
        }
        
        // 创建主容器
        this.container = new PIXI.Container();
        this.container.position.set(x, y);
        this.container.eventMode = 'static';
        this.container.hitArea = new PIXI.Rectangle(0, 0, this.WIDTH, this.HEIGHT);
        
        // 创建内容容器（用于滚动）
        this.contentContainer = new PIXI.Container();
        
        // 创建背景
        this.background = new PIXI.Graphics();
        this.drawBackground();
        
        // 创建标题栏
        this.createTitleBar();
        
        // 创建图片区域
        this.createImageArea();
        
        // 创建按钮
        this.createButtons(buttonConfigs);
        
        // 如果是枪械，创建弹药和配件区域
        if (this.item.accessories.length > 0) {
            this.createAmmoArea();
            this.createAttachmentsArea();
        }
        
        // 计算内容高度并设置滚动
        this.setupScrolling();
        this.maxHeight = this.contentContainer.height - this.HEIGHT + 128;
        if(this.maxHeight < 0) {
            this.maxHeight = 0;
        }
        
        // 添加到游戏舞台
        this.game.app.stage.addChild(this.container);
    }

    private drawBackground() {
        this.background.clear();
        // 绘制背景
        this.background.beginFill(0x1f2121, 0.95);
        this.background.lineStyle(1, 0x686F75);
        this.background.drawRect(0, 0, this.WIDTH, this.HEIGHT);
        this.background.endFill();
        this.container.addChild(this.background);
    }

    // TODO: title应该在content外，不随滚轮滑动而改变位置
    private createTitleBar() {
        const titleBar = new PIXI.Container();
        
        // 标题背景
        const titleBg = new PIXI.Graphics();
        titleBg.beginFill(0x2a2f2f);
        titleBg.drawRect(0, 0, this.WIDTH, this.TITLE_HEIGHT);
        titleBg.endFill();
        titleBar.addChild(titleBg);
        
        // 标题文本
        const titleText = new PIXI.Text({
            text: this.item.name,
            style: {
                fontFamily: "Arial",
                fontSize: 16,
                fill: 0xffffff,
            }
        });
        titleText.position.set(10, (this.TITLE_HEIGHT - titleText.height) / 2);
        titleBar.addChild(titleText);
        
        // 关闭按钮
        const closeButton = new PIXI.Text({
            text: "×",
            style: {
                fontFamily: "Arial",
                fontSize: 40,
                fill: 0xffffff,
            }
        });
        closeButton.position.set(this.WIDTH - 30, (this.TITLE_HEIGHT - closeButton.height) / 2);
        closeButton.eventMode = 'static';
        closeButton.cursor = 'pointer';
        closeButton.on('pointerdown', (e: PIXI.FederatedPointerEvent) => {
            e.stopPropagation(); // 阻止事件冒泡到标题栏
            this.close();
        });
        titleBar.addChild(closeButton);
        
        // 设置拖动功能
        titleBg.eventMode = 'static'; // 改为只在背景上监听拖动
        titleBg.cursor = 'move';
        titleBg.on('pointerdown', this.onDragStart.bind(this))
            .on('pointerup', this.onDragEnd.bind(this))
            .on('pointerupoutside', this.onDragEnd.bind(this));
        
        this.contentContainer.addChild(titleBar);
    }

    private createImageArea() {
        const imageArea = new PIXI.Container();
        imageArea.position.set(0, this.TITLE_HEIGHT);
        
        // 背景色块
        const colorBlock = new PIXI.Graphics();
        colorBlock.rect(0, 0, this.WIDTH, this.IMAGE_HEIGHT);
        colorBlock.fill({ color: parseInt(this.item.color, 16), alpha: 1.0 });
        imageArea.addChild(colorBlock);
        
        // 物品名称
        const nameText = new PIXI.Text({
            text: this.item.name,
            style: {
                fontFamily: "Arial",
                fontSize: 24,
                fill: 0xffffff,
                fontWeight: "bold"
            }
        });
        nameText.position.set(
            (this.WIDTH - nameText.width) / 2,
            this.IMAGE_HEIGHT / 2 - 30
        );
        imageArea.addChild(nameText);
        
        // 物品价值和数量信息
        let valueInfo: string;
        if (this.item.maxStackCount > 1) {
            // 可堆叠物品显示：单价 × 数量 = 总价 (最大堆叠数：xx)
            valueInfo = `${this.item.baseValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} × ${this.item.currentStactCount} = ${this.item.getValue().toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}\n(最大堆叠数：${this.item.maxStackCount})`;
        } else {
            // 不可堆叠物品只显示价值
            valueInfo = this.item.getValue().toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }

        const valueText = new PIXI.Text({
            text: valueInfo,
            style: {
                fontFamily: "Arial",
                fontSize: 20,
                fill: 0xffffff,
                align: 'center'
            }
        });
        valueText.anchor.set(0.5, 0);
        valueText.position.set(
            this.WIDTH / 2,
            this.IMAGE_HEIGHT / 2 + 10
        );
        imageArea.addChild(valueText);
        
        this.contentContainer.addChild(imageArea);
    }

    private createButtons(configs: ButtonConfig[]) {
        let currentY = this.TITLE_HEIGHT + this.IMAGE_HEIGHT + 16 - (this.BUTTON_HEIGHT + this.BUTTON_GAP);
        let currentX = 0;
        
        configs.forEach((config, index) => {
            const button = new PIXI.Container();
            
            // 按钮背景
            const buttonBg = new PIXI.Graphics();
            buttonBg.beginFill(0x313131);
            buttonBg.drawRect(0, 0, this.BUTTON_WIDTH, this.BUTTON_HEIGHT);
            buttonBg.endFill();
            button.addChild(buttonBg);
            
            // 按钮文本
            const buttonText = new PIXI.Text({
                text: config.text,
                style: {
                    fontFamily: "Arial",
                    fontSize: 16,
                    fill: 0xffffff
                }
            });
            buttonText.position.set(
                (this.BUTTON_WIDTH - buttonText.width) / 2,
                (this.BUTTON_HEIGHT - buttonText.height) / 2
            );
            button.addChild(buttonText);
            
            // 设置按钮位置
            if (index % 2 === 0) {
                currentX = (this.WIDTH - 2 * this.BUTTON_WIDTH - this.BUTTON_GAP) / 2;
                currentY += this.BUTTON_HEIGHT + this.BUTTON_GAP;
            } else {
                currentX += this.BUTTON_WIDTH + this.BUTTON_GAP;
            }
            button.position.set(currentX, currentY);
            
            // 添加交互
            button.eventMode = 'static';
            button.cursor = 'pointer';
            button.on('pointerdown', config.callback);
            
            this.buttons.push(button);
            this.contentContainer.addChild(button);
        });
    }

    private createAmmoArea() {
        const lastButton = this.buttons[this.buttons.length - 1];
        let currentY = lastButton.y + lastButton.height + 24;
        
        // 创建弹药格子
        this.ammoType = this.item.accessories[0].title;
        const ammoGrid = this.item.subgrids[this.ammoType];
        ammoGrid.setEnabled(true);
        ammoGrid.container.position.set(
            this.AMMO_START_POS_X,
            currentY
        );
        this.subgrids.push(ammoGrid);
        this.contentContainer.addChild(ammoGrid.container);
        
        currentY += this.SUBGRID_SIZE + 12;
        
        // 添加分隔线
        const separator = new PIXI.Graphics();
        separator.lineStyle(1, 0xffffff);
        separator.moveTo(20, currentY);
        separator.lineTo(this.WIDTH - 20, currentY);
        this.contentContainer.addChild(separator);
        
        currentY += 24;
        
        // 添加"枪械配件"文本
        const attachmentText = new PIXI.Text({
            text: "枪械配件",
            style: {
                fontFamily: "Arial",
                fontSize: 16,
                fill: 0xffffff
            }
        });
        attachmentText.position.set(20, currentY);
        this.contentContainer.addChild(attachmentText);
    }

    private createAttachmentsArea() {
        const startY = this.contentContainer.height + 12;
        let currentX = (this.WIDTH - 5 * (this.SUBGRID_SIZE + this.BUTTON_GAP) + this.BUTTON_GAP) / 2;
        let currentY = startY;
        
        // 创建配件格子
        // this.ammoType = this.item.accessories[0].title;
        // const ammoGrid = this.item.subgrids[this.ammoType];
        // ammoGrid.setEnabled(true);
        // ammoGrid.container.position.set(
        //     this.AMMO_START_POS_X,
        //     currentY
        // );
        // this.subgrids.push(ammoGrid);
        // this.contentContainer.addChild(ammoGrid.container);
        let count = 0;
        for (const accessory of this.item.accessories) {
            const accessoryType = accessory.title;
            if (accessoryType === this.ammoType) {
                continue;
            }
            // console.log(accessoryType, this.item.subgrids)
            const subgrid = this.item.subgrids[accessoryType];
            subgrid.setEnabled(true);
            
            if (count > 0 && count % 5 === 0) {
                currentY += this.SUBGRID_SIZE + this.BUTTON_GAP;
                currentX = (this.WIDTH - 5 * (this.SUBGRID_SIZE + this.BUTTON_GAP) + this.BUTTON_GAP) / 2;
            }
            
            subgrid.container.position.set(currentX, currentY);
            currentX += this.SUBGRID_SIZE + this.BUTTON_GAP;
            
            this.subgrids.push(subgrid);
            this.contentContainer.addChild(subgrid.container);
            count += 1;
        }
    }

    private setupScrolling() {
        // 添加遮罩
        this.maskGraphics = new PIXI.Graphics();
        this.maskGraphics.beginFill(0xffffff);
        this.maskGraphics.drawRect(0, 0, this.WIDTH, this.HEIGHT);
        this.maskGraphics.endFill();

        // 添加内容容器到主容器
        this.container.addChild(this.contentContainer);
        
        // 设置遮罩
        this.container.addChild(this.maskGraphics);
        this.contentContainer.mask = this.maskGraphics;
        
        // 计算最大滚动距离
        this.maxScrollY = Math.max(0, this.contentContainer.height - this.HEIGHT);
        
        // 添加滚动事件监听
        this.container.eventMode = 'static';
        this.container.on('wheel', this.onWheel.bind(this));
    }

    private onDragStart(event: PIXI.FederatedPointerEvent) {
        this.isDragging = true;
        this.dragStartPos = {
            x: this.container.position.x,
            y: this.container.position.y,
            mouseX: event.global.x,
            mouseY: event.global.y
        };

        // 添加移动事件监听
        this.container.on('pointermove', this.onDragMove.bind(this));

        // 创建拖动覆盖层
        this.dragOverlay = new PIXI.Graphics();
        this.dragOverlay.beginFill(0xFFFFFF, 0.001);
        this.dragOverlay.drawRect(-GAME_WIDTH, -GAME_HEIGHT, GAME_WIDTH * 2, GAME_HEIGHT * 2);
        this.dragOverlay.endFill();
        this.container.addChild(this.dragOverlay);
    }

    private onDragMove(event: PIXI.FederatedPointerEvent) {
        // console.log(event.global.x, event.global.y);
        if (this.isDragging) {
            const deltaX = event.global.x - this.dragStartPos.mouseX;
            const deltaY = event.global.y - this.dragStartPos.mouseY;
            
            this.container.position.x = this.dragStartPos.x + deltaX;
            this.container.position.y = this.dragStartPos.y + deltaY;
        }
    }

    private onDragEnd() {
        this.isDragging = false;
        // 移除移动事件监听
        this.container.off('pointermove', this.onDragMove.bind(this));

        // 移除拖动覆盖层
        if (this.dragOverlay) {
            this.container.removeChild(this.dragOverlay);
            this.dragOverlay.destroy();
            this.dragOverlay = null;
        }
    }

    private onWheel(event: WheelEvent) {
        const delta = event.deltaY;
        this.scrollY = Math.max(0, Math.min(this.maxScrollY, this.scrollY + delta));
        this.contentContainer.y -= event.deltaY;
        if (this.contentContainer.y > 0) {
            this.contentContainer.y = 0;
        }
        if (this.contentContainer.y < -this.maxHeight) {
            this.contentContainer.y = -this.maxHeight;
        }
    }

    public close() {
        this.subgrids.forEach(grid => {
            grid.setEnabled(false);
        });
        
        // 移除面板
        this.container.destroy();
        
        // 通知游戏实例面板已关闭
        if (this.game.activeItemInfoPanel === this) {
            this.game.activeItemInfoPanel = null;
        }
    }

    public getPosition(): PIXI.Point {
        return this.container.position.clone();
    }

    public setPosition(pos: PIXI.Point) {
        this.container.position.copyFrom(pos);
    }

    public getSubgrids() {
        return this.subgrids;
    }

    public getBounds() {
        return this.container.getBounds();
    }

    private showSplitPanel() {
        if (this.splitPanel) return;

        // 创建拆分面板
        this.splitPanel = new PIXI.Container();
        this.selectedSplitAmount = 1;

        // 半透明背景遮罩
        const overlay = new PIXI.Graphics();
        overlay.beginFill(0x000000, 0.5);
        overlay.drawRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        overlay.endFill();
        this.game.app.stage.addChild(overlay);

        // 面板背景
        const background = new PIXI.Graphics();
        background.beginFill(0x1f2121, 0.95);
        background.lineStyle(1, 0x686F75);
        background.drawRect(0, 0, this.SPLIT_PANEL_WIDTH, this.SPLIT_PANEL_HEIGHT);
        background.endFill();
        this.splitPanel.addChild(background);

        // 数量显示文本
        const countText = new PIXI.Text({
            text: `数量：${this.selectedSplitAmount}/${this.item.currentStactCount}`,
            style: {
                fontFamily: "Arial",
                fontSize: 14,
                fill: 0xffffff
            }
        });
        countText.position.set(10, 10);
        this.splitPanel.addChild(countText);

        // 减号按钮
        const minusButton = this.createButton("-", () => {
            this.selectedSplitAmount = Math.max(1, this.selectedSplitAmount - 1);
            this.updateSplitPanel();
        }, 20, 50, 40, 40);
        this.splitPanel.addChild(minusButton);

        // 滑动条背景
        const sliderBg = new PIXI.Graphics();
        sliderBg.beginFill(0x333333);
        sliderBg.drawRect(70, 65, 160, 10);
        sliderBg.endFill();
        this.splitPanel.addChild(sliderBg);

        // 滑动条把手
        const slider = new PIXI.Graphics();
        slider.beginFill(0xffffff);
        slider.drawCircle(0, 0, 10);
        slider.endFill();
        slider.position.set(70, 70);
        slider.eventMode = 'static';
        slider.cursor = 'pointer';

        let isDragging = false;
        slider.on('pointerdown', () => isDragging = true);
        slider.on('globalpointermove', (e: PIXI.FederatedPointerEvent) => {
            if (!isDragging) return;
            const bounds = sliderBg.getBounds();
            const x = Math.max(bounds.x, Math.min(e.global.x, bounds.x + bounds.width));
            const progress = (x - bounds.x) / bounds.width;
            this.selectedSplitAmount = Math.max(1, Math.min(
                Math.round(progress * (this.item.currentStactCount - 1)) + 1,
                this.item.currentStactCount - 1
            ));
            slider.position.x = x;
            this.updateSplitPanel();
        });
        slider.on('pointerup', () => isDragging = false);
        slider.on('pointerupoutside', () => isDragging = false);
        this.splitPanel.addChild(slider);

        // 加号按钮
        const plusButton = this.createButton("+", () => {
            this.selectedSplitAmount = Math.min(this.item.currentStactCount - 1, this.selectedSplitAmount + 1);
            this.updateSplitPanel();
        }, 240, 50, 40, 40);
        this.splitPanel.addChild(plusButton);

        // 取消按钮
        const cancelButton = this.createButton("取消", () => {
            this.closeSplitPanel();
        }, 20, this.SPLIT_PANEL_HEIGHT - 60, 120, 40);
        this.splitPanel.addChild(cancelButton);

        // 确认按钮
        const confirmButton = this.createButton("确认", () => {
            this.splitItem();
            this.closeSplitPanel();
        }, 160, this.SPLIT_PANEL_HEIGHT - 60, 120, 40);
        this.splitPanel.addChild(confirmButton);

        // 设置面板位置
        this.splitPanel.position.set(
            (GAME_WIDTH - this.SPLIT_PANEL_WIDTH) / 2,
            (GAME_HEIGHT - this.SPLIT_PANEL_HEIGHT) / 2
        );

        this.game.app.stage.addChild(this.splitPanel);
    }

    private createButton(text: string, callback: () => void, x: number, y: number, width: number, height: number) {
        const button = new PIXI.Container();
        button.position.set(x, y);

        const bg = new PIXI.Graphics();
        bg.beginFill(0x313131);
        bg.drawRect(0, 0, width, height);
        bg.endFill();
        button.addChild(bg);

        const buttonText = new PIXI.Text({
            text,
            style: {
                fontFamily: "Arial",
                fontSize: 16,
                fill: 0xffffff
            }
        });
        buttonText.anchor.set(0.5);
        buttonText.position.set(width / 2, height / 2);
        button.addChild(buttonText);

        button.eventMode = 'static';
        button.cursor = 'pointer';
        button.on('pointerdown', callback);

        return button;
    }

    private updateSplitPanel() {
        if (!this.splitPanel) return;
        const countText = this.splitPanel.children[1] as PIXI.Text;
        countText.text = `数量：${this.selectedSplitAmount}/${this.item.currentStactCount}`;
    }

    private closeSplitPanel() {
        if (!this.splitPanel) return;
        // 移除遮罩
        const overlay = this.game.app.stage.children[this.game.app.stage.children.length - 2];
        this.game.app.stage.removeChild(overlay);
        // 移除面板
        this.game.app.stage.removeChild(this.splitPanel);
        this.splitPanel = null;
    }

    private splitItem() {
        if (!this.item.parentGrid) return;
        if (this.item.currentStactCount === 1) return;

        // 创建新的物品
        const newItemInfo = this.game.BLOCK_TYPES.find((item: any) => item.name === this.item.name);
        const newItem = new Item(this.game, null, newItemInfo.type, newItemInfo);
        newItem.currentStactCount = this.selectedSplitAmount;

        // 更新原物品的堆叠数量
        this.item.currentStactCount -= this.selectedSplitAmount;
        this.item.refreshUI();

        // 将新物品添加到原物品所在的网格中
        this.item.parentGrid.addItem(newItem);
        newItem.refreshUI();
    }
}
