# 第三章 回归分析、相关分析与 Fourier

来源：2026 第 05—06 次课，以及第 07 次课第 3—24 页续讲的卷积与相干。LS 基础见[第二章](02_第二章_参数估计与最小二乘.md)。

- [3.1 一元回归与 BLUE](#c3-s1)
- [3.2 平方和、检验与区间](#c3-s2)
- [3.3 LOC、LNS 与多元回归](#c3-s3)
- [3.4 相关与秩相关](#c3-s4)
- [3.5 自由度和 Monte Carlo](#c3-s5)
- [3.6 Fourier 级数与变换](#c3-s6)
- [3.7 DFT、FFT、采样与窗](#c3-s7)
- [3.8 卷积、互谱与相干](#c3-s8)
- [3.9 练习与复习](#c3-s9)

<a id="c3-s1"></a>
## 3.1 一元回归与 Gauss–Markov 定理

### 3.1.1 模型假设各负责什么

回归模型 $y_i=\beta_0+\beta_1x_i+\varepsilon_i$，解释变量 $x$ 给定，响应 $y$ 随误差变化。假定 $E(\boldsymbol\varepsilon\mid X)=0$ 可保证 OLS 无偏；$C_\varepsilon=\sigma^2I$ 给出同方差且不相关的协方差；正态误差进一步保证小样本精确 t、F 推断。独立比不相关更强。

OLS 不要求自变量本身服从正态。若 $x$ 的测量误差不可忽略，固定设计假设可能不合理；若时间误差相关，需要 GLS 或适合相关结构的推断。

### 3.1.2 系数性质

由第二章 $\hat\beta_1=S_{xy}/S_{xx}$、$\hat\beta_0=\bar y-\hat\beta_1\bar x$。在上述零均值同方差条件下，

$$
E\hat\beta_0=\beta_0,\quad E\hat\beta_1=\beta_1,
$$

$$
\operatorname{Var}(\hat\beta_1)=\frac{\sigma^2}{S_{xx}},\quad
\operatorname{Var}(\hat\beta_0)=\sigma^2\left(\frac1n+\frac{\bar x^2}{S_{xx}}\right),\quad
\operatorname{Cov}(\hat\beta_0,\hat\beta_1)=-\frac{\sigma^2\bar x}{S_{xx}}.
$$

斜率可写成 $\sum_i(x_i-\bar x)y_i/S_{xx}$，其权平方和为 $1/S_{xx}$，直接得到方差。自变量分布越宽，通常斜率越精确；截距是在 $x=0$ 的响应，零点远离数据中心时精度可能很差。将自变量中心化可减少截距与斜率的协方差。

含截距的 OLS 直线经过 $(\bar x,\bar y)$，残差和为零，残差与自变量正交。拟合值与残差不等于独立同分布原误差，残差协方差为 $\sigma^2(I-H_X)$。

### 3.1.3 BLUE 的简明证明

设 $X$ 满列秩、误差零均值且协方差 $\sigma^2I$。任一线性无偏估计可写为 $A\mathbf y$，要求 $AX=I$。令 $A=A_0+D$，$A_0=(X^{\mathsf T}X)^{-1}X^{\mathsf T}$，则 $DX=0$。因此

$$
\operatorname{Cov}(A\mathbf y)=\sigma^2A_0A_0^{\mathsf T}+\sigma^2DD^{\mathsf T},
$$

交叉项为零，第二项半正定。OLS 在所有**线性无偏**估计中方差最小，称 BLUE；证明不要求正态。它不表示在所有有偏估计或所有损失下最优，也不覆盖错误的误差模型。

<a id="c3-s2"></a>
## 3.2 平方和、统计检验与三种区间

### 3.2.1 SST、SSR、SSE 与 $R^2$

含截距 OLS 定义

$$
\operatorname{SST}=\sum_i(y_i-\bar y)^2,\quad
\operatorname{SSR}=\sum_i(\hat y_i-\bar y)^2,\quad
\operatorname{SSE}=\sum_ie_i^2.
$$

由于拟合的中心化部分与残差正交，$\operatorname{SST}=\operatorname{SSR}+\operatorname{SSE}$。$R^2=1-\operatorname{SSE}/\operatorname{SST}$，$\operatorname{SST}>0$ 时有效。含截距一元 OLS 有 $R^2=r^2$。无截距、加权或样本外的 $R^2$ 定义和性质需单独说明；测试 $R^2$ 可以为负。

残差方差 $s_e^2=\operatorname{SSE}/(n-p)$；一元含截距 $p=2$。参数数目增加通常降低训练 SSE，不能据此判断泛化更好。

### 3.2.2 t 检验、F 检验与 p 值

检验 $H_0:\beta_j=b_j$：

$$
t_j=\frac{\hat\beta_j-b_j}{s_e\sqrt{[(X^{\mathsf T}X)^{-1}]_{jj}}}\sim t_{n-p}\quad(H_0\text{ 下}).
$$

双侧 p 值为 $2P(T\ge|t_j|)$。p 值是在零假设及模型条件下，得到至少如此极端统计量的概率，不是零假设为真的概率。拒绝零斜率不等于效应大，更不等于因果。

整体检验一元斜率为零时

$$
F=\frac{\operatorname{SSR}/1}{\operatorname{SSE}/(n-2)}\sim F_{1,n-2},\qquad F=t_1^2.
$$

多元含截距的整体 $H_0:\beta_1=\cdots=\beta_{p-1}=0$ 用 $F=[\operatorname{SSR}/(p-1)]/[\operatorname{SSE}/(n-p)]$。结论依赖模型和残差条件。

### 3.2.3 参数区间、均值区间、预测区间

参数置信区间：$\hat\beta_j\pm t_{1-\alpha/2,n-p}\operatorname{SE}(\hat\beta_j)$。给定新输入列向量 $\mathbf x_*$（含截距），定义 $h_*=\mathbf x_*^{\mathsf T}(X^{\mathsf T}X)^{-1}\mathbf x_*$、$\hat y_*=\mathbf x_*^{\mathsf T}\hat{\boldsymbol\beta}$。

平均响应置信区间与新观测预测区间分别为

$$
\hat y_*\pm t_{1-\alpha/2,n-p}s_e\sqrt{h_*},\qquad
\hat y_*\pm t_{1-\alpha/2,n-p}s_e\sqrt{1+h_*}.
$$

一元 $h_*=1/n+(x_*-\bar x)^2/S_{xx}$。预测区间额外加入新观测自身的噪声。远离数据中心的区间变宽，外推还可能出现模型误差，公式不自动包括它。逐点区间不等于整条曲线同时覆盖区间。

课件的非参数预测带以残差分位数 $q_{\alpha/2},q_{1-\alpha/2}$ 构造 $[\hat y_*+q_{\alpha/2},\hat y_*+q_{1-\alpha/2}]$，允许不对称。但训练残差比未来误差受拟合约束，异方差、相关和参数不确定性会影响覆盖；它不是无条件精确的预测区间。

### 3.2.4 残差与杠杆

看残差对拟合值、自变量、时间的图。弯曲可能提示非线性遗漏，扇形提示异方差，持续同号或周期提示时间结构。帽子矩阵对角元 $h_{ii}$ 为杠杆，反映自变量位置特殊程度；高杠杆不必有大残差，大残差也不必高杠杆。检查标准化残差可使用 $e_i/[s_e\sqrt{1-h_{ii}}]$，并结合原始观测判断。

<a id="c3-s3"></a>
## 3.3 不同拟合目标、多元回归和变量选择

### 3.3.1 OLS、反向 OLS、LOC 与 LNS

$$
b_{Y\mid X}=r\frac{s_y}{s_x},\quad
b_{X\mid Y}=r\frac{s_x}{s_y},\quad
b_{\rm reverse\ in\ Y}=\frac{s_y}{rs_x}\quad(r\ne0).
$$

两个 OLS 方向通常不同，因为一个惩罚竖直距离，另一个惩罚水平距离。LOC（organic correlation，亦与 reduced major axis 思想联系）取相应斜率几何均值：

$$
b_{\rm LOC}=\operatorname{sign}(r)\frac{s_y}{s_x},\qquad
a_{\rm LOC}=\bar y-b_{\rm LOC}\bar x.
$$

用 OLS 从长记录补短记录，预测散布约为 $|r|s_y$；LOC 目标之一是保留尺度变化，不能因此称它对条件均值预测更优。$r=0$ 时方向不能由符号确定。

LNS 为课件使用的正交距离直线。对同单位、同误差计量的中心化二维数据，令

$$
C=\begin{pmatrix}s_x^2&s_{xy}\\s_{xy}&s_y^2\end{pmatrix}.
$$

最大特征值的单位特征向量给直线方向，最小特征值给法向。斜率可由方向分量比获得；若 $s_{xy}\ne0$，

$$
b_{\rm LNS}=\frac{s_y^2-s_x^2+\sqrt{(s_y^2-s_x^2)^2+4s_{xy}^2}}{2s_{xy}}.
$$

等量纲的正交距离对旋转自然一致，但各轴任意改变单位会改变目标；LOC 对各轴尺度有不同性质。选择依据应是误差在哪些变量、目的和单位，不是哪个图更好看。

### 3.3.2 多元回归、共线性与嵌套比较

模型 $\mathbf y=X\boldsymbol\beta+\boldsymbol\varepsilon$，行是观测，列为截距与特征。满秩和误差条件下，系数无偏、$C_\beta=\sigma^2(X^{\mathsf T}X)^{-1}$，新输入区间用上一节的 $h_*$。系数表示控制其他列后该变量的关系，不必等于单变量斜率。

高度共线性造成小奇异值、系数不稳定、标准误较大，即使训练拟合良好。调整 $R^2$ 为 $1-[\operatorname{SSE}/(n-p)]/[\operatorname{SST}/(n-1)]$。

比较嵌套约简与完整模型，参数个数 $p_R<p_F$：

$$
F_{\rm partial}=\frac{(\operatorname{SSE}_R-\operatorname{SSE}_F)/(p_F-p_R)}
{\operatorname{SSE}_F/(n-p_F)}.
$$

它需要同一数据和正确模型假设，不能对非嵌套模型直接套用。逐步回归按加入／删除变量的准则反复搜索；选择不稳定，选择后普通 p 值未计搜索影响。替代路线包括 Ridge、Lasso、信息准则和交叉验证。AIC $=2p-2\ell_{\max}$、BIC $=p\log n-2\ell_{\max}$（解释补充），比较需有可比似然与数据。

### 3.3.3 Matlab 实践接口（课件实践）

`regress` 用设计矩阵估系数及区间；`polyfit` 为多项式系数；`rstool` 展示响应面；`nlinfit` 需非线性模型和初值；`nlparci` 与 `nlpredci` 分别连接参数与预测区间；`nlintool` 提供交互非线性拟合。理解输入、模型、输出统计含义，比记界面更重要。一次、二次模型比较要同时看残差、区间和独立评价。

<a id="c3-s4"></a>
## 3.4 Pearson、滞后相关和秩相关

### 3.4.1 中心化夹角与散点图

$$
r=\frac{\sum_i(x_i-\bar x)(y_i-\bar y)}
{\sqrt{\sum_i(x_i-\bar x)^2\sum_i(y_i-\bar y)^2}}
=\frac{\mathbf u^{\mathsf T}\mathbf v}{\|\mathbf u\|\|\mathbf v\|}.
$$

$\mathbf u,\mathbf v$ 为中心化数据。若任一变量无变化，相关未定义。$r\in[-1,1]$；零相关只表示无这种线性关联，非线性依赖仍可存在。未经中心化的余弦相似度不是一般 Pearson 相关。

Anscombe 四重奏展示相同摘要统计对应不同曲线、异常点或杠杆结构。每次相关分析都看散点、原序列和数据来源。

### 3.4.2 滞后约定

本笔记定义 $R_{xy}(\tau)=E[\overline{x(t)}y(t+\tau)]$；协方差版本先去均值。离散估计在重叠样本上求和／平均，边界分母和全局或局部标准化需说明。若 $y(t)=x(t-d)$，按此约定峰值在 $\tau=d>0$，表示 $y$ 滞后 $x$。

自相关取 $y=x$。交换输入得到共轭和滞后反号。软件 `xcorr` 的约定可能相反，先用已知延迟的模拟检查，滞后样本数乘 $\Delta t$ 才是时间。去趋势可以避免共趋势主导相关，但改变了研究对象。

### 3.4.3 Pearson 零相关检验

独立二元正态样本在 $H_0:\rho=0$ 下，

$$
t=r\sqrt{\frac{n-2}{1-r^2}}\sim t_{n-2}.
$$

双侧拒绝域 $|t|>t_{1-\alpha/2,n-2}$，相应 $|r|$ 临界值为 $t_c/\sqrt{t_c^2+n-2}$。有时间相关或不符合参考模型时不能只代总长度。检验未拒绝不等于证明 $\rho=0$。

### 3.4.4 Kendall 与 Spearman

Kendall 比较所有 $i<j$：$(x_i-x_j)(y_i-y_j)>0$ 为协调对，$<0$ 为不协调对。无并列时，

$$
\tau_a=\frac{N_c-N_d}{n(n-1)/2},\quad
\operatorname{Var}_0(\tau_a)=\frac{2(2n+5)}{9n(n-1)}.
$$

独立连续样本零关联下，大样本 $\tau_a/\sqrt{\operatorname{Var}_0}\approx N(0,1)$。并列时常用 $\tau_b=(N_c-N_d)/\sqrt{(N_0-T_x)(N_0-T_y)}$，$N_0=n(n-1)/2$，$T_x,T_y$ 分别为对应轴并列对总数；检验方差也需修正，不能照用无并列式。（并列修正为解释补充。）

Spearman 为两组秩的 Pearson 相关；无并列时 $r_s=1-6\sum_i d_i^2/[n(n^2-1)]$。并列取平均秩后直接计算秩相关。秩相关描述单调关系，减弱数值极端值影响，但不涵盖所有非单调依赖。

<a id="c3-s5"></a>
## 3.5 自由度、有效信息和 Monte Carlo

平均固定约束减少一个方向，含截距直线估计两个参数，回归残差自由度为 $n-p$。平滑后输出共享输入，点数即使不变，独立信息仍减少。有效自由度依赖统计目标与处理过程，不能通用地取“数组长度减一”。

对于相关时间序列，一种近似独立信息量（解释补充）为

$$
n_{\rm eff}\approx\frac n{1+2\sum_{k\ge1}\rho_x(k)\rho_y(k)},
$$

但截断、自相关估计和适用条件会影响结果，不能机械把它代入所有检验。

课程采用 Monte Carlo 标定：在零关联假设下生成两条独立序列 → 施加与真实分析一致的去趋势、窗、滤波与裁边 → 算统计量 → 重复 $B$ 次 → 双侧用 $|r|$ 的 $1-\alpha$ 分位数。再外层重复整个标定过程，可估临界值本身的随机波动。区分数据长度 $n$、内层模拟数 $B$ 和外层重复数。

假设只模拟白噪声而实际为有色噪声，得到的阈值不能代表实际零假设。做完平滑再照用 $n-2$ 很容易高估显著性。

<a id="c3-s6"></a>
## 3.6 Fourier 级数与连续变换

### 3.6.1 正交投影求周期系数

周期 $T_0$、基频 $f_0=1/T_0$，实 Fourier 级数写为

$$
x(t)=\frac{a_0}2+\sum_{k\ge1}[a_k\cos(2\pi kf_0t)+b_k\sin(2\pi kf_0t)].
$$

在任一完整周期上

$$
a_k=\frac2{T_0}\int_{T_0}x(t)\cos(2\pi kf_0t)\,dt,\qquad
b_k=\frac2{T_0}\int_{T_0}x(t)\sin(2\pi kf_0t)\,dt.
$$

因为不同基函数内积为零、同一非零谐波平方积分为 $T_0/2$，投影能单独取出一个系数。偶函数只有余弦，奇函数只有正弦。方波 $\operatorname{sign}(\sin\omega_0t)$ 为 $\frac4\pi\sum_{j\ge0}\sin[(2j+1)\omega_0t]/(2j+1)$，只有奇次谐波。

分段光滑条件下，跳点收敛到左右极限平均；截断产生 Gibbs 过冲，随项数增加变窄但过冲比例不趋零。它不是随机噪声。

### 3.6.2 复系数、幅相和热方程

复形式 $x=\sum_{k\in\mathbb Z}c_ke^{i2\pi kf_0t}$，$c_k=T_0^{-1}\int x e^{-i2\pi kf_0t}dt$。实信号 $c_{-k}=\overline{c_k}$，$c_k=(a_k-ib_k)/2$。

统一余弦幅相约定：

$$
a\cos\omega t+b\sin\omega t=A\cos(\omega t-\phi),\quad
A=\sqrt{a^2+b^2},\quad\phi=\operatorname{atan2}(b,a).
$$

对应正频复系数辐角为 $-\phi$。直流是 $a_0/2$，不再作双侧合并。振幅近零时相位不稳定。

课件历史线索中热方程 $\partial_tu=\kappa\partial_x^2u$，空间基 $e^{ikx}$ 将二阶微分变成 $-k^2$；各模态随时间 $e^{-\kappa k^2t}$ 衰减。边界条件决定选用正弦、余弦或其他特征函数。

### 3.6.3 变换约定和 box

$$
X(f)=\int_{-\infty}^{\infty}x(t)e^{-i2\pi ft}\,dt,\qquad
x(t)=\int_{-\infty}^{\infty}X(f)e^{i2\pi ft}\,df.
$$

若改用角频率，正向 $\int x e^{-i\omega t}dt$、逆向需 $1/(2\pi)$。不能混合归一化。

定义 $\operatorname{sinc}(u)=\sin(\pi u)/(\pi u)$、$\operatorname{sinc}(0)=1$。居中单位高度 box，$|t|\le T_b/2$ 内为 $1$，其变换为

$$
X(f)=\int_{-T_b/2}^{T_b/2}e^{-i2\pi ft}\,dt=T_b\operatorname{sinc}(T_bf).
$$

零点 $f=m/T_b$，$m\ne0$；时域越宽，主瓣越窄。平移 $t_0$ 乘 $e^{-i2\pi ft_0}$；幅度乘常数则整个谱乘同样常数。周期矩形脉冲占空比 $d$ 的复级数系数为 $c_k=d\operatorname{sinc}(kd)$（居中单位脉冲约定）。

### 3.6.4 Dirac 脉冲与脉冲列

Dirac 为广义函数，满足 $\int x(t)\delta(t-t_0)dt=x(t_0)$。其 Fourier 关系为

$$
\delta(t)\leftrightarrow1,\quad 1\leftrightarrow\delta(f),\quad
\delta(t-t_0)\leftrightarrow e^{-i2\pi ft_0}.
$$

采样梳 $\sum_{m\in\mathbb Z}\delta(t-mT_s)$ 的变换是 $T_s^{-1}\sum_k\delta(f-k/T_s)$。时域乘梳导致频谱复制，频率间隔为 $f_s=1/T_s$，由此理解混叠。

### 3.6.5 Parseval

能量有限时 $\int|x(t)|^2dt=\int|X(f)|^2df$；角频率形式右侧为 $(2\pi)^{-1}\int|X(\omega)|^2d\omega$。周期平均功率为 $T_0^{-1}\int_{T_0}|x|^2dt=\sum_k|c_k|^2$。有限能量信号与无限时长平稳过程的功率谱定义不同，不能一概把 $|X|^2$ 称作同单位 PSD。

<a id="c3-s7"></a>
## 3.7 DFT、FFT、采样和窗函数

### 3.7.1 离散频率与归一化

长度 $N$，索引 $j=0,\ldots,N-1$，DFT 及逆变换为

$$
\tilde x_k=\sum_{j=0}^{N-1}x_je^{-i2\pi jk/N},\qquad
x_j=\frac1N\sum_{k=0}^{N-1}\tilde x_ke^{i2\pi jk/N}.
$$

离散 Parseval：$\sum_j|x_j|^2=N^{-1}\sum_k|\tilde x_k|^2$。直接计算成本 $O(N^2)$，FFT 是同一 DFT 的快速算法，通常 $O(N\log N)$，不是新物理变换。

$$
f_s=1/\Delta t,\quad f_N=f_s/2,\quad T_{\rm rec}=N\Delta t,\quad\Delta f=f_s/N.
$$

样本首尾跨度是 $(N-1)\Delta t$，DFT 基周期按 $N\Delta t$。正频格点为 $k\Delta f$，后半段按负频解释；偶数 $N$ 的 Nyquist 点单独处理。最短采样可表示周期约为 $2\Delta t$，最长非零格点周期 $N\Delta t$；这不保证都能可靠辨识。

实信号单双侧振幅：非 DC／非 Nyquist 正频取 $2|\tilde x_k|/N$；DC 与偶数 Nyquist 取 $|\tilde x_k|/N$。正确相位与幅度恢复要求频率落格点、记录和窗约定适合；不落点能量会分散。恰在格点的模型 $a\cos\omega_kt+b\sin\omega_kt$ 有 $\tilde x_k=N(a-ib)/2$，所以相应双侧周期图为 $N\Delta t(a^2+b^2)/4$；这给出 2025 课末周期图与正余弦回归系数平方和的联系。其他归一化下常数不同，应先确认周期图定义。

### 3.7.2 PSD 与能量谱

未加窗双侧周期图 PSD 可写为

$$
\hat S_{xx}(f_k)=\frac{\Delta t}{N}|\tilde x_k|^2.
$$

单位为数据单位平方／频率单位。实信号合成单侧时，只对非 DC、非 Nyquist 部分乘 $2$；积分近似 $\sum_kS_{xx}(f_k)\Delta f=n^{-1}\sum_jx_j^2$。振幅乘 $2$ 与功率乘 $2$ 是不同规则，不能先把幅度乘 $2$ 后平方还称它为单侧 PSD。

### 3.7.3 混叠、泄漏和栅栏

采样使频率相差整数倍 $f_s$ 的信号无法区分。理想带限条件下需 $f_s>2f_{\max}$ 以避免边界问题；刚好等于两倍的某些相位会退化，实际还需抗混叠滤波与余量。

有限记录相当于乘窗，频域与窗谱卷积；非整周期信号产生泄漏。栅栏效应表示只在频率格点观察连续形状，峰可能在格点之间。零填充得到更密的显示格点，改善峰形读取，但不增加原记录的独立信息或真正分辨两邻近频率的能力。

### 3.7.4 常见窗和校正

矩形窗 $w_j=1$；对称 Hann $w_j=\frac12[1-\cos(2\pi j/(N-1))]$；正弦／余弦钟形窗可写 $\sin(\pi j/(N-1))$；三角窗线性升降。周期式与对称式端点约定略有不同，报告所用定义。

窗降低旁瓣，常使主瓣变宽。单频幅值校正可用相干增益 $G_c=N^{-1}\sum_jw_j$；窗 PSD 归一化可用 $\hat S=\Delta t|\operatorname{DFT}(wx)|^2/\sum_jw_j^2$。等效噪声带宽 $f_s\sum_jw_j^2/(\sum_jw_j)^2$ 是解释补充，体现振幅校正和噪声功率校正不同。

逆 FFT 恢复的是送入 FFT 的数组，加窗后逆变换恢复加窗序列，不会自动恢复原始边界或自动去噪。

<a id="c3-s8"></a>
## 3.8 卷积、互谱、相位与相干

### 3.8.1 LTI 系统和卷积

线性系统满足叠加，时不变系统对延迟输入产生同样延迟输出。脉冲响应 $h$ 决定

$$
y(t)=(x*h)(t)=\int x(\tau)h(t-\tau)d\tau,\qquad
y_j=\sum_mx_mh_{j-m}.
$$

卷积是反转、移位、乘积、累积；满足交换律。移动平均核 $h_m=1/M$（指定 $M$ 个点内）为低通滤波。秋千例中输出是各时刻激励的响应叠加，不是对输入直接取某个单值比例。

卷积定理 $Y(f)=X(f)H(f)$。长度 $N,M$ 的数组线性卷积长 $N+M-1$；FFT 乘积实现需补零到至少这个长度，否则得到循环卷积。

二维可分离核 $h(u,v)=h_1(u)h_2(v)$，可先沿一轴再沿另一轴卷积；$K\times K$ 核的每像素成本从约 $K^2$ 降到 $2K$。不是所有二维核都可分离，可用低秩近似扩展。

### 3.8.2 互相关和互谱的共轭

按本章约定 $R_{xy}(\tau)=\int\overline{x(t)}y(t+\tau)dt$，Fourier 变换为 $\overline{X(f)}Y(f)$。这是与卷积的关键区别，核共轭反转；实信号可省共轭，但反号约定仍需检查。

相应 $S_{xy}$ 估计用分段／频率平滑平均的 $\overline{X}Y$。若 $y$ 延迟 $d$，相位约为 $-2\pi fd$，展开相位斜率可估时延；相位包装、低相干频段与周期歧义会影响解释。

### 3.8.3 幅值平方相干

$$
\gamma^2(f)=\frac{|S_{xy}(f)|^2}{S_{xx}(f)S_{yy}(f)}\in[0,1].
$$

它衡量特定频率上的线性共同成分。不做任何平均时，单个频点直接由 $X,Y$ 得到的比值通常恒为 $1$，因此必须对自谱和互谱先作恰当平均。不要随意把“平滑谱后求比值”换成“平滑已得到的相干”。

若有 $M$ 个有效独立谱平均，在零相干假设下近似临界值

$$
\gamma_c^2=1-\alpha^{1/(M-1)},\qquad M>1.
$$

这里 $\alpha$ 是显著水平；若课件使用置信水平 $c$，等价为 $1-(1-c)^{1/(M-1)}$。重叠窗或相邻频率不独立时，平均点数未必等于有效 $M$；作业要求以完整处理流程 Monte Carlo 核对。

<a id="c3-s9"></a>
## 3.9 小例题、实践与复习

**频率例。** $N=1000,\Delta t=0.01\,\mathrm s$，$f_s=100\,\mathrm{Hz}$、Nyquist $50\,\mathrm{Hz}$、记录时长 $10\,\mathrm s$、格点间隔 $0.1\,\mathrm{Hz}$。$5\,\mathrm{Hz}$ 正弦落在 $k=50$，相位须按正向 DFT 的负指数解释。加零到 $4000$ 点，显示间隔成为 $0.025\,\mathrm{Hz}$，原始有效时长仍为 $10\,\mathrm s$。

**区间例。** 在 $x_*=\bar x$，一元平均响应标准误为 $s_e/\sqrt n$，新个体预测标准差为 $s_e\sqrt{1+1/n}$。增加样本使前者趋零，后者仍保留观测噪声尺度。

复习时应能：推导系数协方差和 BLUE；分解平方和；区分三种区间；说明 LOC 和正交拟合的目的；按已知延迟验证滞后符号；计算无并列 Kendall；设计相关临界值模拟；推导 Fourier 投影与 box 变换；检查 Parseval、单双侧谱、窗校正、卷积长度及相干平均。

对应第 05—06 次课与第 07 次课前两题；第 06 次课今年包含 box 新题，FFT 题相位按当前原题。详见[作业原题](../01_逐课作业原题.md)与[答案](../02_逐课作业解答.md)。
