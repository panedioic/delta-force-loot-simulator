export const GAME_WIDTH = 1334;
export const GAME_HEIGHT = 750;
export const DEFAULT_CELL_SIZE = 72;
export const RIGHT_REGION_COUNT = 6;

export const RARITY_COLORS = [0x808080, 0x808080, 0x367e68, 0x4b6b87, 0x695687, 0xa16e50, 0xa14a4c, 0xa14a4c];

export const GAME_RESOURCE_CDN = {
    local: {
        item_info: [
            {
                name: 'collection',
                url: '/json/props/collection.json'
            },
            {
                name: 'armor',
                url: '/json/protect/armor.json'
            },
            {
                name: 'backpack',
                url: '/json/protect/backpack.json'
            },
            {
                name: 'chestRigs',
                url: '/json/protect/chestRigs.json'
            },
            {
                name: 'helmet',
                url: '/json/protect/helmet.json'
            },
            {
                name: 'primaryWeapon',
                url: '/json/gun/gunRifle.json'
            },
            {
                name: 'secondaryWeapon',
                url: '/json/gun/gunPistol.json'
            },
            {
                name: 'ammo',
                url: '/json/gun/ammo.json'
            },
            {
                name: 'accBackGrip',
                url: '/json/acc/accBackGrip.json'
            },
            {
                name: 'accBarrel',
                url: '/json/acc/accBarrel.json'
            },
            {
                name: 'accForeGrip',
                url: '/json/acc/accForeGrip.json'
            },
            {
                name: 'accFunctional',
                url: '/json/acc/accFunctional.json'
            },
            {
                name: 'accHandGuard',
                url: '/json/acc/accHandGuard.json'
            },
            {
                name: 'accMagazine',
                url: '/json/acc/accMagazine.json'
            },
            {
                name: 'accMuzzle',
                url: '/json/acc/accMuzzle.json'
            },
            {
                name: 'accScope',
                url: '/json/acc/accScope.json'
            },
            {
                name: 'accStock',
                url: '/json/acc/accStock.json'
            },
            {
                name: 'consume',
                url: '/json/props/consume.json'
            },
            {
                name: 'key',
                url: '/json/props/key.json'
            }
        ],
        layouts: "/json/layouts.json",
        gunSlotMap: "/json/gunSlotMap.json"
    },
    jsdelivr: {
        item_info: [
            {
                name: 'collection',
                url: 'https://cdn.jsdelivr.net/gh/panedioic/delta-force-loot-simulator@master/public/json/props/collection.json'
            },
            {
                name: 'armor',
                url: 'https://cdn.jsdelivr.net/gh/panedioic/delta-force-loot-simulator@master/public/json/protect/armor.json'
            },
            {
                name: 'backpack',
                url: 'https://cdn.jsdelivr.net/gh/panedioic/delta-force-loot-simulator@master/public/json/protect/backpack.json'
            },
            {
                name: 'chestRigs',
                url: 'https://cdn.jsdelivr.net/gh/panedioic/delta-force-loot-simulator@master/public/json/protect/chestRigs.json'
            },
            {
                name: 'helmet',
                url: 'https://cdn.jsdelivr.net/gh/panedioic/delta-force-loot-simulator@master/public/json/protect/helmet.json'
            },
            {
                name: 'primaryWeapon',
                url: 'https://cdn.jsdelivr.net/gh/panedioic/delta-force-loot-simulator@master/public/json/gun/gunRifle.json'
            },
            {
                name: 'secondaryWeapon',
                url: 'https://cdn.jsdelivr.net/gh/panedioic/delta-force-loot-simulator@master/public/json/gun/gunPistol.json'
            },
            {
                name: 'ammo',
                url: 'https://cdn.jsdelivr.net/gh/panedioic/delta-force-loot-simulator@master/public/json/gun/ammo.json'
            },
            {
                name: 'accBackGrip',
                url: 'https://cdn.jsdelivr.net/gh/panedioic/delta-force-loot-simulator@master/public/json/acc/accBackGrip.json'
            },
            {
                name: 'accBarrel',
                url: 'https://cdn.jsdelivr.net/gh/panedioic/delta-force-loot-simulator@master/public/json/acc/accBarrel.json'
            },
            {
                name: 'accForeGrip',
                url: 'https://cdn.jsdelivr.net/gh/panedioic/delta-force-loot-simulator@master/public/json/acc/accForeGrip.json'
            },
            {
                name: 'accFunctional',
                url: 'https://cdn.jsdelivr.net/gh/panedioic/delta-force-loot-simulator@master/public/json/acc/accFunctional.json'
            },
            {
                name: 'accHandGuard',
                url: 'https://cdn.jsdelivr.net/gh/panedioic/delta-force-loot-simulator@master/public/json/acc/accHandGuard.json'
            },
            {
                name: 'accMagazine',
                url: 'https://cdn.jsdelivr.net/gh/panedioic/delta-force-loot-simulator@master/public/json/acc/accMagazine.json'
            },
            {
                name: 'accMuzzle',
                url: 'https://cdn.jsdelivr.net/gh/panedioic/delta-force-loot-simulator@master/public/json/acc/accMuzzle.json'
            },
            {
                name: 'accScope',
                url: 'https://cdn.jsdelivr.net/gh/panedioic/delta-force-loot-simulator@master/public/json/acc/accScope.json'
            },
            {
                name: 'accStock',
                url: 'https://cdn.jsdelivr.net/gh/panedioic/delta-force-loot-simulator@master/public/json/acc/accStock.json'
            },
            {
                name: 'consume',
                url: 'https://cdn.jsdelivr.net/gh/panedioic/delta-force-loot-simulator@master/public/json/props/consume.json'
            },
            {
                name: 'key',
                url: 'https://cdn.jsdelivr.net/gh/panedioic/delta-force-loot-simulator@master/public/json/props/key.json'
            }
        ],
        layouts: "https://cdn.jsdelivr.net/gh/panedioic/delta-force-loot-simulator@master/public/json/layouts.json",
        gunSlotMap: "https://cdn.jsdelivr.net/gh/panedioic/delta-force-loot-simulator@master/public/json/gunSlotMap.json"
    }
}

export const REALTIME_VALUE = {
    "local": "/json/values.json",
    "jsdelivr": "https://cdn.jsdelivr.net/gh/panedioic/delta-force-loot-simulator@master/public/json/values.json",
    "df.sanyueqi.com": "https://df.sanyueqi.cn/api/v1/item_list?token=6205abb7-2eed-bfbd-ce66-20426eb34c25"
}

export const GAME_DEFAULT_CONFIG = {
    displayGridTitle: true,
    needSearch: true,
    resource_cdn: 'jsdelivr',
    realtime_value: 'df.sanyueqi.com'
}