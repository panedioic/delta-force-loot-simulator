
import { BlockType } from './types';

export async function getMockBlocks(): Promise<BlockType[]> {
  return [
    {
      cellWidth: 5,
      cellHeight: 2,
      type: "primaryWeapon",
      name: "primaryWeapon",
      value: 30000,
      color: "808080",
    },
    {
      cellWidth: 2,
      cellHeight: 1,
      type: "secondaryWeapon", 
      name: "secondaryWeapon",
      value: 10000,
      color: "808080",
    },
    {
      cellWidth: 1,
      cellHeight: 1,
      type: "chestRigs",
      name: "TestChestRigs",
      value: 10000,
      color: "808080",
    },
    {
      cellWidth: 1,
      cellHeight: 1,
      type: "collection",
      name: "疑似非洲之心",
      value: 888888,
      color: "a14a4c",
    }
  ];
}

export async function getMockGridInfo(): Promise<any[]> {
  return [
    {
      type: "Grid",
      x: 30,
      y: 124,
      width: 6,
      height: 8,
      cellsize: 72,
      aspect: 1.0,
      countable: true,
      accept: ["collection"]
    },
    {
      type: "GridTitle",
      x: 276,
      y: 124,
      cellSize: 72,
      aspect: 1.0
    }
  ];
}
