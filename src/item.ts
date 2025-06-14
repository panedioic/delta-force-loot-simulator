import * as PIXI from "pixi.js";
// import * as text from '@pixi/text';

import { Game } from "./game";
import { Subgrid } from "./subgrid";
import { GAME_WIDTH, GAME_HEIGHT } from "./config";
import { DEFAULT_CELL_SIZE } from "./config";
import { updateTotalValueDisplay } from "./utils";
import { Region } from "./region";
import { RARITY_COLORS } from "./config";
// import type { Grid, Inventory } from "./types";

export class Item {
    game: Game;
    parentGrid: Subgrid | null;
    col: number;
    row: number;
    x: number;
    y: number;
    // itemType: any;
    cellWidth: number;
    cellHeight: number;
    originCellWidth: number;
    originCellHeight: number;
    pixelWidth: number;
    pixelHeight: number;
    color: string;
    baseValue: number;
    name: string;
    type: string;
    search: number;
    cellSize: number;
    aspect: number;
    fullfill: boolean;
    container: PIXI.Container;
    graphicsBg: PIXI.Graphics;
    graphicsText: PIXI.Container | null;
    subgridLayout: Array<[number, number, number, number]> = [];
    subgrids: { [key: string]: Subgrid } = {};
    accessories: Array<{type: string, title: string}> = [];
    maxStackCount: number;
    currentStactCount: number;
    ammoType: string | null;
    ammo: { [key: string]: number } = {};
    capacity: number | null;
    conflicts: { [key: string]: string[] } = {};
    parentRegion: Region | Item | null = null;
    rarity: number | null;

    /** 拖动相关 */
    dragStartParentContainer: PIXI.Container;
    dragStartItemLocalPosition: PIXI.Point;
    dragStartItemGlobalPosition: PIXI.Point;
    dragStartMouseGlobalPoint: PIXI.Point;
    isDragging: boolean;
    hasMoved: boolean;
    dragOverlay: PIXI.Graphics | null;
    previewIndicator: PIXI.Graphics | null;

    /** 单双击相关 */
    clickTimeout: number | null;
    clickCount: number;

    /** 搜索 */
    searched: boolean;
    searchTime: number;
    searchMask: PIXI.Graphics;

    constructor(game: Game, parentGrid: Subgrid | null, type: string, itemType: any) {
        this.game = game;
        this.parentGrid = parentGrid;
        this.col = 0;
        this.row = 0;
        this.x = 0;
        this.y = 0;
        // this.itemType = itemType;
        this.cellWidth = itemType.cellWidth;
        this.cellHeight = itemType.cellHeight;
        this.originCellWidth = this.cellWidth;
        this.originCellHeight = this.cellHeight;
        this.pixelWidth =
            this.parentGrid ? this.cellWidth * this.parentGrid.cellSize * this.parentGrid.aspect : this.cellWidth * DEFAULT_CELL_SIZE;
        this.pixelHeight = this.parentGrid ? this.cellHeight * this.parentGrid.cellSize : this.cellHeight * DEFAULT_CELL_SIZE;
        this.color = itemType.color;
        this.baseValue = itemType.value;
        this.name = itemType.name;
        this.type = type || "collection";
        this.search = itemType.search || 1.2;
        this.subgridLayout = itemType.subgridLayout;
        this.accessories = itemType.accessories ? JSON.parse(JSON.stringify(itemType.accessories)) : [];
        this.maxStackCount = itemType.maxStack || 1;
        this.currentStactCount = itemType.stack || 1;
        this.ammoType = itemType.ammo;
        this.capacity = itemType.capacity;
        this.conflicts = itemType.conflict || {};
        this.rarity = itemType.rarity || null;

        // 只用作检查
        this.cellSize = this.parentGrid ? this.parentGrid.cellSize : DEFAULT_CELL_SIZE;
        this.aspect = this.parentGrid ? this.parentGrid.aspect : 1;
        this.fullfill = false;

        this.container = new PIXI.Container();
        // this.container.position.set(this.x, this.y);
        this.graphicsBg = new PIXI.Graphics();
        this.graphicsText = null;

        this.dragStartParentContainer = this.container.parent;
        this.dragStartItemLocalPosition = new PIXI.Point(this.x, this.y);
        this.dragStartItemGlobalPosition = new PIXI.Point(this.x, this.y);
        this.dragStartMouseGlobalPoint = new PIXI.Point(this.x, this.y);
        this.isDragging = false;
        this.hasMoved = false;
        this.dragOverlay = null;
        this.previewIndicator = null;

        this.subgrids = {};
        this.initAccessories();

        this.addEventListeners();

        this.clickTimeout = null;
        this.clickCount = 0;

        this.searchTime = 1;
        if (window.game.needSearch) {
            this.searched = false;
            this.searchMask = new PIXI.Graphics();
        } else {
            this.searched = true;
            this.searchMask = new PIXI.Graphics();
            this.searchMask.visible = false;
        }

        this.initUI();

        // 处理冲突列表
        if (itemType.conflict) {
            // 将冲突列表转换为字典形式
            for (const [type1, type2] of itemType.conflict) {
                // 添加双向冲突
                if (!this.conflicts[type1]) {
                    this.conflicts[type1] = [];
                }
                if (!this.conflicts[type2]) {
                    this.conflicts[type2] = [];
                }
                this.conflicts[type1].push(type2);
                this.conflicts[type2].push(type1);
            }
        }
    }

