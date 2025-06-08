import * as PIXI from "pixi.js";
// import * as text from '@pixi/text';

import { Game } from "./game";
import { Grid } from "./grid";
import { Subgrid } from "./subgrid";
import { GAME_WIDTH, GAME_HEIGHT } from "./config";
import { DEFAULT_CELL_SIZE } from "./config";

export class Item {
    game: Game;
    parentGrid: Grid | Subgrid | null;
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
    subgridLayout: any;
    subgrid: Subgrid | null;
    accessories: any[];
    maxStackCount: number;
    currentStactCount: number;

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

    constructor(game: Game, parentGrid: Grid | Subgrid | null, type: string, itemType: any) {
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
        this.accessories = itemType.accessories || [];
        this.maxStackCount = itemType.maxStack || 1;
        this.currentStactCount = itemType.stack || 1;
        // console.log('eee')
        // if(itemType.subgridLayout) {
        //     console.log('fff', this)
        //     console.log('ggg', this.subgridLayout)
            
        // }

        // 只用作检查
        this.cellSize = this.parentGrid ? this.parentGrid.cellSize : DEFAULT_CELL_SIZE;
        this.aspect = this.parentGrid ? this.parentGrid.aspect : 1;
        this.fullfill = false;

        this.container = new PIXI.Container();
        // this.container.position.set(this.x, this.y);
        this.graphicsBg = new PIXI.Graphics();
        this.graphicsText = null;
        this.createItemGraphics();

        this.dragStartParentContainer = this.container.parent;
        this.dragStartItemLocalPosition = new PIXI.Point(this.x, this.y);
        this.dragStartItemGlobalPosition = new PIXI.Point(this.x, this.y);
        this.dragStartMouseGlobalPoint = new PIXI.Point(this.x, this.y);
        this.isDragging = false;
        this.hasMoved = false;
        this.dragOverlay = null;
        this.previewIndicator = null;

        this.addEventListeners();
        this.subgrid = null;

        this.clickTimeout = null;
        this.clickCount = 0;
    }

    createItemGraphics() {
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
        const color = parseInt(this.color, 16) || 0x000000;

        // 绘制方块主体
        this.graphicsBg.rect(
            -this.pixelWidth / 2 + 2,
            -this.pixelHeight / 2 + 2,
            this.pixelWidth - 4, // 减去边框宽度
            this.pixelHeight - 4,
        );
        this.graphicsBg.fill({ color: color });

        // 绘制边框
        this.graphicsBg.rect(
            -this.pixelWidth / 2 + 2,
            -this.pixelHeight / 2 + 2,
            this.pixelWidth,
            this.pixelHeight,
        );
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
        nameText.position.set(0, -10); // 名称显示在方块中心上方
        this.graphicsText.addChild(nameText);

        // 添加方块价值
        const valueText = new PIXI.Text({
            text: this.baseValue
                ? this.baseValue
                      .toString()
                      .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                : "0",
            style: {
                fontFamily: "Arial",
                fontSize: 21,
                fill: 0xffffff,
                fontWeight: "bold",
                stroke: { color: "black", width: 3 },
            },
        });
        valueText.anchor.set(0.5);
        valueText.position.set(0, 10); // 价值显示在方块中心下方
        this.graphicsText.addChild(valueText);

        // 设置文字容器的位置
        this.graphicsText.position.set(0, 0);

        // 添加文字到容器
        this.container.addChild(this.graphicsText);
    }

