# ⚡ Nexus Lab · 趣味交互实验室

一个纯原生前端（HTML5 + CSS3 + JavaScript）构建的多功能交互式网站，**无需安装任何依赖、无需后端服务器**，打开即玩！

---

## ✨ 四大趣味交互功能

1. **🌌 引力粒子画板 (`Gravity Particle Sandbox`)**
   - 鼠标移动或点击即可生成绚丽粒子。
   - 支持 **引力吸引**、**斥力推开**、**轨道环绕**、**点击烟花** 四种物理模式。
   - 支持调节拖尾长度，并可一键将画作导出为 PNG 图片。

2. **🎹 赛博电子琴 & 实时声波 (`Cyber Synth`)**
   - 基于浏览器原生 **Web Audio API** 实时合成声音（无需外部音频文件）。
   - 支持鼠标点击或键盘按键（`A~K` 弹奏白键，`W/E/T/Y/U` 弹奏黑键，`1~4` 触发电子鼓）。
   - 支持切换 **正弦波 / 三角波 / 方波 / 锯齿波** 四种音色，并在上方实时绘制音频波形。

3. **🧠 AI 寻路算法可视化 (`Pathfinding Visualizer`)**
   - 可在网格中自由拖拽绘制障碍物、设置起点与终点，或一键生成随机迷宫。
   - 实时动画演示 **A* 启发式搜索**、**BFS 广度优先** 和 **Dijkstra** 算法寻找最短路径的过程。

4. **🎡 灵感决策大转盘 (`Decision Wheel`)**
   - 内置「今天吃什么」「周末学什么」「摸鱼干什么」预设模板，也支持自由编辑选项。
   - 带有丝滑缓动减速动画，帮你快速做决定。

---

## 🚀 如何使用

### 方式一：直接运行（最简单）
1. 找到项目文件夹中的 `index.html`。
2. **双击 `index.html`**，使用任意现代浏览器（Chrome / Edge / Firefox / Safari）打开即可直接游玩。

### 方式二：通过本地服务器运行（推荐开发调试）
如果你安装了 Python，可以在项目目录下打开终端运行：

```bash
python -m http.server 8080
```

然后在浏览器访问：`http://localhost:8080`

---

## 🌐 如何免费生成公开可访问链接？

由于本项目是纯静态网页，你可以 1 分钟内免费部署上线并获得公网链接：

- **方法 A：Netlify Drop（最快，无需命令行）**
  1. 打开 [Netlify Drop](https://app.netlify.com/drop)。
  2. 将整个 `nexus-interactive-lab` 文件夹直接拖入网页即可生成公开链接。
- **方法 B：GitHub Pages**
  1. 在 GitHub 新建一个仓库并上传 `index.html`、`style.css`、`app.js`。
  2. 进入仓库的 **Settings -> Pages**，选择 `main` 分支并保存，稍等即可获得 `https://<你的用户名>.github.io/<仓库名>/` 公开链接。

---

## 📁 文件结构

```text
nexus-interactive-lab/
├── index.html   # 页面结构与四大模块布局
├── style.css    # 暗黑霓虹玻璃拟态样式
├── app.js       # 粒子物理、Web Audio 合成器、寻路算法与转盘逻辑
└── README.md    # 使用与部署说明
```