    initUI() {
        // 清空之前的图形内容（避免重复绘制）
        if (this.graphicsBg) {
            this.container.removeChild(this.graphicsBg);
        }
        if (this.graphicsText) {
            this.container.removeChild(this.graphicsText);
        }

        // 创建背景图形
        this.graphicsBg = new PIXI.Graphics();

        // 确保颜色是有效的十六进制值
        const color = this.rarity ? RARITY_COLORS[this.rarity] : parseInt(this.color, 16);

        const pixelWidth = this.parentGrid ? 
            this.parentGrid.fullfill ? 
                this.parentGrid.cellSize * this.parentGrid.aspect : 
                this.cellWidth * this.parentGrid.cellSize * this.parentGrid.aspect : 
                this.cellWidth * 72;
        const pixelHeight = this.parentGrid ? 
            this.parentGrid.fullfill ? 
                this.parentGrid.cellSize : 
                this.cellHeight * this.parentGrid.cellSize : 
                this.cellHeight * 72;
        this.graphicsBg.rect(
            2,
            2,
            pixelWidth - 4, // 减去边框宽度
            pixelHeight - 4,
        );
        this.graphicsBg.fill({ color: color });
        this.graphicsBg.stroke({ width: 3, color: 0x666666, alpha: 0.8 });

        // 添加背景到容器
        this.container.addChild(this.graphicsBg);

        // 创建文字容器
        this.graphicsText = new PIXI.Container();

        // 添加方块名称
        const nameText = new PIXI.Text({
            text: this.name || "未知",
            style: {
                fontFamily: "Arial",
                fontSize: 16,
                fill: 0xffffff,
                fontWeight: "bold",
                stroke: { color: "black", width: 3 },
            },
        });
        nameText.anchor.set(0.5);
        nameText.position.set(pixelWidth / 2, pixelHeight / 2 - 10); // 名称显示在方块中心上方
        this.graphicsText.addChild(nameText);

        // 添加方块价值
        const valueText = new PIXI.Text({
            text: this.getValue()
                .toString()
                .replace(/\B(?=(\d{3})+(?!\d))/g, ","),
            style: {
                fontFamily: "Arial",
                fontSize: 21,
                fill: 0xffffff,
                fontWeight: "bold",
                stroke: { color: "black", width: 3 },
            },
        });
        valueText.anchor.set(0.5);
        valueText.position.set(pixelWidth / 2, pixelHeight / 2 + 10); // 价值显示在方块中心下方
        this.graphicsText.addChild(valueText);

        // 如果物品可堆叠，添加堆叠数量显示
        if (this.maxStackCount > 1) {
            const stackText = new PIXI.Text({
                text: `x${this.currentStactCount}`,
                style: {
                    fontFamily: "Arial",
                    fontSize: 16,
                    fill: 0xffffff,
                    fontWeight: "bold",
                    stroke: { color: "black", width: 3 },
                },
            });
            stackText.anchor.set(1, 1); // 右下角对齐
            stackText.position.set(
                this.pixelWidth / 2 - 5,  // 右边缘留5像素边距
                this.pixelHeight / 2 - 5   // 下边缘留5像素边距
            );
            this.graphicsText.addChild(stackText);
        }

        // 有子弹，需要显示子弹数量
        if (this.ammoType) {
            const stackText = new PIXI.Text({
                text: `${this.getTotalAmmo()}/${this.capacity}`,
                style: {
                    fontFamily: "Arial",
                    fontSize: 16,
                    fill: 0xffffff,
                    fontWeight: "bold",
                    stroke: { color: "black", width: 3 },
                },
            });
            stackText.anchor.set(1, 1); // 右下角对齐
            stackText.position.set(
                this.pixelWidth / 2 - 5,  // 右边缘留5像素边距
                this.pixelHeight / 2 - 5   // 下边缘留5像素边距
            );
            this.graphicsText.addChild(stackText);
        }

        // 设置文字容器的位置
        this.graphicsText.position.set(0, 0);

        // 添加文字到容器
        this.container.addChild(this.graphicsText);

        // this.searchMask = new PIXI.Graphics();
        // 绘制边框
        this.searchMask.rect(
            2,
            2,
            pixelWidth - 4, // 减去边框宽度
            pixelHeight - 4,
        );
        this.searchMask.fill({ color: 0x040404 });
        this.searchMask.stroke({ width: 3, color: 0x666666, alpha: 0.8 });
        this.container.addChild(this.searchMask);

        if (this.searched) {
            this.searchMask.visible = false;
        }
    }

    refreshUI() {
        if (!this.graphicsText) return;

        // 更新名称、价值位置
        const pixelWidth = this.parentGrid ? 
            this.parentGrid.fullfill ? 
                this.parentGrid.cellSize * this.parentGrid.aspect : 
                this.cellWidth * this.parentGrid.cellSize * this.parentGrid.aspect : 
                this.cellWidth * 72;
        const pixelHeight = this.parentGrid ? 
            this.parentGrid.fullfill ? 
                this.parentGrid.cellSize : 
                this.cellHeight * this.parentGrid.cellSize : 
                this.cellHeight * 72;
        const nameGraph = this.graphicsText.children[0] as PIXI.Graphics;
        const valueGraph = this.graphicsText.children[1] as PIXI.Graphics;
        nameGraph.position.set(pixelWidth / 2, pixelHeight / 2 - 10);
        valueGraph.position.set(pixelWidth / 2, pixelHeight / 2 + 10);
        
        // 更新价值显示
        const valueText = this.graphicsText.children[1] as PIXI.Text;
        const totalValue = this.getValue();
        valueText.text = totalValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

        // 更新堆叠数量显示
        if (this.maxStackCount > 1) {
            const stackText = this.graphicsText.children[2] as PIXI.Text;
            if (stackText) {
                stackText.text = `x${this.currentStactCount}`;
            }
        }

        // 更新子弹数量显示
        if (this.ammoType) {
            const ammoText = this.graphicsText.children[2] as PIXI.Text;
            if (ammoText) {
                const totalAmmo = this.getTotalAmmo();
                ammoText.text = `${totalAmmo}/${this.capacity || 0}`;
            }
        }

        // refresh active item panel if exists
        if (this.game.activeItemInfoPanel) {
            const pos = this.game.activeItemInfoPanel.getPosition();
            this.game.activeItemInfoPanel.close();
            this.game.createItemInfoPanel(this);
            if (this.game.activeItemInfoPanel) {
                this.game.activeItemInfoPanel.setPosition(pos);
            }
        }
    }

