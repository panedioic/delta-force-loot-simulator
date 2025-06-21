import * as PIXI from "pixi.js";

export class Magnify {
    private parent: PIXI.Container;
    private container: PIXI.Container;
    private magnifyGraphics: PIXI.Graphics;
    private centerX: number;
    private centerY: number;
    private radius: number = 12;
    private angle: number = 0;
    private rotationRadius: number = 8;
    private rotationSpeed: number = 0.06;

    constructor(parent: PIXI.Container, x: number, y: number, width: number, height: number) {
        this.parent = parent;
        this.container = new PIXI.Container();
        this.container.position.set(x, y);

        // 添加一个矩形方便调试
        // const testRect = new PIXI.Graphics();
        // testRect.rect(0, 0, width, height);
        // testRect.fill({ color: 0x000000, alpha: 0.5 });
        // this.container.addChild(testRect);
        
        // 计算中心点
        this.centerX = width / 2;
        this.centerY = height / 2;

        // 创建放大镜图形
        this.magnifyGraphics = new PIXI.Graphics();
        this.drawMagnify();
        this.container.addChild(this.magnifyGraphics);

        // 添加到游戏舞台
        this.parent.addChild(this.container);

        // 开始动画
        window.game.app.ticker.add(this.animate.bind(this));
    }

    private drawMagnify() {
        this.magnifyGraphics.clear();

        // 计算当前位置
        const x = this.centerX + Math.cos(this.angle) * this.rotationRadius - 5;
        const y = this.centerY + Math.sin(this.angle) * this.rotationRadius - 5;

        // 绘制圆形镜片
        this.magnifyGraphics.circle(x, y, this.radius);
        this.magnifyGraphics.fill({ color: 0xffffff, alpha: 0 });
        this.magnifyGraphics.stroke({ width: 5, color: 0xffffff });

        // 绘制手柄
        this.magnifyGraphics.moveTo(x+this.radius*0.7, y+this.radius*0.7);
        this.magnifyGraphics.lineTo(x+this.radius*1.8, y+this.radius*1.8);
        this.magnifyGraphics.fill(0xffffff);
        this.magnifyGraphics.stroke({ width: 5, color: 0xffffff });
    }

    private animate() {
        if (!window.game.config.needSearch) return;
        
        // 更新角度
        this.angle += this.rotationSpeed;
        if (this.angle >= Math.PI * 2) {
            this.angle = 0;
        }

        // 重绘放大镜
        this.drawMagnify();
    }

    show() {
        this.container.visible = true;
    }

    hide() {
        this.container.visible = false;
    }
}
