import * as PIXI from "pixi.js";
import { Block } from "./block";
import { Game } from "./game";
import { GAME_WIDTH, GAME_HEIGHT } from "./config";
import { RIGHT_REGION_COUNT } from "./config";
import { DEFAULT_CELL_SIZE } from "./config";

export class Grid {
    game: Game;
    stage: PIXI.Container;
    x: number;
    y: number;
    width: number;
    height: number;
    cellSize: number;
    aspect: number;
    type: string;
    info: any;
    fullfill: boolean;
    countable: boolean;
    acceptedTypes: string[];
    margin: number[];
    container: PIXI.Container;
    blocks: Block[];

    constructor(
        game: Game,
        stage: PIXI.Container,
        x,
        y,
        width,
        height,
        cellSize,
        aspect,
        type,
        info,
        visible = true,
    ) {
        this.game = game;
        this.stage = stage;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.cellSize = cellSize;
        this.aspect = aspect;
        this.type = type;
        this.info = info;
        this.fullfill = info.fullfill || false;
        this.countable = info.countable || false;
        this.acceptedTypes = info.accept || []; // 默认接受所有类型

        this.margin = [4, 4, 4, 4]; // 上下左右边距

        this.container = new PIXI.Container();
        this.container.position.set(this.x, this.y);

        this.blocks = [];

        this.initGrid();
    }

    initGrid() {
        // 创建网格背景
        const graphics = new PIXI.Graphics();

        // 半透明背景
        graphics.beginFill(0x1f2121, 0.3);
        graphics.drawRect(
            0,
            0,
            this.width * this.cellSize * this.aspect,
            this.height * this.cellSize,
        );
        graphics.endFill();

        // 网格线
        graphics.lineStyle(2, 0x666666);

        // 水平线
        for (let row = 0; row <= this.height; row++) {
            graphics.moveTo(0, row * this.cellSize); // 使用 this.cellSize
            graphics.lineTo(
                this.width * this.cellSize * this.aspect,
                row * this.cellSize,
            );
            graphics.stroke({ width: 2, color: 0x333333 });
        }

        // 垂直线
        for (let col = 0; col <= this.width; col++) {
            graphics.moveTo(col * this.cellSize * this.aspect, 0); // 使用 this.cellSize
            graphics.lineTo(
                col * this.cellSize * this.aspect,
                this.height * this.cellSize,
            );
            graphics.stroke({ width: 2, color: 0x333333 });
        }

        // 外围边框
        graphics.lineStyle(3, 0x666666);
        graphics.drawRect(
            0,
            0,
            this.width * this.cellSize * this.aspect,
            this.height * this.cellSize,
        ); // 使用 this.cellSize
        graphics.stroke({ width: 3, color: 0x666666 });

        this.container.addChild(graphics);
    }

    setPosition(x, y) {
        this.x = x;
        this.y = y;
        this.container.position.set(this.x, this.y);
    }

    getGlobalPosition() {
        return this.container.getGlobalPosition();
    }

    /*
     * 给定全局坐标，获取该坐标对应的网格内位置
     * @param {number} globalX - 全局X坐标
     * @param {number} globalY - 全局Y坐标
     * @param {Block} item - 方块对象
     * @returns {object} - 返回一个对象，包含 clampedCol, clampedRow, snapX 和 snapY
     */
    getGridPositionFromGlobal(
        globalX: number,
        globalY: number,
        item: Block | null,
    ): {
        clampedCol: number;
        clampedRow: number;
        snapX: number;
        snapY: number;
    } {
        // 获取容器的全局位置
        const globalPosition = this.getGlobalPosition();

        const cellWidth = item ? item.cellWidth : 1;
        const cellHeight = item ? item.cellHeight : 1;

        // 计算网格位置
        const col = Math.round(
            (globalX -
                globalPosition.x -
                (cellWidth * this.cellSize * this.aspect) / 2) /
                this.cellSize,
        );
        const row = Math.round(
            (globalY - globalPosition.y - (cellHeight * this.cellSize) / 2) /
                this.cellSize,
        );

        // 限制在网格范围内
        const clampedCol = Math.max(0, Math.min(col, this.width - cellWidth));
        const clampedRow = Math.max(0, Math.min(row, this.height - cellHeight));

        // 计算对齐后的位置
        const snapX =
            (clampedCol + cellWidth / 2) * this.cellSize * this.aspect;
        const snapY = (clampedRow + cellHeight / 2) * this.cellSize;

        return { clampedCol, clampedRow, snapX, snapY };
    }

