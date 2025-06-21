import { GAME_RESOURCE_CDN, REALTIME_VALUE } from './config';

interface ResourceInfo {
    name: string;
    url: string;
}

interface ResourceResult {
    name: string;
    data: any[];
}

type CDNType = 'local' | 'jsdelivr';
type ValueSourceType = 'local' | 'df.sanyueqi.com';

// import { Item } from "./item";
// import { Subgrid } from "./subgrid";

export class ItemManager {
    // private itemTypes: any;
    public readonly itemInfos: { [key: string]: any } = {};
    public layouts: any = {};
    public values: any = {};
    public gunSlotMap: any = {};
    private pickingPreset: any = {};

    constructor() {
        // this.loadResources();
        // 临时，之后转移到单独的 json 文件中
        this.pickingPreset = {
            'default': {
                "collection": {
                    "prob": 0.55,
                    "grades" :[0, 0.5, 0.2, 0.15, 0.1, 0.03, 0.02, 0]
                },
                "consume": {
                    "prob": 0.1,
                    "grades" :[0, 0.5, 0.2, 0.15, 0.1, 0.03, 0.02, 0]
                },
                "key": {
                    "prob": 0.01,
                    "grades" :[0, 0, 0, 0.7, 0.2, 0.07, 0.03, 0]
                },
                "armor": {
                    "prob": 0.02,
                    "grades": [0, 0.1, 0.1, 0.3, 0.3, 0.15, 0.05, 0]
                },
                "backpack": {
                    "prob": 0.05,
                    "grades": [0, 0.1, 0.2, 0.2, 0.3, 0.1, 0.1, 0]
                },
                "chestRigs": {
                    "prob": 0.05,
                    "grades": [0, 0.1, 0.2, 0.2, 0.4, 0.1, 0, 0]
                },
                "helmet": {
                    "prob": 0.05,
                    "grades": [0, 0.1, 0.1, 0.3, 0.3, 0.15, 0.05, 0]
                },
                "gunRifle": {
                    "prob": 0.04,
                    "grades": [1, 0, 0, 0, 0, 0, 0, 0]
                },
                "gunPistol": {
                    "prob": 0.02,
                    "grades": [1, 0, 0, 0, 0, 0, 0, 0]
                },
                "ammo": {
                    "prob": 0.02,
                    "grades": [0, 0.1, 0.1, 0.3, 0.3, 0.15, 0.05, 0]
                },
                "accBackGrip": {
                    "prob": 0.01,
                    "grades": [0, 0, 0.5, 0.3, 0.2, 0, 0, 0]
                },
                "accBarrel": {
                    "prob": 0.01,
                    "grades": [0, 0, 0.5, 0.3, 0.2, 0, 0, 0]
                },
                "accForeGrip": {
                    "prob": 0.01,
                    "grades": [0, 0, 0.5, 0.3, 0.2, 0, 0, 0]
                },
                "accFunctional": {
                    "prob": 0.01,
                    "grades": [0, 0, 0.5, 0.3, 0.2, 0, 0, 0]
                },
                "accHandGuard": {
                    "prob": 0.01,
                    "grades": [0, 0, 0.5, 0.3, 0.2, 0, 0, 0]
                },
                "accMagazine": {
                    "prob": 0.01,
                    "grades": [0, 0, 0.5, 0.3, 0.2, 0, 0, 0]
                },
                "accMuzzle": {
                    "prob": 0.01,
                    "grades": [0, 0, 0.5, 0.3, 0.2, 0, 0, 0]
                },
                "accScope": {
                    "prob": 0.01,
                    "grades": [0, 0, 0.5, 0.3, 0.2, 0, 0, 0]
                },
                "accStock": {
                    "prob": 0.01,
                    "grades": [0, 0, 0.5, 0.3, 0.2, 0, 0, 0]
                }
            }
        }
    }
    
    async loadResources() {
        try {
            const cdn = window.game.config.resource_cdn as CDNType;
            
            // 加载物品信息
            const itemLoadPromises = GAME_RESOURCE_CDN[cdn].item_info.map(async (info: ResourceInfo) => {
                const response = await fetch(info.url);
                const data = await response.json();
                return {
                    name: info.name,
                    data: data.jData.data.data.list
                };
            });

            // 加载其他必要信息
            const otherLoadPromises = {
                layouts: fetch(GAME_RESOURCE_CDN[cdn].layouts).then(res => res.json()),
                gunSlotMap: fetch(GAME_RESOURCE_CDN[cdn].gunSlotMap).then(res => res.json())
            };

            // 等待所有资源加载完成
            const [itemResults, otherResults] = await Promise.all([
                Promise.all(itemLoadPromises),
                Promise.all(Object.values(otherLoadPromises))
            ]);

            // 处理物品信息
            itemResults.forEach((result: ResourceResult) => {
                this.itemInfos[result.name] = result.data;
            });

            // 处理其他信息
            const [layouts, gunSlotMap] = otherResults;
            this.layouts = layouts.list;
            this.gunSlotMap = gunSlotMap;

            // 加载实时价格
            await this.getValues();

            console.log('资源加载完成');
            return true;
        } catch (error) {
            console.error('加载资源时出错：', error);
            return false;
        }
    }

