import numpy as np
import matplotlib.pyplot as plt
from scipy.optimize import least_squares
from matplotlib.font_manager import FontProperties

# #指定中文字体
# plt.rcParams["font.family"]=["SimHei",  "sans-serif"]


# --- 1. Generate simulated data ---
A_true = 1.5
phi_true_deg = 30
phi_true_rad = np.deg2rad(phi_true_deg)
T = 1.0
omega = 2 * np.pi / T
t = np.linspace(0, 2*T, 100)
y_theoretical = A_true * np.sin(omega * t - phi_true_rad)
np.random.seed(0)
noise_std = 0.2
y_observed = y_theoretical + np.random.normal(0, noise_std, t.shape)

# --- 2. using optimize functions from least_squares 
def residual(params, t, y):
    A, T, phi =params
    return y-A*np.sin(2 * np.pi / T *t-phi)

x0 = [1.0, 1.05, 0.0] # initial values
res = least_squares(residual, x0, args=(t, y_observed))
A_est, T_est, phi_est = res.x

print(f"真实参数:A={A_true:.3f},T={T:.3f}, ф={np.rad2deg(phi_true_rad):.2f}°")
print(f"估计结果:A={A_est:.3f},T={T_est:.3f}, ф={np.rad2deg(phi_est):.2f}°")
y_fitted =A_est * np.sin(2 * np.pi / T_est *t-phi_est)

plt.figure(figsize=(10, 6))
plt.scatter(t, y_observed, label='observation data (with noise)', color='red', s=20, alpha=0.7)
plt.plot(t, y_theoretical, label='theory curve', color='blue', linewidth=2)
plt.plot(t, y_fitted, label='fitted curve (Non-linear LS)', color='green', linestyle='--', linewidth=2)
plt.title('Non-linear LS estimation')
plt.xlabel('time (t)')
plt.ylabel('Amplitude (y)')
plt.legend()
plt.grid(True)
plt.show()	
