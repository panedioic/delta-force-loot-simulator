import { Subgrid } from "./subgrid";

export class ItemDOM {
    private parentGrid: Subgrid | null;
    private element: HTMLDivElement;
    private nameElement: HTMLDivElement;
    private valueElement: HTMLDivElement;
    private stackElement: HTMLDivElement | null = null;
    private ammoElement: HTMLDivElement | null = null;

    public col: number;
    public row: number;
    public x: number;
    public y: number;
    public cellWidth: number;
    public cellHeight: number;
    public originCellWidth: number;
    public originCellHeight: number;
    public pixelWidth: number;
    public pixelHeight: number;
    public color: string;
    public baseValue: number;
    public name: string;
    public type: string;
    public search: number;
    public cellSize: number;
    public aspect: number;
    public fullfill: boolean;
    public subgridLayout: Array<[number, number, number, number]> = [];
    public subgrids: { [key: string]: Subgrid } = {};
    public accessories: Array<{type: string, title: string}> = [];
    public maxStackCount: number;
    public currentStactCount: number;
    public ammoType: string | null;
    public ammo: { [key: string]: number } = {};
    public capacity: number | null;
    public conflicts: { [key: string]: string[] } = {};

    private dragStartParentElement: HTMLElement | null = null;
    private dragStartItemPosition: { x: number, y: number } = { x: 0, y: 0 };
    private dragStartMousePosition: { x: number, y: number } = { x: 0, y: 0 };
    private isDragging: boolean = false;
    private hasMoved: boolean = false;
    private dragOverlay: HTMLDivElement | null = null;
    private previewIndicator: HTMLDivElement | null = null;

    private clickTimeout: number | null = null;
    private clickCount: number = 0;

    searched: boolean;
    searchTime: number;
    private searchMask: HTMLDivElement;

    constructor(parentGrid: Subgrid | null, type: string, itemType: any) {
        this.parentGrid = parentGrid;
        this.col = 0;
        this.row = 0;
        this.x = 0;
        this.y = 0;
        this.cellWidth = itemType.cellWidth;
        this.cellHeight = itemType.cellHeight;
        this.originCellWidth = this.cellWidth;
        this.originCellHeight = this.cellHeight;
        this.pixelWidth = this.parentGrid ? this.cellWidth * this.parentGrid.cellSize * this.parentGrid.aspect : this.cellWidth * 72;
        this.pixelHeight = this.parentGrid ? this.cellHeight * this.parentGrid.cellSize : this.cellHeight * 72;
        this.color = itemType.color;
        this.baseValue = itemType.value;
        this.name = itemType.name;
        this.type = type || "collection";
        this.search = itemType.search || 1.2;
        this.subgridLayout = itemType.subgridLayout;
        this.accessories = itemType.accessories || [];
        this.maxStackCount = itemType.maxStack || 1;
        this.currentStactCount = itemType.stack || 1;
        this.ammoType = itemType.ammo;
        this.capacity = itemType.capacity;
        this.conflicts = this.processConflicts(itemType.conflict);

        this.cellSize = this.parentGrid ? this.parentGrid.cellSize : 72;
        this.aspect = this.parentGrid ? this.parentGrid.aspect : 1;
        this.fullfill = false;

        // 创建DOM元素
        this.element = document.createElement('div');
        this.element.className = 'item';
        this.element.style.width = `${this.pixelWidth}px`;
        this.element.style.height = `${this.pixelHeight}px`;
        this.element.style.backgroundColor = `#${this.color}`;

        // 创建名称元素
        this.nameElement = document.createElement('div');
        this.nameElement.className = 'item-name';
        this.nameElement.textContent = this.name;
        this.element.appendChild(this.nameElement);

        // 创建价值元素
        this.valueElement = document.createElement('div');
        this.valueElement.className = 'item-value';
        this.valueElement.textContent = this.getValue().toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        this.element.appendChild(this.valueElement);

        // 如果物品可堆叠，添加堆叠数量显示
        if (this.maxStackCount > 1) {
            this.stackElement = document.createElement('div');
            this.stackElement.className = 'item-stack';
            this.stackElement.textContent = `x${this.currentStactCount}`;
            this.element.appendChild(this.stackElement);
        }

        // 如果有子弹，显示子弹数量
        if (this.ammoType) {
            this.ammoElement = document.createElement('div');
            this.ammoElement.className = 'item-ammo';
            this.ammoElement.textContent = `${this.getTotalAmmo()}/${this.capacity}`;
            this.element.appendChild(this.ammoElement);
        }

        // 搜索相关
        if (window.game.needSearch) {
            this.searched = false;
            this.searchMask = document.createElement('div');
            this.searchMask.style.position = 'absolute';
            this.searchMask.style.top = '0';
            this.searchMask.style.left = '0';
            this.searchMask.style.width = '100%';
            this.searchMask.style.height = '100%';
            this.searchMask.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
            this.element.appendChild(this.searchMask);
        } else {
            this.searched = true;
            this.searchMask = document.createElement('div');
            this.searchMask.style.display = 'none';
        }

        this.searchTime = 1;

        // 添加事件监听器
        this.addEventListeners();

        // 初始化配件
        this.initAccessories();
    }

    private processConflicts(conflicts: [string, string][] | undefined): { [key: string]: string[] } {
        const result: { [key: string]: string[] } = {};
        if (conflicts) {
            for (const [type1, type2] of conflicts) {
                if (!result[type1]) result[type1] = [];
                if (!result[type2]) result[type2] = [];
                result[type1].push(type2);
                result[type2].push(type1);
            }
        }
        return result;
    }

