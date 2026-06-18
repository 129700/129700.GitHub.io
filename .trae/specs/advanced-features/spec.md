# 博客高级功能增强 - Product Requirement Document

## Overview
- **Summary**: 为 Hugo Stack 主题博客实现四项高级功能：文章字符统计与阅读时长显示、标签/分类聚合页、时间线页、文章封面图支持。所有功能通过在 `layouts/` 和 `assets/scss/` 目录下创建自定义模板与样式实现，不直接修改主题源文件。
- **Purpose**: 让博客内容更易读、更有组织性，提升读者浏览体验和视觉吸引力。目前文章仅有标题和简单日期展示，缺少字数信息、标签聚合效果、时间线浏览和封面图。
- **Target Users**: 博客读者（浏览者）、博客作者（管理内容）。

## Goals
- 在文章详情页和文章列表中显示精确的字符统计和阅读时长
- 点一个标签/分类时，打开一个漂亮的聚合页，展示该标签下所有文章
- 提供一个时间线页面，按时间顺序展示文章（类似美化版的 archives）
- 文章列表和聚合页中文章支持封面图，视觉更美观

## Non-Goals (Out of Scope)
- 不修改 `themes/hugo-theme-stack/` 目录内的任何文件
- 不引入新的第三方依赖或插件
- 不实现复杂的评论系统、搜索功能增强等不在本次需求范围内的功能
- 不修改网站导航菜单（除非为新页面添加入口的必要配置）

## Background & Context
- 站点基于 Hugo 静态网站生成器，使用 Stack 主题（`themes/hugo-theme-stack/`）
- Hugo 的模板覆盖机制：在根目录 `layouts/` 下创建同名模板即可覆盖主题模板
- 现有 `layouts/archives.html` 已经是自定义模板，作为参考
- 文章 front matter 中通过 `image` 字段可指定封面图，Stack 主题原生支持
- `assets/scss/custom.scss` 已存在，用于自定义样式
- 现有文章目录：`content/post/`，使用 front matter 中的 `categories`、`tags`、`date` 元数据

## Functional Requirements
- **FR-1 (字符统计和阅读时长)**: 在文章详情页（single）的元数据区域显示精确的字符统计（中文汉字数、总字数）和阅读时长，格式如"约 X 字 · 阅读约 Y 分钟"。
- **FR-2 (标签聚合页)**: 点击标签（`/tags/xxx/`）时，展示一个漂亮的聚合页，顶部有标签标题、描述和文章数量，下方以卡片/列表形式展示该标签下所有文章。
- **FR-3 (分类聚合页)**: 点击分类（`/categories/xxx/`）时，展示结构与标签聚合页一致的聚合页。
- **FR-4 (时间线页)**: 在 `/timeline/` 路径下新增时间线页面，以时间线样式（垂直居中节点 + 左右交替内容卡片）展示所有文章，按年/月分组。
- **FR-5 (文章封面图)**: 文章列表（首页、聚合页、时间线页）中的文章卡片支持显示封面图，若文章 front matter 中设置了 `image` 字段则显示。
- **FR-6 (导航菜单入口)**: 在站点侧边栏或导航菜单中为时间线页添加入口。

## Non-Functional Requirements
- **NFR-1 (样式一致性)**: 所有新增页面和组件的样式必须与 Stack 主题现有的视觉风格一致，使用相同的 CSS 变量（如 `--accent-color`、`--card-background` 等）。
- **NFR-2 (响应式)**: 所有新页面在手机、平板、桌面宽度下均需正常显示，不出现横向滚动或布局错乱。
- **NFR-3 (性能)**: 不引入大体积资源，页面构建后 HTML 渲染速度与原站点相当。
- **NFR-4 (可维护性)**: 自定义模板命名清晰、结构简洁，便于后续调整。

## Constraints
- **Technical**: Hugo v0.120+、Hugo Stack 主题、仅允许使用 Go Template、SCSS、原生 HTML/CSS
- **Business**: 无需后端，纯静态站点
- **Dependencies**: 不新增外部依赖；使用主题内已有的 `helper/image`、`helper/icon` 等 partial

## Assumptions
- 读者阅读速度按中文 400-500 字/分钟估算（Hugo 的 `ReadingTime` 默认为 213 字/分钟，需调整）
- 文章内容中的字符统计仅统计 Markdown 正文内容（不含 front matter）
- 至少部分文章的 front matter 中已包含或后续将添加 `image` 字段以启用封面图

## Acceptance Criteria

### AC-1: 文章详情页显示字符统计和阅读时长
- **Given**: 用户打开任意一篇文章详情页（`/post/xxx/`）
- **When**: 页面渲染完成
- **Then**: 在文章标题下方的元数据区域可以看到"约 X 字 · 阅读约 Y 分钟"的信息，字符数精确到个位，阅读时长向上取整到分钟
- **Verification**: `human-judgment`
- **Notes**: 检查样式与现有元数据（日期、标签）协调一致

### AC-2: 文章列表卡片显示字符统计和阅读时长
- **Given**: 用户浏览首页或 archives 页面的文章列表
- **When**: 页面渲染完成
- **Then**: 每篇文章卡片的元数据区域（日期旁边）显示精简版阅读时长信息
- **Verification**: `human-judgment`

### AC-3: 标签聚合页美观展示
- **Given**: 用户点击某个标签（如 `/tags/pid/`）
- **When**: 页面加载完成
- **Then**: 页面顶部展示该标签的名称和文章数量统计卡片，下方以带封面图的卡片/列表形式展示该标签下所有文章，按日期倒序排列
- **Verification**: `human-judgment`
- **Notes**: 聚合页需响应式，支持翻页（如文章数量多）

### AC-4: 分类聚合页美观展示
- **Given**: 用户点击某个分类（如 `/categories/robot/`）
- **When**: 页面加载完成
- **Then**: 页面结构与标签聚合页一致，展示该分类下所有文章
- **Verification**: `human-judgment`

### AC-5: 时间线页按时间线样式展示
- **Given**: 用户访问 `/timeline/` 页面
- **When**: 页面加载完成
- **Then**: 页面呈现垂直时间线效果：一条居中竖线，线上有年份/月份节点，文章卡片在竖线左右交替排列，卡片含标题、日期、封面图（如有）、摘要
- **Verification**: `human-judgment`

### AC-6: 文章封面图在列表中显示
- **Given**: 文章的 front matter 中设置了 `image` 字段
- **When**: 该文章出现在首页列表、聚合页、时间线页中
- **Then**: 文章卡片显示该封面图（缩略图），图片比例合理，不失真
- **Verification**: `human-judgment`

### AC-7: 时间线页可通过导航访问
- **Given**: 用户浏览站点任意页面
- **When**: 查找时间线页入口
- **Then**: 可以通过侧边栏或导航菜单点击进入时间线页
- **Verification**: `human-judgment`

### AC-8: Hugo 构建成功无错误
- **Given**: 所有模板和样式文件已就绪
- **When**: 执行 `hugo` 构建命令
- **Then**: 构建成功退出，无 template error、无 warning 指向新增文件
- **Verification**: `programmatic`

## Open Questions
- [ ] 时间线页的文章卡片左右交替是否适合中文阅读习惯？是否改为统一左对齐时间线？
- [ ] 字符统计是否需要排除代码块中的字符？
- [ ] 文章封面图的默认比例是多少（如 3:2、16:9、1:1）？
