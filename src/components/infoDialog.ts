import { version } from "../../package.json";
import * as PIXI from 'pixi.js';

export class InfoDialog {
    private infoDialogContainerDOM!: HTMLDivElement;
    private isDragging: boolean = false;
    private dragStartPos = { x: 0, y: 0 };
    private dialogStartPos = { x: 0, y: 0 };

    public container!: PIXI.Container;
    public additiveSize: {
        x: number,
        y: number
    } = {
        x: 220,
        y: 50
    }

    constructor() {
        this.initDialog();
        this.initUI();
    }

    private initUI() {
        // 创建主容器
        this.container = new PIXI.Container();
        
        // 创建背景
        const background = new PIXI.Graphics();
        background.roundRect(0, 0, 220, 50, 10);
        background.fill(0xFFFFFF);
        this.container.addChild(background);

        // 创建文本
        const infoText = new PIXI.Text({
            text: "游戏说明:",
            style: {
                fontFamily: "Arial",
                fontSize: 22,
                fill: 0x333333,
                fontWeight: "bold",
            },
        });
        infoText.position.set(10, 13);
        this.container.addChild(infoText);

        // 创建按钮
        const infoButton = new PIXI.Container();
        const buttonBg = new PIXI.Graphics();
        buttonBg.roundRect(0, 0, 80, 30, 5);
        buttonBg.fill(0x4CAF50);
        
        const buttonText = new PIXI.Text({
            text: "Click me!",
            style: {
                fontFamily: "Arial",
                fontSize: 14,
                fill: 0xffffff,
            },
        });
        buttonText.position.set(
            (80 - buttonText.width) / 2,
            (30 - buttonText.height) / 2
        );

        infoButton.addChild(buttonBg);
        infoButton.addChild(buttonText);
        infoButton.position.set(110, 10);
        
        // 添加按钮交互
        infoButton.eventMode = 'static';
        infoButton.cursor = 'pointer';
        infoButton.on('pointerdown', () => this.show());
        infoButton.on('pointerover', () => {
            buttonBg.tint = 0x45A049;
        });
        infoButton.on('pointerout', () => {
            buttonBg.tint = 0xFFFFFF;
        });

        this.container.addChild(infoButton);
    }

    private initDialog() {
        const appElement = document.getElementById('app');
        if (!appElement) {
            console.error('找不到 #app 元素');
            return;
        }

        this.infoDialogContainerDOM = document.createElement('div');
        this.infoDialogContainerDOM.style.cssText = `
            position: fixed;
            width: 600px;
            height: 400px;
            background: rgba(36, 47, 57, 0.95);
            border: 2px solid #666;
            display: none;
            color: white;
            padding: 20px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            font-family: Arial, sans-serif;
            user-select: none;
            z-index: 1001;
        `;

        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.style.cssText = `
            position: absolute;
            right: 20px;
            top: 20px;
            width: 30px;
            height: 30px;
            background: #ff3333;
            border: none;
            border-radius: 5px;
            color: white;
            font-size: 20px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        closeBtn.onclick = () => this.hide();

        const title = document.createElement('h1');
        title.textContent = '三角洲舔包模拟器';
        title.style.cssText = `
            font-size: 24px;
            margin: 0 0 20px 0;
            font-weight: bold;
        `;

        const content = document.createElement('div');
        content.style.cssText = `
            font-size: 16px;
            line-height: 24px;
            max-height: calc(100% - 80px);
            overflow-y: auto;
            padding-right: 10px;
        `;
        content.innerHTML = `
            游戏介绍：<br>
            三角洲行动的舔包模拟器。<br>
            担心自己打完架后不会舔包痛失百万哈夫币？看见主播清图后的炒菜看的手痒？快来试试这款三角洲舔包模拟器吧！让你不用打开三角洲也可以享受舔包的感觉~<br>
            <br>
            玩法说明：<br>
            1. 点击左侧的"开始"按钮开始游戏。<br>
            2. "战利品"的有房按钮可以切换战利品区域。<br>
            3. 子弹可以堆叠，点开枪械的详细面板还可以改枪！<br>
            <br>
            注意：<br>
            1. 目前游戏还处于 Demo 阶段，存在着大量的 bug，欢迎及时反馈！<br>
            2. 目前道具还并不齐全，欢迎有帕鲁帮我补齐（会署名，但是没有其他奖励了，作者也很穷）<br>
            3. 所有的道具价值都是我从游戏里抄的那个时候的价值，不会更新（懒得更新了，不过或许以后可以和其他数据网站合作一下？）<br>
            4. 音效估计也不会有了（虽然使用了 Vercel 部署，但流量还是很贵的啊。。）<br>
            <br>
            游戏版本：${version}<br>
            项目作者：依言（Y1yan）<br>
            项目地址：<a href="https://github.com/panedioic/delta-force-loot-simulator" target="_blank" style="color: #66ccff; text-decoration: none;">https://github.com/panedioic/delta-force-loot-simulator</a><br>
            讨论群：并没有建群的想法（
        `;

        this.infoDialogContainerDOM.appendChild(closeBtn);
        this.infoDialogContainerDOM.appendChild(title);
        this.infoDialogContainerDOM.appendChild(content);
        window.app.appendChild(this.infoDialogContainerDOM);

        // 添加拖拽功能
        this.infoDialogContainerDOM.addEventListener('mousedown', this.onDragStart.bind(this));
        document.addEventListener('mousemove', this.onDragMove.bind(this));
        document.addEventListener('mouseup', this.onDragEnd.bind(this));
    }

    private onDragStart(event: MouseEvent) {
        if (event.target instanceof HTMLAnchorElement) return;
        
        this.isDragging = true;
        this.dragStartPos = {
            x: event.clientX,
            y: event.clientY
        };
        this.dialogStartPos = {
            x: this.infoDialogContainerDOM.offsetLeft,
            y: this.infoDialogContainerDOM.offsetTop
        };
    }

    private onDragMove(event: MouseEvent) {
        if (!this.isDragging) return;
        
        const dx = event.clientX - this.dragStartPos.x;
        const dy = event.clientY - this.dragStartPos.y;
        
        this.infoDialogContainerDOM.style.left = `${this.dialogStartPos.x + dx}px`;
        this.infoDialogContainerDOM.style.top = `${this.dialogStartPos.y + dy}px`;
    }

    private onDragEnd() {
        this.isDragging = false;
    }

    show() {
        this.infoDialogContainerDOM.style.display = 'block';
        const left = (window.innerWidth - 600) / 2;
        const top = (window.innerHeight - 400) / 2;
        this.infoDialogContainerDOM.style.left = `${left}px`;
        this.infoDialogContainerDOM.style.top = `${top}px`;
    }

    hide() {
        this.infoDialogContainerDOM.style.display = 'none';
    }
}
