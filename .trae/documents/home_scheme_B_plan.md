# 博客方案 B（现代简洁版）实现计划

## 一、代码仓库研究结论

### 1.1 当前架构

本项目基于 **Hugo 静态网站生成器**，使用 **Stack 主题**，并通过以下方式进行自定义：

| 文件 | 作用 | 现状 |
|------|------|------|
| [home.html](file:///d:/MY_Page/my-blog/layouts/home.html) | 首页布局模板（覆盖主题） | 三段式：欢迎区 + 精选项目 + 最新文章 |
| [custom.scss](file:///d:/MY_Page/my-blog/assets/scss/custom.scss) | 全站自定义样式（覆盖主题变量） | 蓝紫强调色 + 渐变 banner + 各类卡片样式 |
| [params.toml](file:///d:/MY_Page/my-blog/config/_default/params.toml) | 主题参数配置 | 日期格式、侧栏副标题等 |
| [menu.toml](file:///d:/MY_Page/my-blog/config/_default/menu.toml) | 菜单配置 | 6 项中文菜单 |

### 1.2 Hugo 布局查找规则

Stack 主题的布局层级：
- `baseof.html` 提供容器结构（左栏 + 主内容 + 右栏）
- `layouts/home.html` 使用 `{{ define "main" }}` 填充主内容区
- 我们的新方案 B 沿用此模式：在 `home.html` 中定义新结构，用 `custom.scss` 定义视觉

### 1.3 方案 B 的视觉要点（来自 `/layout-preview/`）

- **顶部导航栏**：左侧 Logo（"129700 · 笔记站"）+ 右侧导航链接（首页/归档/项目/时间线/关于）
- **简介 Banner**：大号标题"记录一些学习，一些生活。" + 简短描述 + 统计数据（文章数/标签数/分类数）
- **文章卡片网格**：2 列布局，每张卡片 = 图片条 + 分类标签 + 标题 + 摘要 + 日期/字数
- **碎碎念区**：浅灰背景，多条带日期的简短动态（类似微博/朋友圈）
- **整体色调**：白底 + 浅灰背景 `#f5f5f7` + 细边框 + 极小的强调色（分类标签用 `#c05621`）
- **圆润克制**：圆角 6-12px，轻阴影 `0 1px 3px rgba(20, 30, 60, 0.06)`，悬停时轻微上浮

---

## 二、需要编辑/新增的文件清单

### 2.1 修改文件（2 个核心文件）

1. **`layouts/home.html`** — 替换首页结构为方案 B
2. **`assets/scss/custom.scss`** — 在文件末尾追加方案 B 的新样式（不删除已有样式以避免破坏其他页面）

### 2.2 不修改但会引用的文件（主题文件，只读）

- `themes/hugo-theme-stack/layouts/baseof.html` — 提供外层容器，方案 B 填充到 `{{ define "main" }}`
- `themes/hugo-theme-stack/layouts/_partials/helper/paginator.html` — 分页组件
- Hugo 的 `.Site.RegularPages`、`.Page.Categories` 等 — 提供数据

---

## 三、修改步骤详解

### 步骤 1：重写 `layouts/home.html`

**目标**：用方案 B 的四个区块替换现有三段式结构。

**结构**：

```
{{ define "main" }}

┌──────────────────────────────────────────┐
│  b-top 顶栏（Logo + 导航链接）            │
├──────────────────────────────────────────┤
│  b-intro 简介区（大标题 + 描述 + 统计）     │
├──────────────────────────────────────────┤
│  b-articles 精选文章卡片网格（2 列，6 篇）  │
├──────────────────────────────────────────┤
│  b-moments 碎碎念区（浅灰背景，动态列表）  │
├──────────────────────────────────────────┤
│  分页导航（沿用主题默认组件）              │
└──────────────────────────────────────────┘

{{ partial "footer/footer" . }}
{{ end }}

{{ define "right-sidebar" }}
    {{ partial "sidebar/right.html" (dict "Context" . "Scope" "homepage") }}
{{ end }}
```

**数据来源**：

| 区块 | 数据源 | Hugo 模板语法 |
|------|--------|----------------|
| 顶栏 Logo | `.Site.Title` | `{{ .Site.Title }}` |
| 顶栏导航 | `menu.toml` | `{{ range .Site.Menus.main }}` |
| 统计-文章数 | 全站文章 | `{{ len .Site.RegularPages }}` |
| 统计-标签数 | Taxonomies | `{{ len .Site.Taxonomies.tags }}` |
| 统计-分类数 | Taxonomies | `{{ len .Site.Taxonomies.categories }}` |
| 文章卡片 | 最新文章（按日期降序） | `{{ range first 6 (where .Site.RegularPages.ByDate.Reverse "Section" "!=" "page") }}` |
| 文章分类 | Front Matter `categories` | `{{ range .Params.categories }}{{ . }}{{ end }}` |
| 文章日期 | `.Date` | `{{ .Date.Format "2006-01-02" }}` |
| 文章字数 | `.WordCount` | `{{ .WordCount }}` |
| 文章摘要 | `.Summary` | `{{ .Summary | plainify | truncate 60 }}` |
| 碎碎念区 | 临时用固定文本（3-5 条），内容围绕控制理论/嵌入式学习的简短感想 | 写死在模板中，等你之后决定放什么 |

**注意**：碎碎念区先放固定的 3-5 条"学习感想"风格的文字 —— 这不是临时 hack，而是因为 Hugo 没有专门的"短动态"内容类型。如果之后想管理起来，可以新建一个 content section（如 `content/moments/`），用 `{{ range first 5 .Site.GetPage "section" "moments" .Pages }}` 迭代。

### 步骤 2：在 `assets/scss/custom.scss` 末尾追加方案 B 样式

**新增样式模块**（约 250-300 行）：

```
/* ============ 方案 B：首页现代简洁版 ============ */
.b-top {
    display: flex; justify-content: space-between; align-items: center;
    padding: 24px 32px; border-bottom: 1px solid #e4e7eb;
}
.b-logo { font-size: 18px; font-weight: 700; letter-spacing: 1px; }
.b-logo .sub { font-size: 11px; color: #8c95a0; font-weight: 400; margin-left: 8px; letter-spacing: 0; }
.b-nav { display: flex; gap: 20px; font-size: 14px; }
.b-nav a { color: #586069; text-decoration: none; padding: 4px 0; border-bottom: 2px solid transparent; }
.b-nav a.active { color: #1f2328; border-bottom-color: #1f2328; font-weight: 500; }

.b-intro { padding: 60px 32px 48px; text-align: center; border-bottom: 1px solid #e4e7eb; }
.b-intro__title { font-size: 32px; font-weight: 700; margin: 0 0 12px; letter-spacing: -0.5px; color: #1f2328; }
.b-intro__sub { ... }
.b-intro__stats { ... }

.b-section-title { padding: 28px 32px 12px; font-size: 15px; font-weight: 600; color: #1f2328; display: flex; justify-content: space-between; align-items: center; }
.b-section-title a { ... }

.b-articles { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; padding: 0 32px 20px; }
.b-article { border: 1px solid #e4e7eb; border-radius: 6px; overflow: hidden; transition: all 0.2s; }
.b-article:hover { border-color: #c8ced6; transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.04); }
.b-article__cover { height: 140px; background: linear-gradient(135deg, #4a6572 0%, #6b8591 100%); display: flex; align-items: center; justify-content: center; font-size: 48px; }
.b-article__body { padding: 14px 16px 18px; }
.b-article__cat { font-size: 12px; color: #c05621; margin-bottom: 6px; font-weight: 500; }
.b-article__title { font-size: 15px; font-weight: 600; color: #1f2328; margin: 0 0 6px; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.b-article__excerpt { font-size: 13px; color: #586069; line-height: 1.6; margin: 0 0 10px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.b-article__meta { font-size: 12px; color: #8c95a0; display: flex; gap: 12px; }

.b-moments { background: #fafbfc; padding: 28px 32px; border-top: 1px solid #e4e7eb; margin-top: 20px; }
.b-moments__title { font-size: 14px; font-weight: 600; color: #1f2328; margin: 0 0 14px; }
.b-moments__list { display: flex; flex-direction: column; gap: 12px; }
.b-moment { font-size: 13px; color: #586069; line-height: 1.7; padding: 10px 14px; background: #fff; border: 1px solid #eaecef; border-radius: 4px; }
.b-moment .date { font-size: 11px; color: #8c95a0; margin-right: 8px; }

// 响应式：窄屏时卡片变 1 列
@media (max-width: 768px) {
    .b-articles { grid-template-columns: 1fr; }
}
```

**关键点**：方案 B 的 CSS 选择器全部以 `.b-` 前缀命名（避免与主题已有 `.home-*` 类冲突），旧样式（`home-hero`、`home-featured` 等）保留在 custom.scss 中，但因为 `home.html` 不再引用它们，它们对首页无视觉影响。

---

## 四、依赖与注意事项

### 4.1 依赖

- **Hugo 模板系统**：`.Site.RegularPages`、`.Site.Menus.main`、`.Site.Taxonomies` — Hugo 原生支持，无需额外插件
- **Stack 主题 partial**：`{{ partial "footer/footer" . }}`、`{{ partial "sidebar/right.html" ... }}` — 主题自带，正常工作
- **SCSS 编译**：Hugo 扩展版内置 SCSS 编译 — 当前项目已经在用，无需修改

### 4.2 注意事项

1. **文章分类（categories）可能为空**：部分文章可能没写 `categories` Front Matter。需要在模板中写 `{{ with .Params.categories }}{{ else }}{{ end }}` 判断避免空显示
2. **文章图片条的颜色**：方案 B 预览中每张卡片的顶部图片条用了不同的深色渐变。模板中用一个 `{{ .WordCount | mod 4 }}`（或 `{{ .Date.Unix | mod 4 }}`）的小技巧，给每张卡片分配不同的 CSS class（`b-article-0` ~ `b-article-3`），实现渐变颜色轮换
3. **分页**：目前方案 B 的卡片区显示 6 篇最新文章（2 列 × 3 行），下面会继续保留主题原生的文章列表（带分页）。这样既保留了视觉，也保留了完整的内容浏览

### 4.3 潜在风险与应对

| 风险 | 概率 | 影响 | 应对方案 |
|------|------|------|----------|
| 主题升级可能改动 `.container` 等基础样式的类名 | 低 | 方案 B 的布局错位 | 所有方案 B 的样式都以 `body` 级 `main` 容器为根，不依赖具体主题 class 名；Hugo 升级后视觉仍可保持 |
| `.Site.Taxonomies.categories` 为空 | 中 | 统计数字显示 0 | 如果为 0，显示一个更友好的提示；或者从菜单/标签替代（目前内容可能确实没设置 category taxonomy） |
| 样式覆盖不足，主题的 `article-list` 样式影响新卡片 | 低 | 卡片视觉不一致 | 方案 B 卡片使用独有的 `.b-article*` 类名，完全脱离主题文章卡片的 CSS 作用域 |
| SCSS 嵌套语法在编译时报错 | 极低 | 样式失效 | custom.scss 已有大量嵌套 SCSS（`.home-hero { ... }`），一直正常编译；方案 B 沿用相同语法 |

---

## 五、实施步骤摘要（执行顺序）

1. **备份**（心理层面，不实际操作）：当前 `home.html` 和 `custom.scss` 内容已知，如需回滚，可随时用当前内容覆盖
2. **修改 `layouts/home.html`**：替换为方案 B 结构（约 100-120 行）
3. **追加 `assets/scss/custom.scss`**：在文件末尾追加方案 B 的样式模块（约 250-300 行）
4. **验证**：`hugo server -D` 启动开发服务器，浏览器打开 `localhost:1313` 检查首页视觉
5. **构建**（可选）：`hugo -D` 确保生产构建无报错

---

## 六、实施后的预期效果

- 首页从"欢迎区 + 项目卡片 + 文章列表"改为"顶栏 + 简介 Banner + 文章卡片网格 + 碎碎念区"
- 整体视觉更克制、现代、接近 baiwumm 等简洁个人博客风格
- 响应式：手机端自动变为 1 列
- 深色模式：方案 B 的颜色使用 CSS 变量和 `[data-scheme="dark"]` 选择器，适配当前已有的深色模式配置
