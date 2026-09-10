# MieWords

> A tiny vocabulary garden for growing words.

MieWords 是一个轻量、隐私友好的个人单词工具。录入英文和中文释义，整理自己的词库，再用随机十词默写随时复习。

## Features

- 英文与中文释义快速录入
- 分开的个人词库与只读内置词库
- 从 GRE（镇考 3000 词）、TOEFL 词库收藏到个人词库
- 按英文字母顺序排列的可搜索词表
- 编辑、删除与重复单词更新
- 选择词库后随机抽取至多十词，点击显示中文释义
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

所有词汇数据均保存在当前浏览器的 IndexedDB 中。清理浏览器数据前，请先导出 JSON 备份。

## Roadmap

- 接入许可证明确的完整 TOEFL 数据源
- 学习结果与薄弱词优先复习
- CSV 导入
- 多语言界面
- 可选的跨设备同步
- Mie 小羊品牌形象

## License

[MIT](LICENSE) © Mie
