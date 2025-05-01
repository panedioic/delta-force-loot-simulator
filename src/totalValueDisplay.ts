import * as PIXI from 'pixi.js';
import { Game } from './game';

export class TotalValueDisplay {
    private game: Game;
    private x: number;
    private y: number;
    private totalValue: number;
    private container: PIXI.Container;

    constructor(game: Game, x: number, y: number) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.totalValue = 0;

        this.container = new PIXI.Container();

        this.initUI();
    }

    initUI() {
        // 背景
        const bg = new PIXI.Graphics();
        bg.beginFill(0xffffff);
        bg.lineStyle(2, 0x333333);
        bg.drawRoundedRect(0, 0, 220, 60, 8);
        bg.endFill();
        this.container.addChild(bg);

        // 标题
        const title = new PIXI.Text('当前总价值:', {
            fontFamily: 'Arial',
            fontSize: 16,
            fill: 0x333333,
            fontWeight: 'bold'
        });
        title.position.set(10, 20);
        this.container.addChild(title);

        // 价值显示
        const valueText = new PIXI.Text('0', {
            fontFamily: 'Arial',
            fontSize: 24,
            fill: 0x00aa00,
            fontWeight: 'bold'
        });
        valueText.position.set(100, 13);
        this.container.addChild(valueText);

        // // 单位
        // const unitText = new PIXI.Text('元', {
        //     fontFamily: 'Arial',
        //     fontSize: 16,
        //     fill: 0x333333
        // });
        // unitText.position.set(210, 20);
        // this.container.addChild(unitText);

        // 定位在左侧网格上方
        this.container.position.set(this.x, this.y);

        this.game.app.stage.addChild(this.container);
    }

    updateTotalValue() {
        this.totalValue = 0;

        // 遍历所有 countable 为 true 的 Grid
        this.game.grids.forEach(grid => {
            if (grid.countable) {
                grid.blocks.forEach(block => {
                    this.totalValue += block.getValue();
                });
            }
        });

        // 格式化数字显示，添加千位分隔符
        const formattedValue = this.totalValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        this.valueText.text = formattedValue;

        // 根据价值改变颜色
        let color = 0x00aa00; // 默认绿色
        if (this.totalValue > 500000) color = 0xff0000; // 红色
        else if (this.totalValue > 200000) color = 0xffcc00; // 金色
        else if (this.totalValue > 100000) color = 0xaa00aa; // 紫色
        this.valueText.style.fill = color;
    }
}