    addEventListeners() {
        this.container.eventMode = "static";

        this.container.on('pointerdown', (event) => {
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
                        this.onClick();
                        this.clickCount = 0;
                        this.clickTimeout = null;
                    }, 200); 
                } else if (this.clickCount === 2) {
                    // 如果是双击，直接触发双击行为，不再等待三击，清除单击效果
                    if (this.clickTimeout) { 
                        window.clearTimeout(this.clickTimeout);
                    }
                    this.onClick();
                    this.clickCount = 0;
                    this.clickTimeout = null;
                }
            }
        });

        // 添加全局键盘事件监听
        window.addEventListener("keydown", this.onKeyDown.bind(this));
    }

    onClick() {
        if (this.clickCount === 1) {
            this.game.createItemInfoPanel(this);
        } else if (this.clickCount === 2) {
            // this.game.createItemInfoPanel(this);
        }
    }

    onDragStart(event: PIXI.FederatedPointerEvent) {

    }

    /**
     * 查找当前坐标对应的网格
     * @param {number} x - 鼠标的 x 坐标
     * @param {number} y - 鼠标的 y 坐标
     * @returns {Grid|null} - 返回找到的网格实例或 null
     */
    findGrid(x: number, y: number) {
        for (let i = 0; i < this.game.grids.length; i++) {
            const grid = this.game.grids[i];
            const bounds = grid.container.getBounds();

            // 检查坐标是否在当前网格的范围内
            if (
                x >= bounds.x &&
                x <= bounds.x + bounds.width &&
                y >= bounds.y &&
                y <= bounds.y + bounds.height
            ) {
                // console.log(bounds.x, bounds.y, bounds.width, bounds.height)
                return grid; // 返回找到的 Grid 实例
            }
        }
        return null; // 如果没有找到对应的 Grid，则返回 null
    }

    /**
     * 结束拖动事件
     */
    onDragEnd() {
        this.container.alpha = 1;

        if (!this.isDragging) return;

        // 移除预览指示器
        if (this.previewIndicator) {
            this.game.app.stage.removeChild(this.previewIndicator);
            this.previewIndicator = null;
        }

        // 移除拖动覆盖层
        if (this.dragOverlay) {
            this.container.removeChild(this.dragOverlay);
            this.dragOverlay = null;
        }

        // 获取当前鼠标位置对应的网格
        const mousePosition = this.game.app.renderer.events.pointer.global;
        const targetGrid = this.findGrid(mousePosition.x, mousePosition.y);

        // 如果找到了目标网格
        if (targetGrid) {
            // 获取网格中的位置
            const gridPosition = targetGrid.getGridPositionFromGlobal(
                mousePosition.x,
                mousePosition.y,
                this,
            );

            // 检查是否可以放置
            const canPlace =
                !targetGrid.checkForOverlap(this, gridPosition.clampedCol, gridPosition.clampedRow) &&
                targetGrid.checkBoundary(this, gridPosition.clampedCol, gridPosition.clampedRow) &&
                targetGrid.checkAccept(this);

            if (canPlace) {
                // 如果可以放置，则从原来的网格中移除
                if (this.parentGrid) {
                    this.parentGrid.removeBlock(this);
                }

                // 添加到新的网格中
                targetGrid.addBlock(this, gridPosition.clampedCol, gridPosition.clampedRow);
            } else {
                // 如果不能放置，返回原位置
                if (this.parentGrid) {
                    this.container.position.copyFrom(this.dragStartItemLocalPosition);
                    this.dragStartParentContainer.addChild(this.container);
                }
            }
        } else {
            // 如果没有找到目标网格，返回原位置
            if (this.parentGrid) {
                this.container.position.copyFrom(this.dragStartItemLocalPosition);
                this.dragStartParentContainer.addChild(this.container);
            }
        }

        // 更新总价值显示
        if (this.game.totalValueDisplay) {
            this.game.totalValueDisplay.updateTotalValue();
        }
        
        this.isDragging = false;
        this.hasMoved = false;
    }

    onDragMove(event: PIXI.FederatedPointerEvent) {
        // 检查是否移动超过阈值（5像素）才开始真正的拖动
        const dx = event.global.x - this.dragStartMouseGlobalPoint.x;
        const dy = event.global.y - this.dragStartMouseGlobalPoint.y;
        if (!this.isDragging && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
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
        grid = this.findGrid(x, y);
        if (!grid) {
            // console.log('没有找到对应的网格');
            return;
        }

        // 获取网格的全局位置
        const { clampedCol, clampedRow, snapX, snapY } =
            grid.getGridPositionFromGlobal(x, y, this);

        globalPos = grid.getGlobalPosition();
        baseX = globalPos.x;
        baseY = globalPos.y;

        // 检查是否可以放置
        const canPlace =
            !grid.checkForOverlap(this, clampedCol, clampedRow) &&
            grid.checkBoundary(this, clampedCol, clampedRow) &&
            grid.checkAccept(this);

        // 设置预览颜色
        const previewColor = canPlace ? 0x88ff88 : 0xff8888; // 浅绿色或浅红色

        // 绘制预览
        if (grid.fullfill) {
            this.previewIndicator.beginFill(previewColor);
            this.previewIndicator.drawRect(
                baseX,
                baseY,
                grid.width * grid.cellSize * grid.aspect,
                grid.height * grid.cellSize,
            );
            this.previewIndicator.endFill();
        } else {
            this.previewIndicator.beginFill(previewColor);
            this.previewIndicator.drawRect(
                baseX + snapX - (this.cellWidth * this.cellSize) / 2,
                baseY + snapY - (this.cellHeight * this.cellSize) / 2,
                this.cellWidth * this.cellSize,
                this.cellHeight * this.cellSize,
            );
            this.previewIndicator.endFill();
        }
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
        this.x =
            (col + 0.5 * this.cellWidth) *
            this.parentGrid.cellSize *
            this.parentGrid.aspect;
        this.y = (row + 0.5 * this.cellHeight) * this.parentGrid.cellSize;
        this.container.position.set(this.x, this.y);
    }

    getValue() {
        return this.baseValue;
    }
}
