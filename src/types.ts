export interface BlockType {
    cellWidth: number;
    cellHeight: number;
    blockType: any; // Assuming blockType is an object with properties
    type: string;
    color: string;
    name: string;
    subgridLayout: any[] | null;
}
