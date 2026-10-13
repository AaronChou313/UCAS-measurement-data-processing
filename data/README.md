# 作业数据说明

本目录保存课程附件中实际被脚本使用的数据，以及已转录的短数据表。复制时保留原始字节；[manifest.json](manifest.json)记录本地来源、大小及 SHA-256。来源路径是整理前外层课程资料目录中的位置。

| 文件 | 对应作业 / 用途 | 读取约定 |
|---|---|---|
| [iris.dat](iris.dat) | 第 03 课描述统计、KDE；第 14 课 PCA | 跳过首行，只读取前面连续的 5 列鸢尾花记录，前四列为数值；尾部另附表不参与 |
| [Ithaca_precipitation1933-1982.dat](Ithaca_precipitation1933-1982.dat) | 第 03 课降雨分布、Gamma、幂变换 | 跳过表头，取第 2 列降雨；单位英寸 |
| [darwin.slp-1000hPa.dat](darwin.slp-1000hPa.dat)、[tahiti.slp-1000hpa.dat](tahiti.slp-1000hpa.dat) | 第 03 课 SOI | 首列年份，余列月份；先检查年份对齐，再按课件程序的全局标准化约定处理 |
| [bjfs.rm.leap.dat](bjfs.rm.leap.dat) | 第 04 课多项式和周年项拟合 | 跳过表头，读取第 1、5 列；过滤非有限值；时标假设见答案 |
| [pacific_sst_test_data.txt](pacific_sst_test_data.txt) | 第 11 课 EOF/PCA/ICA | 跳过表头；经度、纬度、MJD、海温；`-1e+10` 是缺测标记 |
| [temperature.dat](temperature.dat)、[L12_temperature10.txt](L12_temperature10.txt) | 第 12 课温度 Kalman 题的数据对照 | 脚本使用与题目相同的内嵌 10 个数；文件用于核对 |
| [L02_normal20.txt](L02_normal20.txt)、[L02_uniform5.txt](L02_uniform5.txt) | 第 02 课矩估计的短数据表 | 与原题及脚本内嵌数据对照 |
| [L03_Ithaca_precipitation1933-1982.txt](L03_Ithaca_precipitation1933-1982.txt) | 第 03 课题页降雨表转录 | 便于人工检查；运行采用上面的 `.dat` 原附件 |

其他题目的模拟数据由固定种子生成，结果保存于 `results/summary.json`。常规程序不需要外层 `3-datas/`、`5-notes/` 或 PPT 目录。

MNIST 选做数据首次运行 `mnist_optional.py` 时联网下载到 `mnist_data/`，该缓存不提交。没有运行的实验不填写成绩。
