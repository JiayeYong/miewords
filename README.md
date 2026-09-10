# MieWords

> A tiny vocabulary garden for growing words.

MieWords 是一个轻量、隐私友好的个人单词工具。录入英文和中文释义，整理自己的词库，再用随机十词默写随时复习。

## Features

- 英文与中文释义快速录入
- 可新建、重命名和删除的个人词库
- 自动记住上一次录入目标，已有单词自动补全中文释义
- 同一个个人单词可以加入多个词库
- 分开的个人词库与只读内置词库
- 从 GRE（镇考 3000 词）、TOEFL（ECDICT 词库）收藏到个人词库
- 按英文字母顺序排列的可搜索词表
- 编辑、删除与重复单词更新
- 各词库独立的无重复随机遍历进度
- 点击揭晓释义后选择“认识 / 不认识”，难词优先再次出现
- 支持重新开始当前轮次并保留累计学习记录
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

所有个人词汇、词库关系和默写进度均保存在当前浏览器的 IndexedDB 中。清理浏览器数据前，请先导出 JSON 备份。

## Roadmap

- 更细致的学习统计与薄弱词专用复习
- CSV 导入
- 多语言界面
- 可选的跨设备同步
- Mie 小羊品牌形象

## License

[MIT](LICENSE) © Mie
