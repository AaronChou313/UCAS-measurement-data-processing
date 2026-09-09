import numpy as np
import matplotlib.pyplot as plt
from scipy.optimize import curve_fit
import pandas as pd
import matplotlib
matplotlib.rcParams['font.sans-serif'] = ['SimHei']
matplotlib.rcParams['axes.unicode_minus'] = False
file_path = r"E:\course\0国科大授课\0测量数据处理理论与方法\实例数据和程序\bjfs.rm.leap.dat" # 读取数据文件
data = pd.read_csv(file_path, sep=r'\s+', header=0, encoding='gbk') #直接读取数据，第一行作为表头，
# 直接提取数据（pandas 已自动推断为数值类型）
t = data.iloc[:, 0].values # 第1 列：years（年）
t = t - t[0]
y_obs = data.iloc[:, 4].values # 第5 列：gps_rm_leap_3sigma（垂直形变，mm）
# 定义拟合函数：二次多项式+ 周期项
def model_func(t, a0, a1, a2, A1, phi1):
    T1 = 1.0 # 周年周期
    periodic_term = A1 * np.cos(2 * np.pi * t / T1 - phi1)
    polynomial_term = a0 + a1 * t + a2 * t**2
    return polynomial_term + periodic_term
# 初始参数猜测
initial_guess = [y_obs.mean(), 0, 0, (y_obs.max()-y_obs.min())/4, 0]
lower = [-np.inf,-np.inf,-np.inf, 5.0, -2*np.pi] # 
upper = [np.inf, np.inf, np.inf, 20.0, 2*np.pi]

# 进行曲线拟合
popt, pcov = curve_fit(model_func, t, y_obs, p0=initial_guess,maxfev=10000,bounds=(lower,upper))
# 计算参数误差
perr = np.sqrt(np.diag(pcov))
# 提取拟合参数
a0, a1, a2, A1, phi1 = popt
a0_err, a1_err, a2_err, A1_err, phi1_err = perr
# 计算拟合值和残差
y_fit = model_func(t, *popt)
residuals = y_obs - y_fit
rmse = np.sqrt(np.mean(residuals**2))
# 输出结果
print(f"多项式系数:")
print(f" a0 (常数项): {a0:.4f} ± {a0_err:.4f} mm")
print(f" a1 (一次项): {a1:.4f} ± {a1_err:.4f} mm/年")
print(f" a2 (二次项): {a2:.4f} ± {a2_err:.4f} mm/年²")
print(f"周年周期项参数:")
print(f" 振幅A1: {A1:.4f} ± {A1_err:.4f} mm")
print(f" 相位φ1: {phi1:.4f} ± {phi1_err:.4f} rad")
phase_shift_years = phi1 / (2 * np.pi)
print(f" 相位对应的时间偏移: {phase_shift_years:.4f} 年")
print(f"拟合优度:")
print(f" RMSE (均方根误差): {rmse:.4f} mm")
# 绘制结果图形
plt.figure(figsize=(12, 10))
# 1. 原始数据和拟合曲线
plt.subplot(3, 1, 1)
plt.plot(t, y_obs, 'b.', markersize=1, alpha=0.6, label='观测数据')
plt.plot(t, y_fit, 'r-', linewidth=1, label='拟合曲线')
plt.ylabel('垂直形变(mm)')
plt.title('BJFS 台站GNSS 垂直形变时间序列拟合')
plt.legend()
plt.grid(True, alpha=0.3)
# 2. 残差图
plt.subplot(3, 1, 2)
plt.plot(t, residuals, 'g.', markersize=1, alpha=0.6)
plt.axhline(y=0, color='r', linestyle='-', alpha=0.5)
plt.ylabel('残差(mm)')
plt.title('拟合残差')
plt.grid(True, alpha=0.3)
# 3. 各分量分解
plt.subplot(3, 1, 3)
polynomial_component = a0 + a1*t + a2*t**2
periodic_component = A1 * np.cos(2*np.pi*t - phi1)
plt.plot(t, y_obs, 'b.', markersize=1, alpha=0.3, label='观测数据')
plt.plot(t, polynomial_component, 'g-', linewidth=1.5, label='多项式趋势')
plt.plot(t, polynomial_component + periodic_component, 'r-',linewidth=1, label='趋势+周期')
plt.xlabel('时间(年)')
plt.ylabel('形变(mm)')
plt.title('趋势项和周期项分解')
plt.legend()
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.show()