---
title: "程序设计"
slug: chengxu-sheji
date: 2026-06-21
categories: ["笔记"]
tags: ["C语言", "程序设计"]
---
# 程序设计

## Static 静态变量

**在一些变量管理时当不想对外开放时可以通过用static声明+本文件函数调用实现**

```C
static Local_Data[]={0};


void Data_Porcess()
{
    ……
   Local_Data[]=……;   //同一文件下的函数是可以访问的，但是别的文件不行，通过调用这个函数可以实现间接操作该静态数组
}					  //优点是只将必要的接口(该函数)暴露
```

[更多请看](D:\DJi_C\OpenSource\YL\YL\basic_framework-master\静态数组实例管理设计模式.md)