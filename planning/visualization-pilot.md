# 首批可视化试点：V01、V18、V14

日期：2026-10-15。依据 `planning/visualization-audit.md`，按用户指定顺序实施。本文保留首次本地试点验收记录；当时尚未推送或部署。用户确认后的发布状态以 Git 提交及 GitHub Pages 部署记录为准。

## 1. 实施结果与阅读入口

| 试点 | 正文位置 / 新增锚点 | 实现与解决的困难 |
|---|---|---|
| V01 | 第一章 1.3.1 基变换数例后 `#v01-basis`；1.3.2 主动/被动说明后 `#v01-rotation`、`#v01-order` | 六幅静态 SVG 分为三组：同一物理向量的标准/斜基分量，固定轴转对象/固定对象转轴，SR/RS 的不同终点。无控件。 |
| V18 | 第五章 5.1.3 前两步数例后 `#v18-markov` | 三阶段“输入当前分布 → 各来源乘积 → 按到达状态求和”；前进、回退、重置，三矩阵预设及初分布选择。保留概率条、离散历史、长期对比表。 |
| V14 静态 | 第四章 4.6.2 方向方差证明后 `#v14-shape` | 已知协方差例：等比例轮廓、外切矩形、主轴及固定 45° 方向；对照坐标标准差、主轴标准差及投影方差。此处不提前把轮廓称为 95% 区域。 |
| V14 最小交互 | 第四章 4.6.3 概率尺度推导与 W06 澄清后 `#v14-probability` | 只开放相关系数。边际标准差、均值和内部概率固定；图形、矩阵、特征值、方向和数值表同步。对照内侧标准轮廓与外侧 95% 轮廓。 |

三个试点都在图前给出观察问题，图后解释数学规律，新增内容标作解释补充。没有增加教师考点声明。原有章节标题、锚点和正文保留；逐行对照 HEAD，三章原有非空行均按原顺序保留。本轮未改变覆盖索引、作业代码、数据、构建配置或依赖。

## 2. 数学模型与边界

### V01：先判断对象与基各自是否改变

- 标准表示 $\mathbf v=(3,1)^{\mathsf T}$，斜基 $B=\begin{pmatrix}1&1\\0&1\end{pmatrix}$。新坐标为 $(2,1)^{\mathsf T}$，由 $B\mathbf c=\mathbf v$ 重构。斜基不正交，不能把逆矩阵换成转置。
- 主动旋转 $R(\pi/2)\mathbf v=(-1,3)^{\mathsf T}$；被动将轴转 $90^\circ$，物理向量不动，新坐标 $R(-\pi/2)\mathbf v=(1,-3)^{\mathsf T}$。
- $S=\operatorname{diag}(2,1)$、输入 $(1,0)^{\mathsf T}$：$SR$ 得 $(0,1)^{\mathsf T}$，$RS$ 得 $(0,2)^{\mathsf T}$。图明确从右侧矩阵开始运算。
- 各面板保持相同比例与参考范围；不同线型标对象、构造与参考。没有同时移动对象和坐标轴。

### V18：过程是精确概率递推，不是居民模拟

- 采用正文列概率约定，$P_{ij}$ 的列是出发、行是到达，各列和为 $1$。来源贡献是 $P_{ij}p_{k,j}$，条形段长编码该乘积，而不是转移概率本身。
- 默认城市模型由 $(0.8,0.2)^{\mathsf T}$ 得到 $(0.766,0.234)^{\mathsf T}$ 和 $(0.73472,0.26528)^{\mathsf T}$。
- 城市平稳分布为 $(0.375,0.625)^{\mathsf T}$；交替链虽有唯一平稳分布，其他初值会交替；单位矩阵每个分布都平稳，但没有所有初值共同趋向的唯一平稳分布。交替链从 $(0.5,0.5)^{\mathsf T}$ 开始的特殊情形单独说明。
- 历史只画离散递推点，纵轴始终为 $[0,1]$，不作连续插值。较长时刻表可直接查看 $k=0,1,20,60$，不必手动点击到 60。
- 有限步表和图都不构成极限定理的证明；长期趋近不表示居民停止迁移。时刻上限为 $60$，不允许继续到 61。

