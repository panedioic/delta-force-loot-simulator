import * as PIXI from "pixi.js";
import { GAME_WIDTH, GAME_HEIGHT } from "./config";
import { Grid } from "./grid";
import { TotalValueDisplay } from "./totalValueDisplay";

export class Game {
    app: PIXI.Application;
    BLOCK_TYPES: never[];
    grids: Grid[];
    currentRightRegion: number;
    totalValueDisplay: TotalValueDisplay | null;
    regionSwitchUI: null;
    isGameStarted: boolean;
    timer: null;
    scrollableContainer: null;
    instances: Array<any> = [];

    constructor() {
        this.app = new PIXI.Application();
        this.BLOCK_TYPES = [];
        this.grids = [];
        this.currentRightRegion = 0;
        this.totalValueDisplay = null;
        this.regionSwitchUI = null;
        this.isGameStarted = false; // 是否开始游戏
        this.timer = null; // 计时器实例
        this.scrollableContainer = null; // 滚动容器实例
        this.instances = [];
    }

    async loadBlockTypes() {
        try {
            const response = await fetch("public/blocks.json");
            this.BLOCK_TYPES = await response.json();
            const loadingElement = document.querySelector(".loading");
            if (loadingElement) {
                (loadingElement as HTMLElement).style.display = "none";
            }
        } catch (error) {
            console.error("加载方块数据失败:", error);
            const loadingElement = document.querySelector(".loading");
            if (loadingElement) {
                loadingElement.textContent = "加载方块数据失败，请刷新重试";
            }
            throw error;
        }
    }

    async createPixiApp() {
        await this.app.init({
            width: GAME_WIDTH,
            height: GAME_HEIGHT,
            antialias: true,
            backgroundColor: 0x000000,
            resolution: window.devicePixelRatio || 1,
        });
        document.body.appendChild(this.app.canvas);
    }

    createBG() {
        const bg = new PIXI.Graphics();
        bg.beginFill(0x242f39);
        bg.drawRoundedRect(0, 0, GAME_WIDTH, GAME_HEIGHT, 10); // 背景稍微大于按钮和文字
        bg.endFill();
        if (this.app) {
            this.app.stage.addChild(bg);
        }
    }

    createUI() {
        const infoBG = new PIXI.Graphics();
        infoBG.beginFill(0xffffff, 0.1);
        infoBG.drawRect(30, 124, 246, 580);
        infoBG.endFill();
        this.app.stage.addChild(infoBG);

        const infoTitleBG = new PIXI.Graphics();
        infoBG.beginFill(0xffffff, 0.3);
        infoBG.drawRect(30, 72, 760, 50);
        infoBG.endFill();
        this.app.stage.addChild(infoTitleBG);

        const infoTitleText = new PIXI.Text("个人物资", {
            fontFamily: "Arial",
            fontSize: 24,
            fill: 0xffffff,
            fontWeight: "bold",
            stroke: 0x000000,
            strokeThickness: 3,
        });
        infoTitleText.anchor.set(0.5);
        infoTitleText.position.set(100, 100);
        this.app.stage.addChild(infoTitleText);

        const spoilsTitleBG = new PIXI.Graphics();
        spoilsTitleBG.beginFill(0xff0000, 0.3);
        spoilsTitleBG.drawRect(804, 72, 508, 50);
        spoilsTitleBG.endFill();
        this.app.stage.addChild(spoilsTitleBG);

        const infoTitleText2 = new PIXI.Text("战利品", {
            fontFamily: "Arial",
            fontSize: 24,
            fill: 0xffffff,
            fontWeight: "bold",
            stroke: 0x000000,
            strokeThickness: 3,
        });
        infoTitleText2.anchor.set(0.5);
        infoTitleText2.position.set(860, 100);
        this.app.stage.addChild(infoTitleText2);

        // 创建总价值显示UI
        this.totalValueDisplay = new TotalValueDisplay(
            this,
            this.gridContainers,
            42,
            186,
        );

        // 创建区域切换UI
        this.regionSwitchUI = new RegionSwitchUI(this, 920, 86, () => {});
        this.regionSwitchUI.addToStage();

        // 创建创建左侧滚动容器
        this.scrollableContainer = new ScrollableContainer(
            this.app,
            276,
            124,
            514,
            580,
        );
        this.scrollableContainer.addToStage();
    }

    async init() {
        await this.loadBlockTypes();
        await this.createPixiApp();
        this.createBG(); // 创建背景
        // this.createUI();
        // this.createGrids();
        // this.createTimer(); // 创建计时器
        // this.totalValueDisplay.updateTotalValue();
        // console.log(`初始总价值: ${this.totalValueDisplay.valueText.text}`);
    }

