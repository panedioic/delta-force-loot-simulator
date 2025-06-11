import * as PIXI from 'pixi.js';

interface BlockType {
    type: string;
    name: string;
    value: number;
    width: number;
    height: number;
    texture: string;
    subgridLayout?: number[][];
    [key: string]: any;
}

export class ItemManager {
    private itemManagerContainerDOM!: HTMLDivElement;
    private isDragging: boolean = false;
    private dragStartPos = { x: 0, y: 0 };
    private dialogStartPos = { x: 0, y: 0 };
    currentEditingItem: BlockType | null = null;
    private currentFilter: string = 'all';
    private searchTerm: string = '';

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
        const itemManagerText = new PIXI.Text({
            text: "物品管理:",
            style: {
                fontFamily: "Arial",
                fontSize: 22,
                fill: 0x333333,
                fontWeight: "bold",
            },
        });
        itemManagerText.position.set(10, 13);
        this.container.addChild(itemManagerText);

        // 创建按钮
        const itemManagerButton = new PIXI.Container();
        const buttonBg = new PIXI.Graphics();
        buttonBg.roundRect(0, 0, 80, 30, 5);
        buttonBg.fill(0x4CAF50);
        
        const buttonText = new PIXI.Text({
            text: "管理",
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

        itemManagerButton.addChild(buttonBg);
        itemManagerButton.addChild(buttonText);
        itemManagerButton.position.set(110, 10);
        
        // 添加按钮交互
        itemManagerButton.eventMode = 'static';
        itemManagerButton.cursor = 'pointer';
        itemManagerButton.on('pointerdown', () => this.show());
        itemManagerButton.on('pointerover', () => {
            buttonBg.tint = 0x45A049;
        });
        itemManagerButton.on('pointerout', () => {
            buttonBg.tint = 0xFFFFFF;
        });

        this.container.addChild(itemManagerButton);
    }

    private initDialog() {
        this.itemManagerContainerDOM = document.createElement('div');
        this.itemManagerContainerDOM.style.cssText = `
            position: fixed;
            width: 1000px;
            height: 800px;
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
        title.textContent = '物品管理';
        title.style.cssText = `
            font-size: 24px;
            margin: 0 0 20px 0;
            font-weight: bold;
        `;

        // 创建工具栏
        const toolbar = this.createToolbar();

        // 创建内容
        const content = this.createContent();

        this.itemManagerContainerDOM.appendChild(closeBtn);
        this.itemManagerContainerDOM.appendChild(title);
        this.itemManagerContainerDOM.appendChild(toolbar);
        this.itemManagerContainerDOM.appendChild(content);
        window.app.appendChild(this.itemManagerContainerDOM);

        // 添加拖拽功能
        this.itemManagerContainerDOM.addEventListener('mousedown', this.onDragStart.bind(this));
        document.addEventListener('mousemove', this.onDragMove.bind(this));
        document.addEventListener('mouseup', this.onDragEnd.bind(this));
    }

    private createToolbar() {
        const toolbar = document.createElement('div');
        toolbar.style.cssText = `
            display: flex;
            gap: 12px;
            padding: 16px;
            align-items: center;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            margin: 0 20px;
        `;

        // 搜索框
        const searchContainer = document.createElement('div');
        searchContainer.style.cssText = `
            position: relative;
            flex: 1;
        `;

        const searchIcon = document.createElement('span');
        searchIcon.innerHTML = '🔍';
        searchIcon.style.cssText = `
            position: absolute;
            left: 12px;
            top: 50%;
            transform: translateY(-50%);
            color: #888;
            pointer-events: none;
        `;

        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = '搜索物品...';
        searchInput.style.cssText = `
            width: 100%;
            padding: 8px 12px 8px 36px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 4px;
            color: #e1e1e1;
            font-size: 14px;
            outline: none;
            transition: all 0.2s;

            &:focus {
                border-color: rgba(33, 150, 243, 0.5);
                background: rgba(255, 255, 255, 0.15);
            }
        `;

        // 类型筛选下拉框
        const filterSelect = document.createElement('select');
        filterSelect.style.cssText = `
            padding: 8px 12px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 4px;
            color: #e1e1e1;
            font-size: 14px;
            outline: none;
            cursor: pointer;
            min-width: 120px;
            transition: all 0.2s;

            &:focus {
                border-color: rgba(33, 150, 243, 0.5);
                background: rgba(255, 255, 255, 0.15);
            }
        `;

        // 初始化筛选选项
        this.initializeFilterOptions(filterSelect);

        // 添加事件监听器
        searchInput.oninput = (e) => {
            this.searchTerm = (e.target as HTMLInputElement).value.toLowerCase();
            this.updateItemList();
        };

        filterSelect.onchange = (e) => {
            this.currentFilter = (e.target as HTMLSelectElement).value;
            this.updateItemList();
        };

        // 添加按钮
        const addBtn = document.createElement('button');
        addBtn.textContent = '添加物品';
        addBtn.style.cssText = `
            padding: 8px 16px;
            background: rgba(76, 175, 80, 0.1);
            border: 1px solid rgba(76, 175, 80, 0.2);
            border-radius: 4px;
            color: #4CAF50;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s;
            white-space: nowrap;

            &:hover {
                background: rgba(76, 175, 80, 0.2);
                border-color: rgba(76, 175, 80, 0.3);
            }
        `;
        addBtn.onclick = () => this.addNewItem();

        // 导出按钮
        const exportBtn = document.createElement('button');
        exportBtn.textContent = '导出';
        exportBtn.style.cssText = `
            padding: 8px 16px;
            background: rgba(33, 150, 243, 0.1);
            border: 1px solid rgba(33, 150, 243, 0.2);
            border-radius: 4px;
            color: #2196F3;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s;
            white-space: nowrap;

            &:hover {
                background: rgba(33, 150, 243, 0.2);
                border-color: rgba(33, 150, 243, 0.3);
            }
        `;
        exportBtn.onclick = () => this.exportItems();

        // 导入按钮
        const importBtn = document.createElement('button');
        importBtn.textContent = '导入';
        importBtn.style.cssText = `
            padding: 8px 16px;
            background: rgba(156, 39, 176, 0.1);
            border: 1px solid rgba(156, 39, 176, 0.2);
            border-radius: 4px;
            color: #9C27B0;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s;
            white-space: nowrap;

            &:hover {
                background: rgba(156, 39, 176, 0.2);
                border-color: rgba(156, 39, 176, 0.3);
            }
        `;
        importBtn.onclick = () => this.importItems();

        // 组装工具栏
        searchContainer.appendChild(searchIcon);
        searchContainer.appendChild(searchInput);
        toolbar.appendChild(searchContainer);
        toolbar.appendChild(filterSelect);
        toolbar.appendChild(addBtn);
        toolbar.appendChild(exportBtn);
        toolbar.appendChild(importBtn);

        return toolbar;
    }

    private createContent() {
        const content = document.createElement('div');
        content.style.cssText = `
            padding: 20px;
            height: calc(100% - 40px);
            display: flex;
            flex-direction: column;
            gap: 16px;
        `;

        // 创建物品列表容器
        const itemListContainer = document.createElement('div');
        itemListContainer.classList.add('item-list-container');
        itemListContainer.style.cssText = `
            flex: 1;
            overflow-y: auto;
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 16px;
            padding-right: 8px;

            &::-webkit-scrollbar {
                width: 8px;
            }
            &::-webkit-scrollbar-track {
                background: rgba(255, 255, 255, 0.1);
                border-radius: 4px;
            }
            &::-webkit-scrollbar-thumb {
                background: rgba(255, 255, 255, 0.2);
                border-radius: 4px;
            }
            &::-webkit-scrollbar-thumb:hover {
                background: rgba(255, 255, 255, 0.3);
            }
        `;

        content.appendChild(itemListContainer);
        return content;
    }

    private initializeFilterOptions(filterSelect: HTMLSelectElement) {
        // 获取所有物品类型
        const itemTypes = new Set<string>();
        window.game.BLOCK_TYPES.forEach(item => {
            const category = this.getItemCategory(item);
            if (category) {
                itemTypes.add(category);
            }
        });

        // 添加默认选项
        const defaultOption = document.createElement('option');
        defaultOption.value = 'all';
        defaultOption.textContent = '所有类型';
        filterSelect.appendChild(defaultOption);

        // 添加物品类型选项
        Array.from(itemTypes).sort().forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            filterSelect.appendChild(option);
        });
    }

    private getItemCategory(item: BlockType): string {
        // 根据物品类型返回对应的分类
        if (item.type.includes('ammo')) return '弹药';
        if (item.type.includes('weapon')) return '武器';
        if (item.type.includes('armor')) return '护甲';
        if (item.type.includes('medical')) return '医疗';
        if (item.type.includes('food')) return '食物';
        return '其他';
    }

    private updateItemList() {
        const itemListContainer = this.itemManagerContainerDOM.querySelector('.item-list-container') as HTMLDivElement;
        if (!itemListContainer) return;
        
        itemListContainer.innerHTML = '';
        
        const items = window.game.BLOCK_TYPES;
        const filteredItems = items.filter(item => {
            const matchesSearch = this.searchTerm === '' || 
                item.name.toLowerCase().includes(this.searchTerm) ||
                item.type.toLowerCase().includes(this.searchTerm);
            
            const category = this.getItemCategory(item);
            const matchesFilter = this.currentFilter === 'all' || 
                category === this.currentFilter;

            return matchesSearch && matchesFilter;
        });

        if (filteredItems.length === 0) {
            const noResults = document.createElement('div');
            noResults.style.cssText = `
                grid-column: 1 / -1;
                text-align: center;
                color: #888;
                padding: 20px;
            `;
            noResults.textContent = '没有找到匹配的物品';
            itemListContainer.appendChild(noResults);
            return;
        }

        this.renderItems(itemListContainer, filteredItems);
    }

    private renderItems(container: HTMLDivElement, items: BlockType[]) {
        items.forEach(item => {
            const itemCard = document.createElement('div');
            itemCard.style.cssText = `
                background: rgba(255,255,255,0.1);
                border-radius: 5px;
                padding: 15px;
                position: relative;
            `;

            const itemContent = document.createElement('div');
            itemContent.innerHTML = `
                <h3 style="margin: 0 0 10px 0; font-size: 18px;">${item.name}</h3>
                <div style="margin-bottom: 5px;">类型: ${item.type}</div>
                <div style="margin-bottom: 5px;">价值: ${item.value}</div>
                <div style="margin-bottom: 5px;">尺寸: ${item.width}x${item.height}</div>
                ${item.subgridLayout ? '<div style="margin-bottom: 5px;">包含子网格</div>' : ''}
            `;

            const buttonContainer = document.createElement('div');
            buttonContainer.style.cssText = `
                position: absolute;
                top: 15px;
                right: 15px;
                display: flex;
                gap: 5px;
            `;

            const editBtn = document.createElement('button');
            editBtn.textContent = '编辑';
            editBtn.style.cssText = `
                padding: 5px 10px;
                background: #2196F3;
                color: white;
                border: none;
                border-radius: 3px;
                cursor: pointer;
            `;
            editBtn.onclick = () => this.editItem(item);

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '删除';
            deleteBtn.style.cssText = `
                padding: 5px 10px;
                background: #f44336;
                color: white;
                border: none;
                border-radius: 3px;
                cursor: pointer;
            `;
            deleteBtn.onclick = () => this.deleteItem(item);

            buttonContainer.appendChild(editBtn);
            buttonContainer.appendChild(deleteBtn);
            itemCard.appendChild(itemContent);
            itemCard.appendChild(buttonContainer);
            container.appendChild(itemCard);
        });
    }

    private createEditDialog(item: BlockType | null = null) {
        const dialogOverlay = document.createElement('div');
        dialogOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1002;
        `;

        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background: rgba(36, 47, 57, 0.95);
            padding: 20px;
            border-radius: 5px;
            width: 500px;
        `;

        const title = document.createElement('h2');
        title.textContent = item ? '编辑物品' : '添加物品';
        title.style.cssText = `
            margin: 0 0 20px 0;
            color: white;
        `;

        const form = document.createElement('form');
        form.innerHTML = `
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; color: white;">名称:</label>
                <input type="text" value="${item?.name || ''}" name="name" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #666;">
            </div>
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; color: white;">类型:</label>
                <input type="text" value="${item?.type || ''}" name="type" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #666;">
            </div>
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; color: white;">价值:</label>
                <input type="number" value="${item?.value || 0}" name="value" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #666;">
            </div>
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; color: white;">宽度:</label>
                <input type="number" value="${item?.width || 1}" name="width" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #666;">
            </div>
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; color: white;">高度:</label>
                <input type="number" value="${item?.height || 1}" name="height" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #666;">
            </div>
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; color: white;">材质:</label>
                <input type="text" value="${item?.texture || ''}" name="texture" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #666;">
            </div>
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; color: white;">子网格布局 (JSON格式):</label>
                <textarea name="subgridLayout" style="width: 100%; height: 100px; padding: 8px; border-radius: 4px; border: 1px solid #666;">${item?.subgridLayout ? JSON.stringify(item.subgridLayout, null, 2) : ''}</textarea>
            </div>
        `;

        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-top: 20px;
        `;

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = '取消';
        cancelBtn.style.cssText = `
            padding: 8px 20px;
            background: #666;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        `;
        cancelBtn.onclick = () => dialogOverlay.remove();

        const saveBtn = document.createElement('button');
        saveBtn.textContent = '保存';
        saveBtn.style.cssText = `
            padding: 8px 20px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        `;
        saveBtn.onclick = (e) => {
            e.preventDefault();
            this.saveItem(form, item);
            dialogOverlay.remove();
        };

        buttonContainer.appendChild(cancelBtn);
        buttonContainer.appendChild(saveBtn);
        dialog.appendChild(title);
        dialog.appendChild(form);
        dialog.appendChild(buttonContainer);
        dialogOverlay.appendChild(dialog);
        document.body.appendChild(dialogOverlay);
    }

    private saveItem(form: HTMLFormElement, originalItem: BlockType | null) {
        const formData = new FormData(form);
        const newItem: BlockType = {
            name: formData.get('name') as string,
            type: formData.get('type') as string,
            value: Number(formData.get('value')),
            width: Number(formData.get('width')),
            height: Number(formData.get('height')),
            texture: formData.get('texture') as string,
        };

        const subgridLayoutStr = formData.get('subgridLayout') as string;
        if (subgridLayoutStr) {
            try {
                newItem.subgridLayout = JSON.parse(subgridLayoutStr);
            } catch (e) {
                alert('子网格布局JSON格式错误！');
                return;
            }
        }

        if (originalItem) {
            // 编辑现有物品
            const index = window.game.BLOCK_TYPES.findIndex((item: BlockType) => item.type === originalItem.type);
            if (index !== -1) {
                window.game.BLOCK_TYPES[index] = newItem;
            }
        } else {
            // 添加新物品
            window.game.BLOCK_TYPES.push(newItem);
        }

        // 刷新物品列表
        // const itemListContainer = 
        this.itemManagerContainerDOM.querySelector('div:nth-child(4)') as HTMLDivElement;
        this.updateItemList();
    }

    private addNewItem() {
        this.createEditDialog();
    }

    private editItem(item: BlockType) {
        this.currentEditingItem = item;
        this.createEditDialog(item);
    }

    private deleteItem(item: BlockType) {
        if (confirm(`确定要删除物品 "${item.name}" 吗？`)) {
            const index = window.game.BLOCK_TYPES.findIndex((i: BlockType) => i.type === item.type);
            if (index !== -1) {
                window.game.BLOCK_TYPES.splice(index, 1);
                // 刷新物品列表
                // const itemListContainer = 
                this.itemManagerContainerDOM.querySelector('div:nth-child(4)') as HTMLDivElement;
                this.updateItemList();
            }
        }
    }

    private exportItems() {
        const json = JSON.stringify(window.game.BLOCK_TYPES, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'block_types.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    private importItems() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const json = JSON.parse(e.target?.result as string);
                        window.game.BLOCK_TYPES = json;
                        // 刷新物品列表
                        // const itemListContainer = 
                        this.itemManagerContainerDOM.querySelector('div:nth-child(4)') as HTMLDivElement;
                        this.updateItemList();
                        alert('导入成功！');
                    } catch (error) {
                        alert('JSON格式错误！');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }

    private onDragStart(event: MouseEvent) {
        if (
            event.target instanceof HTMLButtonElement ||
            event.target instanceof HTMLInputElement ||
            event.target instanceof HTMLTextAreaElement
        ) return;
        
        this.isDragging = true;
        this.dragStartPos = {
            x: event.clientX,
            y: event.clientY
        };
        this.dialogStartPos = {
            x: this.itemManagerContainerDOM.offsetLeft,
            y: this.itemManagerContainerDOM.offsetTop
        };
    }

    private onDragMove(event: MouseEvent) {
        if (!this.isDragging) return;
        
        const dx = event.clientX - this.dragStartPos.x;
        const dy = event.clientY - this.dragStartPos.y;
        
        this.itemManagerContainerDOM.style.left = `${this.dialogStartPos.x + dx}px`;
        this.itemManagerContainerDOM.style.top = `${this.dialogStartPos.y + dy}px`;
    }

    private onDragEnd() {
        this.isDragging = false;
    }

    show() {
        this.itemManagerContainerDOM.style.display = 'block';
        const left = (window.innerWidth - 1000) / 2;
        const top = (window.innerHeight - 800) / 2;
        this.itemManagerContainerDOM.style.left = `${left}px`;
        this.itemManagerContainerDOM.style.top = `${top}px`;
    }

    hide() {
        this.itemManagerContainerDOM.style.display = 'none';
    }
} 