### V14：W06 已处理，仅使用已知总体参数

已知模型为 $\mathbf X\sim N(\mathbf0,C(\rho))$，两坐标单位均为米，

$$
C(\rho)=\begin{pmatrix}4&2\rho\\2\rho&1\end{pmatrix}\,\mathrm m^2,
\qquad -0.95\le\rho\le0.95.
$$

均值和总体协方差是给定量。没有随机抽样，也没有用样本估计参数。

| 对象 | 含义及本图处理 |
|---|---|
| 坐标标准差 | $\sigma_x=2\,\mathrm m$、$\sigma_y=1\,\mathrm m$，始终固定。 |
| 主轴标准差 | $\sqrt{\lambda_1}$、$\sqrt{\lambda_2}$，单位米；由 $|\rho|$ 决定。 |
| 方向投影方差 | 固定单位方向 $\mathbf u=(1,1)^{\mathsf T}/\sqrt2$，$\mathbf u^{\mathsf T}C\mathbf u=(2.5+2\rho)\,\mathrm m^2$；开方才是标准差。图中棕箭头只标方向，长度不编码方差。 |
| 概率椭圆半轴 | 固定 $q=0.95$，$s=-2\log(1-q)\approx5.991464547$；半轴为 $\sqrt{s\lambda_j}$，不是 $s\sqrt{\lambda_j}$。 |
| 投影半宽 | $\sqrt{s}\sqrt{\mathbf u^{\mathsf T}C\mathbf u}$。坐标外切矩形半宽为 $\sqrt{s}\sigma_x$、$\sqrt{s}\sigma_y$，约 $4.895\,\mathrm m$、$2.448\,\mathrm m$。 |
| 射线半径 | $\sqrt{s/(\mathbf u^{\mathsf T}C^{-1}\mathbf u)}$，通常不是投影半宽。正文增补证明以防误读。 |

默认 $\rho=0.5$ 与正文 4.8 的 $C=\begin{pmatrix}4&1\\1&1\end{pmatrix}$ 对应，特征值 $(5\pm\sqrt{13})/2$，倾角约 $16.845^\circ$，95% 半轴约 $5.077\,\mathrm m$、$2.044\,\mathrm m$。改变相关性不改变边缘标准差，固定概率不代表固定椭圆形状或面积。

**W06 的依赖处理：** 第四章、`02_逐课作业解答.md` 的 L08 及 `03_图表与复现说明.md` 均补充了统计含义。旧 L08 图使用同一批 300 点的样本均值及样本协方差，是代入估计参数的形状图；不能无条件称为精确 95% 总体覆盖、均值置信或未来观测预测区域。没有重算或改写旧作业数据，也没有引入另一套有限样本椭圆组件。

