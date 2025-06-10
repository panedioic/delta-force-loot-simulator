import * as PIXI from "pixi.js";
import { Item } from "./item";

export interface ItemType {
    cellWidth: number;
    cellHeight: number;
    color: string;
    name: string;
    type: string;
    value: number;
    search: number;
    itemType: any; // Assuming itemType is an object with properties
    subgridLayout: any[] | null;
    accessories: any[] | null;
    stack: number | null;
    ammo: string | null;
    capacity: number | null;
    conflict: any[] | null;
}

export interface Grid {
    cellSize: number;
    aspect: number;
    width: number;
    height: number;
    checkBoundary: (item: Item, x: number, y: number) => boolean;
    checkAccept: (item: Item) => boolean;
    checkForOverlap: (item: Item, x: number, y: number) => boolean;
    removeBlock: (item: Item) => void;
    addBlock: (item: Item, x: number, y: number) => void;
    addItem: (item: Item, x: number, y: number) => void;
    getItemsInArea: (x: number, y: number, width: number, height: number) => Item[];
    getAllItems: () => Item[];
    getGridPositionFromGlobal: (x: number, y: number, item: Item) => { 
        clampedCol: number; 
        clampedRow: number;
        snapX: number;
        snapY: number;
    };
    getGlobalPosition: () => PIXI.Point;
    fullfill: () => void;
}

export interface Inventory {
    grids: Grid[];
    selectedItem: Item | null;
    getAllItems: () => Item[];
    onItemClick: (item: Item) => void;
    clearSelection: () => void;
}
