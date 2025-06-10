import * as PIXI from "pixi.js";
import { GAME_WIDTH, GAME_HEIGHT } from "./config";
import { RIGHT_REGION_COUNT } from "./config";
import { Subgrid } from "./subgrid";
import { TotalValueDisplay } from "./totalValueDisplay";
import { RegionSwitchUI } from "./regionSwitchUI";
import { InfoDialog } from "./infoDialog";
import { Timer } from "./timer";
import { Inventory } from "./invntory";
import { SpoilsManager } from "./spoilsManager";
import { ItemInfoPanel } from "./itemInfoPanel";
import { Item } from "./item";
import { DebugTools } from "./debugTools";
// import { Magnify } from "./magnify";

declare global {
    interface Window {
        game: Game;
        app: HTMLElement;
    }
}

/**
 * The Game class represents the main game instance.
 * It initializes the PIXI application, loads block types, and creates the game UI.
 */
export class Game {
    app: PIXI.Application;
    BLOCK_TYPES: any[];
    GRID_INFO: any[];
    GRID_INFO_SPOILS: any[];
    grids: Subgrid[];
    currentRightRegion: number;
    totalRightRegion: number;

    // Components
    totalValueDisplay: TotalValueDisplay | null;
    regionSwitchUI: RegionSwitchUI | null;
    isGameStarted: boolean;
    timer: Timer | null;
    // scrollableContainer: ScrollableContainer | null;
    playerInventory!: Inventory | null;
    spoilsManager!: SpoilsManager | null;
    infoDialog: InfoDialog | null;
    instances: Array<any> = [];

    activeItemInfoPanel: ItemInfoPanel | null;

    /** 搜索模式 */
    needSearch: boolean;

    // debug
    debugTools: DebugTools | null;

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
        // this.scrollableContainer = null; // 滚动容器实例
        this.spoilsManager = null;
        this.infoDialog = null;
        this.instances = [];
        this.activeItemInfoPanel = null;
        this.debugTools = null;
        this.needSearch = true;

        // debuging
        this.needSearch = false;
    }

    /**
     * Initialize the game, this method will be called when the game starts.
     * @returns {Promise<void>} A promise that resolves when the block types are loaded.
     * */
    async init(): Promise<void> {
        await this.loadItemTypes();
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

        // Debug Tools
        if (import.meta.env.MODE === "development") {
            this.debugTools = new DebugTools(this);
            this.debugTools.initItems();
        } else {
            this.debugTools = null;
        }

        // test magnify
        // 在需要的地方创建放大镜实例
        // const magnify = new Magnify(this.app.stage, 0, 0, 72, 72);

        // 控制显示/隐藏
        // magnify.show();  // 显示
    }

    /**
     * Load block types from a JSON file.
     * @returns {Promise<void>} A promise that resolves when the block types are loaded.
     * */
    async loadItemTypes(): Promise<void> {
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
        const appElement = document.getElementById("app");
        if (appElement) {
            appElement.appendChild(this.app.canvas);
            window.app = appElement;
            
            // 设置app元素样式
            appElement.style.cssText = `
                width: 100vw;
                height: 100vh;
                display: flex;
                justify-content: center;
                align-items: center;
                background: #000;
                overflow: hidden;
            `;

            // 自动调整canvas大小保持16:9
            const resizeCanvas = () => {
                const windowWidth = window.innerWidth;
                const windowHeight = window.innerHeight;
                const aspectRatio = 16 / 9;
                
                let width = windowWidth;
                let height = width / aspectRatio;
                
                if (height > windowHeight) {
                    height = windowHeight;
                    width = height * aspectRatio;
                }
                
                this.app.renderer.resize(width, height);
                this.app.canvas.style.width = `${width}px`;
                this.app.canvas.style.height = `${height}px`;
            };

            // 初始调整和监听窗口大小变化
            resizeCanvas();
            window.addEventListener('resize', resizeCanvas);
        }
        window.game = this;

        // 添加更新循环
        this.app.ticker.add(() => {
            if(!this.spoilsManager) return;
            for (const inventory of this.spoilsManager.inventories) {
                inventory.update();
            }
            // if (this.playerInventory) {
            //     this.playerInventory.update();
            // }
        });
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
        this.infoDialog = new InfoDialog(this);
        this.infoDialog.initUI();
    }

    createItemInfoPanel(item: Item) {
        // 如果已经存在面板，则不创建新的
        if (this.activeItemInfoPanel) {
            return;
        }

        // 如果游戏还没开始，不创建面板
        if (!this.isGameStarted) {
            return;
        }

        // 创建面板
        this.activeItemInfoPanel = new ItemInfoPanel(
            this,
            item,
            (this.app.screen.width - 420) / 2,  // 居中显示
            (this.app.screen.height - 636) / 2,
            [
                {
                    text: "丢弃",
                    callback: () => {
                        if (item.parentGrid) {
                            item.parentGrid.removeBlock(item);
                            this.activeItemInfoPanel?.close();
                        }
                    }
                }
            ]
        );
    }

    /**
     * 工具函数，根据全局坐标查找对应的 Subgrid
     * @param x x坐标
     * @param y y坐标
     * @returns 返回找到的 Subgrid 或 null 表示没有找到
     */
    findGrid(x: number, y: number) {
        // 先检查是否位于 itemInfoPanel 的 Subgrid 内
        if (this.activeItemInfoPanel) {
            for (const subgrid of this.activeItemInfoPanel.getSubgrids()) {
                const bounds = subgrid.container.getBounds();
                if (
                    x >= bounds.x &&
                    x <= bounds.x + bounds.width &&
                    y >= bounds.y &&
                    y <= bounds.y + bounds.height
                ) {
                    // console.log(bounds.x, bounds.y, bounds.width, bounds.height)
                    return subgrid;
                }
            }
            const bounds = this.activeItemInfoPanel.getBounds()
            if (
                x >= bounds.x &&
                x <= bounds.x + bounds.width &&
                y >= bounds.y &&
                y <= bounds.y + bounds.height
            ) {
                return null;
            }
        }
        // 不位于 itemInfoPanel，也没有被遮挡
        for (const subgrid of this.grids) {
            const bounds = subgrid.container.getBounds();
            // 检查坐标是否在当前网格的范围内
            if (
                x >= bounds.x &&
                x <= bounds.x + bounds.width &&
                y >= bounds.y &&
                y <= bounds.y + bounds.height
            ) {
                return subgrid; // 返回找到的 Grid 实例
            }
        }
        return null; // 如果没有找到对应的 Grid，则返回 null
    }
}
