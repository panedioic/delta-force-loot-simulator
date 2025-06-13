import * as PIXI from "pixi.js";
import { GridTitle } from "./gridTitle";
import { Subgrid } from "./subgrid";
import { GridContainer } from "./gridContainer";
import { DEFAULT_CELL_SIZE } from "./config";
import { Item } from "./item";
import { Magnify } from "./magnify";
import { Region } from "./region";

/**
 * Inventory，可以代表一个玩家的盒子或一个地图中的容器（保险、航空箱、鸟窝、井盖等）。
 * 如果是普通容器，一般只包含一个 Subgrid，若是玩家盒子，则会包含多个 GridContainer、GridTitle 和 Subgrid。
 * @param {Game} game - The game instance
 * @param {number} x - The x coordinate of the container
 * @param {number} y - The y coordinate of the container
 * @param {number} width - The width of the container
 * @param {number} height - The height of the container
 * */
export class Inventory {
    // Inventory 的标题
    title: string;

    // UI相关
    private width: number;
    private height: number;
    container: PIXI.Container;

    // 所有包含的子网格
    contents: { [key: string]: GridTitle | Subgrid | GridContainer };

    // 是否计算价值（左侧的当前总价值）
    countable: boolean;

    // Inventory 的所在区域。（是在个人物资区域还是战利品区域，如果是枪上的配件需要单独处理）
    // （虽然 Inventory 不可能是一个枪的配件，但还是这么写了，方便处理）
    parentRegion: Region | Item | null = null;

    // 滚动相关
    scrollable: boolean;
    baseY: number = 0;
    maxHeight: number = 128;

    // 启用状态（false 将会不可见，此时无法将 Item 拖动到对应的 Inventory 中）
    enabled: boolean = true;

    // 搜索相关（放大镜转圈）
    private currentSearchItem: Item | null = null;
    private magnify: Magnify | null = null;
    private searchTimer: number = 0;

    constructor(
        title: string,
        options: {
            position: {x: number, y: number},
            size: {width: number, height: number},
            countable: boolean,
            scrollable: boolean,
            parentRegion: Region | Item | null,
        }
    ) {
        this.title = title;
        this.countable = options.countable;
        this.scrollable = options.scrollable;
        this.width = options.size.width;
        this.height = options.size.height;
        this.parentRegion = options.parentRegion;

        this.contents = {};
        this.container = new PIXI.Container();
        this.container.position.set(options.position.x, options.position.y);

        this.initUI();
        this.initContent();
        this.refreshUI();
    }

    /**
     * 初始化 UI
     */
    initUI () {
        // 创建遮罩
        const mask = new PIXI.Graphics();
        mask.rect(0, 0, this.width, this.height);
        mask.fill({ color: 0xffffff });
        this.container.addChild(mask);
        this.container.mask = mask;

        const bg = new PIXI.Graphics();
        bg.rect(0, 0, this.width, this.height);
        bg.fill({ color: 0xffffff, alpha: 0.1 });
        this.container.addChild(bg);

        // 添加滚动事件
        this.container.interactive = true;
        this.container.on("wheel", this.onScroll.bind(this));
    }

