import * as PIXI from 'pixi.js';

interface GameItem {
    name: string;
    width: number;
    height: number;
    value: number;
    type: string;
}

export class DebugTools {
    private debugToolsContainerDOM!: HTMLDivElement;
    private isDragging: boolean = false;
    private dragStartPos = { x: 0, y: 0 };
    private dialogStartPos = { x: 0, y: 0 };
    private treeContainer!: HTMLDivElement;
    private pinnedContainer!: HTMLDivElement;
    private addItemDialog!: HTMLDivElement;
    private updateInterval: number | null = null;
    private pinnedItems: Map<string, any> = new Map();

    public container!: PIXI.Container;
    public additiveSize = { x: 220, y: 50 };

    constructor() {
        this.initDialog();
        this.initUI();
    }

    private initUI() {
        this.container = new PIXI.Container();
        
        const background = new PIXI.Graphics();
        background.roundRect(0, 0, 220, 50, 10);
        background.fill(0xFFFFFF);
        this.container.addChild(background);

        const debugText = new PIXI.Text({
            text: "调试工具:",
            style: {
                fontFamily: "Arial",
                fontSize: 22,
                fill: 0x333333,
                fontWeight: "bold",
            },
        });
        debugText.position.set(10, 13);
        this.container.addChild(debugText);

        const debugButton = new PIXI.Container();
        const buttonBg = new PIXI.Graphics();
        buttonBg.roundRect(0, 0, 80, 30, 5);
        buttonBg.fill(0x4CAF50);
        
        const buttonText = new PIXI.Text({
            text: "调试",
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

        debugButton.addChild(buttonBg);
        debugButton.addChild(buttonText);
        debugButton.position.set(110, 10);
        
        debugButton.eventMode = 'static';
        debugButton.cursor = 'pointer';
        debugButton.on('pointerdown', () => this.show());
        debugButton.on('pointerover', () => {
            buttonBg.tint = 0x45A049;
        });
        debugButton.on('pointerout', () => {
            buttonBg.tint = 0xFFFFFF;
        });

        this.container.addChild(debugButton);
    }

    private initDialog() {
        this.debugToolsContainerDOM = document.createElement('div');
        this.debugToolsContainerDOM.style.cssText = `
            position: fixed;
            width: 800px;
            height: 600px;
            background: rgba(36, 47, 57, 0.98);
            border: 1px solid #4a5a6a;
            border-radius: 10px;
            display: none;
            color: #e1e1e1;
            padding: 20px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.3);
            font-family: 'Arial', sans-serif;
            user-select: none;
            z-index: 1001;
            backdrop-filter: blur(10px);
        `;

        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.style.cssText = `
            position: absolute;
            right: 15px;
            top: 15px;
            width: 32px;
            height: 32px;
            background: rgba(255, 51, 51, 0.1);
            border: 1px solid rgba(255, 51, 51, 0.2);
            border-radius: 8px;
            color: #ff5555;
            font-size: 24px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
            padding: 0;
        `;
        closeBtn.onmouseover = () => {
            closeBtn.style.background = 'rgba(255, 51, 51, 0.2)';
            closeBtn.style.borderColor = 'rgba(255, 51, 51, 0.3)';
        };
        closeBtn.onmouseout = () => {
            closeBtn.style.background = 'rgba(255, 51, 51, 0.1)';
            closeBtn.style.borderColor = 'rgba(255, 51, 51, 0.2)';
        };
        closeBtn.onclick = () => this.hide();

        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        `;

        const title = document.createElement('h1');
        title.textContent = '调试工具';
        title.style.cssText = `
            font-size: 24px;
            margin: 0;
            font-weight: 600;
            color: #fff;
            flex-grow: 1;
        `;

        const toolbar = document.createElement('div');
        toolbar.style.cssText = `
            display: flex;
            gap: 12px;
            align-items: center;
        `;

        const refreshBtn = document.createElement('button');
        refreshBtn.innerHTML = '<span style="margin-right:6px;">↻</span> 刷新';
        refreshBtn.style.cssText = `
            padding: 8px 16px;
            background: rgba(33, 150, 243, 0.1);
            border: 1px solid rgba(33, 150, 243, 0.2);
            border-radius: 6px;
            color: #2196F3;
            font-size: 14px;
            cursor: pointer;
            display: flex;
            align-items: center;
            transition: all 0.2s ease;
        `;
        refreshBtn.onmouseover = () => {
            refreshBtn.style.background = 'rgba(33, 150, 243, 0.2)';
            refreshBtn.style.borderColor = 'rgba(33, 150, 243, 0.3)';
        };
        refreshBtn.onmouseout = () => {
            refreshBtn.style.background = 'rgba(33, 150, 243, 0.1)';
            refreshBtn.style.borderColor = 'rgba(33, 150, 243, 0.2)';
        };
        refreshBtn.onclick = () => this.updateTree();

        const autoRefreshLabel = document.createElement('label');
        autoRefreshLabel.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
            color: #a0a0a0;
            font-size: 14px;
            cursor: pointer;
            padding: 8px;
            border-radius: 6px;
            transition: all 0.2s ease;
        `;
        autoRefreshLabel.onmouseover = () => {
            autoRefreshLabel.style.background = 'rgba(255,255,255,0.05)';
        };
        autoRefreshLabel.onmouseout = () => {
            autoRefreshLabel.style.background = 'transparent';
        };

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.style.cssText = `
            width: 16px;
            height: 16px;
            margin: 0;
            cursor: pointer;
        `;
        checkbox.onchange = (e) => this.toggleAutoRefresh((e.target as HTMLInputElement).checked);

        autoRefreshLabel.appendChild(checkbox);
        autoRefreshLabel.appendChild(document.createTextNode('自动刷新'));

        toolbar.appendChild(refreshBtn);
        toolbar.appendChild(autoRefreshLabel);

        header.appendChild(title);
        header.appendChild(toolbar);

        this.treeContainer = document.createElement('div');
        this.treeContainer.style.cssText = `
            height: calc(100% - 80px);
            overflow-y: auto;
            padding: 15px;
            background: rgba(0,0,0,0.2);
            border-radius: 8px;
            font-family: 'Consolas', 'Monaco', monospace;
            border: 1px solid rgba(255,255,255,0.1);

            /* 自定义滚动条样式 */
            &::-webkit-scrollbar {
                width: 8px;
                height: 8px;
            }
            &::-webkit-scrollbar-track {
                background: rgba(0,0,0,0.1);
                border-radius: 4px;
            }
            &::-webkit-scrollbar-thumb {
                background: rgba(255,255,255,0.2);
                border-radius: 4px;
            }
            &::-webkit-scrollbar-thumb:hover {
                background: rgba(255,255,255,0.3);
            }
        `;

        // 添加固定项容器
        this.pinnedContainer = document.createElement('div');
        this.pinnedContainer.style.cssText = `
            margin-bottom: 15px;
            display: none;
            flex-direction: column;
            gap: 10px;
            padding: 15px;
            background: rgba(0,0,0,0.2);
            border-radius: 8px;
            font-family: 'Consolas', 'Monaco', monospace;
            border: 1px solid rgba(255,255,255,0.1);
            max-height: 200px;
            overflow-y: auto;

            /* 自定义滚动条样式 */
            &::-webkit-scrollbar {
                width: 8px;
                height: 8px;
            }
            &::-webkit-scrollbar-track {
                background: rgba(0,0,0,0.1);
                border-radius: 4px;
            }
            &::-webkit-scrollbar-thumb {
                background: rgba(255,255,255,0.2);
                border-radius: 4px;
            }
            &::-webkit-scrollbar-thumb:hover {
                background: rgba(255,255,255,0.3);
            }
        `;

        this.debugToolsContainerDOM.appendChild(closeBtn);
        this.debugToolsContainerDOM.appendChild(header);
        this.debugToolsContainerDOM.appendChild(this.pinnedContainer);
        this.debugToolsContainerDOM.appendChild(this.treeContainer);
        window.app.appendChild(this.debugToolsContainerDOM);

        // 添加拖拽功能
        header.style.cursor = 'move';
        header.addEventListener('mousedown', this.onDragStart.bind(this));
        document.addEventListener('mousemove', this.onDragMove.bind(this));
        document.addEventListener('mouseup', this.onDragEnd.bind(this));

        // 创建添加物品对话框
        this.addItemDialog = document.createElement('div');
        this.addItemDialog.style.cssText = `
            position: fixed;
            width: 600px;
            height: 500px;
            background: rgba(36, 47, 57, 0.98);
            border: 1px solid #4a5a6a;
            border-radius: 10px;
            display: none;
            color: #e1e1e1;
            padding: 20px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.3);
            font-family: 'Arial', sans-serif;
            user-select: none;
            z-index: 1002;
            backdrop-filter: blur(10px);
        `;

        window.app.appendChild(this.addItemDialog);
    }

    private onDragStart(event: MouseEvent) {
        if (
            event.target instanceof HTMLButtonElement ||
            event.target instanceof HTMLInputElement
        ) return;
        
        this.isDragging = true;
        this.dragStartPos = {
            x: event.clientX,
            y: event.clientY
        };
        this.dialogStartPos = {
            x: this.debugToolsContainerDOM.offsetLeft,
            y: this.debugToolsContainerDOM.offsetTop
        };
    }

    private onDragMove(event: MouseEvent) {
        if (!this.isDragging) return;
        
        const dx = event.clientX - this.dragStartPos.x;
        const dy = event.clientY - this.dragStartPos.y;
        
        this.debugToolsContainerDOM.style.left = `${this.dialogStartPos.x + dx}px`;
        this.debugToolsContainerDOM.style.top = `${this.dialogStartPos.y + dy}px`;
    }

    private onDragEnd() {
        this.isDragging = false;
    }

    show() {
        this.debugToolsContainerDOM.style.display = 'block';
        this.debugToolsContainerDOM.style.opacity = '0';
        const left = (window.innerWidth - 800) / 2;
        const top = (window.innerHeight - 600) / 2;
        this.debugToolsContainerDOM.style.left = `${left}px`;
        this.debugToolsContainerDOM.style.top = `${top}px`;
        
        // 添加淡入动画
        requestAnimationFrame(() => {
            this.debugToolsContainerDOM.style.transition = 'opacity 0.2s ease';
            this.debugToolsContainerDOM.style.opacity = '1';
        });
        
        this.updateTree();
    }

    hide() {
        // 添加淡出动画
        this.debugToolsContainerDOM.style.opacity = '0';
        setTimeout(() => {
            this.debugToolsContainerDOM.style.display = 'none';
            this.toggleAutoRefresh(false);
        }, 200);
    }

    private updateTree() {
        if (!this.treeContainer) return;
        
        this.treeContainer.innerHTML = '';
        if (window.game) {
            const gameTree = document.createElement('div');
            gameTree.style.marginBottom = '20px';
            
            // 添加游戏实例节点
            const gameNode = this.createTreeItem(window.game, 0, 'game');
            gameTree.appendChild(gameNode);

            // 添加玩家区域
            if (window.game.playerRegion) {
                const playerNode = this.createTreeItem(window.game.playerRegion, 1, 'game.playerRegion');
                gameTree.appendChild(playerNode);
            }

            // 添加战利品区域
            if (window.game.spoilsRegion) {
                const spoilsNode = this.createTreeItem(window.game.spoilsRegion, 1, 'game.spoilsRegion');
                gameTree.appendChild(spoilsNode);
            }

            this.treeContainer.appendChild(gameTree);
        } else {
            this.treeContainer.innerHTML = '<div style="color: #ff5555;">Game instance not found!</div>';
        }
    }

    private toggleAutoRefresh(enabled: boolean) {
        if (enabled) {
            this.updateInterval = window.setInterval(() => this.updateTree(), 1000);
        } else {
            if (this.updateInterval !== null) {
                clearInterval(this.updateInterval);
                this.updateInterval = null;
            }
        }
    }

    private createTreeItem(item: any, level: number = 0, path: string = ''): HTMLDivElement {
        const wrapper = document.createElement('div');

        const itemContainer = document.createElement('div');
        itemContainer.style.cssText = `
            margin-left: ${level * 24}px;
            margin-bottom: 6px;
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 6px 8px;
            border-radius: 6px;
            transition: background 0.2s ease;
        `;
        itemContainer.onmouseover = () => {
            itemContainer.style.background = 'rgba(255,255,255,0.05)';
        };
        itemContainer.onmouseout = () => {
            itemContainer.style.background = 'transparent';
        };

        const toggleBtn = document.createElement('span');
        toggleBtn.textContent = '▼';
        toggleBtn.style.cssText = `
            cursor: pointer;
            width: 20px;
            display: inline-block;
            color: #4CAF50;
            font-size: 12px;
            transition: transform 0.2s ease;
        `;

        const content = document.createElement('div');
        content.style.cssText = `
            flex: 1;
            font-size: 14px;
            color: #e1e1e1;
            min-width: 0;
        `;

        let type = item.constructor.name;
        let info = '';

        if (type === 'Region') {
            info = `${item.title || 'Unnamed Region'}`;
            if (item.inventories) {
                info += ` <span style="color: #888;">(${item.inventories.length} inventories)</span>`;
            }
        } else if (type === 'Inventory') {
            info = `${item.name || 'Unnamed Inventory'} <span style="color: #888;">(${Object.keys(item.contents || {}).length} items)</span>`;
        } else if (type === 'GridContainer') {
            info = `${item.name || 'Unnamed Container'} <span style="color: #888;">(${item.items?.length || 0} items)</span>`;
        } else if (type === 'Subgrid') {
            info = `${item.name || 'Unnamed Subgrid'} <span style="color: #888;">(${item.width}x${item.height})</span>`;
        } else if (type === 'Item') {
            info = `${item.name || 'Unnamed Item'} <span style="color: #888;">(${item.width}x${item.height}, value: ${item.value})</span>`;
        } else if (type === 'Game') {
            info = '<span style="color: #64B5F6;">Game Instance</span>';
        }

        content.innerHTML = `<span style="color: #81C784;">${type}:</span> ${info}`;

        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            gap: 8px;
            align-items: center;
            flex-shrink: 0;
        `;

        // 添加 Add 按钮（仅对特定类型显示）
        if (type === 'Inventory' || type === 'GridContainer') {
            const addBtn = document.createElement('button');
            addBtn.textContent = 'Add';
            addBtn.style.cssText = `
                padding: 4px 10px;
                background: rgba(76, 175, 80, 0.1);
                border: 1px solid rgba(76, 175, 80, 0.2);
                border-radius: 4px;
                color: #4CAF50;
                font-size: 12px;
                cursor: pointer;
                transition: all 0.2s ease;
                white-space: nowrap;
            `;
            addBtn.onmouseover = () => {
                addBtn.style.background = 'rgba(76, 175, 80, 0.2)';
                addBtn.style.borderColor = 'rgba(76, 175, 80, 0.3)';
            };
            addBtn.onmouseout = () => {
                addBtn.style.background = 'rgba(76, 175, 80, 0.1)';
                addBtn.style.borderColor = 'rgba(76, 175, 80, 0.2)';
            };
            addBtn.onclick = () => this.showAddItemDialog(item, path);
            buttonContainer.appendChild(addBtn);
        }

        // Pin 按钮
        const pinBtn = document.createElement('button');
        pinBtn.textContent = this.pinnedItems.has(path) ? 'Unpin' : 'Pin';
        pinBtn.style.cssText = `
            padding: 4px 10px;
            background: ${this.pinnedItems.has(path) ? 'rgba(156, 39, 176, 0.1)' : 'rgba(158, 158, 158, 0.1)'};
            border: 1px solid ${this.pinnedItems.has(path) ? 'rgba(156, 39, 176, 0.2)' : 'rgba(158, 158, 158, 0.2)'};
            border-radius: 4px;
            color: ${this.pinnedItems.has(path) ? '#9C27B0' : '#9E9E9E'};
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s ease;
            white-space: nowrap;
        `;
        pinBtn.onmouseover = () => {
            pinBtn.style.background = this.pinnedItems.has(path) ? 'rgba(156, 39, 176, 0.2)' : 'rgba(158, 158, 158, 0.2)';
            pinBtn.style.borderColor = this.pinnedItems.has(path) ? 'rgba(156, 39, 176, 0.3)' : 'rgba(158, 158, 158, 0.3)';
        };
        pinBtn.onmouseout = () => {
            pinBtn.style.background = this.pinnedItems.has(path) ? 'rgba(156, 39, 176, 0.1)' : 'rgba(158, 158, 158, 0.1)';
            pinBtn.style.borderColor = this.pinnedItems.has(path) ? 'rgba(156, 39, 176, 0.2)' : 'rgba(158, 158, 158, 0.2)';
        };
        pinBtn.onclick = () => this.togglePin(item, path, pinBtn);
        buttonContainer.appendChild(pinBtn);

        // Debug 按钮
        const debugBtn = document.createElement('button');
        debugBtn.textContent = 'Debug';
        debugBtn.style.cssText = `
            padding: 4px 10px;
            background: rgba(33, 150, 243, 0.1);
            border: 1px solid rgba(33, 150, 243, 0.2);
            border-radius: 4px;
            color: #2196F3;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s ease;
            white-space: nowrap;
        `;
        debugBtn.onmouseover = () => {
            debugBtn.style.background = 'rgba(33, 150, 243, 0.2)';
            debugBtn.style.borderColor = 'rgba(33, 150, 243, 0.3)';
        };
        debugBtn.onmouseout = () => {
            debugBtn.style.background = 'rgba(33, 150, 243, 0.1)';
            debugBtn.style.borderColor = 'rgba(33, 150, 243, 0.2)';
        };
        debugBtn.onclick = () => {
            console.log('Debug object at path:', path);
            console.log(item);
        };
        buttonContainer.appendChild(debugBtn);

        itemContainer.appendChild(toggleBtn);
        itemContainer.appendChild(content);
        itemContainer.appendChild(buttonContainer);

        const childrenContainer = document.createElement('div');
        childrenContainer.style.cssText = `
            display: block;
            margin-top: 4px;
        `;

        // 添加子元素
        if (item.inventories) {
            item.inventories.forEach((inventory: any, index: number) => {
                childrenContainer.appendChild(
                    this.createTreeItem(inventory, level + 1, `${path}.inventories[${index}]`)
                );
            });
        }
        if (item.contents) {
            Object.entries(item.contents).forEach(([key, content]) => {
                childrenContainer.appendChild(
                    this.createTreeItem(content, level + 1, `${path}.contents.${key}`)
                );
            });
        }
        if (item.items) {
            item.items.forEach((childItem: any, index: number) => {
                childrenContainer.appendChild(
                    this.createTreeItem(childItem, level + 1, `${path}.items[${index}]`)
                );
            });
        }

        if (childrenContainer.children.length > 0) {
            toggleBtn.onclick = () => {
                if (childrenContainer.style.display === 'none') {
                    childrenContainer.style.display = 'block';
                    toggleBtn.style.transform = 'rotate(0deg)';
                } else {
                    childrenContainer.style.display = 'none';
                    toggleBtn.style.transform = 'rotate(-90deg)';
                }
            };
        } else {
            toggleBtn.style.visibility = 'hidden';
        }

        wrapper.appendChild(itemContainer);
        wrapper.appendChild(childrenContainer);
        return wrapper;
    }

    private togglePin(item: any, path: string, pinBtn: HTMLButtonElement) {
        if (this.pinnedItems.has(path)) {
            this.pinnedItems.delete(path);
            pinBtn.textContent = 'Pin';
            pinBtn.style.background = 'rgba(158, 158, 158, 0.1)';
            pinBtn.style.borderColor = 'rgba(158, 158, 158, 0.2)';
            pinBtn.style.color = '#9E9E9E';
        } else {
            this.pinnedItems.set(path, item);
            pinBtn.textContent = 'Unpin';
            pinBtn.style.background = 'rgba(156, 39, 176, 0.1)';
            pinBtn.style.borderColor = 'rgba(156, 39, 176, 0.2)';
            pinBtn.style.color = '#9C27B0';
        }
        this.updatePinnedItems();
    }

    private updatePinnedItems() {
        if (this.pinnedItems.size === 0) {
            this.pinnedContainer.style.display = 'none';
            this.treeContainer.style.height = 'calc(100% - 80px)';
            return;
        }

        this.pinnedContainer.style.display = 'flex';
        this.treeContainer.style.height = 'calc(100% - 300px)';
        this.pinnedContainer.innerHTML = '';

        const pinnedTitle = document.createElement('div');
        pinnedTitle.style.cssText = `
            font-size: 14px;
            color: #888;
            margin-bottom: 10px;
            padding-bottom: 8px;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        `;
        pinnedTitle.textContent = 'Pinned Items';
        this.pinnedContainer.appendChild(pinnedTitle);

        this.pinnedItems.forEach((item, path) => {
            const pinnedItem = document.createElement('div');
            pinnedItem.style.cssText = `
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 8px;
                background: rgba(255,255,255,0.05);
                border-radius: 6px;
            `;

            const content = document.createElement('div');
            content.style.cssText = `
                flex: 1;
                font-size: 14px;
                color: #e1e1e1;
            `;

            let type = item.constructor.name;
            let info = '';

            if (type === 'Region') {
                info = `${item.title || 'Unnamed Region'}`;
                if (item.inventories) {
                    info += ` <span style="color: #888;">(${item.inventories.length} inventories)</span>`;
                }
            } else if (type === 'Inventory') {
                info = `${item.name || 'Unnamed Inventory'} <span style="color: #888;">(${Object.keys(item.contents || {}).length} items)</span>`;
            } else if (type === 'GridContainer') {
                info = `${item.name || 'Unnamed Container'} <span style="color: #888;">(${item.items?.length || 0} items)</span>`;
            } else if (type === 'Subgrid') {
                info = `${item.name || 'Unnamed Subgrid'} <span style="color: #888;">(${item.width}x${item.height})</span>`;
            } else if (type === 'Item') {
                info = `${item.name || 'Unnamed Item'} <span style="color: #888;">(${item.width}x${item.height}, value: ${item.value})</span>`;
            } else if (type === 'Game') {
                info = '<span style="color: #64B5F6;">Game Instance</span>';
            }

            content.innerHTML = `<span style="color: #81C784;">${type}:</span> ${info}`;

            const pathText = document.createElement('div');
            pathText.style.cssText = `
                font-size: 12px;
                color: #666;
            `;
            pathText.textContent = path;

            const debugBtn = document.createElement('button');
            debugBtn.textContent = 'Debug';
            debugBtn.style.cssText = `
                padding: 4px 10px;
                background: rgba(33, 150, 243, 0.1);
                border: 1px solid rgba(33, 150, 243, 0.2);
                border-radius: 4px;
                color: #2196F3;
                font-size: 12px;
                cursor: pointer;
                transition: all 0.2s ease;
            `;
            debugBtn.onmouseover = () => {
                debugBtn.style.background = 'rgba(33, 150, 243, 0.2)';
                debugBtn.style.borderColor = 'rgba(33, 150, 243, 0.3)';
            };
            debugBtn.onmouseout = () => {
                debugBtn.style.background = 'rgba(33, 150, 243, 0.1)';
                debugBtn.style.borderColor = 'rgba(33, 150, 243, 0.2)';
            };
            debugBtn.onclick = () => {
                console.log('Debug pinned object at path:', path);
                console.log(item);
            };

            const unpinBtn = document.createElement('button');
            unpinBtn.textContent = '×';
            unpinBtn.style.cssText = `
                padding: 4px 8px;
                background: rgba(244, 67, 54, 0.1);
                border: 1px solid rgba(244, 67, 54, 0.2);
                border-radius: 4px;
                color: #F44336;
                font-size: 14px;
                cursor: pointer;
                transition: all 0.2s ease;
            `;
            unpinBtn.onmouseover = () => {
                unpinBtn.style.background = 'rgba(244, 67, 54, 0.2)';
                unpinBtn.style.borderColor = 'rgba(244, 67, 54, 0.3)';
            };
            unpinBtn.onmouseout = () => {
                unpinBtn.style.background = 'rgba(244, 67, 54, 0.1)';
                unpinBtn.style.borderColor = 'rgba(244, 67, 54, 0.2)';
            };
            unpinBtn.onclick = () => {
                this.pinnedItems.delete(path);
                this.updatePinnedItems();
                this.updateTree(); // 更新主树以反映取消固定状态
            };

            const itemContent = document.createElement('div');
            itemContent.style.cssText = `
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 4px;
            `;
            itemContent.appendChild(content);
            itemContent.appendChild(pathText);

            pinnedItem.appendChild(itemContent);
            pinnedItem.appendChild(debugBtn);
            pinnedItem.appendChild(unpinBtn);

            this.pinnedContainer.appendChild(pinnedItem);
        });
    }

    private showAddItemDialog(container: any, _path: string) {
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 400px;
            max-height: 80vh;
            background: rgba(40, 44, 52, 0.95);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 20px;
            color: #e1e1e1;
            font-size: 14px;
            display: flex;
            flex-direction: column;
            gap: 16px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            z-index: 10000;
        `;

        // 添加遮罩层
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(2px);
            z-index: 9999;
        `;
        document.body.appendChild(overlay);

        const title = document.createElement('h3');
        title.textContent = 'Add Item';
        title.style.cssText = `
            margin: 0;
            color: #e1e1e1;
            font-size: 18px;
            font-weight: 500;
        `;

        const content = document.createElement('div');
        content.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 16px;
            overflow-y: auto;
            max-height: calc(80vh - 140px);
            padding-right: 8px;
        `;

        // 添加自定义滚动条样式
        content.innerHTML = `
            <style>
                .debug-tools-dialog::-webkit-scrollbar {
                    width: 8px;
                }
                .debug-tools-dialog::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 4px;
                }
                .debug-tools-dialog::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 4px;
                }
                .debug-tools-dialog::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.3);
                }
            </style>
        `;
        content.classList.add('debug-tools-dialog');

        // 搜索框
        const searchContainer = document.createElement('div');
        searchContainer.style.cssText = `
            position: relative;
            margin-bottom: 8px;
        `;

        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Search items...';
        searchInput.style.cssText = `
            width: 100%;
            padding: 8px 12px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 4px;
            color: #e1e1e1;
            font-size: 14px;
            outline: none;
            box-sizing: border-box;
        `;

        // 物品列表
        const itemList = document.createElement('div');
        itemList.style.cssText = `
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
            margin-bottom: 16px;
        `;

        // 坐标输入
        const coordsContainer = document.createElement('div');
        coordsContainer.style.cssText = `
            display: flex;
            gap: 8px;
            margin-bottom: 16px;
        `;

        const createCoordInput = (label: string) => {
            const container = document.createElement('div');
            container.style.cssText = `
                display: flex;
                flex-direction: column;
                gap: 4px;
                flex: 1;
            `;

            const labelElement = document.createElement('label');
            labelElement.textContent = label;
            labelElement.style.cssText = `
                font-size: 12px;
                color: #888;
            `;

            const input = document.createElement('input');
            input.type = 'number';
            input.value = '0';
            input.style.cssText = `
                padding: 6px 8px;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 4px;
                color: #e1e1e1;
                font-size: 14px;
                outline: none;
                width: 100%;
                box-sizing: border-box;
            `;

            container.appendChild(labelElement);
            container.appendChild(input);
            return { container, input };
        };

        const xInput = createCoordInput('X Position');
        const yInput = createCoordInput('Y Position');
        const stackInput = createCoordInput('Stack Size');

        coordsContainer.appendChild(xInput.container);
        coordsContainer.appendChild(yInput.container);
        coordsContainer.appendChild(stackInput.container);

        // 按钮容器
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            gap: 8px;
            justify-content: flex-end;
            margin-top: auto;
        `;

        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'Cancel';
        cancelButton.style.cssText = `
            padding: 8px 16px;
            background: rgba(158, 158, 158, 0.1);
            border: 1px solid rgba(158, 158, 158, 0.2);
            border-radius: 4px;
            color: #9E9E9E;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s ease;
        `;

        const confirmButton = document.createElement('button');
        confirmButton.textContent = 'Add Item';
        confirmButton.style.cssText = `
            padding: 8px 16px;
            background: rgba(76, 175, 80, 0.1);
            border: 1px solid rgba(76, 175, 80, 0.2);
            border-radius: 4px;
            color: #4CAF50;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s ease;
        `;

        // 添加按钮事件
        cancelButton.onclick = () => {
            document.body.removeChild(dialog);
            document.body.removeChild(overlay);
        };

        // 添加所有元素到对话框
        searchContainer.appendChild(searchInput);
        content.appendChild(searchContainer);
        content.appendChild(itemList);
        content.appendChild(coordsContainer);
        buttonContainer.appendChild(cancelButton);
        buttonContainer.appendChild(confirmButton);

        dialog.appendChild(title);
        dialog.appendChild(content);
        dialog.appendChild(buttonContainer);
        document.body.appendChild(dialog);

        // 加载并显示物品列表
        this.loadItems().then((items: GameItem[]) => {
            let selectedItem: HTMLDivElement | null = null;

            items.forEach((item: GameItem) => {
                const itemElement = document.createElement('div');
                itemElement.style.cssText = `
                    padding: 8px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 4px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                `;
                itemElement.innerHTML = `
                    <div style="font-weight: 500;">${item.name}</div>
                    <div style="font-size: 12px; color: #888;">
                        ${item.width}x${item.height} - Value: ${item.value}
                    </div>
                `;

                itemElement.onclick = () => {
                    if (selectedItem) {
                        selectedItem.style.background = 'rgba(255, 255, 255, 0.05)';
                        selectedItem.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    }
                    itemElement.style.background = 'rgba(76, 175, 80, 0.1)';
                    itemElement.style.borderColor = 'rgba(76, 175, 80, 0.2)';
                    selectedItem = itemElement;
                    confirmButton.disabled = false;
                };

                itemList.appendChild(itemElement);
            });

            // 搜索功能
            searchInput.oninput = () => {
                const searchTerm = searchInput.value.toLowerCase();
                Array.from(itemList.children).forEach((child: any) => {
                    const itemName = child.querySelector('div').textContent.toLowerCase();
                    child.style.display = itemName.includes(searchTerm) ? 'block' : 'none';
                });
            };

            // 确认添加按钮事件
            confirmButton.onclick = () => {
                if (!selectedItem) return;

                const itemName = selectedItem.querySelector('div')!.textContent;
                const item = items.find(i => i.name === itemName);
                if (!item) return;

                const x = parseInt(xInput.input.value) || 0;
                const y = parseInt(yInput.input.value) || 0;
                const stackSize = parseInt(stackInput.input.value) || 1;

                // 添加物品到容器
                if (container.addItem) {
                    container.addItem(item.type, x, y, stackSize);
                } else if (container.contents) {
                    // 处理其他类型的容器
                    const newItem = {
                        type: item.type,
                        x,
                        y,
                        stack: stackSize,
                        width: item.width,
                        height: item.height,
                        value: item.value
                    };
                    container.contents[`${x},${y}`] = newItem;
                }

                document.body.removeChild(dialog);
                document.body.removeChild(overlay);
            };
        });
    }

    private loadItems(): Promise<GameItem[]> {
        // 从游戏实例获取物品类型
        const items = window.game.BLOCK_TYPES.map(item => ({
            name: item.name,
            width: item.width || 1,
            height: item.height || 1,
            value: item.value || 0,
            type: item.type
        }));
        return Promise.resolve(items);
    }
} 