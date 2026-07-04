---
title: "CMake, GCC, G++"
slug: cmake-gcc-g
date: 2026-06-21
categories: ["学习"]
tags: ["编译工具链", "嵌入式"]
---
# CMake，GCC，G++

# C/C++编译

c/c++文件需要工具链（Tool Chain）来将其编译为.exe，

### GCC

可用于编译c/c++文件，但C++支持不佳，建议使用g++

```bash
#output 输出的exe可执行文件或者库文件
#source 源文件
gcc -o <output_file>  <source_file> #生成对应的exe文件
#若想编译c++,可以额外添加 -lstdc++ 指令，但只能编译符合C语法的C++文件
```

### G++

主要用于编译c++文件

```bash
gcc -o <output_file>  <source_file>
```



---

# 库文件

> 和自己写的.h文件不一样

**库文件**分为**静态库**和**动态库**，静态库在编译链接的时候和可执行文件合为一体，而动态库单独作为文件供可执行文件调用

- 静态库直接装载到内存，占用内存资源，但执行速度快
- 动态库用的时候才被装载到内存，且可被多个文件调用，因此节省资源，但是执行速度慢

**常见扩展名**

- Windows系统
  - 静态库：lib,library
  - 动态库：dll（Dynamic Link Library）
- Linux系统
  - 静态库：a,Archive
  - 动态库：so,Shared Object

# gcc和g++对多个文件联合生成可执行文件

## 前言

- 通常说的编译是：从源文件编译生成可执行文件
- 但实际上在编译中通常有一下步骤：
  - 源文件.c/.cpp-> 目标文件.o -> 可执行文件.exe
  - 源文件，即你写的代码
  - 目标文件.o，包含代码的二进制表示文件，属于编译中间产物，可删除
  - 可执行文件，即.exe，.elf,hex或这bin文件等，是能在操作系统执行的文件
    - window中常为.exe
    - Linux中常为.elf
    - 嵌入式系统中，一般是可以用烧录器烧录的hex文件或者写入存储的bin文件
  - 总之，可执行文件实际上通过编译+链接两个过程



## 单文件编译

```Bash
gcc -o  test.exe test.c
#等价于
gcc -o test.o -c test.c #-c表示只进行编译
gcc -o test.exe test.o# 将目标文件链接生成可执行文件

```

## 多文件编译

```bash
gcc -o test.exe test.c func.c ... #可以放多个文件联合编译
```

## C/C++混合编译

- 当C中需要带调用C++时在C++代码外部加上$extern "C"$

``` C
extern "C"
{
    <被调用代码>
}
```

- 但是C++调用c时也会报错，故最终解决方案如下

```c++
//如果当前是C++，那就告诉编译器，用c语言来编译,在.h头文件里写
#ifdef __cplusplus
extern "C"
{
    #endif
    <被调用内容>eg:函数声明
    #ifdef __cplusplus
}
#endif

```



---

# Make

- 一个C/C++项目构建工具
- 根据makefile文件来编译指定文件
- 常见内容

```makefile
<demo_name>:<dependency>
	<related_instructions>
#<demo_name>即项目名称
#<dependency> 依赖项，可以是其他项目名，也可以是多个文件，不同文件之间用空格隔开
#<related_instructions>指令名，可以是一条或者多条gcc/g++指令

```

- 常见make指令

```bash
make <demo_name>
```

---

# CMake

可以根据CMakeLists.txt来生成makefile文件，然后再根据makefile进行编译链接

> 还没用过呢，感觉不如直接让ai写makefile