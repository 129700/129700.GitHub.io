---
title: "平衡车理论（一）：PID 控制"
slug: balance-car-pid
description: "深入理解 PID 控制原理，以及如何在两轮自平衡车上实现直立环、速度环、转向环三环串级 PID 控制。"
categories:
    - 项目
    - 学习
tags:
    - 平衡车
    - PID
    - 控制理论
    - 串级PID
date: 2026-06-18
math: true
---

## 什么是 PID 控制？

PID（Proportional-Integral-Derivative）是最经典的反馈控制算法，诞生于 20 世纪初，至今仍被广泛应用于工业控制中。它的核心思想非常简单：

**根据当前误差（P）、历史误差（I）和未来误差趋势（D），计算控制量。**

### 数学表达式

连续形式：

$$
u(t) = K_p e(t) + K_i \int_0^t e(\tau) d\tau + K_d \frac{de(t)}{dt}
$$

离散形式（实际代码实现）：

$$
u[k] = K_p \cdot e[k] + K_i \cdot \sum_{i=0}^{k} e[i] \cdot T_s + K_d \cdot \frac{e[k] - e[k-1]}{T_s}
$$

其中：

| 符号 | 含义 |
|------|------|
| $u(t)$ | 控制器输出（如 PWM 占空比） |
| $e(t)$ | 误差 = 目标值 - 实际值 |
| $K_p$ | 比例增益 |
| $K_i$ | 积分增益 |
| $K_d$ | 微分增益 |
| $T_s$ | 采样周期 |

### 三参数的作用

| 参数 | 作用 | 过大时 | 过小时 |
|------|------|--------|--------|
| **Kp** | 快速响应当前误差 | 超调、振荡 | 响应慢、稳态误差大 |
| **Ki** | 消除稳态误差 | 积分饱和、振荡 | 稳态误差无法消除 |
| **Kd** | 抑制超调、预测趋势 | 放大噪声、抖动 | 超调大、稳定慢 |

## 平衡车中的三环串级 PID

两轮自平衡车的控制结构通常是**三环嵌套**：

```
                 ┌──────────────┐
  目标速度 ──→  │  速度环 (外环)  │ ──→ 目标倾角
                 └──────┬───────┘
                        ▼
                 ┌──────────────┐
        ──→     │  直立环 (中环)  │ ──→ 目标角速度
                 └──────┬───────┘
                        ▼
                 ┌──────────────┐
        ──→     │ 角速度环 (内环)  │ ──→ PWM 输出
                 └──────────────┘
```

### 1. 直立环（角度环）— 最内层

**目标**：保持车身竖直，倾角 $\theta = 0$。

这是平衡车最核心的控制环，直接决定车能否站稳。

```c
// 直立环 PID（PD 控制，通常不需要积分项）
float balance_control(float angle, float angle_target) {
    float error = angle - angle_target;
    return Kp_balance * error + Kd_balance * gyro_y;  // gyro_y 是角速度
}
```

> 直接用陀螺仪角速度代替微分项，避免对角度求导引入噪声，这是工程上的常见技巧。

### 2. 速度环 — 中间层

**目标**：控制小车的移动速度，使其能前进、后退、停止。

速度环通过**改变目标倾角**来间接控制速度：想让车前进，就让它往前倾一点。

```c
// 速度环 PI 控制
float speed_control(float speed, float speed_target) {
    static float integral = 0;
    float error = speed - speed_target;
    integral += error;
    return Kp_speed * error + Ki_speed * integral;
}
```

### 3. 转向环 — 最外层

**目标**：控制小车的转向（差速控制）。

```c
// 转向环 PD 控制
float turn_control(float z_gyro, float turn_target) {
    float error = z_gyro - turn_target;
    return Kp_turn * error + Kd_turn * (error - last_error);
}
```

### 最终 PWM 输出

```c
// 左轮和右轮 PWM = 直立环 + 速度环 ± 转向环
int pwm_left  = balance_output + speed_output - turn_output;
int pwm_right = balance_output + speed_output + turn_output;
```

## PID 调参经验

推荐顺序：**直立环 → 速度环 → 转向环**

### 直立环调参

1. 先将 Kp 从 0 开始增大，直到车体出现低频振荡
2. 将 Kp 乘以 0.6 ~ 0.7 作为最终值
3. 加入 Kd 抑制振荡，从小到大增加直到车体稳定

### 速度环调参

1. 先调 Kp，让车能响应速度指令
2. 再加入 Ki 消除稳态误差

### 常见问题

| 现象 | 可能原因 | 解决方法 |
|------|----------|----------|
| 高频抖动 | Kd 过大 | 减小 Kd 或对传感器做低通滤波 |
| 低频摆动 | Kp 不足 | 增大 Kp |
| 往一个方向倒 | 角度零点漂移 | 校准 MPU6050 零点 |
| 积分饱和 | Ki 持续累加 | 加入积分限幅 |

## 离散 PID 的改进形式

### 位置式 PID（上面使用的方式）

```c
output = Kp*err + Ki*integral + Kd*(err - last_err);
```

### 增量式 PID

```c
delta = Kp*(err - last_err) + Ki*err + Kd*(err - 2*last_err + prev_err);
output += delta;
```

增量式 PID 的优势：输出只与最近 3 次误差有关，**天然抗积分饱和**，适合电机控制。

## 小结

PID 是平衡车控制的入门首选，不需要高深的数学基础，调参直观。但它也有局限：

- 三个参数是**独立调试**的，没有系统化的最优解
- 对**非线性和约束**处理能力有限
- 平衡车的直立、速度、转向三环之间的**耦合**难以通过 PID 完美解耦

接下来的 LQR 和 MPC 将解决这些问题。

> 参考文献: 平衡车PID控制角度环角速度环分析 - CSDN文库