    checkForOverlap(item, col, row) {
        // 获取当前容器中的所有方块，排除当前检测的方块
        const items = this.blocks.filter((child) => child !== item);

        // 计算当前方块的边界
        const itemBounds = {
            col: col,
            row: row,
            right: col + item.cellWidth,
            bottom: row + item.cellHeight,
        };

        // 遍历其他方块，检查是否有重叠
        for (const otherItem of items) {
            const otherBounds = {
                col: otherItem.col,
                row: otherItem.row,
                right: otherItem.col + otherItem.cellWidth,
                bottom: otherItem.row + otherItem.cellHeight,
            };

            // 检查是否重叠
            if (
                itemBounds.col < otherBounds.right &&
                itemBounds.right > otherBounds.col &&
                itemBounds.row < otherBounds.bottom &&
                itemBounds.bottom > otherBounds.row
            ) {
                return true; // 存在重叠
            }
        }

        return false; // 无重叠
    }

    checkBoundary(item, col, row) {
        if (this.fullfill) {
            return col === 0 && row === 0;
        }
        // 获取网格的宽度和高度
        const gridWidth = this.width;
        const gridHeight = this.height;

        // 计算方块的右边界和下边界
        const blockRight = col + item.cellWidth;
        const blockBottom = row + item.cellHeight;

        // 检查是否在网格范围内
        return (
            col >= 0 &&
            row >= 0 &&
            blockRight <= gridWidth &&
            blockBottom <= gridHeight
        );
    }

    checkAccept(item) {
        if (this.acceptedTypes.length === 0) {
            return true; // 如果没有指定接受的类型，则默认接受所有类型
        }
        let ret = false;
        this.acceptedTypes.forEach((type) => {
            // console.log(item.type, type, item.type === type)
            if (item.type === type) {
                ret = true;
            }
        });
        return ret;
    }

    addToStage() {
        this.stage.addChild(this.container);
    }

    addBlock(obj, col, row) {
        this.blocks.push(obj);
        this.container.addChild(obj.container);
        obj.parentGrid = this; // 设置父级网格

        if (this.fullfill) {
            obj.resize(this.cellSize * this.aspect, this.cellSize);
        } else {
            obj.resize(
                this.cellSize * this.aspect * obj.cellWidth,
                this.cellSize * obj.cellHeight,
            );
        }

        if (this.fullfill) {
            obj.setGridPosition(
                -(obj.cellWidth - 1) / 2,
                -(obj.cellHeight - 1) / 2,
            ); // 设置网格位置
        } else {
            obj.setGridPosition(col, row); // 设置网格位置
        }
    }

    removeBlock(obj) {
        const index = this.blocks.indexOf(obj);
        if (index !== -1) {
            this.blocks.splice(index, 1);
            this.container.removeChild(obj.graphics);
            obj.parentGrid = null; // 清除父级网格引用
        }
    }

    setVisible(visible) {
        this.container.visible = visible;
    }

    getBounds() {
        return this.container.getBounds();
    }

    setVisible(visible) {
        this.container.visible = visible;
    }

    initialBlocks(row_count, col_count, blockTypes) {
        const blocksNum = Math.floor(Math.random() * 10); // 随机生成0到9个方块
        let blocks = [];
        for (let i = 0; i < blocksNum; i++) {
            const blockType =
                blockTypes[Math.floor(Math.random() * blockTypes.length)];
            blocks.push(blockType);
        }

        for (let row = 0; row < row_count; row++) {
            for (let col = 0; col < col_count; col++) {
                const blockType = blocks[0];
                if (!blockType) {
                    return; // 如果没有更多方块类型，退出循环
                }
                // console.log(blocks, blockType)
                const item = {
                    cellWidth: blockType.w,
                    cellHeight: blockType.h,
                    blockType: blockType,
                };
                const canPlace =
                    !this.checkForOverlap(item, col, row) &&
                    this.checkBoundary(item, col, row);
                // console.log(canPlace, item.blockType.name, col, row)
                if (canPlace) {
                    const x =
                        col * this.cellSize + (blockType.w * this.cellSize) / 2;
                    const y =
                        row * this.cellSize + (blockType.h * this.cellSize) / 2;

                    // 使用 Block 类创建方块
                    const block = new Block(this.game, this, item.blockType);
                    this.addBlock(block, col, row);

                    blocks.shift(); // 移除已放置的方块类型
                    if (blocks.length === 0) {
                        return;
                    }
                }
            }
        }
    }
}