    addEventListeners() {
        this.container.eventMode = "static";

        this.container.on('pointerdown', (event) => {
            if(!this.searched) {
                return;
            }
            if (this.game.isGameStarted) {
                // 增加点击数量
                this.clickCount++;

                // 进行拖动相关判定
                this.isDragging = false;
                this.hasMoved = false;

                // 记录初始位置
                this.dragStartParentContainer = this.container.parent;
                this.dragStartItemLocalPosition = this.container.position.clone();
                this.dragStartItemGlobalPosition = this.container.getGlobalPosition();
                this.dragStartMouseGlobalPoint = event.global.clone();
        
                // 绑定移动事件
                this.container.on("pointermove", this.onDragMove.bind(this));
                this.container.on("wheel", (event) => {
                    // console.log(event)
                    const globalMousePosition = event.global;
                    if (window.game.playerRegion) {
                        const playerInventoryBounds = window.game.playerRegion.inventories[0].container.getBounds();
                        if (globalMousePosition.x > playerInventoryBounds.x &&
                            globalMousePosition.x < playerInventoryBounds.x + playerInventoryBounds.width &&
                            globalMousePosition.y > playerInventoryBounds.y &&
                            globalMousePosition.y < playerInventoryBounds.y + playerInventoryBounds.height) {
                                window.game.playerRegion.inventories[0].onScroll(event);
                                return;
                        }
                    }
                    if (window.game.spoilsRegion) {
                        const currentSpoilsInventoryIndex = window.game.spoilsRegion.currentInventoryId;
                        if (currentSpoilsInventoryIndex >= window.game.spoilsRegion.inventories.length) {
                            return;
                        }
                        const spoilsInventoryBounds = window.game.spoilsRegion.inventories[currentSpoilsInventoryIndex].container.getBounds();
                        if (globalMousePosition.x > spoilsInventoryBounds.x &&
                            globalMousePosition.x < spoilsInventoryBounds.x + spoilsInventoryBounds.width &&
                            globalMousePosition.y > spoilsInventoryBounds.y &&
                            globalMousePosition.y < spoilsInventoryBounds.y + spoilsInventoryBounds.height) {
                                window.game.spoilsRegion.inventories[currentSpoilsInventoryIndex].onScroll(event);
                                return;
                        }
                    }
                });
                this.onDragStart(event);   
            }
        });

        this.container.on("pointerup", () => {
            // 移除拖动时的事件监听
            this.container.off("pointermove");
            if (this.isDragging) {
                // 如果发生拖动，就不再处理单击或双击
                this.clickCount = 0;
                this.onDragEnd();
            } else {
                if (this.clickCount === 1) {
                    // 200ms 内如果没有第二次点击，就认为是单击
                    this.clickTimeout = window.setTimeout(() => {
                        this.clickCount = 0;
                        this.clickTimeout = null;
                        this.onClick();
                    }, 200); 
                } else if (this.clickCount === 2) {
                    // 如果是双击，直接触发双击行为，不再等待三击，清除单击效果
                    if (this.clickTimeout) { 
                        window.clearTimeout(this.clickTimeout);
                    }
                    this.clickCount = 0;
                    this.clickTimeout = null;
                    this.onClick(2);
                }
            }
        });

        // 添加全局键盘事件监听
        window.addEventListener("keydown", this.onKeyDown.bind(this));
    }

    onClick(clickCount=1) {
        if (clickCount === 1) {
            this.game.createItemInfoPanel(this);
        } else if (clickCount === 2) {
            if (!this.parentRegion) {
                return;
            }
            const realParentRegion = this.parentRegion instanceof Region ? 
                this.parentRegion : this.parentRegion.parentRegion;
            if (!realParentRegion) {
                return;
            }
            const targetRegion = realParentRegion === window.game.playerRegion ?
                window.game.spoilsRegion : window.game.playerRegion;
            if (!targetRegion) {
                return;
            }
            targetRegion.addItem(this);
        }
    }

    onDragStart(_: PIXI.FederatedPointerEvent) {

    }

