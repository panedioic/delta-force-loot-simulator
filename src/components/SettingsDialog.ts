import * as PIXI from 'pixi.js';

export class SettingsDialog {
    private settingsDialogContainerDOM!: HTMLDivElement;
    private isDragging: boolean = false;
    private dragStartPos = { x: 0, y: 0 };
    private dialogStartPos = { x: 0, y: 0 };
    private regionDialog!: HTMLDivElement;
    private regionList!: HTMLDivElement;
    private currentEditingIndex: number = -1;

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
        this.loadRegionsFromStorage();
        this.setupRegionEventListeners();
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
                <label style="display: block; margin-bottom: 5px;">
                    <input type="checkbox" id="needSearchCheckbox" ${window.game.config.needSearch ? 'checked' : ''}> 启用搜索功能
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
            <h2 style="margin-bottom: 15px;">默认战利品区域管理</h2>
            <div style="margin-bottom: 10px;">
                <button id="addRegionBtn" style="padding: 5px 15px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    添加新区域
                </button>
            </div>
            <div id="regionList" style="max-height: 400px; overflow-y: auto;">
                ${this.generateRegionListHTML()}
            </div>
        `;

        // 创建添加/编辑区域的弹窗
        const regionDialog = document.createElement('div');
        regionDialog.id = 'regionDialog';
        regionDialog.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 400px;
            background: rgba(36, 47, 57, 0.98);
            border: 2px solid #666;
            padding: 20px;
            display: none;
            z-index: 1002;
            border-radius: 8px;
        `;

        regionDialog.innerHTML = `
            <h3 style="margin: 0 0 20px 0; color: white;">添加新区域</h3>
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; color: white;">类型：</label>
                <select id="regionType" style="width: 100%; padding: 8px; background: #333; color: white; border: 1px solid #666; border-radius: 4px;">
                    <option value="spoilsBox">战利品箱</option>
                    <option value="playerContainer">玩家盒子</option>
                </select>
            </div>
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; color: white;">标题：</label>
                <input type="text" id="regionTitle" style="width: 100%; padding: 8px; background: #333; color: white; border: 1px solid #666; border-radius: 4px;">
            </div>
            <div class="size-inputs" style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; color: white;">尺寸：</label>
                <div style="display: flex; gap: 10px;">
                    <input type="number" id="regionWidth" placeholder="宽度" style="width: 50%; padding: 8px; background: #333; color: white; border: 1px solid #666; border-radius: 4px;">
                    <input type="number" id="regionHeight" placeholder="高度" style="width: 50%; padding: 8px; background: #333; color: white; border: 1px solid #666; border-radius: 4px;">
                </div>
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 10px;">
                <button id="cancelRegionBtn" style="padding: 8px 20px; background: #666; color: white; border: none; border-radius: 4px; cursor: pointer;">取消</button>
                <button id="confirmRegionBtn" style="padding: 8px 20px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">确认</button>
            </div>
        `;

        document.body.appendChild(regionDialog);

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

    private loadRegionsFromStorage() {
        const storedRegions = localStorage.getItem('defaultSpoilsRegionConfig');
        if (storedRegions) {
            window.game.defaultSpoilsRegionConfig = JSON.parse(storedRegions);
        }
        this.updateRegionList();
    }

    private setupRegionEventListeners() {
        const addRegionBtn = document.getElementById('addRegionBtn');
        const cancelRegionBtn = document.getElementById('cancelRegionBtn');
        const confirmRegionBtn = document.getElementById('confirmRegionBtn');
        const regionType = document.getElementById('regionType') as HTMLSelectElement;
        const needSearchCheckbox = document.getElementById('needSearchCheckbox') as HTMLInputElement;
        this.regionDialog = document.getElementById('regionDialog') as HTMLDivElement;
        this.regionList = document.getElementById('regionList') as HTMLDivElement;

        if (!addRegionBtn || !cancelRegionBtn || !confirmRegionBtn || !regionType || !this.regionDialog || !this.regionList || !needSearchCheckbox) {
            console.error('Some required elements are missing');
            return;
        }

        needSearchCheckbox.addEventListener('change', (e) => {
            window.game.config.needSearch = (e.target as HTMLInputElement).checked;
            window.game.refreshUIRecursive();
        });

        addRegionBtn.addEventListener('click', () => this.showRegionDialog());
        cancelRegionBtn.addEventListener('click', () => this.hideRegionDialog());
        confirmRegionBtn.addEventListener('click', () => this.saveRegion());

        regionType.addEventListener('change', (e) => {
            const sizeInputs = document.querySelector('.size-inputs') as HTMLDivElement;
            if (sizeInputs) {
                sizeInputs.style.display = (e.target as HTMLSelectElement).value === 'spoilsBox' ? 'block' : 'none';
            }
        });
    }