    async getValues() {
        try {
            const valueSource = window.game.config.realtime_value as ValueSourceType;
            const response = await fetch(REALTIME_VALUE[valueSource]);
            const data = await response.json();

            if (valueSource === 'local') {
                const ret: Array<{objectID: number, baseValue: number}> = [];
                for (const item of data.list) {
                    ret.push({
                        objectID: Number(item.objectID),
                        baseValue: Number(item.baseValue)
                    });
                }
                this.values = ret;
            } else if (valueSource === 'df.sanyueqi.com') {
                const ret: Array<{objectID: number, baseValue: number}> = [];
                for (const item of data.data.rows) {
                    ret.push({
                        objectID: Number(item.object_id),
                        baseValue: Number(item.c_price)
                    });
                }
                this.values = ret;
            }
        } catch (error) {
            console.error('加载实时价格时出错：', error);
            // 如果加载失败，使用本地价格作为后备
            if (this.values.length === 0) {
                const response = await fetch(REALTIME_VALUE.local);
                const data = await response.json();
                this.values = data.list;
            }
        }
    }

    getItemInfoByName(name: string) {
        for (const key of Object.keys(this.itemInfos)) {
            const infos = this.itemInfos[key];
            if (Array.isArray(infos)) {
                for (const itemInfo of infos) {
                    if (name === itemInfo.objectName) {
                        return this.applyExternalInfo(itemInfo);
                    }
                }
            }
        }
        return null;
    }

    getItemInfoById(id: number | string) {
        if (typeof id === 'string') {
            id = parseInt(id);
        }
        for (const key of Object.keys(this.itemInfos)) {
            const infos = this.itemInfos[key];
            if (Array.isArray(infos)) {
                for (const itemInfo of infos) {
                    if (id === itemInfo.objectID) {
                        return this.applyExternalInfo(itemInfo);
                    }
                }
            }
        }
        return null;
    }

    getGunSlotInfoByID(id: string | number) {
        if(typeof id === 'number') {
            id = id.toString();
        }
        return this.gunSlotMap[id];
    }

    getRandomItem(probabilities: any) {
        // 首先根据概率选择物品类型
        const totalProb = Object.values(probabilities).reduce((sum: number, info: any) => sum + info.prob, 0);
        let randomValue = Math.random() * totalProb;
        let selectedType = '';

        for (const [type, info] of Object.entries(probabilities)) {
            randomValue -= (info as any).prob;
            if (randomValue <= 0) {
                selectedType = type;
                break;
            }
        }

        if (!selectedType || !this.itemInfos[selectedType]) {
            return null;
        }

        // 根据等级概率选择等级
        const gradeProbs = probabilities[selectedType].grades;
        randomValue = Math.random();
        let selectedGrade = -1;
        let accumProb = 0;

        for (let i = 0; i < gradeProbs.length; i++) {
            accumProb += gradeProbs[i];
            if (randomValue <= accumProb) {
                selectedGrade = i;
                break;
            }
        }

        if (selectedGrade === -1) {
            return null;
        }

        // 从选定类型和等级的物品中随机选择一个
        const itemsOfGrade = this.itemInfos[selectedType].filter(
            (item: any) => item.grade === selectedGrade
        );

        if (itemsOfGrade.length === 0) {
            return null;
        }

        const randomIndex = Math.floor(Math.random() * itemsOfGrade.length);
        let info = itemsOfGrade[randomIndex];

        info = this.applyExternalInfo(info);

        return info;
    }

    applyExternalInfo(info: any) {
        // 添加 layout 信息
        const layoutInfo = this.layouts.find((val: any) => val.objectID === info.objectID);
        if (layoutInfo) {
            // console.log('233', layoutInfo)
            info.subgridLayout = layoutInfo.subgridLayout;
        }

        // 添加 value 信息
        const valueInfo = this.values.find((val: any) => val.objectID === info.objectID);
        if (valueInfo) {
            info.baseValue = valueInfo.baseValue;
        } else {
            info.baseValue = 1;
        }

        // 如果是子弹，随机添加数量
        if ( info.primaryClass === 'ammo') {
            // 暂时统一设置为60
            info.maxStack = 60;
            info.stack = Math.floor(Math.random() * 60) + 1;
        }

        // 添加搜索时间信息（TODO：当前默认为 1.2s，之后再写具体算法）
        info.searchTime = 1.2;
        return info;
    }

    getRandomItemWithPreset(preset: string | null) {
        if (!preset || !this.pickingPreset[preset]) {
            preset = 'default';
        }
        while(true) {
            const item = this.getRandomItem(this.pickingPreset[preset]);
            if(item) {
                return item;
            }
        }
    }
}