    /**
     * 结束拖动事件
     */
    onDragEnd() {
        this.container.alpha = 1;

        if (!this.isDragging) return;

        // 移除预览指示器 & 移除拖动覆盖层
        if (this.previewIndicator) {
            this.game.app.stage.removeChild(this.previewIndicator);
            this.previewIndicator = null;
        }
        if (this.dragOverlay) {
            this.container.removeChild(this.dragOverlay);
            this.dragOverlay = null;
        }

        // 获取当前鼠标位置对应的网格
        const mousePosition = this.game.app.renderer.events.pointer.global;
        const targetGrid = this.game.findGrid(mousePosition.x, mousePosition.y);

        // 位置不合法或不可交互，返回原位置
        let bReturnToOriginalPosition = false;

        // 如果找到了目标网格
        if (targetGrid) {
            // 获取网格中的位置
            const gridPosition = targetGrid.getGridPositionFromGlobal(
                mousePosition.x,
                mousePosition.y,
                this,
            );

            // 获取重叠的物品
            const overlappingItems = targetGrid.getOverlappingItems(this, gridPosition.clampedCol, gridPosition.clampedRow);
            const overlappingItemsRotated = targetGrid.getOverlappingItems(this, gridPosition.clampedCol, gridPosition.clampedRow, true);
            
            if (overlappingItems.length === 0 || overlappingItemsRotated.length === 0) {
                // 无重叠物品，检查边界和类型
                const isPositionValid = 
                    targetGrid.checkBoundary(this, gridPosition.clampedCol, gridPosition.clampedRow) &&
                    targetGrid.checkAccept(this); //
                if (!isPositionValid) {
                    // 如果位置不合法，检查旋转
                    const isPositionValidRotated = 
                        targetGrid.checkBoundary(this, gridPosition.clampedCol, gridPosition.clampedRow, true) &&
                        targetGrid.checkAccept(this);
                    if (!isPositionValidRotated) {
                        bReturnToOriginalPosition = true;
                    } else {
                        const temp = this.cellWidth;
                        this.cellWidth = this.cellHeight;
                        this.cellHeight = temp;
                        targetGrid.addItem(this, gridPosition.clampedCol, gridPosition.clampedRow);
                    }
                } else {
                    console.log(gridPosition)
                    targetGrid.addItem(this, gridPosition.clampedCol, gridPosition.clampedRow);
                }
            } else {
                // 先检查是否可以交互
                // 有重叠的物品，尝试触发交互
                let bCanInteract = true;
                for (const overlappingItem of overlappingItems) {
                    bCanInteract = bCanInteract && overlappingItem.onItemInteractPreview(this, {
                        col: gridPosition.clampedCol,
                        row: gridPosition.clampedRow
                    }, overlappingItems);
                    if (bCanInteract === false) {
                        break;
                    }
                }
                // 可以交互，进行交互
                if (bCanInteract) {
                    for (const overlappingItem of overlappingItems) {
                        // console.log(333, overlappingItem.name)
                        overlappingItem.onItemInteract(this, {
                            col: gridPosition.clampedCol,
                            row: gridPosition.clampedRow
                        }, overlappingItems);
                    }
                } else {
                    let bCanInteractRotated = true;
                    for (const overlappingItem of overlappingItemsRotated) {
                        bCanInteractRotated = bCanInteractRotated && overlappingItem.onItemInteractPreview(this, {
                            col: gridPosition.clampedCol,
                            row: gridPosition.clampedRow
                        }, overlappingItemsRotated);
                    }
                    if(bCanInteractRotated) {
                        for (const overlappingItem of overlappingItemsRotated) {
                            overlappingItem.onItemInteract(this, {
                                col: gridPosition.clampedCol,
                                row: gridPosition.clampedRow
                            }, overlappingItemsRotated);
                        }
                    } else {
                        bReturnToOriginalPosition = true;
                    }
                }
            }
        } else {
            // 如果没有找到目标网格，返回原位置
            bReturnToOriginalPosition = true;
        }

        if (bReturnToOriginalPosition) {
            if (this.parentGrid) {
                this.container.position.copyFrom(this.dragStartItemLocalPosition);
                this.dragStartParentContainer.addChild(this.container);
            }
        }

        // 更新总价值显示
        updateTotalValueDisplay();
        
        this.isDragging = false;
        this.hasMoved = false;
    }

    onDragMove(event: PIXI.FederatedPointerEvent) {
        // 检查是否移动超过阈值（3像素）才开始真正的拖动
        const dx = event.global.x - this.dragStartMouseGlobalPoint.x;
        const dy = event.global.y - this.dragStartMouseGlobalPoint.y;
        if (!this.isDragging && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
            this.isDragging = true;
            this.container.alpha = 0.7;

            // 创建预览指示器
            if (!this.previewIndicator) {
                this.previewIndicator = new PIXI.Graphics();
                this.game.app.stage.addChild(this.previewIndicator);
            }

            // 创建拖动覆盖层
            if (!this.dragOverlay) {
                this.dragOverlay = new PIXI.Graphics();
                this.dragOverlay.beginFill(0x000000, 0.1);
                this.dragOverlay.drawRect(
                    -GAME_WIDTH,
                    -GAME_HEIGHT,
                    GAME_WIDTH * 3,
                    GAME_HEIGHT * 3,
                );
                this.dragOverlay.endFill();
                this.container.addChild(this.dragOverlay);
            }

            // 移动到舞台顶层
            const globalPosition = this.container.getGlobalPosition();
            this.game.app.stage.addChild(this.container);
            this.container.position.set(globalPosition.x, globalPosition.y);
        }

        if (this.isDragging) {
            // 更新位置
            const newX = this.dragStartItemGlobalPosition.x + dx;
            const newY = this.dragStartItemGlobalPosition.y + dy;
            this.container.position.set(newX, newY);

            // 更新预览指示器
            this.updatePreviewIndicator(event.global.x, event.global.y);
        }
    }

