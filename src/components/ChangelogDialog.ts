import * as PIXI from 'pixi.js';

export class ChangelogDialog {
    private changelogDialogContainerDOM!: HTMLDivElement;
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
        const changelogText = new PIXI.Text({
            text: "更新日志:",
            style: {
                fontFamily: "Arial",
                fontSize: 22,
                fill: 0x333333,
                fontWeight: "bold",
            },
        });
        changelogText.position.set(10, 13);
        this.container.addChild(changelogText);

        // 创建按钮
        const changelogButton = new PIXI.Container();
        const buttonBg = new PIXI.Graphics();
        buttonBg.roundRect(0, 0, 80, 30, 5);
        buttonBg.fill(0x4CAF50);
        
        const buttonText = new PIXI.Text({
            text: "查看",
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

        changelogButton.addChild(buttonBg);
        changelogButton.addChild(buttonText);
        changelogButton.position.set(110, 10);
        
        // 添加按钮交互
        changelogButton.eventMode = 'static';
        changelogButton.cursor = 'pointer';
        changelogButton.on('pointerdown', () => this.show());
        changelogButton.on('pointerover', () => {
            buttonBg.tint = 0x45A049;
        });
        changelogButton.on('pointerout', () => {
            buttonBg.tint = 0xFFFFFF;
        });

        this.container.addChild(changelogButton);
    }

    private initDialog() {
        const appElement = document.getElementById('app');
        if (!appElement) {
            console.error('找不到 #app 元素');
            return;
        }

        this.changelogDialogContainerDOM = document.createElement('div');
        this.changelogDialogContainerDOM.style.cssText = `
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
        title.textContent = '更新日志';
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
            <div style="margin-bottom: 20px;">
                <h2 style="font-size: 18px; color: #66ccff;">版本 0.10.3 <span style="color: #999; font-size: 14px;">2025-06-21</span></h2>
                <ul style="list-style-type: none; padding-left: 20px;">
                    <li>• 加入了实时价格功能（感谢 @松叶 提供的 API）。</li>
                    <li>• 加入了 CDN 功能，加速资源加载。</li>
                </ul>
            </div>
            <div style="margin-bottom: 20px;">
                <h2 style="font-size: 18px; color: #66ccff;">版本 0.10.2 <span style="color: #999; font-size: 14px;">2025-06-21</span></h2>
                <ul style="list-style-type: none; padding-left: 20px;">
                    <li>• 重构了一些代码，去掉了一些 warnings。</li>
                    <li>• 增加了搜索功能。</li>
                </ul>
            </div>
            <div style="margin-bottom: 20px;">
                <h2 style="font-size: 18px; color: #66ccff;">版本 0.10.1 <span style="color: #999; font-size: 14px;">2025-06-20</span></h2>
                <ul style="list-style-type: none; padding-left: 20px;">
                    <li>• 修复了部分道具交换位置失败的 bug。</li>
                </ul>
            </div>
            <div style="margin-bottom: 20px;">
                <h2 style="font-size: 18px; color: #66ccff;">版本 0.10.0 <span style="color: #999; font-size: 14px;">2025-06-20</span></h2>
                <ul style="list-style-type: none; padding-left: 20px;">
                    <li>• 虽然没啥新功能，但是 item 的代码整体重构了一下，因此版本号直接跳到 0.10.0</li>
                    <li>• 加入了基本所有的 S1 赛季物品</li>
                    <li>• 预设功能暂时下线（可能存在 bug）</li>
                    <li>• 调试工具和物品管理功能下线</li>
                    <li>• 枪械配件冲突检测下线，现在可以随便加配件</li>
                </ul>
            </div>
            <div style="margin-bottom: 20px;">
                <h2 style="font-size: 18px; color: #66ccff;">版本 0.9.1 <span style="color: #999; font-size: 14px;">2025-06-18</span></h2>
                <ul style="list-style-type: none; padding-left: 20px;">
                    <li>• 增加了 F 键快速拾取物品功能</li>
                    <li>• 修复了已知 bug</li>
                </ul>
            </div>
            <div style="margin-bottom: 20px;">
                <h2 style="font-size: 18px; color: #66ccff;">版本 0.9.0 <span style="color: #999; font-size: 14px;">2025-06-18</span></h2>
                <ul style="list-style-type: none; padding-left: 20px;">
                    <li>• 增加了 Changelog 页面</li>
                </ul>
            </div>
            <div style="margin-bottom: 20px;">
                <h2 style="font-size: 18px; color: #66ccff;">版本 0.8.15 <span style="color: #999; font-size: 14px;">2025-06-14</span></h2>
                <ul style="list-style-type: none; padding-left: 20px;">
                    <li>• 终于大体可玩的版本</li>
                </ul>
            </div>
        `;

        this.changelogDialogContainerDOM.appendChild(closeBtn);
        this.changelogDialogContainerDOM.appendChild(title);
        this.changelogDialogContainerDOM.appendChild(content);
        window.app.appendChild(this.changelogDialogContainerDOM);

        // 添加拖拽功能
        this.changelogDialogContainerDOM.addEventListener('mousedown', this.onDragStart.bind(this));
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
            x: this.changelogDialogContainerDOM.offsetLeft,
            y: this.changelogDialogContainerDOM.offsetTop
        };
    }

    private onDragMove(event: MouseEvent) {
        if (!this.isDragging) return;
        
        const dx = event.clientX - this.dragStartPos.x;
        const dy = event.clientY - this.dragStartPos.y;
        
        this.changelogDialogContainerDOM.style.left = `${this.dialogStartPos.x + dx}px`;
        this.changelogDialogContainerDOM.style.top = `${this.dialogStartPos.y + dy}px`;
    }

    private onDragEnd() {
        this.isDragging = false;
    }

    show() {
        this.changelogDialogContainerDOM.style.display = 'block';
        // 居中显示
        this.changelogDialogContainerDOM.style.left = `${(window.innerWidth - this.changelogDialogContainerDOM.offsetWidth) / 2}px`;
        this.changelogDialogContainerDOM.style.top = `${(window.innerHeight - this.changelogDialogContainerDOM.offsetHeight) / 2}px`;
    }

    hide() {
        this.changelogDialogContainerDOM.style.display = 'none';
    }
} 