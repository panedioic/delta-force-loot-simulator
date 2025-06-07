import * as PIXI from "pixi.js";
import { Block } from "./block";
import { Game } from "./game";
import { DEFAULT_CELL_SIZE } from "./config";
import { BlockType } from "./types";

/**
 * This class represents a grid in the game.
 * @param {Game} game - The game instance
 * @param {PIXI.Container} stage - The stage to add the grid to
 */
export class Subgrid {
    game: Game;
    width: number;
    height: number;
    cellSize: number;
    aspect: number;
    info: any;
    fullfill: boolean;
    countable: boolean;
    acceptedTypes: string[];
    margin: number[];
    container: PIXI.Container;
    blocks: Block[];
    title: string;
    onBlockMoved?: (block: Block, col: number, row: number) => void;

    constructor(
        game: Game,
        width: number,
        height: number,
        cellSize: number,
        aspect: number,
        fullfill: boolean,
        countable: boolean,
        accept: string[],
        title: string,
    ) {
        this.game = game;
        this.width = width;
        this.height = height;
        this.cellSize = cellSize || DEFAULT_CELL_SIZE;
        this.aspect = aspect || 1.0;
        this.fullfill = fullfill || false;
        this.countable = countable || false;
        this.acceptedTypes = accept || []; // 默认接受所有类型
        this.title = title || '';

        this.margin = [4, 4, 4, 4]; // 上下左右边距

        this.container = new PIXI.Container();

        this.blocks = [];

        this.initUI();
        this.game.grids.push(this);
    }

    /**
     * Initialize the grid by creating the grid background and lines.
     */
    initUI() {
        // 创建网格背景
        const graphics = new PIXI.Graphics();

        // 半透明背景 (deprecated)
        // graphics.beginFill(0x1f2121, 0.3);
        // graphics.drawRect(
        //     0,
        //     0,
        //     this.width * this.cellSize * this.aspect,
        //     this.height * this.cellSize,
        // );
        // graphics.endFill();
        graphics.rect(
            0,
            0,
            this.width * this.cellSize * this.aspect,
            this.height * this.cellSize,
        );
        graphics.fill({ color: 0x1f2121, alpha: 0.3 });

        // 网格线
        // graphics.lineStyle(2, 0x666666);

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
        graphics.rect(
            0,
            0,
            this.width * this.cellSize * this.aspect,
            this.height * this.cellSize,
        ); // 使用 this.cellSize
        graphics.stroke({ width: 3, color: 0x666666 });

        const titleText = new PIXI.Text({
            text: this.title,
            style: {
                fontFamily: "Arial",
                fontSize: 20,
                fill: { color: 0xffffff, alpha: 0.3 },
            },
        });
        titleText.anchor.set(0);
        titleText.position.set(4, 4);
        graphics.addChild(titleText);

        this.container.addChild(graphics);
    }

    /**
     * Get the global position of the grid.
     * @returns {PIXI.Point} - The global position of the grid
     **/
    getGlobalPosition(): PIXI.Point {
        return this.container.getGlobalPosition();
    }

    /**
     * Get the grid position from the global coordinates
     * @param {number} globalX - The global X coordinate
     * @param {number} globalY - The global Y coordinate
     * @param {Block} item - The block item to check
     * @returns {object} - Returns an object containing the clamped column, clamped row, snap X, and snap Y
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

    /**
     * Check for overlap between the item and other items in the grid.
     * @param {Block} item - The block item to check
     * @param {number} col - The column position of the item
     * @param {number} row - The row position of the item
     * @returns {boolean} - Returns true if there is an overlap, false otherwise
     */
    checkForOverlap(
        item: Block | BlockType,
        col: number,
        row: number,
    ): boolean {
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

    /**
     * Check if the item is within the boundary of the grid.
     * @param {Block} item - The block item to check
     * @param {number} col - The column position of the item
     * @param {number} row - The row position of the item
     * @returns {boolean} - Returns true if the item is within the boundary, false otherwise
     * */
    checkBoundary(item: Block | BlockType, col: number, row: number): boolean {
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

    /**
     * Check if the item is acceptable by the grid.
     * @param {Block} item - The block item to check
     * @returns {boolean} - Returns true if the item is accepted, false otherwise
     * */
    checkAccept(item: Block): boolean {
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
        // console.log(this.acceptedTypes, item.type, ret);
        return ret;
    }

    /**
     * Add the grid to the stage.
     * @param {PIXI.Container} stage - The stage to add the grid to
     * */
    addToStage(stage: PIXI.Container) {
        stage.addChild(this.container);
    }

    /**
     * Add a block to the grid.
     * @param {Block} obj - The block to add
     * @param {number} col - The column position of the block
     * @param {number} row - The row position of the block
     * */
    addBlock(obj: Block, col: number, row: number) {
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
            // console.log(obj.col, obj.row);
        }

        if (this.onBlockMoved) {
            this.onBlockMoved(obj, col, row);
        }
    }

    /**
     * Remove a block from the grid.
     * @param {Block} obj - The block to remove
     * */
    removeBlock(obj: Block) {
        const index = this.blocks.indexOf(obj);
        if (index !== -1) {
            this.blocks.splice(index, 1);
            this.container.removeChild(obj.container);
            // obj.parentGrid = null; // 清除父级网格引用
        }
    }

    /**
     * Set the visibility of the grid.
     * @param {boolean} visible - The visibility of the grid
     * */
    setVisible(visible: boolean) {
        this.container.visible = visible;
    }

    /**
     * Get the bounds of the grid.
     * @returns {PIXI.Rectangle} - The bounds of the grid
     * */
    getBounds(): PIXI.Bounds {
        return this.container.getBounds();
    }

    /**
     * Initialize the blocks in the grid.
     * @param {Array} blockTypes - The types of blocks to initialize
     * */
    initialBlocks(blockTypes: BlockType[]) {
        console.log(blockTypes)
        const blocksNum = Math.floor(Math.random() * 10); // 随机生成0到9个方块
        let blocks = [];
        for (let i = 0; i < blocksNum; i++) {
            const blockType =
                blockTypes[Math.floor(Math.random() * blockTypes.length)];
            blocks.push(blockType);
        }

        for (let row = 0; row < this.width; row++) {
            for (let col = 0; col < this.height; col++) {
                const blockType = blocks[0];
                if (!blockType) {
                    return; // 如果没有更多方块类型，退出循环
                }
                const item = {
                    cellWidth: blockType.cellWidth,
                    cellHeight: blockType.cellHeight,
                    blockType: blockType,
                    type: blockType.type,
                    name: '',
                    color: '',
                    subgridLayout: blockType.subgridLayout
                };
                const canPlace =
                    !this.checkForOverlap(item, col, row) &&
                    this.checkBoundary(item, col, row);
                if (canPlace) {
                    // console.log("aaa", blockType, item);
                    // 使用 Block 类创建方块
                    const block = new Block(
                        this.game,
                        this,
                        item.type,
                        blockType,
                    );
                    if(blockType.subgridLayout) {
                        block.subgridLayout = blockType.subgridLayout;
                    }
                    this.addBlock(block, col, row);

                    blocks.shift(); // 移除已放置的方块类型
                    if (blocks.length === 0) {
                        // console.log(this.blocks);
                        return;
                    }
                }
            }
        }
    }
}