    onKeyDown(event: any) {
        if (event.key.toLowerCase() === "r") {
            // console.log(this.isDragging)
            if (this.isDragging) {
                // 交换宽度和高度以实现旋转
                const t1 = this.cellWidth;
                this.cellWidth = this.cellHeight;
                this.cellHeight = t1;

                // 更新图形
                // const t2 = this.graphicsBG.width;
                // this.graphicsBg.width = this.graphicsBg.height;
                // this.graphicsBg.height = t2;
                // console.log('方块已旋转');
            }
        }
    }

    updatePreviewIndicator(x: number, y: number) {
        if (!this.previewIndicator) return;

        this.previewIndicator.clear();

        // 确定在哪个区域
        let globalPos, baseX, baseY, grid;
        grid = this.game.findGrid(x, y);
        if (!grid) {
            // console.log('没有找到对应的网格');
            return;
        }

        // 获取网格的全局位置和放置位置
        const { clampedCol, clampedRow, snapX, snapY } =
            grid.getGridPositionFromGlobal(x, y, this);

        globalPos = grid.getGlobalPosition();
        baseX = globalPos.x;
        baseY = globalPos.y;

        // 获取重叠的物品
        const overlappingItems = grid.getOverlappingItems(this, clampedCol, clampedRow);
        // console.log(overlappingItems)
        const overlappingItemsRotated = grid.getOverlappingItems(this, clampedCol, clampedRow, true);
        
        // 判断是否可以放置
        let canPlace = false;
        let canPlaceRotated = false;
        let bCanInteract = false;
        let bCanInteractRotated = false;
        if (overlappingItems.length === 0 || overlappingItemsRotated.length === 0) {
            // 无重叠物品，检查边界和类型
            canPlace = overlappingItems.length === 0 &&
                grid.checkBoundary(this, clampedCol, clampedRow) &&
                grid.checkAccept(this);
            if (!canPlace) {
                canPlaceRotated = grid.checkBoundary(this, clampedCol, clampedRow, true) &&
                    grid.checkAccept(this);
            }
        } else {
            // 有重叠物品，检查是否可以交互
            bCanInteract = true;
            for (const overlappingItem of overlappingItems) {
                bCanInteract = bCanInteract && overlappingItem.onItemInteractPreview(this, {
                    col: clampedCol,
                    row: clampedRow
                }, overlappingItems);
                if (bCanInteract === false) {
                    break;
                }
            }
            if (!bCanInteract) {
                bCanInteractRotated = true;
                for (const overlappingItem of overlappingItemsRotated) {
                    bCanInteractRotated = bCanInteractRotated && overlappingItem.onItemInteractPreview(this, {
                        col: clampedCol,
                        row: clampedRow
                    }, overlappingItems);
                    if (bCanInteractRotated === false) {
                        break;
                    }
                }
            }
        }
        // console.log(canPlace, canPlaceRotated, bCanInteract, bCanInteractRotated)

        // 设置预览颜色
        const previewColor = (canPlace || canPlaceRotated || bCanInteract || bCanInteractRotated) ? 0x88ff88 : 0xff8888; // 浅绿色或浅红色

        const globalSnappedPosition = grid.getGridGlobalPosition({col: clampedCol, row: clampedRow});
        const drawX = grid.fullfill ? baseX :
            (bCanInteract || bCanInteractRotated) ? baseX + snapX - (this.cellWidth * this.cellSize) / 2 : // TODO
            // baseX + snapX + (this.cellWidth * this.cellSize) / 2;
            globalSnappedPosition.x;
        const drawY = grid.fullfill ? baseY :
            (bCanInteract || bCanInteractRotated) ? baseY + snapY - (this.cellHeight * this.cellSize) / 2 : // TODO
            globalSnappedPosition.y;
        // console.log(x, baseX, snapX, clampedCol)
        const drawWidth = grid.fullfill ? grid.width * grid.cellSize * grid.aspect :
            bCanInteract ? this.cellWidth * grid.cellSize : // TODO
            bCanInteractRotated ? this.cellHeight * grid.cellSize :
            canPlaceRotated ? this.cellHeight * grid.cellSize :
            this.cellWidth * grid.cellSize;
        const drawHeight = grid.fullfill ? grid.height * grid.cellSize :
            bCanInteract ? this.cellHeight * grid.cellSize : // TODO
            bCanInteractRotated ? this.cellWidth * grid.cellSize :
            canPlaceRotated ? this.cellWidth * grid.cellSize :
            this.cellHeight * grid.cellSize;

        // Draw Preview
        this.previewIndicator.rect(drawX, drawY, drawWidth, drawHeight);
        this.previewIndicator.fill({ color: previewColor, alpha: 0.5 });

        // 绘制预览
        // if (grid.fullfill) {
        //     this.previewIndicator.beginFill(previewColor);
        //     this.previewIndicator.drawRect(
        //         baseX,
        //         baseY,
        //         grid.width * grid.cellSize * grid.aspect,
        //         grid.height * grid.cellSize,
        //     );
        //     this.previewIndicator.endFill();
        // } else {
        //     this.previewIndicator.beginFill(previewColor);
        //     this.previewIndicator.drawRect(
        //         baseX + snapX - (this.cellWidth * this.cellSize) / 2,
        //         baseY + snapY - (this.cellHeight * this.cellSize) / 2,
        //         this.cellWidth * this.cellSize,
        //         this.cellHeight * this.cellSize,
        //     );
        //     this.previewIndicator.endFill();
        // }
    }

    resize(sizeX: number, sizeY: number) {
        this.graphicsBg.width = sizeX - 4;
        this.graphicsBg.height = sizeY - 4;
    }

