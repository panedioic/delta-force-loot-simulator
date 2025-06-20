import json
import os

def process_values():
    # 读取values.json文件
    try:
        with open('./public/json/values.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        print("错误：找不到values.json文件")
        return
    except json.JSONDecodeError:
        print("错误：values.json文件格式不正确")
        return

    # 确保data中包含list字段
    if 'list' not in data:
        print("错误：values.json中没有找到'list'字段")
        return

    # 打印列表长度
    print(f"数据列表总长度：{len(data['list'])}")

    # 用于存储结果的列表
    result_list = []  # 创建新的列表来存储清理后的数据

    # 遍历每个对象
    for i, item in enumerate(data['list']):
        print(f"\n当前对象 ({i + 1}/{len(data['list'])})：")
        print(f"对象名称 (objectName): {item.get('objectName', 'N/A')}")
        print(f"对象ID (objectID): {item.get('objectID', 'N/A')}")

        # 创建新的清理后的对象，只包含必要字段
        cleaned_item = {
            'id': item.get('id'),
            'objectID': item.get('objectID'),
            'objectName': item.get('objectName')
        }

        current_value = item.get('baseValue', None)
        
        if current_value is not None:
            print(f"当前baseValue值: {current_value}")
            user_input = input("是否需要更改baseValue？(直接回车保持不变，输入新值进行更改，输入q退出): ")
            if user_input.lower() == 'q':
                # 将剩余未处理的项添加到结果列表（同样只保留必要字段）
                for remaining_item in data['list'][i:]:
                    remaining_cleaned = {
                        'id': remaining_item.get('id'),
                        'objectID': remaining_item.get('objectID'),
                        'objectName': remaining_item.get('objectName')
                    }
                    if 'baseValue' in remaining_item:
                        remaining_cleaned['baseValue'] = remaining_item['baseValue']
                    result_list.append(remaining_cleaned)
                break
            if user_input.strip():
                try:
                    new_value = int(user_input)
                    cleaned_item['baseValue'] = new_value
                except ValueError:
                    print("输入的不是有效的数字，保持原值不变")
                    if current_value is not None:
                        cleaned_item['baseValue'] = current_value
            else:
                if current_value is not None:
                    cleaned_item['baseValue'] = current_value
        else:
            while True:
                user_input = input("请输入baseValue值 (输入q退出): ")
                if user_input.lower() == 'q':
                    # 将剩余未处理的项添加到结果列表（同样只保留必要字段）
                    for remaining_item in data['list'][i:]:
                        remaining_cleaned = {
                            'id': remaining_item.get('id'),
                            'objectID': remaining_item.get('objectID'),
                            'objectName': remaining_item.get('objectName')
                        }
                        if 'baseValue' in remaining_item:
                            remaining_cleaned['baseValue'] = remaining_item['baseValue']
                        result_list.append(remaining_cleaned)
                    break
                if user_input.strip():
                    try:
                        new_value = int(user_input)
                        cleaned_item['baseValue'] = new_value
                        break
                    except ValueError:
                        print("请输入有效的数字")
                else:
                    print("baseValue不能为空，请输入一个值")
            
            if user_input.lower() == 'q':
                break

        result_list.append(cleaned_item)

    # 保存结果到values.json
    try:
        with open('./public/json/values.json', 'w', encoding='utf-8') as f:
            json.dump({'list': result_list}, f, ensure_ascii=False, indent=2)
        print("\n数据已成功保存到values.json文件")
    except Exception as e:
        print(f"\n保存文件时发生错误：{str(e)}")

if __name__ == "__main__":
    process_values()
