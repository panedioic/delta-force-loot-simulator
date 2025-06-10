# 三角洲舔包模拟器 🎮

[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](package.json)
[![Vite](https://img.shields.io/badge/Vite-6.2-green)](package.json)

三角洲行动的舔包模拟器。

担心自己打完架后不会舔包痛失百万哈夫币？看见主播清图后的炒菜看的手痒？快来试试这款三角洲舔包模拟器吧！让你不用打开三角洲也可以享受舔包的感觉\~

## ✨ Features

- 拖放式界面
- 模拟了手机端三角洲行动的 UI
- 多种物品类型（头、甲、背包、胸挂、枪械、收集品...）
- 计时器系统
- 自动计算所有物品的总价值

## 🌐 Online Demo

[点击体验在线演示](https://df.y1yan.com)

## 🚀 Quick Start

1. 克隆仓库
2. 安装依赖：
```bash
npm install
```
3. 启动开发服务器：
```bash
npm run dev
```

## 📁 项目结构

- `src/` - 源代码
  - `game.ts` - 主游戏逻辑
  - `block.ts` - 物品方块实现
  - `grid.ts` - 网格系统
  - `timer.ts` - 计时器实现
  - 以及更多...
- `public/` - 静态资产和配置文件

## 📝 TODO

- [ ] 道具搜索功能
- [ ] 子弹组合功能
- [ ] 改枪系统
- [ ] 不同的背包和胸挂样式
- [ ] 自动旋转功能
- [ ] 交换位置功能
- [ ] 更大的战利品区域
- [ ] 双击快速拾取
- [ ] 其他功能改进

## 🤝 Contrubution

欢迎参与项目开发！您可以通过以下方式贡献：
1. Fork 仓库
2. 创建功能分支
3. 提交 Pull Request

如有任何问题或建议，欢迎提出 Issue！

## 👨‍💻 Development

Created by [Y1yan（依言）](https://github.com/panedioic)

## 📄 License

本项目采用 Apache-2.0 许可证开源，详见 LICENSE 文件。

## 配置文件说明

### blocks.json

物品配置文件，定义了游戏中所有可用的物品。每个物品包含以下属性：

```json
{
    "name": "物品名称",
    "type": "物品类型",
    "color": "808080",     // 物品颜色（稀有度）
    "search": 1,           // 搜索所需时间
    "cellWidth": 2,        // 物品宽度（格子数）
    "cellHeight": 1,       // 物品高度（格子数）
    "maxStack": 60,        // 最大堆叠数量（一般是子弹使用）
    "value": 100,          // 物品价值（单个价值）
    "accessories": [       // 配件槽位（可选）
        {
            "type": "配件类型",
            "title": "槽位名称"
        }
    ],
    "subgridLayout": [     // 子网格布局（可选，用于背包、胸挂等）
        [2, 3, 0, 0],      // [宽度, 高度, x偏移, y偏移]
        [3, 2, 2, 0]
    ],
    "ammo": "Ammo76251",   // 使用子弹类型（枪械）
    "capacity": 10,        // 弹匣容量（枪械或弹匣）
    "conflict": [          // 配件间的相互冲突
      ["Handguard", "HandguardKit"]
    ]
}
```

物品类型包括：
一般的类型：
- `primaryWeapon`: 主武器
- `secondaryWeapon`: 副武器
- `Helmet`: 头盔
- `Armor`: 护甲
- `Backpack`: 背包
- `ChestRig`: 胸挂
特殊类型：
- `Ammo76251`: 弹药
- `Barrel`: 枪管
- `Muzzle`: 枪口
- `Handguard`: 护木
- `Magazine`: 弹匣
- `Scope`: 瞄准镜
- `SideSight`: 侧瞄
- 等...
