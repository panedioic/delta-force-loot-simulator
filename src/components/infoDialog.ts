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
        `;
        content.innerHTML = `
            游戏介绍：<br>
            三角洲行动的舔包模拟器。通过拖拽方式管理你的装备和收集品。<br>
            <br>
            玩法说明：<br>
            1. 拖动物品到合适的格子中存放<br>
            2. 按R键可以旋转物品<br>
            3. 合理安排空间以获得最大收益<br>
            <br>
            游戏版本：${version}<br>
            项目作者：依言（Y1yan）<br>
            项目地址：<a href="https://github.com/panedioic/delta-force-loot-simulator" target="_blank" style="color: #66ccff; text-decoration: none;">https://github.com/panedioic/delta-force-loot-simulator</a><br>
            讨论群：还没有建好（
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