核对依据：独立标准正态平方和的卡方关系及密度见 [NIST 卡方分布](https://www.itl.nist.gov/div898/handbook/eda/section3/eda3666.htm)；未知总体均值的 Hotelling 推断与置信椭圆见 [Penn State STAT 505 第七课](https://online.stat.psu.edu/stat505/Lesson07)。本试点不把后者公式用于已知参数模型。

范围限制：没有加入方向滑块、概率滑块、圆形/奇异分布预设、点云模拟或 3D。$|\rho|=1$ 时退化，组件拒绝求逆；固定的两个不同边缘方差使本模型不会出现特征值重合的圆形。概率属于整个内部，边界本身概率为零。

## 3. 工程与可访问性

- 新增文件集中在 `.vitepress/theme/visualizations/`。V01 SVG 有确定性生成脚本，V18/V14 用 Vue 与内联 SVG；没有新依赖，没有通用组件框架。
- SVG 的对象、轴、构造、主方向有线型、文字与数值辅助，不只靠颜色。使用站点颜色变量；深色模式另设描边与文字色，SVG 不依赖操作系统模式。
- V01 小屏由左右排列改为上下排列。交互控件可换行；大表只在表内横向滚动，不撑宽整页。SVG 保持等比例，图中文字随容器缩放。
- 原生按钮、下拉框和滑块支持键盘，有可见焦点；滑块步长 0.05，支持 Home/End/方向键，重置按钮始终可用。计算阶段通过礼貌播报区提示；相关系数在提交调整时播报简短结果。
- V18/V14 的控件在挂载后出现。服务端 HTML 已包含 SVG、默认数值表及解释；V18 无 JavaScript 时静态完整计算默认展开。静态回退不依赖截图或运行时 MathJax。
- Markdown 公式继续由现有 MathJax 生成。组件动态量用可读文本和上下标展示，未向运行时直接注入美元符号 LaTeX。

## 4. 可重复验证

```sh
npm run test:visualizations
npm run figures:check
npm run docs:build
npm run check:visualization-pages
git diff --check
```

- **数学测试：12 项通过。** V01 检查基重构、49 个旋转角的长度与逆变换、SR/RS；V18 检查全部 3 模型 × 5 初值 × 61 时刻的概率守恒和独立闭式、具体来源贡献与反例；V14 检查全部 39 档相关系数的正定/特征方程及两条轮廓共 14,118 个边界点、各方向解析极值与投影宽度、镜像、平方根尺度、无效输入。用梯形积分独立核对三种卡方累计概率，容差 $10^{-8}$，不以抽样模拟冒充证明。
- `figures:check` 逐字节核对六幅 SVG 与生成器输出一致。
- 生产构建通过；站点检查覆盖 **21 个 HTML、1,784 个本地链接/资源、3,190 个 MathJax 公式**，无数学渲染错误。
- SSR 专项检查默认六幅坐标 SVG、两幅椭圆 SVG、V14 默认数值及 Markov 展开的静态回退都存在；未挂载时没有不可用的交互控件。
- 独立只读复查重跑了数学测试并审阅数学条件、差异与 SSR，没有发现阻塞问题。其指出的“无 JS 仍提示点击下一步”已修正；终止时刻也给出回退/重置提示。
- 前端静态检测运行一次，所检组件与样式返回空问题列表。它只作辅助，不代替数学与真实页面检查。

构建仍提示个别压缩块超过 500 kB；本轮没有为此修改打包策略。教学效果尚未进行真实初学者试学，不能把单元测试、构建或作者自查当作学习效果实验证据。

## 5. 页面检查与截图

本地生产预览（当前进程保留在端口 4180）：

- [V01 两套坐标](http://localhost:4180/UCAS-measurement-data-processing/notes/chapter-1.html#v01-basis)、[主动／被动](http://localhost:4180/UCAS-measurement-data-processing/notes/chapter-1.html#v01-rotation)、[SR／RS](http://localhost:4180/UCAS-measurement-data-processing/notes/chapter-1.html#v01-order)。
- [V18 分步递推](http://localhost:4180/UCAS-measurement-data-processing/notes/chapter-5.html#v18-markov)。
- [V14 静态形状](http://localhost:4180/UCAS-measurement-data-processing/notes/chapter-4.html#v14-shape)、[相关系数与概率椭圆](http://localhost:4180/UCAS-measurement-data-processing/notes/chapter-4.html#v14-probability)。

关闭预览进程后可在仓库运行 `npm run docs:preview -- --host 127.0.0.1 --port 4180`。这些链接记录本地预览。上线后可使用正式站点的相同页面路径与锚点：[V01](https://aaronchou313.github.io/UCAS-measurement-data-processing/notes/chapter-1.html#v01-basis)、[V18](https://aaronchou313.github.io/UCAS-measurement-data-processing/notes/chapter-5.html#v18-markov)、[V14](https://aaronchou313.github.io/UCAS-measurement-data-processing/notes/chapter-4.html#v14-shape)。

**实际页面检查：** 桌面设置为 1440×1000，手机设置为 390×844；浏览器截图可见区域分别为 1425×990、375×812（浏览器保留了滚动条等区域）。三页的页面滚动宽度均未超过视口宽度。V01 小屏纵向排列，SVG 标注未超出视图边界；将分量标签移到刻度下方后再次检查。V18 验证了阶段乘积、求和、回退、重置、键盘空格推进、交替链与其平稳初值、单位矩阵；历史图标签为手机单独放大。V14 验证了 Home/End 的 ±0.95、零相关、负相关与重置，矩阵／数值／图同步。手机数值表实际宽 327 px、内容宽 532 px，键盘右键可滚动表内内容，有可见焦点，未撑宽页面。三项均检查了深色显示。最终生产预览控制台未见警告或错误；MathJax 检查未见错误元素。

没有借助浏览器关闭 JavaScript 的模拟设置；无 JS 结论来自实际服务端 HTML 的专项检查，回退的 SVG、表格、叙述和展开属性均存在于构建产物。没有进行屏幕阅读器人工听读或真实学生学习实验。

| 画面 | 桌面截图 | 手机截图 |
|---|---|---|
| 两套坐标 | [标准基与斜基](visualization-pilot/screenshots/v01-basis-desktop.jpg) | 旋转对照同样采用单列排列 |
| 主动与被动旋转 | [两幅并列](visualization-pilot/screenshots/v01-rotation-desktop.jpg) | [深色纵向对照](visualization-pilot/screenshots/v01-rotation-dark-mobile.jpg) |
| Markov 输入与求和 | [矩阵、来源贡献及结果](visualization-pilot/screenshots/v18-sum-desktop.jpg) | [输入](visualization-pilot/screenshots/v18-input-dark-mobile.jpg)、[逐项求和](visualization-pilot/screenshots/v18-sum-dark-mobile.jpg) |
| Markov 不收敛 | 生产页切换交替模型即可复核 | [交替点、平稳参照与结论](visualization-pilot/screenshots/v18-alternating-dark-mobile.jpg) |
| 协方差静态读图 | [主轴与外切矩形](visualization-pilot/screenshots/v14-shape-desktop.jpg) | [静态图](visualization-pilot/screenshots/v14-shape-mobile.jpg) |
| 概率尺度及相关性 | [浅色默认](visualization-pilot/screenshots/v14-probability-desktop.jpg)、[深色默认](visualization-pilot/screenshots/v14-probability-dark-desktop.jpg) | [浅色默认](visualization-pilot/screenshots/v14-probability-mobile.jpg)、[深色负相关](visualization-pilot/screenshots/v14-probability-dark-mobile.jpg)、[表格焦点与滚动](visualization-pilot/screenshots/v14-table-mobile.jpg) |

![V01 两套坐标的实际页面](visualization-pilot/screenshots/v01-basis-desktop.jpg)

![V18 默认模型的来源乘积和求和](visualization-pilot/screenshots/v18-sum-desktop.jpg)

![V14 已知二维正态的概率椭圆](visualization-pilot/screenshots/v14-probability-desktop.jpg)

## 6. 请人工验收的教学问题

1. **V01：** 不看公式时，能否指出两幅图中哪个对象保持不变，并解释被动旋转为什么使用相反角度？斜基分量构造是否仍需更明显的标注？
2. **V18：** 能否从四个来源乘积独立求出下一分布，解释“有迁入却可能下降”，再用交替链说明“唯一平稳”不等于“从任意初值收敛”？分步粒度和长时刻表的入口是否自然？
3. **V14：** 能否在调节前预测负相关的方向变化，调节后解释为什么坐标标准差不变而主轴变化？能否区分投影标准差、主轴标准差、95% 半轴与投影半宽？如果静态图已足以完成这些任务，是否愿意保留交互，需由试学反馈判断。
4. 手机上的 SVG 标签、图例和表格是否舒适可读，分步展开是否过长？目前未做屏幕阅读器端到端人工听读，建议人工验收时补查。

本批已交付人工验收；后续是否调整或扩大范围以用户反馈为准。本轮没有提前制作其他候选项。
