import { Game } from "./game";
import { version } from "../package.json";

export class InfoDialog {
    private game: Game;
    private container!: HTMLDivElement;
    private isDragging: boolean = false;
    private dragStartPos = { x: 0, y: 0 };
    private dialogStartPos = { x: 0, y: 0 };

    constructor(game: Game) {
        this.game = game;
        this.initDialog();
    }

    

    initUI() {
        const appBoundingClientRect = this.game.app.canvas.getBoundingClientRect();
        console.log(appBoundingClientRect)

        const UIContainer = document.createElement('div');
        UIContainer.style.cssText = `
            position: absolute;
            left: ${appBoundingClientRect.x + 42}px;
            top: ${appBoundingClientRect.y + 386}px;
            width: 200px;
            height: 50px;
            background: white;
            border-radius: 10px;
            display: flex;
            align-items: center;
            padding: 0 10px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            z-index: 1000;
        `;

        const infoText = document.createElement('span');
        infoText.textContent = '游戏说明:';
        infoText.style.cssText = `
            font-family: Arial;
            font-size: 22px;
            color: #333;
            font-weight: bold;
            margin-right: 10px;
            user-select: none;
        `;

        const infoBtn = document.createElement('button');
        infoBtn.textContent = 'Click me!';
        infoBtn.style.cssText = `
            background: #4caf50;
            color: white;
            border: none;
            border-radius: 5px;
            padding: 5px 15px;
            cursor: pointer;
            font-size: 14px;
            user-select: none;
        `;
        infoBtn.onclick = () => this.show();

        UIContainer.appendChild(infoText);
        UIContainer.appendChild(infoBtn);
        // document.body.appendChild(UIContainer);
        window.app.appendChild(UIContainer);
    }

    private initDialog() {
        const appElement = document.getElementById('app');
        if (!appElement) {
            console.error('找不到 #app 元素');
            return;
        }

        this.container = document.createElement('div');
        this.container.style.cssText = `
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

        this.container.appendChild(closeBtn);
        this.container.appendChild(title);
        this.container.appendChild(content);
        // appElement.appendChild(this.container);
        window.app.appendChild(this.container)

        // 添加拖拽功能
        this.container.addEventListener('mousedown', this.onDragStart.bind(this));
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
            x: this.container.offsetLeft,
            y: this.container.offsetTop
        };
    }

    private onDragMove(event: MouseEvent) {
        if (!this.isDragging) return;
        
        const dx = event.clientX - this.dragStartPos.x;
        const dy = event.clientY - this.dragStartPos.y;
        
        this.container.style.left = `${this.dialogStartPos.x + dx}px`;
        this.container.style.top = `${this.dialogStartPos.y + dy}px`;
    }

    private onDragEnd() {
        this.isDragging = false;
    }

    show() {
        this.container.style.display = 'block';
        const left = (window.innerWidth - 600) / 2;
        const top = (window.innerHeight - 400) / 2;
        this.container.style.left = `${left}px`;
        this.container.style.top = `${top}px`;
    }

    hide() {
        this.container.style.display = 'none';
    }
}