    setGridPosition(col: number, row: number) {
        if (!this.parentGrid) {
            return;
        }
        this.col = col;
        this.row = row;
        // this.x =
        //     (col + 0.5 * this.cellWidth) *
        //     this.parentGrid.cellSize *
        //     this.parentGrid.aspect;
        // this.y = (row + 0.5 * this.cellHeight) * this.parentGrid.cellSize;
        this.x = col * this.cellWidth * this.parentGrid.cellSize * this.parentGrid.aspect;
        this.y = row * this.cellHeight * this.parentGrid.cellSize;
        this.container.position.set(
            col * this.parentGrid.cellSize * this.parentGrid.aspect, 
            row * this.parentGrid.cellSize
        );
        // console.log(col, row, this.cellHeight, this.parentGrid.cellSize)
    }

    getValue() {
        let ret = this.baseValue * this.currentStactCount;
        // console.log(this.baseValue, this.currentStactCount, ret)
        for (const subgrid of Object.values(this.subgrids)) {
            for (const item of Object.values(subgrid.blocks)) {
                ret += item.getValue();
            }
        }
        for (const [ammoType, ammoCount] of Object.entries(this.ammo)) {
            // console.log(this.ammo, ammoType, ammoCount)
            ret += ammoCount * this.game.BLOCK_TYPES.find(info => info.name ===ammoType).value;
        }
        return ret;
    }

    onAccessoryAdded(item: Item, _col: number, _row: number, previousGrid: Subgrid | null) {
        // 先检测是否有冲突
        // console.log(this, item)
        let bHasConflict = false;
        if (this.conflicts[item.type]) {
            for (const conflictedTypes of this.conflicts[item.type]) {
                for (const conflictSubgrid of Object.values(this.subgrids)) {
                    if (conflictSubgrid.acceptedTypes.includes(conflictedTypes) && conflictSubgrid.blocks.length > 0) {
                        bHasConflict = true;
                        break;
                    }
                }
            }
        }
        if (bHasConflict) {
            if (previousGrid) {
                previousGrid.addItem(item);
            }
            return false;
        }
        // 新的配件槽位
        if (item.accessories) {
            for (const newInfo of item.accessories) {
                this.accessories.push(newInfo);
                const newSubgrid = new Subgrid(
                    this.game,
                    1,
                    1,
                    72,
                    1,
                    true,
                    false,
                    [newInfo.type],
                    newInfo.title
                )
                this.subgrids[newInfo.title] = newSubgrid;
                newSubgrid.onItemDraggedIn = this.onAccessoryAdded.bind(this);
                newSubgrid.onItemDraggedOut = this.onAccessoryRemoved.bind(this);
                newSubgrid.setEnabled(false);
            }
        }
        if (item.capacity && this.capacity) {
            this.capacity += item.capacity;
        }
        this.refreshUI();
    }

    onAccessoryRemoved(item: Item, _previousGrid: Subgrid | null) {
        if (item.accessories) {
            for (const info of item.accessories) {
                if (this.subgrids[info.title]) {
                    delete this.subgrids[info.title];
                }
                if (this.accessories.includes(info)) {
                    this.accessories.splice(this.accessories.indexOf(info), 1);
                }
            }
        }
        if (item.capacity && this.capacity) {
            this.capacity -= item.capacity;
        }
        this.refreshUI();
    }

    /**
     * 初始化配件
     */
    initAccessories() {
        for(const info of this.accessories) {
            const subgrid = new Subgrid(
                this.game,
                1,
                1,
                72,
                1,
                true,
                false,
                [info.type],
                info.title
            );
            subgrid.parentRegion = this;
            this.subgrids[info.title] = subgrid;
            subgrid.onItemDraggedIn = this.onAccessoryAdded.bind(this);
            subgrid.onItemDraggedOut = this.onAccessoryRemoved.bind(this);
            subgrid.setEnabled(false);
        }
    }

    /**
     * 获取当前枪中的子弹总数
     * @returns 
     */
    getTotalAmmo(): number {
        let totalAmmoCount = 0;
        for (const ammoCount of Object.values(this.ammo)) {
            totalAmmoCount += ammoCount;
        }
        return totalAmmoCount;
    }

    /**
     * 卸载子弹，根据枪中的子弹类型创建新的 Item，并添加到父网格中
     */
    unloadAmmo() {
        // console.log(this.ammo)
        for (const [ammoType, ammoCount] of Object.entries(this.ammo)) {
            if (ammoCount > 0) {
                // 创建新的弹药物品
                const ammoInfo = this.game.BLOCK_TYPES.find(info => info.name ===ammoType);
                const ammoItem = new Item(this.game, null, ammoInfo.type, ammoInfo);
                ammoItem.currentStactCount = ammoCount;
                
                // 将弹药添加到父网格
                if (this.parentGrid) {
                    this.parentGrid.addItem(ammoItem);
                    ammoItem.refreshUI();
                }
                
                // 清空当前弹药
                this.ammo[ammoType] = 0;
            }
        }
        this.refreshUI();
        // console.log(this.ammo)
    }

