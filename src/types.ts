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
}