    private addEventListeners() {
        this.element.addEventListener('mousedown', this.onDragStart.bind(this));
        document.addEventListener('mousemove', this.onDragMove.bind(this));
        document.addEventListener('mouseup', this.onDragEnd.bind(this));
        this.element.addEventListener('click', () => this.onClick());
        document.addEventListener('keydown', this.onKeyDown.bind(this));
    }

    private onClick(_clickCount = 1) {
        if (this.clickTimeout === null) {
            this.clickCount = 1;
            this.clickTimeout = window.setTimeout(() => {
                if (this.clickCount === 1) {
                    // 单击
                    // this.game.showItemInfo(this);
                }
                this.clickTimeout = null;
                this.clickCount = 0;
            }, 300);
        } else {
            this.clickCount++;
            if (this.clickCount === 2) {
                // 双击
                window.clearTimeout(this.clickTimeout);
                this.clickTimeout = null;
                this.clickCount = 0;
                // 处理双击逻辑
            }
        }
    }

    private onDragStart(event: MouseEvent) {
        if (event.button !== 0) return; // 只响应左键
        event.preventDefault();
        
        this.isDragging = true;
        this.hasMoved = false;
        
        const rect = this.element.getBoundingClientRect();
        this.dragStartParentElement = this.element.parentElement!;
        this.dragStartItemPosition = { x: rect.left, y: rect.top };
        this.dragStartMousePosition = { x: event.clientX, y: event.clientY };
        
        // 创建拖动时的覆盖层
        this.dragOverlay = document.createElement('div');
        this.dragOverlay.style.position = 'fixed';
        this.dragOverlay.style.left = '0';
        this.dragOverlay.style.top = '0';
        this.dragOverlay.style.width = '100%';
        this.dragOverlay.style.height = '100%';
        this.dragOverlay.style.zIndex = '9999';
        this.dragOverlay.style.cursor = 'grabbing';
        document.body.appendChild(this.dragOverlay);
        
        // 将物品元素移到body下，以便在其他元素上方显示
        document.body.appendChild(this.element);
        this.element.style.position = 'fixed';
        this.element.style.left = `${rect.left}px`;
        this.element.style.top = `${rect.top}px`;
        this.element.style.zIndex = '10000';
    }

    private onDragMove(event: MouseEvent) {
        if (!this.isDragging) return;
        
        const deltaX = event.clientX - this.dragStartMousePosition.x;
        const deltaY = event.clientY - this.dragStartMousePosition.y;
        
        if (!this.hasMoved && (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5)) {
            this.hasMoved = true;
        }
        
        this.element.style.left = `${this.dragStartItemPosition.x + deltaX}px`;
        this.element.style.top = `${this.dragStartItemPosition.y + deltaY}px`;
        
        // 更新预览指示器
        this.updatePreviewIndicator(event.clientX, event.clientY);
    }

    private onDragEnd() {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        
        // 移除拖动覆盖层
        if (this.dragOverlay) {
            this.dragOverlay.remove();
            this.dragOverlay = null;
        }
        
        // 移除预览指示器
        if (this.previewIndicator) {
            this.previewIndicator.remove();
            this.previewIndicator = null;
        }
        
        if (!this.hasMoved || !this.dragStartParentElement) {
            // 如果没有移动，将物品放回原位
            if (this.dragStartParentElement) {
                this.dragStartParentElement.appendChild(this.element);
                this.element.style.position = 'absolute';
                this.element.style.left = `${this.x}px`;
                this.element.style.top = `${this.y}px`;
            }
            return;
        }
        
        // TODO: 处理放置逻辑
        // 这里需要检查目标位置是否可以放置物品
        // 如果可以，更新物品位置
        // 如果不可以，将物品放回原位
        if (this.dragStartParentElement) {
            this.dragStartParentElement.appendChild(this.element);
            this.element.style.position = 'absolute';
            this.element.style.left = `${this.x}px`;
            this.element.style.top = `${this.y}px`;
        }
    }

    private updatePreviewIndicator(_mouseX: number, _mouseY: number) {
        // TODO: 实现预览指示器逻辑
    }

    private onKeyDown(event: KeyboardEvent) {
        if (event.key === 'r' && this.isDragging) {
            // TODO: 实现旋转逻辑
        }
    }

    public getValue(): number {
        return this.baseValue * this.currentStactCount;
    }

    public getTotalAmmo(): number {
        return Object.values(this.ammo).reduce((sum, count) => sum + count, 0);
    }

    private initAccessories() {
        // TODO: 实现配件初始化逻辑
    }

    public getElement(): HTMLDivElement {
        return this.element;
    }

    public setPosition(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.element.style.left = `${x}px`;
        this.element.style.top = `${y}px`;
    }

    public setGridPosition(col: number, row: number) {
        this.col = col;
        this.row = row;
        if (this.parentGrid) {
            const pos = this.parentGrid.gridToPixel(col, row);
            this.setPosition(pos.x, pos.y);
        }
    }

    public hasConflict(type: string): boolean {
        return this.conflicts[type]?.length > 0;
    }

    public unloadAmmo() {
        const ammoToUnload = { ...this.ammo };
        this.ammo = {};
        return ammoToUnload;
    }
} 