    /** 
     * 交互回调。当把一个item挪到自己身上时，会触发自己的回调。
     * @returns {boolean} 返回 true 表示已处理交互，false 表示未处理
     */
    onItemInteract(draggingItem: Item, pos: {col: number, row: number}, interacting: Item[]) {
        const accessoryTypes = this.accessories.map(accessory => accessory.type);
        if (this.ammoType === draggingItem.type) {
            // 添加子弹
            const draggingItemOriginalParentGrid = draggingItem.parentGrid;
            // 获取当前子弹总数
            let totalAmmoCount = this.getTotalAmmo();
            if ((!this.capacity) || totalAmmoCount === this.capacity) {
                if(draggingItemOriginalParentGrid) {
                    // back to original position
                    draggingItemOriginalParentGrid.addItem(draggingItem);
                }
            } else {
                if (draggingItem.currentStactCount <= this.capacity - totalAmmoCount) {
                    if (!this.ammo[draggingItem.name]) {
                        this.ammo[draggingItem.name] = draggingItem.currentStactCount;
                    } else {
                        this.ammo[draggingItem.name] += draggingItem.currentStactCount;
                    }
                    draggingItem.currentStactCount = 0;
                    draggingItem.destroy();
                    // console.log('test', draggingItem, this)
                } else {
                    if (!this.ammo[draggingItem.name]) {
                        this.ammo[draggingItem.name] = this.capacity - totalAmmoCount;
                    } else {
                        this.ammo[draggingItem.name] += this.capacity - totalAmmoCount;
                    }
                    draggingItem.currentStactCount -= this.capacity - totalAmmoCount;
                    if(draggingItemOriginalParentGrid) {
                        // back to original position
                        draggingItemOriginalParentGrid.addItem(draggingItem);
                    }
                }
            }
            this.refreshUI();
            // console.log('ui refreshed!', this)
        } else if (accessoryTypes.includes(draggingItem.type)) {
            // 添加配件
            // 先检测是否有冲突
            let bHasConflict = false;
            if (this.conflicts[draggingItem.type]) {
            for (const conflictedTypes of this.conflicts[draggingItem.type]) {
                for (const subgrid of Object.values(this.subgrids)) {
                    if (subgrid.acceptedTypes.includes(conflictedTypes) && subgrid.blocks.length > 0) {
                        bHasConflict = true;
                        break;
                    }
                    }
                }
                console.log(this.conflicts[draggingItem.type], draggingItem.type, bHasConflict)
            }
            if (bHasConflict) {
                if (draggingItem.parentGrid) {
                    // back to original position
                    draggingItem.parentGrid.addItem(draggingItem, draggingItem.col, draggingItem.row);
                }
                return false;
            }
            // 找到对应的subgrid
            const accessoryInfo = this.accessories.find(acc => acc.type === draggingItem.type);
            if (accessoryInfo) {
                const subgrid = this.subgrids[accessoryInfo.title];
                if (subgrid) {
                    // 尝试将物品添加到subgrid中
                    const draggingItemOriginalParentGrid = draggingItem.parentGrid;
                    const added = subgrid.addItem(draggingItem);
                    if (added) {
                        return true;
                    } else {
                        const originalItem = subgrid.blocks[0];
                        subgrid.addItem(draggingItem)
                        draggingItemOriginalParentGrid?.addItem(originalItem);
                    }
                    // 如果添加失败，将物品返回到原始位置（暂时忽略返回原位置的情况）
                    // if (draggingItem.parentGrid) {
                    //     draggingItem.parentGrid.addItem(draggingItem, draggingItem.col, draggingItem.row);
                    // }
                }
            }
        } else if (this.maxStackCount > 1 && this.name == draggingItem.name) {
            // 堆叠子弹
            if (this.currentStactCount < this.maxStackCount) {
                const transAmmoCount = Math.min(
                    this.maxStackCount - this.currentStactCount, draggingItem.currentStactCount);
                this.currentStactCount += transAmmoCount;
                draggingItem.currentStactCount -= transAmmoCount;
                
                // 更新显示
                this.refreshUI();
                draggingItem.refreshUI();

                // 如果拖动的物品数量为0，从网格中移除并销毁它
                if (draggingItem.currentStactCount === 0) {
                    if (draggingItem.parentGrid) {
                        draggingItem.destroy();
                    }
                }
            }
            return true;
        } else {
            // 交换位置
            if (!this.parentGrid || !draggingItem.parentGrid) {
                return false;
            }

            const draggingItemOriginalParentGrid = draggingItem.parentGrid;
            const thisItemOriginalParentGrid = this.parentGrid;
            // console.log(111, pos.col, this.col, pos.row, this.row)
            if (
                pos.col <= this.col &&
                pos.col + draggingItem.cellWidth >= this.col + this.cellWidth &&
                pos.row <= this.row &&
                pos.row + draggingItem.cellHeight >= this.row + this.cellHeight
            ) {
                // 如果 this 完全被拖动的 item 覆盖，位置就很好确定了
                let newPos = {
                    col: draggingItem.col + this.col - pos.col,
                    row: draggingItem.row + this.row - pos.row
                }
                // console.log(222, this.name, newPos.col, draggingItem.col, this.col, pos.col)
                if (this.parentGrid === draggingItem.parentGrid) {
                    if (pos.col + draggingItem.cellWidth > draggingItem.col &&
                        pos.col < draggingItem.col
                    ) {
                        newPos.col += draggingItem.col - pos.col;
                    }
                    if (pos.col < draggingItem.col + draggingItem.cellWidth &&
                        pos.col > draggingItem.col
                    ) {
                        newPos.col -= pos.col - draggingItem.col;
                    }
                    if (pos.row + draggingItem.cellHeight > draggingItem.row &&
                        pos.row < draggingItem.row
                    ) {
                        newPos.row += draggingItem.row - pos.row;
                    }
                    if (pos.row < draggingItem.row + draggingItem.cellHeight &&
                        pos.row > draggingItem.row
                    ) {
                        newPos.row -= pos.row - draggingItem.row;
                    }
                }
                // console.log(555, this.name, newPos.col)
                if (draggingItemOriginalParentGrid && this === interacting[0]) {
                    draggingItemOriginalParentGrid.removeItem(draggingItem);
                    // remove item 是为了给 this item 腾位置，但为了方便后面的 item 这里还是把 parent grid 给他赋回去
                    draggingItem.parentGrid = draggingItemOriginalParentGrid;
                }
                if (thisItemOriginalParentGrid) {
                    thisItemOriginalParentGrid.removeItem(this)
                }
                if (draggingItemOriginalParentGrid) {
                    draggingItemOriginalParentGrid.addItem(this, newPos.col, newPos.row);
                }
                if (thisItemOriginalParentGrid && this === interacting[interacting.length-1]) {
                    thisItemOriginalParentGrid.addItem(draggingItem, pos.col, pos.row);
                }
                return true;
            } else {
                console.log(4444)
                if (thisItemOriginalParentGrid) {
                    thisItemOriginalParentGrid.removeItem(this)
                }
                if (draggingItemOriginalParentGrid && this === interacting[0]) {
                    draggingItemOriginalParentGrid.removeItem(draggingItem);
                }
                if (thisItemOriginalParentGrid && this === interacting[interacting.length-1]) {
                    thisItemOriginalParentGrid.addItem(draggingItem, pos.col, pos.row);
                }
                if (draggingItemOriginalParentGrid) {
                    draggingItemOriginalParentGrid.addItem(this);
                }
                return true;
            }
        }
    }