    /**
     * 初始化内容。如果是玩家盒子的话就创建需要的头、甲、枪、背包、胸挂等。
     */
    initContent() {
        if (this.scrollable) {
            for (const info of window.game.GRID_INFO) {
                // this.createObject(info);
                if (info.type === 'Grid') {
                        const subgrid = new Subgrid(
                            window.game,
                            1,
                            1,
                            info.cellsize,
                            info.aspect,
                            info.fullfill,
                            this.countable,
                            info.accept,
                            info.name
                        );
                        subgrid.parentRegion = this.parentRegion;
                        this.contents[info.name] = subgrid;
                        this.container.addChild(subgrid.container);
                } else if (info.type === 'GridTitle') {
                    const gridTitle = new GridTitle(
                        window.game,
                        info.name,
                        36,
                        13.8
                    );
                    this.contents[info.name] = gridTitle;
                    this.container.addChild(gridTitle.container);
                } else if (info.type === 'GridContainer') {
                    const gridContainer = new GridContainer(
                        window.game,
                        info.name,
                        [],
                        4,
                        false,
                        DEFAULT_CELL_SIZE,
                        1,
                        false,
                        this.countable,
                        []
                    );
                    gridContainer.parentRegion = this.parentRegion;
                    this.contents[info.name] = gridContainer;
                    this.container.addChild(gridContainer.container);
                }
            }
            // 定义口袋
            (this.contents['pocket'] as GridContainer).layout = [
                [1, 1, 0, 0], [1, 1, 1.05, 0], [1, 1, 2.1, 0], [1, 1, 3.15, 0], [1, 1, 4.2, 0]
            ];
            (this.contents['pocket'] as GridContainer).initSubgrids();
            // 定义安全箱
            (this.contents['ContainerSecure'] as GridContainer).layout = [
                [3, 3, 0, 0]
            ];
            (this.contents['ContainerSecure'] as GridContainer).initSubgrids();
            try {
                // 胸挂回调函数
                (this.contents['ChestRig'] as Subgrid).onItemDraggedIn = (item, _col, _row) => {
                    // console.log('there', item.subgridLayout);
                    (this.contents['ContainerChestRigs'] as GridContainer).layout = item.subgridLayout;
                    // console.log(item.subgrids);
                    if (Object.keys(item.subgrids).length > 0) {
                        for (const subgrid of Object.values(item.subgrids)) {
                            (this.contents['ContainerChestRigs'] as GridContainer).subgrids.push(subgrid);
                        }
                        (this.contents['ContainerChestRigs'] as GridContainer).refreshUI();
                    } else {
                        (this.contents['ContainerChestRigs'] as GridContainer).initSubgrids();
                    }
                    // console.log('Moved in!')
                    this.refreshUI();
                }
                (this.contents['ChestRig'] as Subgrid).onItemDraggedOut = (item) => {
                    // 将当前背包/胸挂的内容备份至 item 内
                    item.subgrids = {};
                    for (const subgrid of Object.values((this.contents['ContainerChestRigs'] as GridContainer).subgrids)) {
                        item.subgrids[subgrid.title] = subgrid;
                    }
                    (this.contents['ContainerChestRigs'] as GridContainer).layout = [];
                    (this.contents['ContainerChestRigs'] as GridContainer).initSubgrids();
                    this.refreshUI();
                }
            } catch(error) {
                console.error('添加胸挂道具时出现错误：', this.contents['ChestRig'])
                console.error(error)
            }
            try{
                // 背包回调函数
                (this.contents['Backpack'] as Subgrid).onItemDraggedIn = (item, _col, _row) => {
                    // console.log('there');
                    (this.contents['ContainerBackpack'] as GridContainer).layout = item.subgridLayout;
                    if (Object.keys(item.subgrids).length > 0) {
                        for (const subgrid of Object.values(item.subgrids)) {
                            (this.contents['ContainerBackpack'] as GridContainer).subgrids.push(subgrid);
                        }
                        // console.log((this.contents['ContainerBackpack'] as GridContainer).subgrids);
                        // console.log('ccc');
                        (this.contents['ContainerBackpack'] as GridContainer).refreshUI();
                        // console.log('ddd');
                    } else {
                        (this.contents['ContainerBackpack'] as GridContainer).initSubgrids();
                    }
                    this.refreshUI();
                }
                (this.contents['Backpack'] as Subgrid).onItemDraggedOut = (item) => {
                    // 将当前背包/胸挂的内容备份至 item 内
                    item.subgrids = {};
                    for (const subgrid of Object.values((this.contents['ContainerBackpack'] as GridContainer).subgrids)) {
                        item.subgrids[subgrid.title] = subgrid;
                    }
                    (this.contents['ContainerBackpack'] as GridContainer).layout = [];
                    (this.contents['ContainerBackpack'] as GridContainer).initSubgrids();
                    this.refreshUI();
                }
            } catch(error) {
                console.error('添加背包道具时出现错误：', this.contents['Backpack'])
                console.error(error)
            }
        } else {
            const spoilsBox = new Subgrid(
                window.game,
                7,
                8,
                72,
                1,
                false,
                false,
                [],
                "spoilsBox"
            );
            spoilsBox.parentRegion = this.parentRegion;
            // console.log(this, spoilsBox)
            // console.log(this.parentRegion, spoilsBox.parentRegion)
            this.contents["spoilsBox"] = spoilsBox;
            this.container.addChild(spoilsBox.container);
        }
    }

    /**
     * 刷新 UI（部分对 UI 的调整需要刷新）
     */
    refreshUI() {
        let currentY = this.baseY + 8;
        let currentX = 8;
        let maxHeight = 156;

        for (const info of window.game.GRID_INFO) {
            const item = this.contents[info.name];
        //     console.log(item);
        //     if(item instanceof GridContainer && item.subgrids.length > 0) {
        //     console.log(item.subgrids[0].container.position)
        //     console.log(item.container.position)
        // }
        // console.log('now pos:', currentX, currentY, info.name)
            if (item instanceof GridTitle) {
                // 标题位置设置
                item.container.position.set(8, currentY);
                currentY += item.container.height + 8; // 标题后添加间距
            } else if (item instanceof Subgrid) {
                // 特殊物品的位置处理
                if (item.acceptedTypes.includes("primaryWeapon")) {
                    item.container.position.set(8, currentY);
                } else if (item.acceptedTypes.includes("SecondaryWeapon")) {
                    item.container.position.set(348, currentY);
                    currentY += 136;
                } else if (item.acceptedTypes.includes("knife")) {
                    item.container.position.set(348, currentY);
                    currentY += 136;
                } else if (item.acceptedTypes.includes("helmet")) {
                    item.container.position.set(8, currentY);
                } else if (item.acceptedTypes.includes("armor")) {
                    item.container.position.set(260, currentY);
                    currentY += 144;
                } else {
                    // 普通容器的位置设置
                    item.container.position.set(currentX, currentY);
                    maxHeight = item.additiveSize.y + 8;
                    currentX += item.additiveSize.x + 8;
                    if (!item.fullfill) {
                        currentY += maxHeight;
                        maxHeight = 0;
                        currentX = 8;
                    }
                }
            } else if (item instanceof GridContainer) {
                item.container.position.set(currentX, currentY);
                maxHeight = Math.max(maxHeight, item.additiveSize.y + 8);
                currentX += item.additiveSize.x + 8;
                if (!item.fullfill) {
                    currentY += maxHeight;
                    maxHeight = 0;
                    currentX = 8;
                }
            }
        }
        this.maxHeight = (currentY) - this.baseY - 580;
    }

