# MieWords

MieWords is a minimal English–Chinese vocabulary tool for collecting words, organizing personal word lists, and reviewing GRE and TOEFL vocabulary. It runs directly in your browser and keeps your personal data on your device.

## 立即使用

最快捷的方法：打开 **[MieWords 在线版](https://jiayeyong.github.io/miewords/)**，无需安装或登录。建议将页面加入浏览器书签，之后可以直接打开。

## 使用方法

### 录入

输入英文单词和中文释义，选择保存到哪个个人词库。输入已经收录的单词时，MieWords 会尝试从个人词库、GRE 或 TOEFL 词库自动填写中文，你可以在保存前修改。

### 词库

- 新建、重命名和管理自己的词库。
- 搜索个人词库及内置 GRE、TOEFL 词库。
- 将内置词库中的单词收藏到自己的词库。
- 通过“数据”菜单导入或导出个人数据。

### 背诵

- **个人词库：** 每组复习十个单词；选择“认识”后计入本轮完成，选择“不认识”会优先再次出现。
- **内置词库：** 每 100 个单词为一组，选择任意 List 后逐张翻阅词卡。点击或按空格翻面，使用方向键切换。

## 数据保存

个人单词、词库和复习记录只保存在当前浏览器中。正常关闭页面或重启电脑不会丢失，但清除浏览器数据、更换浏览器或设备时不会自动同步。

建议定期进入 `词库 → 默认词库 → 数据`，选择 **导出 JSON** 进行备份；需要恢复时选择 **导入 JSON**。

## 本地运行

```bash
npm install
npm run dev
```

## License

[MIT](LICENSE) © Mie · [Third-party notices](THIRD_PARTY_NOTICES.md)
