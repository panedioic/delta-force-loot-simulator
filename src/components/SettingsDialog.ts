import * as PIXI from 'pixi.js';

export class SettingsDialog {
    private settingsDialogContainerDOM!: HTMLDivElement;
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
        const settingsText = new PIXI.Text({
            text: "游戏设置:",
            style: {
                fontFamily: "Arial",
                fontSize: 22,
                fill: 0x333333,
                fontWeight: "bold",
            },
        });
        settingsText.position.set(10, 13);
        this.container.addChild(settingsText);

        // 创建按钮
        const settingsButton = new PIXI.Container();
        const buttonBg = new PIXI.Graphics();
        buttonBg.roundRect(0, 0, 80, 30, 5);
        buttonBg.fill(0x4CAF50);
        
        const buttonText = new PIXI.Text({
            text: "设置",
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

        settingsButton.addChild(buttonBg);
        settingsButton.addChild(buttonText);
        settingsButton.position.set(110, 10);
        
        // 添加按钮交互
        settingsButton.eventMode = 'static';
        settingsButton.cursor = 'pointer';
        settingsButton.on('pointerdown', () => this.show());
        settingsButton.on('pointerover', () => {
            buttonBg.tint = 0x45A049;
        });
        settingsButton.on('pointerout', () => {
            buttonBg.tint = 0xFFFFFF;
        });

        this.container.addChild(settingsButton);
    }

    private initDialog() {
        this.settingsDialogContainerDOM = document.createElement('div');
        this.settingsDialogContainerDOM.style.cssText = `
            position: fixed;
            width: 800px;
            height: 600px;
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
        title.textContent = '游戏设置';
        title.style.cssText = `
            font-size: 24px;
            margin: 0 0 20px 0;
            font-weight: bold;
        `;

        // 创建设置内容容器
        const settingsContent = document.createElement('div');
        settingsContent.style.cssText = `
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            padding: 20px;
        `;

        // 左侧 - 基础设置
        const basicSettings = document.createElement('div');
        basicSettings.innerHTML = `
            <h2 style="margin-bottom: 15px;">基础设置</h2>
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px;">右边区域数量：</label>
                <input type="number" min="1" max="10" value="3" style="width: 100px; padding: 5px; border-radius: 4px; border: 1px solid #666;">
            </div>
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px;">
                    <input type="checkbox" checked> 启用搜索功能
                </label>
            </div>
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px;">
                    <input type="checkbox" checked> 显示物品价值
                </label>
            </div>
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px;">
                    <input type="checkbox" checked> 启用旋转提示
                </label>
            </div>
        `;

        // 右侧 - 区域管理
        const regionSettings = document.createElement('div');
        regionSettings.innerHTML = `
            <h2 style="margin-bottom: 15px;">区域管理</h2>
            <div style="margin-bottom: 10px;">
                <button style="padding: 5px 15px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    添加新区域
                </button>
            </div>
            <div id="regionList" style="max-height: 400px; overflow-y: auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: rgba(255,255,255,0.1); margin-bottom: 5px; border-radius: 4px;">
                    <span>区域 1</span>
                    <div>
                        <button style="padding: 3px 10px; background: #2196F3; color: white; border: none; border-radius: 3px; margin-right: 5px;">编辑</button>
                        <button style="padding: 3px 10px; background: #f44336; color: white; border: none; border-radius: 3px;">删除</button>
                    </div>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: rgba(255,255,255,0.1); margin-bottom: 5px; border-radius: 4px;">
                    <span>区域 2</span>
                    <div>
                        <button style="padding: 3px 10px; background: #2196F3; color: white; border: none; border-radius: 3px; margin-right: 5px;">编辑</button>
                        <button style="padding: 3px 10px; background: #f44336; color: white; border: none; border-radius: 3px;">删除</button>
                    </div>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: rgba(255,255,255,0.1); margin-bottom: 5px; border-radius: 4px;">
                    <span>区域 3</span>
                    <div>
                        <button style="padding: 3px 10px; background: #2196F3; color: white; border: none; border-radius: 3px; margin-right: 5px;">编辑</button>
                        <button style="padding: 3px 10px; background: #f44336; color: white; border: none; border-radius: 3px;">删除</button>
                    </div>
                </div>
            </div>
        `;

        // 底部按钮
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            position: absolute;
            bottom: 20px;
            right: 20px;
            display: flex;
            gap: 10px;
        `;

        const saveButton = document.createElement('button');
        saveButton.textContent = '保存设置';
        saveButton.style.cssText = `
            padding: 8px 20px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        `;
        saveButton.onclick = () => this.saveSettings();

        const resetButton = document.createElement('button');
        resetButton.textContent = '重置默认';
        resetButton.style.cssText = `
            padding: 8px 20px;
            background: #f44336;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        `;
        resetButton.onclick = () => this.resetSettings();

        buttonContainer.appendChild(resetButton);
        buttonContainer.appendChild(saveButton);

        settingsContent.appendChild(basicSettings);
        settingsContent.appendChild(regionSettings);

        this.settingsDialogContainerDOM.appendChild(closeBtn);
        this.settingsDialogContainerDOM.appendChild(title);
        this.settingsDialogContainerDOM.appendChild(settingsContent);
        this.settingsDialogContainerDOM.appendChild(buttonContainer);
        window.app.appendChild(this.settingsDialogContainerDOM);

        // 添加拖拽功能
        this.settingsDialogContainerDOM.addEventListener('mousedown', this.onDragStart.bind(this));
        document.addEventListener('mousemove', this.onDragMove.bind(this));
        document.addEventListener('mouseup', this.onDragEnd.bind(this));
    }

    private onDragStart(event: MouseEvent) {
        if (
            event.target instanceof HTMLButtonElement ||
            event.target instanceof HTMLInputElement ||
            event.target instanceof HTMLSelectElement
        ) return;
        
        this.isDragging = true;
        this.dragStartPos = {
            x: event.clientX,
            y: event.clientY
        };
        this.dialogStartPos = {
            x: this.settingsDialogContainerDOM.offsetLeft,
            y: this.settingsDialogContainerDOM.offsetTop
        };
    }

    private onDragMove(event: MouseEvent) {
        if (!this.isDragging) return;
        
        const dx = event.clientX - this.dragStartPos.x;
        const dy = event.clientY - this.dragStartPos.y;
        
        this.settingsDialogContainerDOM.style.left = `${this.dialogStartPos.x + dx}px`;
        this.settingsDialogContainerDOM.style.top = `${this.dialogStartPos.y + dy}px`;
    }

    private onDragEnd() {
        this.isDragging = false;
    }

    private saveSettings() {
        // TODO: 实现保存设置的逻辑
        console.log('保存设置');
        this.hide();
    }

    private resetSettings() {
        // TODO: 实现重置设置的逻辑
        if (confirm('确定要重置所有设置吗？')) {
            console.log('重置设置');
        }
    }

    show() {
        this.settingsDialogContainerDOM.style.display = 'block';
        const left = (window.innerWidth - 800) / 2;
        const top = (window.innerHeight - 600) / 2;
        this.settingsDialogContainerDOM.style.left = `${left}px`;
        this.settingsDialogContainerDOM.style.top = `${top}px`;
    }

    hide() {
        this.settingsDialogContainerDOM.style.display = 'none';
    }
} 