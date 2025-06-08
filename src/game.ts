import * as PIXI from "pixi.js";
import { GAME_WIDTH, GAME_HEIGHT } from "./config";
import { RIGHT_REGION_COUNT } from "./config";
import { DEFAULT_CELL_SIZE } from "./config";
import { Grid } from "./grid";
import { Subgrid } from "./subgrid";
import { GridTitle } from "./gridTitle";
import { TotalValueDisplay } from "./totalValueDisplay";
import { RegionSwitchUI } from "./regionSwitchUI";
import { ScrollableContainer } from "./scrollableContainer";
import { InfoDialog } from "./infoDialog";
import { Timer } from "./timer";
import { Inventory } from "./invntory";
import { SpoilsManager } from "./spoilsManager";

/**
 * The Game class represents the main game instance.
 * It initializes the PIXI application, loads block types, and creates the game UI.
 */
export class Game {
    app: PIXI.Application;
    BLOCK_TYPES: any[];
    GRID_INFO: any[];
    GRID_INFO_SPOILS: any[];
    grids: (Grid | Subgrid)[];
    currentRightRegion: number;
    totalRightRegion: number;

    // Components
    totalValueDisplay: TotalValueDisplay | null;
    regionSwitchUI: RegionSwitchUI | null;
    isGameStarted: boolean;
    timer: Timer | null;
    scrollableContainer: ScrollableContainer | null;
    playerInventory!: Inventory | null;
    spoilsManager!: SpoilsManager | null;
    infoDialog: InfoDialog | null;
    instances: Array<any> = [];

    constructor() {
        this.app = new PIXI.Application();
        this.BLOCK_TYPES = [];
        this.GRID_INFO = [];
        this.GRID_INFO_SPOILS = [];
        this.grids = [];
        this.currentRightRegion = 0;
        this.totalRightRegion = RIGHT_REGION_COUNT;
        this.totalValueDisplay = null;
        this.regionSwitchUI = null;
        this.isGameStarted = false; // 是否开始游戏
        this.timer = null; // 计时器实例
        this.scrollableContainer = null; // 滚动容器实例
        this.spoilsManager = null;
        this.infoDialog = null;
        this.instances = [];
    }

    /**
     * Initialize the game, this method will be called when the game starts.
     * @returns {Promise<void>} A promise that resolves when the block types are loaded.
     * */
    async init(): Promise<void> {
        // Load block types and grid info from JSON files
        await this.loadBlockTypes();
        await this.loadGridInfo();
        await this.loadGridInfoSpoils();
        // Create PIXI application
        await this.createPixiApp();
        this.initGameUI(); // 创建背景
        this.initGameUI();
        this.initGameComponents();
        // this.initGrids();

        // 计算初始总价值
        if (this.totalValueDisplay) {
            this.totalValueDisplay.updateTotalValue();
            console.log(`初始总价值: ${this.totalValueDisplay.totalValue}`);
        } else {
            console.error("TotalValueDisplay is not initialized.");
        }
    }

    /**
     * Load block types from a JSON file.
     * @returns {Promise<void>} A promise that resolves when the block types are loaded.
     * */
    async loadBlockTypes(): Promise<void> {
        // if (import.meta.env.MODE === "development") {
        //     this.BLOCK_TYPES = await getMockBlocks();
        //     const loadingElement = document.querySelector(".loading");
        //     if (loadingElement) {
        //         (loadingElement as HTMLElement).style.display = "none";
        //     }
        //     return;
        // }
        try {
            const response = await fetch("/blocks.json");
            this.BLOCK_TYPES = await response.json();
            const loadingElement = document.querySelector(".loading");
            if (loadingElement) {
                (loadingElement as HTMLElement).style.display = "none";
            }
        } catch (error) {
            console.error("Failed to load block data:", error);
            const loadingElement = document.querySelector(".loading");
            if (loadingElement) {
                loadingElement.textContent = "加载方块数据失败，请刷新重试";
            }
            throw error;
        }
    }

    /**
     * Load grid info from a JSON file.
     * @returns {Promise<void>} A promise that resolves when the grid info is loaded.
     * */
    async loadGridInfo(): Promise<void> {
        try {
            // if (import.meta.env.MODE === "development") {
            //     const { getMockGridInfo } = await import("./mockData");
            //     this.GRID_INFO = await getMockGridInfo();
            //     return;
            // }
            const response = await fetch("/gridinfo.json");
            this.GRID_INFO = await response.json();
            const loadingElement = document.querySelector(".loading");
            if (loadingElement) {
                (loadingElement as HTMLElement).style.display = "none";
            }
        } catch (error) {
            console.error("Failed to load grid data:", error);
            const loadingElement = document.querySelector(".loading");
            if (loadingElement) {
                loadingElement.textContent = "加载网格数据失败，请刷新重试";
            }
            throw error;
        }
    }

    /**
     * Load grid info(spoils) from a JSON file.
     * @returns {Promise<void>} A promise that resolves when the grid info is loaded.
     * */
    async loadGridInfoSpoils(): Promise<void> {
        try {
            // if (import.meta.env.MODE === "development") {
            //     const { getMockGridInfo } = await import("./mockData");
            //     this.GRID_INFO = await getMockGridInfo();
            //     return;
            // }
            const response = await fetch("/gridinfospoils.json");
            this.GRID_INFO_SPOILS = await response.json();
            const loadingElement = document.querySelector(".loading");
            if (loadingElement) {
                (loadingElement as HTMLElement).style.display = "none";
            }
        } catch (error) {
            console.error("Failed to load grid data:", error);
            const loadingElement = document.querySelector(".loading");
            if (loadingElement) {
                loadingElement.textContent = "加载网格数据失败，请刷新重试";
            }
            throw error;
        }
    }

