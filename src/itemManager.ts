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
    
    async loadResources(): Promise<void> {
        try {
            const [collection, armor, backpack, chestRigs, helmet, primaryWeapon, secondaryWeapon, ammo, 
                accBackGrip, accBarrel, accForeGrip, accFunctional, accHandGuard, accMagazine, accMuzzle, accScope, accStock,
                consume, key,
                layouts, values, gunSlotMap
            ] = await Promise.all([
                // 加载方块数据
                (async () => {
                    const response = await fetch("/json/props/collection.json");
                    return await response.json();
                })(),
                (async () => {
                    const response = await fetch("/json/protect/armor.json");
                    return await response.json();
                })(),
                (async () => {
                    const response = await fetch("/json/protect/backpack.json");
                    return await response.json();
                })(),
                (async () => {
                    const response = await fetch("/json/protect/chestRigs.json");
                    return await response.json();
                })(),
                (async () => {
                    const response = await fetch("/json/protect/helmet.json");
                    return await response.json();
                })(),
                (async () => {
                    const response = await fetch("/json/gun/gunRifle.json");
                    return await response.json();
                })(),
                (async () => {
                    const response = await fetch("/json/gun/gunPistol.json");
                    return await response.json();
                })(),
                (async () => {
                    const response = await fetch("/json/gun/ammo.json");
                    return await response.json();
                })(),
                (async () => {
                    const response = await fetch("/json/acc/accBackGrip.json");
                    return await response.json();
                })(),
                (async () => {
                    const response = await fetch("/json/acc/accBarrel.json");
                    return await response.json();
                })(),
                (async () => {
                    const response = await fetch("/json/acc/accForeGrip.json");
                    return await response.json();
                })(),
                (async () => {
                    const response = await fetch("/json/acc/accFunctional.json");
                    return await response.json();
                })(),
                (async () => {
                    const response = await fetch("/json/acc/accHandGuard.json");
                    return await response.json();
                })(),
                (async () => {
                    const response = await fetch("/json/acc/accMagazine.json");
                    return await response.json();
                })(),
                (async () => {
                    const response = await fetch("/json/acc/accMuzzle.json");
                    return await response.json();
                })(),
                (async () => {
                    const response = await fetch("/json/acc/accScope.json");
                    return await response.json();
                })(),
                (async () => {
                    const response = await fetch("/json/acc/accStock.json");
                    return await response.json();
                })(),
                (async () => {
                    const response = await fetch("/json/props/consume.json");
                    return await response.json();
                })(),
                (async () => {
                    const response = await fetch("/json/props/key.json");
                    return await response.json();
                })(),
                (async () => {
                    const response = await fetch("/json/layouts.json");
                    return await response.json();
                })(),
                (async () => {
                    const response = await fetch("/json/values.json");
                    return await response.json();
                })(),
                (async () => {
                    const response = await fetch("/json/gunSlotMap.json");
                    return await response.json();
                })(),
                
            ]);

            this.itemInfos['collection'] = collection.jData.data.data.list;
            this.itemInfos['armor'] = armor.jData.data.data.list;
            this.itemInfos['backpack'] = backpack.jData.data.data.list;
            this.itemInfos['chestRigs'] = chestRigs.jData.data.data.list;
            this.itemInfos['helmet'] = helmet.jData.data.data.list;
            this.itemInfos['primaryWeapon'] = primaryWeapon.jData.data.data.list;
            this.itemInfos['secondaryWeapon'] = secondaryWeapon.jData.data.data.list;
            this.itemInfos['ammo'] = ammo.jData.data.data.list;
            this.itemInfos['accBackGrip'] = accBackGrip.jData.data.data.list;
            this.itemInfos['accBarrel'] = accBarrel.jData.data.data.list;
            this.itemInfos['accForeGrip'] = accForeGrip.jData.data.data.list;
            this.itemInfos['accFunctional'] = accFunctional.jData.data.data.list;
            this.itemInfos['accHandGuard'] = accHandGuard.jData.data.data.list;
            this.itemInfos['accMagazine'] = accMagazine.jData.data.data.list;
            this.itemInfos['accMuzzle'] = accMuzzle.jData.data.data.list;
            this.itemInfos['accScope'] = accScope.jData.data.data.list;
            this.itemInfos['accStock'] = accStock.jData.data.data.list;
            this.itemInfos['consume'] = consume.jData.data.data.list;
            this.itemInfos['key'] = key.jData.data.data.list;

            this.layouts = layouts.list;
            this.values = values.list;
            this.gunSlotMap = gunSlotMap;

        } catch (error) {
            console.error("Failed to load game resources:", error);
            throw error;
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
        // if(info.secondClass === 'bag'){
        //     console.log('466', info)
        //     console.log(this.layouts)
        // }

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
