import * as PIXI from "pixi.js";

/**
 * 显示玩家目前获得的所有物资的总价值的组件。
 * */
export class TotalValueDisplay {
    private container: PIXI.Container;
    private valueText: PIXI.Text;

    public totalValue: number = 0;
    public additiveSize: {
        x: number;
        y: number;
    } = {
        x: 220,
        y: 60,
    };

    constructor() {
        this.container = new PIXI.Container();
        this.valueText = new PIXI.Text();

        this.initUI();
    }

    initUI() {
        // 背景
        const bg = new PIXI.Graphics();
        bg.roundRect(0, 0, 220, 60, 8);
        bg.fill({ color: 0xffffff });
        bg.stroke({ width: 2, color: 0x333333 });
        this.container.addChild(bg);

        // 标题
        const title = new PIXI.Text({
            text: "当前总价值:",
            style: {
                fontFamily: "Arial",
                fontSize: 16,
                fill: 0x333333,
                fontWeight: "bold",
            },
        });
        title.position.set(10, 20);
        this.container.addChild(title);

        // 价值显示
        this.valueText = new PIXI.Text({
            text: "0",
            style: {
                fontFamily: "Arial",
                fontSize: 24,
                fill: 0x00aa00,
                fontWeight: "bold",
            },
        });
        this.valueText.position.set(100, 13);
        this.container.addChild(this.valueText);
    }

    updateTotalValue() {
        this.totalValue = 0;

        // 遍历所有 countable 为 true 的 Grid
        window.game.grids.forEach((grid) => {
            if (grid.countable) {
                grid.blocks.forEach((block) => {
                    this.totalValue += block.getValue();
                });
            }
        });

        // 格式化数字显示，添加千位分隔符
        const formattedValue = this.totalValue
            .toString()
            .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        this.valueText.text = formattedValue;

        // 根据价值改变颜色
        let color = 0x00aa00; // 默认绿色
        if (this.totalValue > 500000)
            color = 0xff0000; // 红色
        else if (this.totalValue > 200000)
            color = 0xffcc00; // 金色
        else if (this.totalValue > 100000) color = 0xaa00aa; // 紫色
        this.valueText.style.fill = color;
    }
}
