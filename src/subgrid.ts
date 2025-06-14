import * as PIXI from "pixi.js";
import { Item } from "./item";
import { Game } from "./game";
import { DEFAULT_CELL_SIZE } from "./config";
import { ItemType } from "./types";
import { Region } from "./region";
import { updateTotalValueDisplay } from "./utils";

interface ItemPlace {
    col: number;
    row: number;
    cellWidth: number;
    cellHeight: number;
}


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
    blocks: Item[];
    title: string;
    parentRegion: Region | Item | null = null;
    enabled: boolean = true;
    onItemDraggedIn?: (item: Item, col: number, row: number, grid: Subgrid | null) => void;
    onItemDraggedOut?: (item: Item, grid: Subgrid | null) => void;

    // 用于防止出现大小的bug
    additiveSize: { x: number; y: number };

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
        this.additiveSize = { x: this.container.width, y: this.container.height };
        // console.log(this)
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
     * @param {Item} item - The block item to check
     * @returns {object} - Returns an object containing the clamped column, clamped row, snap X, and snap Y
     */
    getGridPositionFromGlobal(
        globalX: number,
        globalY: number,
        item: Item | null,
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
        const clampedCol = Math.max(0, Math.min(col, this.width));
        const clampedRow = Math.max(0, Math.min(row, this.height));

        // 计算对齐后的位置
        const snapX =
            (clampedCol + cellWidth / 2) * this.cellSize * this.aspect;
        const snapY = (clampedRow + cellHeight / 2) * this.cellSize;

        // console.log(globalPosition, clampedCol, clampedRow, snapX, snapY)
        return { clampedCol, clampedRow, snapX, snapY };
    }

    getGridGlobalPosition(position: {col: number, row: number}) {
        const globalPosition = this.getGlobalPosition();
        return {
            x: globalPosition.x + position.col * this.cellSize * this.aspect,
            y: globalPosition.y + position.row * this.cellSize
        }
    }

    /**
     * 获取与指定位置重叠的所有物品
     * @param {Item} item - 要检查的物品
     * @param {number} col - 列位置
     * @param {number} row - 行位置
     * @returns {Item[]} - 返回所有重叠的物品数组
     */
    getOverlappingItems(
        item: Item | ItemType,
        col: number,
        row: number,
        rotated: boolean=false
    ): Item[] {
        const overlappingItems: Item[] = [];
        
        for (const block of this.blocks) {
            // 如果是同一个物品，跳过
            if (block === item) continue;

            // 检查是否有重叠
            const itemRight = rotated ? col + (item.cellHeight || 1) : col + (item.cellWidth || 1);
            const itemBottom = rotated ? row + (item.cellWidth || 1) : row + (item.cellHeight || 1);
            const blockRight = block.col + block.cellWidth;
            const blockBottom = block.row + block.cellHeight;

            if (
                col < blockRight &&
                itemRight > block.col &&
                row < blockBottom &&
                itemBottom > block.row
            ) {
                overlappingItems.push(block);
            }
        }
        return overlappingItems;
    }

    /**
     * 检查是否有重叠（保留此方法以保持向后兼容）
     */
    checkForOverlap(
        item: Item | ItemType,
        col: number,
        row: number
    ): boolean {
        return this.getOverlappingItems(item, col, row).length > 0;
    }

    /**
     * Check if the item is within the boundary of the grid.
     * @param {Item} item - The block item to check
     * @param {number} col - The column position of the item
     * @param {number} row - The row position of the item
     * @returns {boolean} - Returns true if the item is within the boundary, false otherwise
     * */
    checkBoundary(item: Item | ItemType | ItemPlace, col: number, row: number, rotated: boolean=false): boolean {
        if (this.fullfill) {
            return col === 0 && row === 0;
        }
        // 获取网格的宽度和高度
        const gridWidth = this.width;
        const gridHeight = this.height;

        // 计算方块的右边界和下边界
        const blockRight = rotated ? col + item.cellHeight : col + item.cellWidth;
        const blockBottom = rotated ? row + item.cellWidth : row + item.cellHeight;

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
     * @param {Item} item - The block item to check
     * @returns {boolean} - Returns true if the item is accepted, false otherwise
     * */
    checkAccept(item: Item): boolean {
        if (this.acceptedTypes.length === 0) {
            return true; // 如果没有指定接受的类型，则默认接受所有类型
        }
        let ret = false;
        // console.log(this)
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

    rearrange() {
        // TODO
    }

    /**
     * Add a block to the grid. 若给定具体 col 和 row，则不会判断是否发生重叠，直接加入。
     * @param {Item} obj - The block to add
     * @param {number} col - The column position of the block
     * @param {number} row - The row position of the block
     * */
    addItem(obj: Item, col: number = -1, row: number = -1, removeFromOriginalGrid: boolean=true): boolean {
        // Check accept first
        const bIsAccepted = this.checkAccept(obj);
        if (!bIsAccepted) {
            return false;
        }
        const objOriginalParentGrid = obj.parentGrid;
        let bFound = col >= 0 && row >= 0;
        // console.log('bFound', bFound, col, row)
        if (!bFound) {
            // need to find pos annually
            for (let r = 0; r < this.height; r++) {
                for (let c = 0; c < this.width; c++) {
                    const bOverlap = this.checkForOverlap(obj, c, r);
                    const bBoundary = this.checkBoundary(obj, c, r);
                    if(!bOverlap && bBoundary) {
                        bFound = true;
                        col = c;
                        row = r;
                        break;
                    }
                }
                if(bFound) {
                    break;
                }
            }
        }
        // console.log('bFound', bFound, col, row)
        // TODO: this.rearrange();
        if (!bFound) {
            return false;
        }

        const originalParentGrid = obj.parentGrid;
        if (removeFromOriginalGrid && originalParentGrid) {
            originalParentGrid.removeItem(obj);
        }
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
            // obj.setGridPosition(
            //     -(obj.cellWidth - 1) / 2,
            //     -(obj.cellHeight - 1) / 2,
            // ); // 设置网格位置
            obj.setGridPosition(0, 0)
        } else {
            obj.setGridPosition(col, row); // 设置网格位置
            // console.log(obj.col, obj.row);
        }

        obj.parentRegion = this.parentRegion;

        if (this.onItemDraggedIn) {
            this.onItemDraggedIn(obj, col, row, objOriginalParentGrid);
        }

        obj.refreshUI();
        updateTotalValueDisplay();
        return true;
    }

    /**
     * Remove a block from the grid.
     * @deprecated 使用 removeItem 代替
     * @param {Item} obj - The block to remove
     * */
    removeBlock(obj: Item, destroy: boolean=false) {
        this.removeItem(obj, destroy);
    }

    /**
     * Remove a block from the grid.
     * @param {Item} obj - The block to remove
     * */
    removeItem(obj: Item, destroy: boolean=false) {
        const index = this.blocks.indexOf(obj);
        if (index !== -1) {
            this.blocks.splice(index, 1);
            this.container.removeChild(obj.container);
            obj.parentGrid = null; // 清除父级网格引用
            if (this.onItemDraggedOut) {
                this.onItemDraggedOut(obj, this);
            }
            if (destroy) {
                obj.container.destroy();
            }
        }
    }

    /**
     * Set the visibility of the grid.
     * @param {boolean} visible - The visibility of the grid
     * */
    setVisible(visible: boolean) {
        this.container.visible = visible;
    }

    setEnabled(enabled: boolean) {
        this.container.visible = enabled;
    }

    /**
     * Get the bounds of the grid.
     * @returns {PIXI.Rectangle} - The bounds of the grid
     * */
    getBounds(): PIXI.Bounds {
        return this.container.getBounds();
    }

    // 获取指定区域内的所有物品
    getItemsInArea(x: number, y: number, width: number, height: number): Item[] {
        const items: Item[] = [];
        for (const item of this.blocks) {
            if (Math.max(x, item.x) <= Math.min(x + width, item.x + item.cellWidth) &&
                Math.max(y, item.y) <= Math.min(y + height, item.y + item.cellHeight)) {
                items.push(item);
            }
        }
        return items;
    }

    // 获取所有物品
    getAllItems(): Item[] {
        return this.blocks;
    }

    /**
     * 获取与指定位置重叠的物品
     * @param {Item} item - 要检查的物品
     * @param {number} col - 列位置
     * @param {number} row - 行位置
     * @returns {Item|null} - 返回重叠的物品，如果没有重叠则返回 null
     */
    getOverlappingItem(item: Item, col: number, row: number): Item | null {
        for (const block of this.blocks) {
            // 跳过自己
            if (block === item) continue;

            // 检查是否有重叠
            const itemRight = col + item.cellWidth;
            const itemBottom = row + item.cellHeight;
            const blockRight = block.col + block.cellWidth;
            const blockBottom = block.row + block.cellHeight;

            if (
                col < blockRight &&
                itemRight > block.col &&
                row < blockBottom &&
                itemBottom > block.row
            ) {
                return block;
            }
        }
        return null;
    }

    clearItem() {
        for (const item of this.blocks) {
            this.container.removeChild(item.container);
            if (this.onItemDraggedOut) {
                this.onItemDraggedOut(item, this);
            }
        }
        this.blocks = [];
    }

    tryPlaceItem(item: Item, ignores: (Item | ItemPlace)[], blocks: (Item | ItemPlace)[]): { col: number, row: number } | null {
        // console.log('======')
        if (!this.checkAccept(item)) {
            return null;
        }
        for (let row = 0; row < this.height; row+=1) {
            for (let col = 0; col < this.width; col+=1) {
                // 检查是否在边界内
                if (!this.checkBoundary(item, col, row)) {
                    continue;
                }

                // 检查是否与blocks重叠
                let hasOverlap = false;
                for (const blockedItem of blocks) {
                    const blockedItemRight = blockedItem.col + blockedItem.cellWidth;
                    const blockedItemBottom = blockedItem.row + blockedItem.cellHeight;
                    const itemRight = col + item.cellWidth;
                    const itemBottom = row + item.cellHeight;
                    // if(col === 0 && row === 0 ) {
                    //     console.log('ffff')
                    //     console.log(col, row, itemRight, itemBottom, blockedItem)
                    // }

                    if (
                        col < blockedItemRight &&
                        itemRight > blockedItem.col &&
                        row < blockedItemBottom &&
                        itemBottom > blockedItem.row
                    ) {
                        // if(col === 0 && row === 0 ) {
                        //     console.log('gggg')
                        //     console.log(col, row, itemRight, itemBottom, blockedItem)
                        // }
                        hasOverlap = true;
                        break;
                    }
                }
                if (hasOverlap) {
                    // console.log(col, row, 'hhhh')
                    continue;
                }
                // console.log(col, row, 'iiii')
                hasOverlap = false;
                for (const originalItem of this.blocks) {
                    if (ignores.includes(originalItem)) {
                        continue;
                    }
                    // console.log(333, ignores)
                    const blockRight = originalItem.col + originalItem.cellWidth;
                    const blockBottom = originalItem.row + originalItem.cellHeight;
                    const itemRight = col + item.cellWidth;
                    const itemBottom = row + item.cellHeight;

                    if (
                        col < blockRight &&
                        itemRight > originalItem.col &&
                        row < blockBottom &&
                        itemBottom > originalItem.row
                    ) {
                        hasOverlap = true;
                        break;
                    }
                }
                if (hasOverlap) {
                    continue;
                }
                return { col, row };
            }
        }
        // TODO: rearrange
        return null;
    }

    public gridToPixel(col: number, row: number): { x: number, y: number } {
        return {
            x: col * this.cellSize * this.aspect,
            y: row * this.cellSize
        };
    }
}
