import * as PIXI from "pixi.js";
// import * as text from '@pixi/text';

import { Game } from "./game";
import { Grid } from "./grid";
import { GAME_WIDTH, GAME_HEIGHT } from "./config";

export class Block {
    game: Game;
    parentGrid: Grid;
    col: number;
    row: number;
    x: number;
    y: number;
    blockType: any;
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

    /** 拖动相关 */
    dragStartParentContainer: PIXI.Container;
    dragStartBlockLocalPosition: PIXI.Point;
    dragStartBlockGlobalPosition: PIXI.Point;
    dragStartMouseGlobalPoint: PIXI.Point;
    isDragging: boolean;
    hasMoved: boolean;
    dragOverlay: PIXI.Graphics | null;
    previewIndicator: PIXI.Graphics | null;

    constructor(game: Game, parentGrid: Grid, type: string, blockType: any) {
        this.game = game;
        this.parentGrid = parentGrid;
        this.col = 0;
        this.row = 0;
        this.x = 0;
        this.y = 0;
        this.blockType = blockType;
        this.cellWidth = this.blockType.cellWidth;
        this.cellHeight = this.blockType.cellHeight;
        this.originCellWidth = this.cellWidth;
        this.originCellHeight = this.cellHeight;
        this.pixelWidth =
            this.cellWidth * this.parentGrid.cellSize * this.parentGrid.aspect;
        this.pixelHeight = this.cellHeight * this.parentGrid.cellSize;
        this.color = this.blockType.color;
        this.baseValue = this.blockType.value;
        this.name = this.blockType.name;
        this.type = type || "collection";
        this.search = blockType.search || 1.2;

        // 只用作检查
        this.cellSize = this.parentGrid.cellSize;
        this.aspect = this.parentGrid.aspect;
        this.fullfill = false;

        this.container = new PIXI.Container();
        // this.container.position.set(this.x, this.y);
        this.graphicsBg = new PIXI.Graphics();
        this.graphicsText = null;
        this.createBlockGraphics();

        this.dragStartParentContainer = this.container.parent;
        this.dragStartBlockLocalPosition = new PIXI.Point(this.x, this.y);
        this.dragStartBlockGlobalPosition = new PIXI.Point(this.x, this.y);
        this.dragStartMouseGlobalPoint = new PIXI.Point(this.x, this.y);
        this.isDragging = false;
        this.hasMoved = false;
        this.dragOverlay = null;
        this.previewIndicator = null;

        this.addEventListeners();
    }

    createBlockGraphics() {
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
        // this.container.interactive = true;
        // this.container.buttonMode = true;
        this.container.eventMode = "static";

        this.container
            .on("pointerdown", (event) => {
                if (this.game.isGameStarted) {
                    // 只有游戏开始后才能拖动
                    this.onDragStart(event);
                }
            })
            .on("pointerup", this.onDragEnd.bind(this))
            .on("pointerupoutside", this.onDragEnd.bind(this))
            .on("click", this.onBlockClick.bind(this));

        // 添加全局键盘事件监听
        window.addEventListener("keydown", this.onKeyDown.bind(this));
    }

