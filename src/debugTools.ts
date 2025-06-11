import { Game } from "./game";
// import { Item } from "./item";
// import { Subgrid } from "./subgrid";

export class DebugTools {
    private game: Game;
    // private itemTypes: any;

    constructor(game: Game) {
        this.game = game;
        this.loadItemTypes();
        this.setupKeyboardShortcuts();
        this.game.timer?.start();
        this.game.isGameStarted = true;
    }

    initItems() {
        // 当前的 Inventory
        /*
        if(!this.game.spoilsManager || (this.game.spoilsManager.inventories.length === 0)) {
            return;
        }
        const inventory = this.game.spoilsManager.inventories[0];
        // 清除所有物品
        inventory.clearItem();

        const itemToBeAdded = [
            "M14", 
            "7.62x51mm M62", 
            "7.62x51mm M62", 
            "7.62x51mm M62", 
            "7.62x51mm M80", 
            "7.62x51mm M80", 
            "7.62x51mm M80", 
            "通用托腮板",
            "堡垒水平补偿器", 
            "钛金竞赛制退器",
            "M14洞察超长枪管", 
            "PEQ-2红色激光镭指", 
            "游侠护木片", 
            "游侠护木片", 
            "KC猎犬护木片", 
            "共振人体工程握把", 
            "M14 30发弹匣", 
            "灰熊权威里快拔套（沙色）", 
            "M157火控光学系统", 
            "M14先进枪身系统", 
            "影袭导轨枪托"
        ];

        const itemInfoToBeAdded = itemToBeAdded.map(itemName => 
            this.game.BLOCK_TYPES.find((item: any) => item.name === itemName)
        );
        
        for (const itemInfo of itemInfoToBeAdded) {
            if (itemInfo) {
                const item = new Item(this.game, null, itemInfo.type, itemInfo);
                inventory.addItem(item);
                // console.log(res, item);
            }
        }*/
    }

    private async loadItemTypes() {
        // try {
        //     const response = await fetch('/blocks.json');
        //     this.itemTypes = await response.json();
        // } catch (error) {
        //     console.error('Failed to load item types:', error);
        // }
    }

    private setupKeyboardShortcuts() {
        window.addEventListener('keydown', (event) => {
            // Ctrl + Shift + D 打开调试菜单
            if (event.ctrlKey && event.shiftKey && event.key === 'D') {
                // this.showDebugMenu();
            }
        });
    }

    /*
    private showDebugMenu() {
        const menu = document.createElement('div');
        menu.style.position = 'fixed';
        menu.style.top = '50%';
        menu.style.left = '50%';
        menu.style.transform = 'translate(-50%, -50%)';
        menu.style.backgroundColor = '#2a2a2a';
        menu.style.padding = '20px';
        menu.style.borderRadius = '8px';
        menu.style.zIndex = '1000';
        menu.style.color = 'white';
        menu.style.fontFamily = 'Arial, sans-serif';

        // 创建标题
        const title = document.createElement('h2');
        title.textContent = '调试工具';
        title.style.marginTop = '0';
        menu.appendChild(title);

        // 创建物品选择下拉框
        const itemSelect = document.createElement('select');
        itemSelect.style.width = '200px';
        itemSelect.style.marginBottom = '10px';
        itemSelect.style.padding = '5px';
        
        // 添加物品选项
        for (const item of this.itemTypes) {
            const option = document.createElement('option');
            option.value = JSON.stringify(item);
            option.textContent = `${item.name} (${item.type})`;
            itemSelect.appendChild(option);
        }
        menu.appendChild(itemSelect);

        // 创建按钮容器
        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.gap = '10px';
        buttonContainer.style.marginTop = '10px';

        // 替换选中物品按钮
        const replaceButton = document.createElement('button');
        replaceButton.textContent = '替换选中物品';
        replaceButton.style.padding = '8px 16px';
        replaceButton.onclick = () => {
            const selectedItemType = JSON.parse(itemSelect.value);
            this.replaceSelectedItem(selectedItemType);
            document.body.removeChild(menu);
        };
        buttonContainer.appendChild(replaceButton);

        // 替换所有物品按钮
        const replaceAllButton = document.createElement('button');
        replaceAllButton.textContent = '替换所有物品';
        replaceAllButton.style.padding = '8px 16px';
        replaceAllButton.onclick = () => {
            const selectedItemType = JSON.parse(itemSelect.value);
            this.replaceAllItems(selectedItemType);
            document.body.removeChild(menu);
        };
        buttonContainer.appendChild(replaceAllButton);

        // 关闭按钮
        const closeButton = document.createElement('button');
        closeButton.textContent = '关闭';
        closeButton.style.padding = '8px 16px';
        closeButton.onclick = () => document.body.removeChild(menu);
        buttonContainer.appendChild(closeButton);

        menu.appendChild(buttonContainer);
        document.body.appendChild(menu);
    }

    private replaceSelectedItem(newItemType: any) {
        if (!this.game.spoilsManager) return;

        const currentInventory = this.game.spoilsManager.inventories[this.game.spoilsManager.current];
        const selectedItem = currentInventory.selectedItem;

        if (selectedItem) {
            const newItem = new Item(this.game, selectedItem.parentGrid, newItemType.type, newItemType);
            if (selectedItem.parentGrid) {
                const x = selectedItem.x;
                const y = selectedItem.y;
                selectedItem.parentGrid.removeBlock(selectedItem);
                selectedItem.parentGrid.addBlock(newItem, x, y);
            }
        }
    }

    private replaceAllItems(newItemType: any) {
        if (!this.game.spoilsManager) return;

        const currentInventory = this.game.spoilsManager.inventories[this.game.spoilsManager.current];
        const items = [...currentInventory.getAllItems()]; // 创建副本以避免在迭代时修改数组

        for (const item of items) {
            const newItem = new Item(this.game, item.parentGrid, newItemType.type, newItemType);
            if (item.parentGrid) {
                const x = item.x;
                const y = item.y;
                item.parentGrid.removeBlock(item);
                item.parentGrid.addBlock(newItem, x, y);
            }
        }
    }*/
}
