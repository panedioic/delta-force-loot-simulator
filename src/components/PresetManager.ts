import * as PIXI from 'pixi.js';

export interface Preset {
    id: number;
    name: string;
    description: string;
    config: any; // 预设配置数据
}

export class PresetManager {
    private presetDialogContainerDOM!: HTMLDivElement;
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

    private presets: Preset[] = [
        {
            id: 0,
            name: '默认预设',
            description: '根据设置随机生成内容',
            config: {}
        }
    ];

    constructor() {
        // 将 game.presets 添加进 UI
        window.game.presets.forEach((val) => {
            this.presets.push({
                id: this.presets.length,
                name: val.title,
                description: val.description,
                config: val
            });
        });
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
        const presetText = new PIXI.Text({
            text: "预设管理:",
            style: {
                fontFamily: "Arial",
                fontSize: 22,
                fill: 0x333333,
                fontWeight: "bold",
            },
        });
        presetText.position.set(10, 13);
        this.container.addChild(presetText);

        // 创建按钮
        const presetButton = new PIXI.Container();
        const buttonBg = new PIXI.Graphics();
        buttonBg.roundRect(0, 0, 80, 30, 5);
        buttonBg.fill(0x4CAF50);
        
        const buttonText = new PIXI.Text({
            text: "预设",
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

        presetButton.addChild(buttonBg);
        presetButton.addChild(buttonText);
        presetButton.position.set(110, 10);
        
        // 添加按钮交互
        presetButton.eventMode = 'static';
        presetButton.cursor = 'pointer';
        presetButton.on('pointerdown', () => this.show());
        presetButton.on('pointerover', () => {
            buttonBg.tint = 0x45A049;
        });
        presetButton.on('pointerout', () => {
            buttonBg.tint = 0xFFFFFF;
        });

        this.container.addChild(presetButton);
    }

    private initDialog() {
        this.presetDialogContainerDOM = document.createElement('div');
        this.presetDialogContainerDOM.style.cssText = `
            position: fixed;
            width: 600px;
            height: 500px;
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
        title.textContent = '预设管理';
        title.style.cssText = `
            font-size: 24px;
            margin: 0 0 20px 0;
            font-weight: bold;
        `;

        // 创建预设列表容器
        const presetContent = document.createElement('div');
        presetContent.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 20px;
            padding: 20px;
            max-height: 350px;
            overflow-y: auto;
        `;

        // 添加新预设按钮
        const addPresetBtn = document.createElement('button');
        addPresetBtn.textContent = '创建新预设';
        addPresetBtn.style.cssText = `
            padding: 8px 20px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            width: fit-content;
            margin-bottom: 15px;
        `;
        addPresetBtn.onclick = () => this.createNewPreset();

        presetContent.appendChild(addPresetBtn);

        // 渲染预设列表
        this.presets.forEach(preset => {
            const presetItem = this.createPresetItem(preset);
            presetContent.appendChild(presetItem);
        });

        this.presetDialogContainerDOM.appendChild(closeBtn);
        this.presetDialogContainerDOM.appendChild(title);
        this.presetDialogContainerDOM.appendChild(presetContent);
        window.app.appendChild(this.presetDialogContainerDOM);

        // 添加拖拽功能
        this.presetDialogContainerDOM.addEventListener('mousedown', this.onDragStart.bind(this));
        document.addEventListener('mousemove', this.onDragMove.bind(this));
        document.addEventListener('mouseup', this.onDragEnd.bind(this));
    }

    private createPresetItem(preset: Preset): HTMLDivElement {
        const presetItem = document.createElement('div');
        presetItem.style.cssText = `
            background: rgba(255,255,255,0.1);
            border-radius: 4px;
            padding: 15px;
            margin-bottom: 10px;
        `;

        const presetHeader = document.createElement('div');
        presetHeader.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        `;

        const presetName = document.createElement('h3');
        presetName.textContent = preset.name;
        presetName.style.margin = '0';

        const buttonGroup = document.createElement('div');
        buttonGroup.style.cssText = `
            display: flex;
            gap: 10px;
        `;

        const applyBtn = document.createElement('button');
        applyBtn.textContent = '应用';
        applyBtn.style.cssText = `
            padding: 5px 15px;
            background: #2196F3;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        `;
        applyBtn.onclick = (() => {
            window.game.startGameWithPreset(preset.id);
            this.hide();
        });

        const editBtn = document.createElement('button');
        editBtn.textContent = '编辑';
        editBtn.style.cssText = `
            padding: 5px 15px;
            background: #FFA500;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        `;
        editBtn.onclick = () => this.editPreset(preset);

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '删除';
        deleteBtn.style.cssText = `
            padding: 5px 15px;
            background: #f44336;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        `;
        deleteBtn.onclick = () => this.deletePreset(preset);

        // 默认预设不能删除
        if (preset.id === 0) {
            deleteBtn.disabled = true;
            deleteBtn.style.opacity = '0.5';
            deleteBtn.style.cursor = 'not-allowed';
        }

        buttonGroup.appendChild(applyBtn);
        buttonGroup.appendChild(editBtn);
        buttonGroup.appendChild(deleteBtn);

        presetHeader.appendChild(presetName);
        presetHeader.appendChild(buttonGroup);

        const presetDescription = document.createElement('p');
        presetDescription.textContent = preset.description;
        presetDescription.style.margin = '0';
        presetDescription.style.color = '#ccc';

        presetItem.appendChild(presetHeader);
        presetItem.appendChild(presetDescription);

        return presetItem;
    }

    private onDragStart(event: MouseEvent) {
        if (
            event.target instanceof HTMLButtonElement ||
            event.target instanceof HTMLInputElement
        ) {
            return;
        }
        this.isDragging = true;
        this.dragStartPos = { x: event.clientX, y: event.clientY };
        this.dialogStartPos = {
            x: this.presetDialogContainerDOM.offsetLeft,
            y: this.presetDialogContainerDOM.offsetTop
        };
    }

    private onDragMove(event: MouseEvent) {
        if (!this.isDragging) return;
        
        const dx = event.clientX - this.dragStartPos.x;
        const dy = event.clientY - this.dragStartPos.y;
        
        this.presetDialogContainerDOM.style.left = `${this.dialogStartPos.x + dx}px`;
        this.presetDialogContainerDOM.style.top = `${this.dialogStartPos.y + dy}px`;
    }

    private onDragEnd() {
        this.isDragging = false;
    }

    private createNewPreset() {
        const name = prompt('请输入预设名称：');
        if (!name) return;

        const description = prompt('请输入预设描述：');
        if (!description) return;

        const preset: Preset = {
            id: this.presets.length,
            name,
            description,
            config: this.getCurrentConfig()
        };

        this.presets.push(preset);
        this.refreshPresetList();
    }

    private getCurrentConfig(): any {
        // const game = window.game;
        return {
            // 暂时什么都没有
        };
    }

    /*
    private applyPreset(preset: Preset) {
        const game = window.game;
        const config = preset.config;

        // 应用配置
        if (config.rightRegionCount !== undefined) {
            game.totalRightRegion = config.rightRegionCount;
        }
        if (config.needSearch !== undefined) {
            game.needSearch = config.needSearch;
        }
        // 可以根据需要应用更多配置项

        // 重新初始化游戏区域
        if (game.spoilsRegion) {
            game.spoilsRegion.destroy();
            game.spoilsRegion = null;
        }
        game.spoilsRegion = initSpoilsRegion({x: 804, y: 72}, config);

        // 提示用户预设已应用
        alert(`预设 "${preset.name}" 已应用`);
        this.hide();
    }
        */

    private editPreset(preset: Preset) {
        const name = prompt('请输入新的预设名称：', preset.name);
        if (!name) return;

        const description = prompt('请输入新的预设描述：', preset.description);
        if (!description) return;

        const index = this.presets.findIndex(p => p.id === preset.id);
        if (index !== -1) {
            this.presets[index] = {
                ...preset,
                name,
                description
            };
            this.refreshPresetList();
        }
    }

    private deletePreset(preset: Preset) {
        if (preset.id === 0) return;

        if (confirm(`确定要删除预设 "${preset.name}" 吗？`)) {
            this.presets = this.presets.filter(p => p.id !== preset.id);
            this.refreshPresetList();
        }
    }

    private refreshPresetList() {
        const presetContent = this.presetDialogContainerDOM.querySelector('div');
        if (!presetContent) return;

        // 清除现有预设列表（保留添加按钮）
        const addButton = presetContent.firstChild;
        while (presetContent.lastChild !== addButton) {
            presetContent.removeChild(presetContent.lastChild!);
        }

        // 重新渲染预设列表
        this.presets.forEach(preset => {
            const presetItem = this.createPresetItem(preset);
            presetContent.appendChild(presetItem);
        });
    }

    show() {
        this.presetDialogContainerDOM.style.display = 'block';
        // 居中显示
        const left = (window.innerWidth - this.presetDialogContainerDOM.offsetWidth) / 2;
        const top = (window.innerHeight - this.presetDialogContainerDOM.offsetHeight) / 2;
        this.presetDialogContainerDOM.style.left = `${left}px`;
        this.presetDialogContainerDOM.style.top = `${top}px`;
    }

    hide() {
        this.presetDialogContainerDOM.style.display = 'none';
    }
}