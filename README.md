# 测量数据处理理论与方法

课程知识点、六章系统学习笔记，以及可复现的课程作业。

**在线阅读：<https://aaronchou313.github.io/UCAS-measurement-data-processing/>**

## 从哪里开始

1. [阅读指南与统一符号](系统学习笔记/00_阅读指南与统一符号.md)：先了解覆盖范围、符号和学习顺序。
2. [学习大纲](00_学习大纲.md) → [六章笔记](系统学习笔记/00_阅读指南与统一符号.md#2-六章入口与学习顺序) → [全部知识点清单](全课程知识点清单.md)。
3. [作业原题](01_逐课作业原题.md) → [作业原页图](04_作业原页图对照.md) → [作业解答](02_逐课作业解答.md) → [图表与复现](03_图表与复现说明.md)。

当前收纳 300 个知识条目。主线采用 2026 年第 01—08 次课、2025 年第 09—14 次课，保留去年前八课的知识补充。作业统计为 12 组常规作业加第 14 次课选做练习；第 13 次课另含 MNIST 选做。统计依据是课件题页，实际提交次数和考试范围以教师通知为准。[覆盖说明](系统学习笔记/07_资料覆盖核对.md)和[来源记录](资料来源.md)可用于回查。

## 仓库目录

| 内容 | 位置 |
|---|---|
| 学习顺序、知识点清单 | `00_学习大纲.md`、`全课程知识点清单.md` |
| 六章笔记、统一符号、覆盖与版本索引 | `系统学习笔记/` |
| 逐课原题、答案、复现说明 | `01_` 至 `04_` 开头的 Markdown |
| 交互式学习脉络树 | `05_学习脉络树.html` |
| 作业原页图（39 页） | `source_pages/` |
| Python 参考实现 | `course_work.py`、`mnist_optional.py` |
| 运行所需数据及来源哈希 | `data/` |
| 已生成图表、数值、CSV | `results/` |
| Python 依赖 | `requirements.txt`、`requirements-optional.txt` |
| 网站配置、生成与检查脚本 | `.vitepress/`、`scripts/` |
| GitHub Pages 自动发布 | `.github/workflows/deploy-pages.yml` |

本目录本身就是仓库根目录。完整 PPT、PDF、参考书保留在外层目录，不进入 Git；下载本仓库可以阅读笔记、查看原题并运行常规作业。

## 运行作业

需要 Python 3.11 或以上版本：

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python course_work.py
```

Windows 激活命令为 `.venv\Scripts\activate`。数据路径相对于脚本所在目录，因此可从其他工作目录运行。输出写入 `results/`。

- 默认模式：快速预览，使用较少的 Monte Carlo 外层重复；会覆盖现有结果和完整临界值 CSV。
- 完整复现：`python course_work.py --full-mc`，第 06 课每个样本量采用 200 个外层重复。
- 仅刷新第 06—07 课的新题：`python course_work.py --refresh-2026`，保留其他课次结果及完整临界值 CSV。
- MNIST 选做：`python -m pip install -r requirements-optional.txt`，然后 `python mnist_optional.py --epochs 3`。第一次联网下载数据到 `mnist_data/`；这个缓存不提交。当前未收录训练成绩。

常规数据已随仓库保存；MNIST 采用 torchvision 官方数据加载器下载，不把大体积训练数据放入 Git。[数据说明](data/README.md)列出使用位置与预处理约定。

## 本地预览网站

需要 Node.js 22 或以上，推荐与发布流程一致使用 Node.js 24。

```bash
npm ci
npm run docs:dev
```

以终端显示的地址为准。发布前检查：

```bash
npm run docs:build
npm run docs:preview
```

站点使用 VitePress。直接编辑本仓库的 Markdown 即可，网站临时内容由 `scripts/prepare-site.mjs` 生成到 `.site/`，不要编辑该生成目录。开发期间改完原文后重新执行 `npm run docs:dev`；构建始终重新生成。公式保留 `$...$` 和 `$$...$$`，网站用 MathJax 渲染。页面内容、导航、搜索索引都来自同一份 Markdown。

## GitHub Pages

发布源为 **GitHub Actions**，工作流会在推送到 `main` 后构建并部署。项目路径固定为 `/UCAS-measurement-data-processing/`。如自行创建仓库，请在 Settings → Pages → Build and deployment → Source 选择 GitHub Actions。

## 后续课件更新

把新版课件放进外层同级 `26PPT/`，按[课件更新流程](维护与更新.md)核对知识和题目，再提交本仓库。原始课件不需要移动到仓库中。`scripts/check_sources.py` 可检测新增、修改或缺失的课件，但不会自行判断知识点和答案是否变化。

## 材料说明

本仓库是依据课程材料整理的学习辅助资料，包含解释补充和代码参考解，均不代表教师正式答案。课程原页与数据保留用于学习及来源核对；未擅自为课程原材料声明开源许可证。

## 可视化教材 V1.0

六章保留原知识体系；静态图展示概率、投影、频谱、误差传播、高维与梯度关系，交互只保留相关系数、Markov时间和Kalman固定阶段。全部32候选的实施/替代/不新增理由与来源核查见 [建设记录](planning/visualization-v1.md)，后续按 [设计规范](planning/visualization-design-guidelines.md)维护。

```bash
npm run figures:generate          # 从模型重建静态SVG
npm run test:visualizations       # 数学、真实SVG、Python模型约定
npm run check:course-integrity    # 原文/标题/公式/清单保留
npm run figures:check             # 不写文件的一致性检查
npm run docs:build               # 只构建一次并检查链接/公式
npm run check:visualization-pages # 实际SSR与无JS回退
```

`test:visualizations`还需要Python 3（不需安装科学计算依赖）；完整作业/旧PNG再生成才使用requirements。修改科学图须改生成脚本，不直接改SVG、`.site/`或构建输出。Pages在所有门禁成功后发布main；PR仅验证。`release.json`提供实际构建提交用于线上核验。