    /**
     * 交互回调预览
     * @returns {boolean} 返回 true 表示可以交互，false 表示不能交互
     */
    onItemInteractPreview(draggingItem: Item, pos: {col: number, row: number}, _interacting: Item[]): boolean {
        const accessoryTypes = this.accessories.map(accessory => accessory.type);
        if (this.ammoType === draggingItem.type) {
            return true;
        } else if (accessoryTypes.includes(draggingItem.type)) {
            // 可放入subgrid
            return true;
        } else if (this.maxStackCount > 1 && this.name == draggingItem.name) {
            // 可堆叠
            return true;
        } else {
            // 检查是否可以交换位置
            if (!this.parentGrid || !draggingItem.parentGrid) {
                return false;
            }

            // 双方 grid 必须互相能够接受
            if (!this.parentGrid.checkAccept(draggingItem) || !draggingItem.parentGrid.checkAccept(this)) {
                return false;
            }

            // this 为 fullfill，则必然可以交换位置
            if (this.parentGrid.fullfill) {
                return true;
            }

            // 首先判断二者不同 Parent Grid 的情况
            // if (this.parentGrid !== draggingItem.parentGrid) {
            //     // console.log(111)
            //     // 做完了别的再来看这里好像也没什么难的
            //     if (this.parentGrid.tryPlaceItem(this, [draggingItem], [])) {
            //         // console.log('there')
            //         return true;
            //     } else {
            //         return false;
            //     }
            // }

            if (
                pos.col <= this.col &&
                pos.col + draggingItem.cellWidth >= this.col + this.cellWidth &&
                pos.row <= this.row &&
                pos.row + draggingItem.cellHeight >= this.row + this.cellHeight
            ) {
                // 如果 this 完全被拖动的 item 覆盖，则必然是可以交换位置的
                return true;
            } else if (
                this.col <= pos.col &&
                this.col + this.cellWidth >= pos.col + draggingItem.cellWidth &&
                this.row <= pos.row &&
                this.row + this.cellHeight >= pos.row + draggingItem.cellHeight
            ) {
                // 如果 This Item 比 Dragging Item 大，说明 Dragging Item 必然只覆盖了 This 一个 item，
                // 那么只要 This Item 有新的位置可以放，那就可以交换
                const deaggingItemPlace = {
                    col: pos.col,
                    row: pos.row,
                    cellWidth: draggingItem.cellWidth,
                    cellHeight: draggingItem.cellHeight
                }
                if (this.parentGrid.tryPlaceItem(this, [this, draggingItem], [deaggingItemPlace])) {
                    // console.log(this.parentGrid.tryPlaceItem(this, [this, draggingItem], [deaggingItemPlace]))
                    return true;
                } else {
                    return false;
                }
            } else {
                // 二者互相不能完全覆盖对方，按现在的三角洲的机制，不能交换位置
                return false;
            }

            /*
            if (true) {
                const deaggingItemPlace = {
                    col: pos.col,
                    row: pos.row,
                    cellWidth: draggingItem.cellWidth,
                    cellHeight: draggingItem.cellHeight
                }
                if (this.parentGrid.tryPlaceItem(this, [this, draggingItem], [deaggingItemPlace])) {
                    // console.log(this.parentGrid.tryPlaceItem(this, [this, draggingItem], [deaggingItemPlace]))
                    return true;
                } else {
                    return false;
                }
            } else {
                return false;
            }*/
        }
    }

    /**
     * 
     * @param type 检查配件之间是否有冲突
     * @returns 
     */
    hasConflict(type: string): boolean {
        if (!this.conflicts[type]) return false;
        
        // 检查所有子网格中的物品
        for (const subgrid of Object.values(this.subgrids)) {
            for (const item of subgrid.blocks) {
                if (this.conflicts[type].includes(item.type)) {
                    return true;
                }
            }
        }
        return false;
    }

    destroy() {
        if (this.parentGrid) {
            this.parentGrid.removeItem(this);
        }
        this.container.destroy();
    }
}
