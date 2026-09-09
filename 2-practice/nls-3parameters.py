import numpy as np
import matplotlib.pyplot as plt
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

# --- 2. Nonlinear least squares iteration ---
# define model function
def model_func(t, A, T0, phi):
    return A * np.sin( 2 * np.pi / T0 * t - phi)  #note, here phi is in rad unit

# define Jacobian matrix
def jacobian(t, A, T0, phi):
    J = np.vstack([
        np.sin(2 * np.pi / T0 * t - phi),
        -2 * np.pi * A /T0 /T0 * np.cos(2 * np.pi / T0 * t - phi),
        -A * np.cos(2 * np.pi / T0 * t - phi)
    ]).T
    return J

# initial values
A_est = 1.0  # initial amplitude guess
T_est = 0.86  #initial period
phi_est = 0.0 # initial phase, unit in rad

max_iter = 100
tolerance = 1e-3

print(f"initial values: A = {A_est:.4f}, T= {T_est:.4f}, φ = {np.rad2deg(phi_est):.4f}°")

for i in range(max_iter):
    # a. calculation prediction value y_pred and residuals r
    y_pred = model_func(t, A_est, T_est, phi_est)
    r = y_observed - y_pred
    
    # b. calculate Jacobian matrix
    J = jacobian(t, A_est, T_est, phi_est)
    
    # c. solve parameter's small change/correction (J.T @ J) * delta_a = J.T @ r
    # using np.linalg.solve is more powerful than to solve inverse of matrix
    try:
        delta_a = np.linalg.solve(J.T @ J, J.T @ r)
    except np.linalg.LinAlgError:
        print("iteration num. :", i, "The matrix is singular and cannot be solved.")
        break
        
    # d. update parameters 
    A_est_new = A_est + delta_a[0]
    T_est_new = T_est + delta_a[1]
    phi_est_new = phi_est + delta_a[2]
    phi_est_new = np.mod(phi_est_new, 2*np.pi)
        
    # e. check convergence
    if np.linalg.norm(delta_a) < tolerance:
        print(f"after {i+1} iteration, convergence.")
        A_est, T_est, phi_est = A_est_new, T_est_new, phi_est_new
        break
        
    A_est, T_est, phi_est = A_est_new, T_est_new, phi_est_new

print(f"true parameters: A = {A_true:.4f}, T = {T:.4f}, φ = {phi_true_deg:.4f}°")
print(f"est. parameters: A = {A_est:.4f}, T={T_est:.4f}, φ = {np.rad2deg(phi_est):.4f}°")

# --- 3. visual plot ---
y_fitted = model_func(t, A_est, T_est, phi_est)

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
