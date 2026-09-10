# MieWords

> A tiny vocabulary garden for growing words.

MieWords 是一个轻量、隐私友好的个人单词工具。录入英文和中文释义，整理自己的词库，再通过个人复习和内置单词卡持续背诵。

## Features

- 英文与中文释义快速录入
- 可新建、重命名和删除的个人词库
- 自动记住上一次录入目标，从个人及内置词库补全中文释义
- 录入时可从 GRE、TOEFL 内置词库自动补全释义，个人修改不影响原词库
- 同一个个人单词可以加入多个词库
- 分开的个人词库与只读内置词库
- 从 GRE（镇考 3000 词）、TOEFL（ECDICT 词库）收藏到个人词库
- 按英文字母顺序排列的可搜索词表
- 编辑、删除与重复单词更新
- 个人词库使用独立的无重复随机遍历进度
- 个人复习中点击揭晓释义后选择“认识 / 不认识”，难词优先再次出现
- 支持重新开始当前轮次并保留累计学习记录
- 内置词库使用固定随机的百词分组与逐张翻阅单词卡
- 内置词卡支持键盘操作，并记住每组最后停留位置
- 内置词库稳定随机分成每组 100 词，以可翻面的单词卡浏览
- 可自由选择内置词组，并记住每组上次停留的位置
- IndexedDB 本地保存，不上传个人词库
- JSON 备份导入与导出、CSV 导出
- 响应式界面，支持桌面与移动设备

## Local development

```bash
npm install
npm run dev
```

生产构建：

```bash
npm run build
```

## Deployment

项目包含 GitHub Pages 自动发布工作流。将仓库公开并在仓库的
`Settings → Pages → Build and deployment` 中选择 **GitHub Actions** 后，
每次推送到 `main` 分支都会自动构建并发布。

默认项目地址为 `https://<username>.github.io/miewords/`。

## Privacy

所有个人词汇、词库关系、个人复习进度和内置词卡位置均保存在当前浏览器的 IndexedDB 中。清理浏览器数据前，请先导出 JSON 备份。

## Roadmap

- 更细致的学习统计与薄弱词专用复习
- CSV 导入
- 多语言界面
- 可选的跨设备同步
- Mie 小羊品牌形象

## License

[MIT](LICENSE) © Mie
