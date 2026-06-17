---
title: "平衡车理论（三）：MPC 模型预测控制"
slug: balance-car-mpc
description: "掌握模型预测控制（MPC）的核心原理：预测模型、滚动优化、反馈校正，以及在平衡车上的应用实现。"
categories:
    - 项目
    - 学习
tags:
    - 平衡车
    - MPC
    - 控制理论
    - 模型预测控制
    - 最优控制
date: 2026-06-20
math: true
---

## 什么是 MPC？

**模型预测控制（Model Predictive Control, MPC）** 是 20 世纪 70 年代从工业过程控制中发展起来的一种先进控制算法。它的核心思想可以用一句话概括：

**"利用模型预测未来，在约束条件下找到最优控制序列，只执行第一步，然后重复这个过程。"**

MPC 被广泛应用于自动驾驶、机器人、无人机、化工过程等需要处理多变量、多约束的复杂系统。

## MPC 三大核心要素

```
┌─────────────────────────────────────────────────────┐
│                    MPC 三要素                         │
│                                                     │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐        │
│  │ 预测模型  │──→│ 滚动优化  │──→│ 反馈校正  │        │
│  │          │   │          │   │          │        │
│  │预测未来N步│   │最小化代价  │   │只执行第1步│        │
│  │的状态输出 │   │函数       │   │重新测量   │        │
│  └──────────┘   └──────────┘   └──────────┘        │
└─────────────────────────────────────────────────────┘
```

### 1. 预测模型

利用系统的状态空间方程，预测未来 $N_p$ 步的状态：

**离散状态空间方程：**

$$
\mathbf{x}(k+1) = A_d \mathbf{x}(k) + B_d \mathbf{u}(k)
$$

$$
\mathbf{y}(k) = C_d \mathbf{x}(k)
$$

**预测方程推导：**

$$
\begin{aligned}
\mathbf{x}(k+1|k) &= A_d \mathbf{x}(k) + B_d \mathbf{u}(k|k) \\
\mathbf{x}(k+2|k) &= A_d^2 \mathbf{x}(k) + A_d B_d \mathbf{u}(k|k) + B_d \mathbf{u}(k+1|k) \\
&\vdots \\
\mathbf{x}(k+N_p|k) &= A_d^{N_p} \mathbf{x}(k) + \sum_{i=0}^{N_p-1} A_d^{N_p-1-i} B_d \mathbf{u}(k+i|k)
\end{aligned}
$$

写成矩阵形式：

$$
\mathbf{X} = \Phi \mathbf{x}(k) + \Gamma \mathbf{U}
$$

其中 $\mathbf{X} = [\mathbf{x}(k+1|k); \mathbf{x}(k+2|k); \dots; \mathbf{x}(k+N_p|k)]$，

$\mathbf{U} = [\mathbf{u}(k|k); \mathbf{u}(k+1|k); \dots; \mathbf{u}(k+N_c-1|k)]$。

### 2. 滚动优化

定义代价函数（二次型）：

$$
J = \sum_{i=1}^{N_p} \| \mathbf{x}(k+i|k) - \mathbf{x}_{ref} \|_Q^2 + \sum_{i=0}^{N_c-1} \| \mathbf{u}(k+i|k) \|_R^2
$$

其中：

| 符号 | 含义 | 典型值 |
|------|------|--------|
| $N_p$ | 预测时域 | 10 ~ 30 |
| $N_c$ | 控制时域 | 3 ~ 10 |
| $Q$ | 状态权重矩阵 | 同 LQR |
| $R$ | 控制权重矩阵 | 同 LQR |

### 3. 反馈校正

只执行优化结果中的**第一步**控制量 $\mathbf{u}(k|k)$，下一采样时刻重新测量状态，重复整个优化过程。

```
  时间轴 →
  k:     [u₀, u₁, u₂, ..., u_{Nc-1}]  ← 优化得到 Nc 步控制序列
         ↓ 只执行 u₀
  k+1:       [u₀, u₁, u₂, ..., u_{Nc-1}]  ← 重新优化
             ↓ 只执行 u₀
  k+2:           [u₀, u₁, u₂, ..., u_{Nc-1}]  ← 再重新优化
                 ↓
```

这就是"滚动"的含义。

## MPC 的数学推导

### 二次规划（QP）形式

将代价函数展开为标准二次规划形式：

$$
\min_{\mathbf{U}} \quad \frac{1}{2} \mathbf{U}^T H \mathbf{U} + \mathbf{f}^T \mathbf{U}
$$

$$
\text{s.t.} \quad \mathbf{U}_{min} \leq \mathbf{U} \leq \mathbf{U}_{max}
$$

其中：

$$
H = 2(\Gamma^T Q \Gamma + R)
$$