    /*
    createGrid(info) {
        const grid = new Grid(
            this,
            info.scrollable ? this.scrollableContainer : this.app.stage,
            info.x || 0,
            info.y || 0,
            info.width || 1,
            info.height || 1,
            info.cellsize || this.CELL_SIZE,
            info.aspect || 1.0,
            info.type,
            info,
            info.visible
        );
        this.gridContainers.push(grid.container);
        this.grids.push(grid);
      
        if (info.scrollable) {
            this.scrollableContainer.addObject(grid);
        } else {
            this.app.stage.addChild(grid.container);
        }
      
        // 初始化方块
        if (!info.countable) {
            grid.initialBlocks(info.height, info.width, this.BLOCK_TYPES);
        }
      
    }
  
    createGridTitle(info) {
        const gridTitle = new GridTitle(this, info.x, info.y, info.cellSize, info.aspect);
        gridTitle.margin = [14, 6, 4, 4];
        this.scrollableContainer.addObject(gridTitle);
    }
  
    createGrids() {
        const gearInfo = [
            { accept: ['primaryWeapon'], cellsize: 128, aspect: 2.6, scrollable: true, fullfill: true, countable: true },
            { accept: ['secondaryWeapon'], cellsize: 128, aspect: 1.2, scrollable: true, fullfill: true, countable: true },
            { accept: ['primaryWeapon'], cellsize: 128, aspect: 2.6, scrollable: true, fullfill: true, countable: true },
            { accept: ['knife'], cellsize: 128, aspect: 1.2, scrollable: true, fullfill: true, countable: true },
            { accept: ['helmet'], cellsize: 128, aspect: 1.9, scrollable: true, fullfill: true, countable: true },
            { accept: ['armor'], cellsize: 128, aspect: 1.9, scrollable: true, fullfill: true, countable: true },
        ]
      
        const chestRigsInfo = [
            { accept: ['chestRigs'], width: 1, height: 1, cellsize: 100, aspect: 1.0, scrollable: true, fullfill: true, countable: true },
            { x: 112, y: 468, width: 5, height: 4, scrollable: true, countable: true }
        ]
      
        const pocketInfo = [
            { x: 4, y: 750, width: 1, height: 1, scrollable: true, countable: true },
            { x: 4, y: 750, width: 1, height: 1, scrollable: true, countable: true },
            { x: 4, y: 750, width: 1, height: 1, scrollable: true, countable: true },
            { x: 4, y: 750, width: 1, height: 1, scrollable: true, countable: true },
            { x: 4, y: 750, width: 1, height: 1, scrollable: true, countable: true },
        ]
      
        const backpackInfo = [
            { accept: ['backpack'], cellsize: 100, aspect: 1.0, scrollable: true, fullfill: true, countable: true },
            { x: 112, y: 882, width: 5, height: 8, scrollable: true, countable: true }
        ]
      
        const secureContainerInfo = [
            { x: 112, y: 882, width: 3, height: 3, scrollable: true, countable: true }
        ]
      
        const spoilsInfo = [
            { x: 806, y: 128, width: 7, height: 8, cellsize: 72, aspect: 1.0},
        ]
      
        for (const info of gearInfo) {
            this.createGrid(info);
        }
      
        this.createGridTitle({
            x: 0,
            y: 0,
            cellSize: 36,
            aspect: 13.8
        });
      
        for (const info of chestRigsInfo) {
            this.createGrid(info);
        }
      
        this.createGridTitle({
            x: 0,
            y: 0,
            cellSize: 36,
            aspect: 13.8
        });
      
        for (const info of pocketInfo) {
            this.createGrid(info);
        }
      
        this.createGridTitle({
            x: 0,
            y: 0,
            cellSize: 36,
            aspect: 13.8
        });
      
        for (const info of backpackInfo) {
            this.createGrid(info);
        }
      
        this.createGridTitle({
            x: 0,
            y: 0,
            cellSize: 36,
            aspect: 13.8
        });
      
        for (const info of secureContainerInfo) {
            this.createGrid(info);
        }
      
        for (const info of spoilsInfo) {
            this.createGrid(info);
        }
    }

    createTimer() {
        this.timer = new Timer(
            this.app,
            42,
            286,
            () => {
                this.isGameStarted = true; // 开始计时时，允许拖动方块
            },
            () => {
                this.isGameStarted = false; // 暂停计时时，禁止拖动方块
            }
        );
    }
        */
}
