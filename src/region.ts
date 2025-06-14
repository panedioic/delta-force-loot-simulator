import * as PIXI from "pixi.js";
import { Inventory } from "./invntory";
import { initInventory } from "./utils";
import { RegionSwitchUI } from "./components/regionSwitchUI";
import { Item } from "./item";

interface RegionOptions {
    title: string;
    width?: number;
    height?: number;
    titleColor?: number;
    titleAlpha?: number
    titleHeight?: number;
    backgroundColor?: number;
    backgroundAlpha?: number;
    componentWidth?: number;
    countable: boolean;
}

/**
 * 游戏中的区域组件，包含标题栏和内容区
 */
export class Region {
    private container: PIXI.Container;
    private switcherUI: RegionSwitchUI | null = null;
    private currentComponentPosition: {
        x: number;
        y: number;
    } = {
        x: 12,
        y: 62,
    };

    public readonly components: { [key: string]: any } = {};
    public readonly inventories: Inventory[] = [];
    public currentInventoryId: number = 0;

    private options: RegionOptions;

    constructor(pos: {x: number, y: number}, options: RegionOptions) {
        this.options = {
            width: 508,
            height: 632,
            titleColor: 0xff0000,
            titleAlpha: 0.3,
            titleHeight: 50,
            backgroundColor: 0xffffff,
            componentWidth: 246,
            ...options
        };

        this.container = new PIXI.Container();
        this.container.position.set(pos.x, pos.y);

        this.initUI();

        // 将容器添加到游戏舞台
        window.game.app.stage.addChild(this.container);
    }

    private initUI() {
        // Title bar
        const titleBarBG = new PIXI.Graphics();
        titleBarBG.rect(0, 0, this.options.width!, this.options.titleHeight!);
        titleBarBG.fill({ color: this.options.titleColor!, alpha: this.options.titleAlpha! });
        this.container.addChild(titleBarBG);

        const titleText = new PIXI.Text({
            text: this.options.title!,
            style: {
                fontFamily: "Arial",
                fontSize: 24,
                fill: 0xffffff,
                fontWeight: "bold",
                stroke: { color: "black", width: 3 },
            },
        });
        titleText.anchor.set(0.5);
        titleText.position.set(56, this.options.titleHeight! / 2);
        this.container.addChild(titleText);

        // Content background
        const contentBG = new PIXI.Graphics();
        contentBG.rect(0, this.options.titleHeight!, this.options.width!, this.options.height! - this.options.titleHeight!);
        contentBG.fill({ color: this.options.backgroundColor!, alpha: this.options.backgroundAlpha! });
        this.container.addChild(contentBG);
    }

    /**
     * 添加一个组件到内容区
     * @param component 要添加的组件
     */
    public addComponent(name: string, component: any) {
        const componentInstance = new component();
        this.components[name] = componentInstance;
        componentInstance.container.position.set(
            this.currentComponentPosition.x, this.currentComponentPosition.y);
        this.currentComponentPosition.y += componentInstance.additiveSize.y + 12;
        this.container.addChild(componentInstance.container);
    }

    /**
     * 添加一个物品栏到内容区
     * @param type 0 为普通容器，1 为玩家盒子
     */
    public addInventory(type: number, needToInit: boolean=true, title: string='') {
        const inventoryTitle = title ? title : this.options.title + (this.inventories.length + 1);
        const inventory = new Inventory(inventoryTitle, {
            position: {
                x: this.options.componentWidth ? this.options.componentWidth : 0,
                y: this.options.titleHeight ? this.options.titleHeight : 0,
            },
            size: {width: 514, height: 580},
            countable: this.options.countable,
            scrollable: type === 1 ? true : false,
            parentRegion: this,
        });

        this.inventories.push(inventory);
        this.container.addChild(inventory.container);
        if (needToInit) {
            initInventory(inventory, type);
        }
        inventory.setEnabled(false);
        return inventory;
    }

    addItem(item: Item) {
        return this.inventories[this.currentInventoryId].addItem(item);
    }

    public addSwitcherUI() {
        this.switcherUI = new RegionSwitchUI(
            () => {
                this.switchTo(this.currentInventoryId - 1);
            },
            () => {
                this.switchTo(this.currentInventoryId + 1);
            }
        );
        this.container.addChild(this.switcherUI.container);
        this.switcherUI.container.position.set(116, 10);
        this.switcherUI.updateText(`区域 ${this.currentInventoryId + 1}/${this.inventories.length}`);
    }

    public switchTo (id: number) {
        if (this.inventories.length === 0 || id >= this.inventories.length) {
            return;
        }
        if (id < 0) {
            return;
        }
        // console.log(id)
        this.inventories[this.currentInventoryId].setEnabled(false);
        this.currentInventoryId = id;
        this.inventories[this.currentInventoryId].setEnabled(true);
        this.switcherUI?.updateText(`区域 ${this.currentInventoryId + 1}/${this.inventories.length}`);
    }

    /**
     * 更新区域内所有组件
     */
    public update() {
        for (const inventory of this.inventories) {
            inventory.update();
        }
    }

    /**
     * 销毁区域及其所有子组件
     */
    public destroy() {
        for (const inventory of this.inventories) {
            inventory.destroy();
        }
        this.container.destroy();
    }

    /**
     * 获取容器的边界
     */
    public getBounds(): PIXI.Bounds {
        return this.container.getBounds();
    }
}
