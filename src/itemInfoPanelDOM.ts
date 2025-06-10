import { ItemDOM } from "./itemDOM";
import { Subgrid } from "./subgrid";

interface ButtonConfig {
    text: string;
    callback: () => void;
}

export class ItemInfoPanelDOM {
    // private readonly WIDTH = 420;
    // private readonly HEIGHT = 636;
    // private readonly TITLE_HEIGHT = 40;
    // private readonly IMAGE_HEIGHT = 220;
    // private readonly BUTTON_WIDTH = 186;
    // private readonly BUTTON_HEIGHT = 46;
    // private readonly BUTTON_GAP = 4;
    // private readonly SUBGRID_SIZE = 72;
    // private readonly AMMO_START_POS_X = 24;
    // private readonly SPLIT_PANEL_WIDTH = 300;
    // private readonly SPLIT_PANEL_HEIGHT = 200;

    private item: ItemDOM;
    private element: HTMLDivElement;
    private contentElement: HTMLDivElement;
    private buttons: HTMLButtonElement[] = [];
    private subgrids: Subgrid[] = [];
    private isDragging: boolean = false;
    private dragStartPos = { x: 0, y: 0, mouseX: 0, mouseY: 0 };
    private scrollY: number = 0;
    maxScrollY: number = 0;
    private maxHeight: number = 0;
    ammoType: string = '';
    private splitPanel: HTMLDivElement | null = null;
    private selectedSplitAmount: number = 1;

    constructor(item: ItemDOM, x: number, y: number, buttonConfigs: ButtonConfig[]) {
        this.item = item;

        // 如果物品可堆叠，添加拆分按钮
        if (this.item.maxStackCount > 1 && this.item.currentStactCount > 1) {
            buttonConfigs.push({
                text: "拆分",
                callback: () => this.showSplitPanel()
            });
        }

        // 如果是枪械，添加卸载子弹功能
        if (this.item.ammoType) {
            buttonConfigs.push({
                text: "卸载子弹",
                callback: () => this.item.unloadAmmo()
            });
        }

        // 创建主容器
        this.element = document.createElement('div');
        this.element.className = 'item-info-panel';
        this.element.style.left = `${x}px`;
        this.element.style.top = `${y}px`;

        // 创建内容容器
        this.contentElement = document.createElement('div');
        this.contentElement.className = 'info-panel-content';
        this.element.appendChild(this.contentElement);

        // 创建标题栏
        this.createTitleBar();

        // 创建图片区域
        this.createImageArea();

        // 创建按钮
        this.createButtons(buttonConfigs);

        // 如果是枪械，创建弹药和配件区域
        if (this.item.accessories.length > 0) {
            this.createAmmoArea();
            this.createAttachmentsArea();
        }

        // 设置滚动
        this.setupScrolling();

        // 添加到文档
        document.body.appendChild(this.element);
    }

    private createTitleBar() {
        const titleBar = document.createElement('div');
        titleBar.className = 'info-panel-title';

        const title = document.createElement('h2');
        title.textContent = this.item.name;
        titleBar.appendChild(title);

        const closeButton = document.createElement('button');
        closeButton.className = 'info-panel-close';
        closeButton.textContent = '×';
        closeButton.onclick = (e) => {
            e.stopPropagation();
            this.close();
        };
        titleBar.appendChild(closeButton);

        titleBar.onmousedown = this.onDragStart.bind(this);
        this.contentElement.appendChild(titleBar);
    }

    private createImageArea() {
        const imageArea = document.createElement('div');
        imageArea.className = 'info-panel-image';
        imageArea.style.backgroundColor = `#${this.item.color}`;

        const name = document.createElement('h1');
        name.textContent = this.item.name;
        imageArea.appendChild(name);

        let valueInfo: string;
        if (this.item.maxStackCount > 1) {
            valueInfo = `${this.item.baseValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} × ${this.item.currentStactCount} = ${this.item.getValue().toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}\n(最大堆叠数：${this.item.maxStackCount})`;
        } else {
            valueInfo = this.item.getValue().toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }

        const value = document.createElement('p');
        value.textContent = valueInfo;
        imageArea.appendChild(value);

        this.contentElement.appendChild(imageArea);
    }

    private createButtons(configs: ButtonConfig[]) {
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'info-panel-buttons';

        configs.forEach(config => {
            const button = document.createElement('button');
            button.className = 'info-panel-button';
            button.textContent = config.text;
            button.onclick = config.callback;
            buttonsContainer.appendChild(button);
            this.buttons.push(button);
        });

        this.contentElement.appendChild(buttonsContainer);
    }

    private createAmmoArea() {
        const ammoArea = document.createElement('div');
        ammoArea.className = 'info-panel-ammo';

        const title = document.createElement('h3');
        title.textContent = '弹药';
        ammoArea.appendChild(title);

        // TODO: 实现弹药区域的具体内容

        this.contentElement.appendChild(ammoArea);
    }