    /**
     * Handle the scroll event
     * @param {PIXI.FederatedMouseEvent} event - The scroll event
     * */
    onScroll(event: any) {
        const delta = event.deltaY; // 获取滚动的方向和距离
        this.baseY -= delta; // 根据滚动方向调整内容位置

        // clamp
        if (this.baseY > 0) {
            this.baseY = 0;
        } else if (this.baseY < -(this.maxHeight)) {
            this.baseY = -this.maxHeight
        }
        this.refreshUI();
        // console.log(this.baseY)
    }

    /**
     * 设置启用状态
     * @param enabled 是否启用
     */
    setEnabled(enabled: boolean) {
        this.enabled = enabled;
        // 遍历所有的subgrid并设置启用状态
        for (const grid of Object.values(this.contents)) {
            grid.setEnabled(enabled);
        }
        this.container.visible = enabled;
    }

    /**
     * 添加一个物品。
     * （Inventory 处理：如果是能装备的道具，尽量先尝试装备，无法装备在转移到背包里）
     * @param item 要添加的物品
     * @returns 是否添加成功
     */
    addItem(item: Item) {
        for (const subgrid of Object.values(this.contents).filter(item => item instanceof Subgrid)) {
            if (subgrid.addItem(item)) {
                return true;
            }
        }
        for (const subgrid of Object.values(this.contents).filter(item => item instanceof GridContainer)) {
            if (subgrid.addItem(item)) {
                return true;
            }
        }
        return false;
    }

    /**
     * 清空所有物品
     */
    clearItem() {
        for (const subgrid of Object.values(this.contents)) {
            if (subgrid instanceof GridTitle) {
                continue;
            }
            subgrid.clearItem();
        }
    }

    /**
     * Tick 函数，一般每帧执行一次
     */
    update() {
        if (!this.enabled) {
            this.currentSearchItem = null;
            if(this.magnify) {
                this.magnify.hide();
                this.magnify = null;
            }
            this.searchTimer = 0;
            return;
        }
        // 检查是否有需要搜索的物品
        if (window.game.needSearch && !this.currentSearchItem) {
            const itemToSearch = this.findNextSearchableItem();
            if (itemToSearch) {
                this.startSearchItem(itemToSearch);
            }
        }

        // 更新搜索计时
        if (this.currentSearchItem) {
            this.searchTimer += window.game.app.ticker.deltaMS / 1000; // 转换为秒
            if (this.searchTimer >= this.currentSearchItem.searchTime) { // 1秒后完成搜索
                this.completeSearch();
            }
        }
    }

    /**
     * 找到下一个需要搜索的物品
     * @returns 下一个需要搜索的物品，若没有则返回 null
     */
    private findNextSearchableItem(): Item | null {
        for (const key in this.contents) {
            const content = this.contents[key];
            if (content instanceof Subgrid) {
                for (const item of content.blocks) {
                    if (!item.searched) {
                        return item;
                    }
                }
            } else if (content instanceof GridContainer) {
                for (const subgrid of content.subgrids) {
                    for (const item of subgrid.blocks) {
                        if (!item.searched) {
                            return item;
                        }
                    }
                }
            }
        }
        return null;
    }

    /**
     * 开始搜索物品
     * @param item 要搜索的物品
     */
    private startSearchItem(item: Item) {
        this.currentSearchItem = item;
        this.searchTimer = 0;

        // 创建放大镜动画
        if(!this.currentSearchItem.parentGrid) return;
        const parentGrid = this.currentSearchItem.parentGrid;
        const x = parentGrid.container.position.x + 
            (this.currentSearchItem.col + (this.currentSearchItem.cellWidth-1) / 2) * 
            parentGrid.cellSize * parentGrid.aspect;
        const y = parentGrid.container.position.y + 
            (this.currentSearchItem.row + (this.currentSearchItem.cellHeight-1) / 2) * 
            parentGrid.cellSize;
        this.magnify = new Magnify(
            parentGrid.container,
            x,
            y,
            72,
            72
        );
        this.magnify.show();
    }

    /**
     * 完成搜索
     */
    private completeSearch() {
        if (this.currentSearchItem) {
            this.currentSearchItem.searched = true;
            this.currentSearchItem.searchMask.visible = false;
        }

        // 移除放大镜
        if (this.magnify) {
            this.magnify.hide();
            this.magnify = null;
        }

        this.currentSearchItem = null;
        this.searchTimer = 0;
    }
}