$$
\mathbf{f} = 2\Gamma^T Q (\Phi \mathbf{x}(k) - \mathbf{X}_{ref})
$$

求解这个 QP 问题即可得到最优控制序列 $\mathbf{U}^*$。

### 约束处理（MPC 的杀手锏）

MPC 最大的优势就是能够**显式处理约束**：

```matlab
% 约束条件
lb = -PWM_max * ones(Nc, 1);   % 控制量下界
ub =  PWM_max * ones(Nc, 1);   % 控制量上界

% 状态约束
% theta_min <= theta <= theta_max  (倾角约束)
```

这在 PID 和 LQR 中是无法直接实现的。

## 平衡车中的 MPC 实现

### 1. 离散化连续模型

```matlab
% 连续系统离散化
Ts = 0.01;  % 采样周期 10ms
sys_c = ss(A, B, C, D);
sys_d = c2d(sys_c, Ts);
[A_d, B_d, C_d, D_d] = ssdata(sys_d);
```

### 2. 构建预测矩阵

```matlab
function [Phi, Gamma] = build_prediction_matrices(A, B, Np, Nc)
    n = size(A, 1);  % 状态维度
    m = size(B, 2);  % 控制维度
    
    Phi = zeros(n*Np, n);
    Gamma = zeros(n*Np, m*Nc);
    
    for i = 1:Np
        Phi((i-1)*n+1:i*n, :) = A^i;
        for j = 1:min(i, Nc)
            Gamma((i-1)*n+1:i*n, (j-1)*m+1:j*m) = A^(i-j) * B;
        end
    end
end
```

### 3. 构建 QP 问题

```matlab
function [H, f] = build_qp(Phi, Gamma, Q, R, x0, x_ref, Np, Nc)
    Q_bar = kron(eye(Np), Q);   % 扩展 Q 矩阵
    R_bar = kron(eye(Nc), R);   % 扩展 R 矩阵
    
    H = Gamma' * Q_bar * Gamma + R_bar;
    f = Gamma' * Q_bar * (Phi * x0 - x_ref);
end
```

### 4. 求解 QP（使用 quadprog）

```matlab
function u = mpc_controller(x0, A, B, Q, R, Np, Nc, umin, umax)
    [Phi, Gamma] = build_prediction_matrices(A, B, Np, Nc);
    [H, f] = build_qp(Phi, Gamma, Q, R, x0, zeros(size(x0)), Np, Nc);
    
    % 求解二次规划
    options = optimoptions('quadprog', 'Display', 'off');
    U = quadprog(H, f, [], [], [], [], ...
                 umin*ones(Nc,1), umax*ones(Nc,1), [], options);
    
    u = U(1);  % 只取第一步
end
```

## 三种算法终极对比

```
┌──────────────────────────────────────────────────────────┐
│                      控制算法谱系                           │
│                                                          │
│  PID ──────────→ LQR ──────────→ MPC                     │
│  经典控制          现代控制          先进控制                 │
│                                                          │
│  无模型            需要模型          需要模型                 │
│  单变量            多变量            多变量                  │
│  无约束            无约束            ✅ 支持约束              │
│  手动调参          数学优化          数学优化                │
│  简单可靠          理论优雅          功能强大                │
│  实时性 ⭐⭐⭐      实时性 ⭐⭐⭐      实时性 ⭐⭐             │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 如何选择？

| 场景 | 推荐算法 |
|------|----------|
| 快速原型验证、简单系统 | **PID** |
| 多变量系统、需要最优性能 | **LQR** |
| 有约束、需要预测能力 | **MPC** |
| 低成本 MCU（如 STM32F103） | PID 或预计算 LQR |
| 高性能 MCU（如 STM32F407+） | 可尝试简化 MPC |

## MPC 在嵌入式上的挑战

1. **计算量**：QP 求解需要矩阵运算，在 MCU 上需要优化
2. **实时性**：每个控制周期（10ms）内必须完成 QP 求解
3. **解决方案**：
   - 使用**显式 MPC**（离线预计算分段仿射控制律）
   - 使用轻量级 QP 求解器（如 qpOASES、OSQP）
   - 减少预测时域 $N_p$ 和控制时域 $N_c$

## 小结

MPC 是三种算法中最强大也最复杂的。它继承了 LQR 的最优性，同时增加了**预测能力**和**约束处理**。对于平衡车这样的欠驱动非线性系统，MPC 在多目标控制（平衡 + 移动 + 避障）场景下具有天然优势。

> 从 PID 到 LQR 再到 MPC，是从"感觉"到"理论"再到"智能"的进化。

> 参考文献: 模型预测控制(MPC)原理应用与实践 - CSDN博客