    private createAttachmentsArea() {
        const attachmentsArea = document.createElement('div');
        attachmentsArea.className = 'info-panel-attachments';

        const title = document.createElement('h3');
        title.textContent = '配件';
        attachmentsArea.appendChild(title);

        // TODO: 实现配件区域的具体内容

        this.contentElement.appendChild(attachmentsArea);
    }

    private setupScrolling() {
        this.contentElement.onwheel = this.onWheel.bind(this);
        this.maxHeight = this.contentElement.scrollHeight - this.contentElement.clientHeight;
    }

    private onDragStart(event: MouseEvent) {
        if (event.button !== 0) return;
        event.preventDefault();

        this.isDragging = true;
        const rect = this.element.getBoundingClientRect();
        this.dragStartPos = {
            x: rect.left,
            y: rect.top,
            mouseX: event.clientX,
            mouseY: event.clientY
        };

        document.addEventListener('mousemove', this.onDragMove.bind(this));
        document.addEventListener('mouseup', this.onDragEnd.bind(this));
    }

    private onDragMove(event: MouseEvent) {
        if (!this.isDragging) return;

        const deltaX = event.clientX - this.dragStartPos.mouseX;
        const deltaY = event.clientY - this.dragStartPos.mouseY;

        this.element.style.left = `${this.dragStartPos.x + deltaX}px`;
        this.element.style.top = `${this.dragStartPos.y + deltaY}px`;
    }

    private onDragEnd() {
        this.isDragging = false;
        document.removeEventListener('mousemove', this.onDragMove.bind(this));
        document.removeEventListener('mouseup', this.onDragEnd.bind(this));
    }

    private onWheel(event: WheelEvent) {
        event.preventDefault();
        this.scrollY = Math.max(0, Math.min(this.maxHeight, this.scrollY + event.deltaY));
        this.contentElement.scrollTop = this.scrollY;
    }

    private showSplitPanel() {
        if (this.splitPanel) return;

        this.splitPanel = document.createElement('div');
        this.splitPanel.className = 'split-panel';

        const title = document.createElement('h3');
        title.textContent = '拆分物品';
        this.splitPanel.appendChild(title);

        const controls = document.createElement('div');
        controls.className = 'split-panel-controls';

        const decreaseButton = document.createElement('button');
        decreaseButton.textContent = '-';
        decreaseButton.onclick = () => {
            this.selectedSplitAmount = Math.max(1, this.selectedSplitAmount - 1);
            this.updateSplitPanel();
        };
        controls.appendChild(decreaseButton);

        const amountText = document.createElement('span');
        amountText.textContent = this.selectedSplitAmount.toString();
        controls.appendChild(amountText);

        const increaseButton = document.createElement('button');
        increaseButton.textContent = '+';
        increaseButton.onclick = () => {
            this.selectedSplitAmount = Math.min(this.item.currentStactCount - 1, this.selectedSplitAmount + 1);
            this.updateSplitPanel();
        };
        controls.appendChild(increaseButton);

        this.splitPanel.appendChild(controls);

        const buttons = document.createElement('div');
        buttons.className = 'split-panel-buttons';

        const confirmButton = document.createElement('button');
        confirmButton.textContent = '确认';
        confirmButton.onclick = () => this.splitItem();
        buttons.appendChild(confirmButton);

        const cancelButton = document.createElement('button');
        cancelButton.textContent = '取消';
        cancelButton.onclick = () => this.closeSplitPanel();
        buttons.appendChild(cancelButton);

        this.splitPanel.appendChild(buttons);
        document.body.appendChild(this.splitPanel);
    }

    private updateSplitPanel() {
        if (!this.splitPanel) return;
        const amountText = this.splitPanel.querySelector('.split-panel-controls span');
        if (amountText) {
            amountText.textContent = this.selectedSplitAmount.toString();
        }
    }

    private closeSplitPanel() {
        if (this.splitPanel) {
            this.splitPanel.remove();
            this.splitPanel = null;
        }
        this.selectedSplitAmount = 1;
    }

    private splitItem() {
        // TODO: 实现物品拆分逻辑
        this.closeSplitPanel();
    }

    public close() {
        this.element.remove();
        if (this.splitPanel) {
            this.splitPanel.remove();
        }
    }

    public getPosition(): { x: number, y: number } {
        const rect = this.element.getBoundingClientRect();
        return { x: rect.left, y: rect.top };
    }

    public setPosition(x: number, y: number) {
        this.element.style.left = `${x}px`;
        this.element.style.top = `${y}px`;
    }

    public getSubgrids(): Subgrid[] {
        return this.subgrids;
    }
} 