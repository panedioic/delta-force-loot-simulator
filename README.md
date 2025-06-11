# 三角洲舔包模拟器 🎮

[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](package.json)
[![Vite](https://img.shields.io/badge/Vite-6.2-green)](package.json)

三角洲行动的舔包模拟器。

担心自己打完架后不会舔包痛失百万哈夫币？看见主播清图后的炒菜看的手痒？快来试试这款三角洲舔包模拟器吧！让你不用打开三角洲也可以享受舔包的感觉\~

## ✨ Features

- 模拟了手机端三角洲行动的 UI （虽然现在只支持电脑端）
- 多种容器类型（区分盒子和一般容器，不过没有对不同的容器做区分）
- 计时器系统，在有限的时间内拾取最多的价值吧！
- 拼好枪！
- 自由的添加道具（现在是个摆设）

等等等等....

## 注意

1. 目前的项目还是 Demo 阶段，存在着大量的 bug，欢迎及时反馈！
2. 目前的道具还并不齐全，欢迎有帕鲁帮我补齐（会署名，但是没有其他奖励了，作者也很穷）
3. 所有的道具价值都是我从游戏里抄的那个时候的价值，不会更新（懒得更新了，不过或许以后可以和其他数据网站合作一下？）
4. 音效估计也不会有了（虽然使用了 Vercel 部署，但流量还是很贵的啊。。）

## 🌐 Online Demo

[点击体验在线演示](https://df.y1yan.com)

## 🚀 Quick Start

如果你想要本地运行这个项目，请参考以下步骤：

1. 确保你具备 node.js 开发环境
2. 克隆仓库
```bash
git clone http://github.com/panedioic/delta-force-loot-simulator.git
```
3. 安装依赖：
```bash
npm install
```
4. 启动开发服务器：
```bash
npm run dev
```

## 📁 项目结构

- `src/` - 源代码
- `public/` - 静态资产和配置文件

详细的开发文档以后再补吧（）

## 📝 TODO & 已知 bug

- [ ] 道具搜索功能（bug）
- [ ] 完善设置/管理/调试界面（目前只是摆设）
- [ ] 双击快速拾取（bug）
- [ ] 拖动物品时有时会出现 bug
- [ ] 拖动有物品的背包时背包里的物品会消失
- [ ] 部分格子无法放置道具/有些时候放置道具会错位
- [ ] 部分道具 UI 显示异常
......


## 🤝 Contrubution

仅凭我一人开发的速度必然是缓慢的，欢迎有意愿的同学一起参与开发！您可以通过以下方式贡献：
1. Fork 仓库
2. 创建功能分支
3. 提交 Pull Request

如有任何问题或建议，欢迎提出 Issue！

## 配置文件说明

### blocks.json

物品配置文件，定义了游戏中所有可用的物品。每个物品包含以下属性：

```js
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

### 物品类型包括：

#### 一般的类型：

- `collection`: 常规收集品
- `primaryWeapon`: 主武器
- `secondaryWeapon`: 副武器
- `Helmet`: 头盔
- `Armor`: 护甲
- `Backpack`: 背包
- `ChestRig`: 胸挂

#### 特殊类型：

- `Ammo76251`: 弹药
- `Barrel`: 枪管
- `Muzzle`: 枪口
- `Handguard`: 护木
- `Magazine`: 弹匣
- `Scope`: 瞄准镜
- `SideSight`: 侧瞄
- 等等等等...


## 👨‍💻 Development

Created by [Y1yan（依言）](https://github.com/panedioic)

## 📄 License

本项目采用 Apache-2.0 许可证开源。

项目内部分道具文本版权归腾讯公司所有。