    private showRegionDialog(editIndex: number = -1) {
        this.currentEditingIndex = editIndex;
        const dialog = document.getElementById('regionDialog') as HTMLDivElement;
        const titleInput = document.getElementById('regionTitle') as HTMLInputElement;
        const typeSelect = document.getElementById('regionType') as HTMLSelectElement;
        const widthInput = document.getElementById('regionWidth') as HTMLInputElement;
        const heightInput = document.getElementById('regionHeight') as HTMLInputElement;
        const sizeInputs = document.querySelector('.size-inputs') as HTMLDivElement;

        if (editIndex >= 0) {
            const region = window.game.defaultSpoilsRegionConfig[editIndex];
            titleInput.value = region.title;
            typeSelect.value = region.type;
            if (region.type === 'spoilsBox') {
                widthInput.value = region.width.toString();
                heightInput.value = region.height.toString();
                sizeInputs.style.display = 'block';
            } else {
                sizeInputs.style.display = 'none';
            }
        } else {
            titleInput.value = '';
            typeSelect.value = 'spoilsBox';
            widthInput.value = '7';
            heightInput.value = '8';
            sizeInputs.style.display = 'block';
        }

        dialog.style.display = 'block';
    }

    private hideRegionDialog() {
        const dialog = document.getElementById('regionDialog') as HTMLDivElement;
        dialog.style.display = 'none';
        this.currentEditingIndex = -1;
    }

    private saveRegion() {
        const titleInput = document.getElementById('regionTitle') as HTMLInputElement;
        const typeSelect = document.getElementById('regionType') as HTMLSelectElement;
        const widthInput = document.getElementById('regionWidth') as HTMLInputElement;
        const heightInput = document.getElementById('regionHeight') as HTMLInputElement;

        const newRegion: any = {
            type: typeSelect.value,
            title: titleInput.value
        };

        if (typeSelect.value === 'spoilsBox') {
            newRegion.width = parseInt(widthInput.value);
            newRegion.height = parseInt(heightInput.value);
        }

        if (this.currentEditingIndex >= 0) {
            window.game.defaultSpoilsRegionConfig[this.currentEditingIndex] = newRegion;
        } else {
            window.game.defaultSpoilsRegionConfig.push(newRegion);
        }

        this.saveToLocalStorage();
        this.updateRegionList();
        this.hideRegionDialog();
    }

    private generateRegionListHTML() {
        return (window.game.defaultSpoilsRegionConfig || []).map((region: any, index: number) => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: rgba(255,255,255,0.1); margin-bottom: 5px; border-radius: 4px;">
                <span>${region.title} (${region.type === 'spoilsBox' ? `${region.width}x${region.height}` : '个人物资'})</span>
                <div>
                    <button onclick="window.game.playerRegion?.components.settingsDialog.editRegion(${index})" 
                            style="padding: 3px 10px; background: #2196F3; color: white; border: none; border-radius: 3px; margin-right: 5px;">编辑</button>
                    <button onclick="window.game.playerRegion?.components.settingsDialog.deleteRegion(${index})" 
                            style="padding: 3px 10px; background: #f44336; color: white; border: none; border-radius: 3px;">删除</button>
                </div>
            </div>
        `).join('');
    }

    private updateRegionList() {
        const regionList = document.getElementById('regionList');
        if (!regionList) return;
        
        regionList.innerHTML = this.generateRegionListHTML();
    }

    private saveToLocalStorage() {
        localStorage.setItem('defaultSpoilsRegionConfig', JSON.stringify(window.game.defaultSpoilsRegionConfig));
    }

    editRegion(index: number) {
        this.showRegionDialog(index);
    }

    deleteRegion(index: number) {
        if (confirm('确定要删除这个区域吗？')) {
            window.game.defaultSpoilsRegionConfig.splice(index, 1);
            this.saveToLocalStorage();
            this.updateRegionList();
        }
    }

    private saveSettings() {
        // 保存设置时也保存区域配置
        this.saveToLocalStorage();
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
        this.updateRegionList();
    }

    hide() {
        this.settingsDialogContainerDOM.style.display = 'none';
    }
} 