    onDragStart(event: PIXI.FederatedMouseEvent) {
        this.isDragging = true;
        this.hasMoved = false;
        // Keep track of the starting position and container
        this.dragStartParentContainer = this.container.parent;
        this.dragStartBlockLocalPosition = this.container.position.clone();
        this.dragStartBlockGlobalPosition = this.container.getGlobalPosition();
        // Get the global mouse position at the start of the drag
        this.dragStartMouseGlobalPoint = event.global.clone();
        this.container.alpha = 0.7;

        // 创建预览指示器
        if (!this.previewIndicator) {
            this.previewIndicator = new PIXI.Graphics();
            this.game.app.stage.addChild(this.previewIndicator);
        }

        // 创建一个完全透明的大矩形覆盖整个屏幕
        if (!this.dragOverlay) {
            this.dragOverlay = new PIXI.Graphics();
            this.dragOverlay.beginFill(0x000000, 0.1); // 完全透明
            this.dragOverlay.drawRect(
                -GAME_WIDTH,
                -GAME_HEIGHT,
                GAME_WIDTH * 3,
                GAME_HEIGHT * 3,
            ); // 大范围矩形
            this.dragOverlay.endFill();
            this.container.addChild(this.dragOverlay);
        }

        const globalPosition = this.container.getGlobalPosition();

        // 将原本的 block 移动到 app.stage 顶层
        // console.log(this.app)
        this.game.app.stage.addChild(this.container);
        this.container.position.set(globalPosition.x, globalPosition.y);

        // bind
        this.container.on("pointermove", this.onDragMove.bind(this));
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
        this.isDragging = false;

        const newPosition = this.container.getGlobalPosition();

        const grid = this.findGrid(newPosition.x, newPosition.y);
        if (!grid) {
            console.log("没有找到对应的网格");
            return;
        }

        // 获取网格的全局位置
        const { clampedCol, clampedRow } = grid.getGridPositionFromGlobal(
            newPosition.x,
            newPosition.y,
            this,
        );
        // console.log(clampedCol, clampedRow);

        const canPlace =
            !grid.checkForOverlap(this, clampedCol, clampedRow) &&
            grid.checkBoundary(this, clampedCol, clampedRow) &&
            grid.checkAccept(this);

        // 检查重叠和边界
        if (canPlace) {
            // 如果可以放置，更新方块在网格中的位置
            this.parentGrid.removeBlock(this);
            grid.addBlock(this, clampedCol, clampedRow);
        } else {
            // 如果重叠或超出边界，返回拖动前的位置
            this.dragStartParentContainer.addChild(this.container);
            this.container.position.copyFrom(this.dragStartBlockLocalPosition);
            // console.log(checkForOverlap(container, this.container, snapX, snapY), checkBoundary(container, this.container, clampedCol, clampedRow));
        }
        // console.log("2", this.previewIndicator.position.x);
        // console.log("2", this.graphicsBg.position.x);

        // Remove the preview indicator
        if (this.previewIndicator) {
            this.game.app.stage.removeChild(this.previewIndicator);
            this.previewIndicator = null;
        }

        // Remove the drag overlay
        if (this.dragOverlay) {
            this.container.removeChild(this.dragOverlay);
            this.dragOverlay = null;
        }

        // Update the total value display
        if (this.game.totalValueDisplay) {
            this.game.totalValueDisplay.updateTotalValue();
        }

        // Remove the event listener for pointermove
        this.container.off("pointermove", this.onDragMove.bind(this));

        if (!this.hasMoved) {
            this.showBlockDetails(newPosition.x, newPosition.y);
        }
        this.hasMoved = false;
    }

    onDragMove(event: PIXI.FederatedMouseEvent) {
        if (this.isDragging === false) {
            return;
        }
        this.hasMoved = true;
        const dx = event.global.x - this.dragStartMouseGlobalPoint.x;
        const dy = event.global.y - this.dragStartMouseGlobalPoint.y;

        const currentBlockGlobalPosition = {
            x: this.dragStartBlockGlobalPosition.x + dx,
            y: this.dragStartBlockGlobalPosition.y + dy,
        };

        // console.log(
        //     this.dragStartBlockGlobalPosition,
        //     currentBlockGlobalPosition,
        // );

        // 更新方块位置
        this.container.position.set(
            currentBlockGlobalPosition.x,
            currentBlockGlobalPosition.y,
        );

        // 更新预览指示器
        this.updatePreviewIndicator(
            currentBlockGlobalPosition.x,
            currentBlockGlobalPosition.y,
        );
        // console.log("1", this.dragOverlay.position.x);
        // console.log("1", this.graphicsBg.position.x);
    }

    onBlockClick(event: any) {
        event.stopPropagation();
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

    showBlockDetails(x: number, y: number) {
        // Implement block details display logic here
        console.log(`Showing details for block at (${x}, ${y})`);
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
        this.col = col;
        this.row = row;
        this.x =
            (col + 0.5 * this.cellWidth) *
            this.parentGrid.cellSize *
            this.parentGrid.aspect;
        this.y = (row + 0.5 * this.cellHeight) * this.parentGrid.cellSize;
        this.container.position.set(this.x, this.y);
        // console.log(
        //     col,
        //     row,
        //     this.parentGrid.cellSize,
        //     this.parentGrid.aspect,
        //     this.cellWidth,
        //     this.x,
        //     this.y,
        //     this.graphicsBg.scale,
        // );
    }

    getValue() {
        return this.baseValue;
    }
}