    /**
     * Create the PIXI application.
     * @returns {Promise<void>} A promise that resolves when the PIXI application is created.
     * */
    async createPixiApp(): Promise<void> {
        await this.app.init({
            width: GAME_WIDTH,
            height: GAME_HEIGHT,
            antialias: true,
            backgroundColor: 0x000000,
            resolution: window.devicePixelRatio || 1,
        });
        document.body.appendChild(this.app.canvas);
    }

    /**
     * Initialize the game UI.
     * */
    initGameUI() {
        // Create background
        const bg = new PIXI.Graphics();
        bg.roundRect(0, 0, GAME_WIDTH, GAME_HEIGHT, 10);
        bg.fill({ color: 0x242f39 });
        this.app.stage.addChild(bg);

        // Info background
        const infoBG = new PIXI.Graphics();
        infoBG.rect(30, 124, 246, 580);
        infoBG.fill({ color: 0xffffff, alpha: 0.1 });
        this.app.stage.addChild(infoBG);

        const infoTitleBG = new PIXI.Graphics();
        infoTitleBG.rect(30, 72, 760, 50);
        infoTitleBG.fill({ color: 0xffffff, alpha: 0.3 });
        this.app.stage.addChild(infoTitleBG);

        const infoTitleText = new PIXI.Text({
            text: "个人物资",
            style: {
                fontFamily: "Arial",
                fontSize: 24,
                fill: 0xffffff,
                fontWeight: "bold",
                stroke: { color: "black", width: 3 },
            },
        });
        infoTitleText.anchor.set(0.5);
        infoTitleText.position.set(100, 100);
        this.app.stage.addChild(infoTitleText);

        // Spoils background
        const spoilsTitleBG = new PIXI.Graphics();
        spoilsTitleBG.rect(804, 72, 508, 50);
        spoilsTitleBG.fill({ color: 0xff0000, alpha: 0.3 });
        this.app.stage.addChild(spoilsTitleBG);

        const infoTitleText2 = new PIXI.Text({
            text: "战利品",
            style: {
                fontFamily: "Arial",
                fontSize: 24,
                fill: 0xffffff,
                fontWeight: "bold",
                stroke: { color: "black", width: 3 },
            },
        });
        infoTitleText2.anchor.set(0.5);
        infoTitleText2.position.set(860, 100);
        this.app.stage.addChild(infoTitleText2);
    }

    /**
     * Initialize the game components.
     * */
    initGameComponents() {
        this.totalValueDisplay = new TotalValueDisplay(this, 42, 186);
        this.playerInventory = new Inventory(
            this,
            true,
            true,
            276,
            124
        )
        this.spoilsManager = new SpoilsManager(
            this,
            806,
            128,
            3,
            3
        );
        this.regionSwitchUI = new RegionSwitchUI(this, 920, 86, () => {});
        this.regionSwitchUI.addToStage();
        this.timer = new Timer(
            this,
            42,
            266,
            () => {
                this.isGameStarted = true; // 开始计时时，允许拖动方块
            },
            () => {
                this.isGameStarted = false; // 暂停计时时，禁止拖动方块
            },
        );
        // Initialize info dialog
        this.infoDialog = new InfoDialog(this, 42, 386);
        this.infoDialog.initUI();
    }

    initGrids() {
        // for (const info of this.GRID_INFO) {
        //     this.createObject(info);
        // }

        // Create spoils grids
        const spoilsInfo = {
            type: "Grid",
            x: 806,
            y: 128,
            width: 7,
            height: 8,
            cellsize: 72,
            aspect: 1.0,
            countable: false,
        };
        for (let i = 0; i < this.totalRightRegion; i += 1) {
            this.createObject(spoilsInfo);
        }
        this.grids[this.grids.length - this.totalRightRegion].setVisible(true);
    }

    createObject(info: any) {
        if (info.type === "Grid") {
            let parentStage = info.scrollable
                ? this.scrollableContainer
                : this.app.stage;
            if (!parentStage) {
                parentStage = this.app.stage;
            }
            const grid = new Grid(
                this,
                info.x || 0,
                info.y || 0,
                info.width || 1,
                info.height || 1,
                info.cellsize || DEFAULT_CELL_SIZE,
                info.aspect || 1.0,
                info.fullfill || false,
                info.countable || false,
                info.accept || [],
            );
            this.grids.push(grid);
            if (info.scrollable) {
                this.scrollableContainer?.addObject(grid);
            } else {
                this.app.stage.addChild(grid.container);
                grid.initialBlocks(this.BLOCK_TYPES);
                grid.setVisible(false);
            }
        } else if (info.type === "GridTitle") {
            const gridTitle = new GridTitle(
                this,
                "title",
                info.cellSize,
                info.aspect,
            );
            gridTitle.margin = [14, 6, 4, 4];
            if (this.scrollableContainer) {
                this.scrollableContainer.addObject(gridTitle);
            }
        }
    }
}
