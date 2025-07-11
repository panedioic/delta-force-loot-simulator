import * as PIXI from "pixi.js";
import { GAME_WIDTH, GAME_HEIGHT, GAME_DEFAULT_CONFIG } from "./config";
import { Subgrid } from "./subgrid";
import { TotalValueDisplay } from "./totalValueDisplay";
import { RegionSwitchUI } from "./components/regionSwitchUI";
import { InfoDialog } from "./components/infoDialog";
import { ChangelogDialog } from "./components/ChangelogDialog";
import { Timer } from "./components/timer";
import { ItemInfoPanel } from "./itemInfoPanel";
import { Item } from "./item";
import { TitleBar } from "./titleBar";
import { Region } from "./region";
import { SettingsDialog } from "./components/SettingsDialog";
// import { ItemManager } from "./components/ItemManager";
// import { DebugTools } from "./components/DebugTools";
import { PresetManager } from "./components/PresetManager";
import { initInventory, updateTotalValueDisplay } from "./utils";
import { ItemManager } from "./itemManager";
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
    icon: PIXI.Texture | null;
    titleBar: TitleBar | null;
    defaultSpoilsRegionConfig: any[] = [];
    spoilsRegion: Region | null = null;

    // Components
    playerRegion: Region | null = null;
    totalValueDisplay: TotalValueDisplay | null;
    regionSwitchUI: RegionSwitchUI | null;
    isGameStarted: boolean;
    timer: Timer | null;
    infoDialog: InfoDialog | null;
    instances: Array<any> = [];

    activeItemInfoPanel: ItemInfoPanel | null;

    /** 预设 */
    defaultSpoilsRegionNumber: number = 3;
    defaultPlayerRegionNumber: number = 1;
    presets: any[] = [];

    // debug
    // debugTools: DebugTools | null;

    presetManager: PresetManager | null = null;

    // item manager
    itemManager: ItemManager;

    // 基础配置信息
    config: any = GAME_DEFAULT_CONFIG;

    constructor() {
        this.app = new PIXI.Application();
        this.BLOCK_TYPES = [];
        this.GRID_INFO = [];
        this.GRID_INFO_SPOILS = [];
        this.grids = [];
        this.totalValueDisplay = null;
        this.regionSwitchUI = null;
        this.isGameStarted = false; // 是否开始游戏
        this.timer = null; // 计时器实例
        this.icon = null;
        this.titleBar = null;
        // this.scrollableContainer = null; // 滚动容器实例
        this.infoDialog = null;
        this.instances = [];
        this.activeItemInfoPanel = null;

        this.itemManager = new ItemManager();

        // default spoils region
        const storedRegions = localStorage.getItem('defaultSpoilsRegionConfig');
        if (storedRegions) {
            try {
                this.defaultSpoilsRegionConfig = JSON.parse(storedRegions);
            } catch (e) {
                console.error('Failed to parse stored regions, using default config:', e);
                this.initDefaultSpoilsRegionConfig();
            }
        } else {
            this.initDefaultSpoilsRegionConfig();
        }

        /** Debuging */
        if (import.meta.env.MODE === "development") {
            this.isGameStarted = true;
            this.config.needSearch = false;
            this.config.resource_cdn = 'local';
            this.config.realtime_value = 'local';
        }

        window.game = this;
    }

    private initDefaultSpoilsRegionConfig() {
        this.defaultSpoilsRegionConfig = [
            {type: "spoilsBox", title: "战利品1", width: 7, height: 8},
            {type: "spoilsBox", title: "战利品2", width: 7, height: 8},
            {type: "spoilsBox", title: "战利品3", width: 7, height: 8},
            {type: "playerContainer", title: "玩家盒子1"},
            {type: "playerContainer", title: "玩家盒子2"},
            {type: "playerContainer", title: "玩家盒子3"}
        ];
    }

    /**
     * Initialize the game, this method will be called when the game starts.
     * @returns {Promise<void>} A promise that resolves when the block types are loaded.
     * */
    async init(): Promise<void> {
        await this.loadResources();
        await this.itemManager.loadResources();
        // Create PIXI application
        await this.createPixiApp();
        this.initGameUI();
        this.initGameComponents();

        // 初始化标题栏
        this.titleBar = new TitleBar();

        this.startGameWithPreset(0);

        // debug
        const debugItemArray = [
            'M4A1突击步枪',
            '5.56x45mm M995'
        ];
        for (const itemName of debugItemArray) {
            const itemInfo = this.itemManager.getItemInfoByName(itemName);
            const item = new Item(itemInfo);
            this.spoilsRegion?.addItem(item);
        }
    }

    /**
     * 刷新游戏 UI （一般用于更新配置后）
     */
    public refreshUI() {

    }

    public refreshUIRecursive() {
        this.refreshUI();
        if (this.playerRegion) {
            this.playerRegion.refreshUIRecursive();
        }
        if (this.spoilsRegion) {
            this.spoilsRegion.refreshUIRecursive();
        }
    }

    /**
     * 并行加载所有游戏资源
     * @returns {Promise<void>} 当所有资源加载完成时解析的Promise
     */
    private async loadResources(): Promise<void> {
        try {
            const [blocks, gridInfo, gridInfoSpoils, preset2, icon] = await Promise.all([
                // 加载方块数据
                (async () => {
                    const response = await fetch("/blocks.json");
                    return await response.json();
                })(),
                // 加载网格数据
                (async () => {
                    const response = await fetch("/gridinfo.json");
                    return await response.json();
                })(),
                // 加载战利品网格数据
                (async () => {
                    const response = await fetch("/gridinfospoils.json");
                    return await response.json();
                })(),
                // 加载预设
                (async () => {
                    const response = await fetch("/preset2.json");
                    return await response.json();
                })(),
                // 加载图标
                PIXI.Assets.load("/deltaforce.png")
            ]);

            // 保存加载的资源
            this.BLOCK_TYPES = blocks;
            this.GRID_INFO = gridInfo;
            this.GRID_INFO_SPOILS = gridInfoSpoils;
            this.icon = icon;
            this.presets.push(preset2);
            // 隐藏加载提示
            const loadingElement = document.querySelector(".loading");
            if (loadingElement) {
                (loadingElement as HTMLElement).style.display = "none";
            }
        } catch (error) {
            console.error("Failed to load game resources:", error);
            const loadingElement = document.querySelector(".loading");
            if (loadingElement) {
                loadingElement.textContent = "加载游戏资源失败，请刷新重试";
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

        // 添加更新循环
        this.app.ticker.add(() => {
            if(!this.spoilsRegion) return;
            for (const inventory of this.spoilsRegion.inventories) {
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
    }

    /**
     * Initialize the game components.
     * */
    initGameComponents() {
        this.playerRegion = new Region({x: 30, y: 72}, {
            title: "个人物资",
            width: 760,
            height: 632,
            titleColor: 0xffffff,
            titleAlpha: 0.3,
            componentWidth: 246,
            backgroundColor: 0xffffff,
            backgroundAlpha: 0.1,
            countable: true
        });
        this.playerRegion.addComponent('totalValueDisplay', TotalValueDisplay);
        this.playerRegion.addComponent('timer', Timer);
        this.playerRegion.addComponent('infoDialog', InfoDialog);
        this.playerRegion.addComponent('settingsDialog', SettingsDialog);
        // this.playerRegion.addComponent('itemManager', ItemManager);
        this.playerRegion.addComponent('presetManager', PresetManager);
        // this.playerRegion.addComponent('debugTools', DebugTools);
        this.playerRegion.addComponent('changelogDialog', ChangelogDialog);
        this.playerRegion.addInventory(1, false);
        this.playerRegion.switchTo(0);
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
                        item.destroy();
                        this.activeItemInfoPanel?.close();
                        updateTotalValueDisplay();
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
        for (const subgrid of this.grids.filter(grid => grid.enabled)) {
            // console.log(subgrid)
            const bounds = subgrid.container.getBounds();
            // 检查坐标是否在当前网格的范围内
            if (
                x >= bounds.x &&
                x <= bounds.x + bounds.width &&
                y >= bounds.y &&
                y <= bounds.y + bounds.height
            ) {
                // Debug
                // const parentInventory = (subgrid.parentRegion as Region).inventories.find((inventory) => {
                //     for (const grid of Object.values(inventory.contents)) {
                //         if (grid instanceof Subgrid) {
                //             if (grid === subgrid) {
                //             return true;
                //         } else if (grid instanceof GridContainer) {
                //             if (grid.subgrids.includes(subgrid)) {
                //                 return true;
                //             }
                //         }
                //     }
                //     return false;
                // });
                // console.log(subgrid)
                return subgrid; // 返回找到的 Grid 实例
            }
        }
        return null; // 如果没有找到对应的 Grid，则返回 null
    }

    startGameWithPreset(idx: number) {
        if (idx < 0 || idx > this.presets.length) {
            return;
        }

        if (this.spoilsRegion) {
            this.spoilsRegion.destroy();
        }

        // find timer and clear

        
        const region = new Region({x: 804, y: 72}, {
            title: "战利品",
            width: 508,
            height: 632,
            titleColor: 0xff0000,
            titleAlpha: 0.3,
            componentWidth: 0,
            backgroundColor: 0xffffff,
            backgroundAlpha: 0.1,
            countable: false,
        });

        if (idx === 0) {
            // console.log('2333')
            this.defaultSpoilsRegionConfig.forEach((val) => {
                if (val.type === "spoilsBox") {
                    region.addInventory(0, true, val.title);
                } else if (val.type === "playerContainer") {
                    region.addInventory(1, true, val.title);
                }
            });
        } else {
            const preset_data = this.presets[idx - 1];
            for ( const preset of preset_data.data) {
                const inventory_type = preset.type === 'playerContainer' ? 1 : 0;
                const inventory = region.addInventory(inventory_type, false);
                initInventory(inventory, inventory_type, preset);
                inventory.setEnabled(false);
            }
        }
        // console.log('23334')
        region.switchTo(0);
        region.addSwitcherUI();
        this.spoilsRegion = region;
    }
}
