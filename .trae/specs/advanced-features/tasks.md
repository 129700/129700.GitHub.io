# 博客高级功能增强 - 实施计划（任务拆解与优先级列表）

## [ ] Task 1: 自定义文章元数据组件（字符统计 + 阅读时长）
- **Priority**: P0
- **Depends On**: None
- **Description**:
  - 在 `layouts/_partials/article/components/` 下创建自定义 `details.html`，覆盖主题同名文件
  - 在元数据区域添加自定义字符统计（使用 Hugo 的 `.WordCount` 或自定义模板函数统计中文字符）和阅读时长信息
  - 阅读时长按中文阅读速度调整（约 400-500 字/分钟），显示为"X 分钟"
  - 格式如：`📅 2026-06-18 · 📝 1,234 字 · ⏱ 约 3 分钟`
- **Acceptance Criteria Addressed**: AC-1, AC-2, AC-8
- **Test Requirements**:
  - `human-judgement` TR-1.1: 打开一篇文章详情页，确认字符统计和阅读时长显示在标题下方元数据区，样式与日期、标签协调一致
  - `human-judgement` TR-1.2: 打开首页文章列表，确认每篇卡片显示精简版阅读时长
  - `programmatic` TR-1.3: 执行 `hugo` 构建，确认退出码为 0，无模板错误
- **Notes**: Hugo 的 `.WordCount` 对中文不够精确，可能需要使用 `.Plain` 的 `len` 或自定义字符统计逻辑

## [ ] Task 2: 自定义标签/分类聚合页模板
- **Priority**: P0
- **Depends On**: Task 1
- **Description**:
  - 在 `layouts/_default/` 下创建 `list.html`（覆盖主题同名模板），用于标签（`/tags/xxx/`）和分类（`/categories/xxx/`）的聚合页
  - 页面顶部：展示 taxonomy 名称、文章数量、描述（如有）的卡片
  - 页面主体：以卡片列表形式展示该标签/分类下所有文章，支持封面图、标题、日期、阅读时长、摘要
  - 如文章数量多，支持分页（复用主题的 pagination partial）
- **Acceptance Criteria Addressed**: AC-3, AC-4, AC-6, AC-8
- **Test Requirements**:
  - `human-judgement` TR-2.1: 访问一个有文章的标签页，确认顶部有标签名称 + 文章数量卡片，下方为文章列表
  - `human-judgement` TR-2.2: 访问一个有文章的分类页，确认结构与标签聚合页一致
  - `human-judgement` TR-2.3: 检查响应式布局（手机/平板/桌面宽度），确认无横向滚动
  - `programmatic` TR-2.4: `hugo` 构建成功无错误

## [ ] Task 3: 创建时间线页模板与内容入口
- **Priority**: P0
- **Depends On**: Task 2
- **Description**:
  - 创建 `layouts/timeline.html` 或 `layouts/_default/timeline.html`，实现时间线样式
  - 页面结构：顶部标题卡片 → 垂直时间线（居中竖线 + 年/月节点 + 左右交替文章卡片）
  - 每篇文章卡片包含：封面图（如有）、标题、日期、阅读时长、简短摘要（50-80字）
  - 在 `content/page/timeline/index.md` 创建时间线页面内容入口，设置 `layout: timeline`
  - 按年/月分组文章
- **Acceptance Criteria Addressed**: AC-5, AC-6, AC-8
- **Test Requirements**:
  - `human-judgement` TR-3.1: 访问 `/timeline/`，确认时间线样式展示正确
  - `human-judgement` TR-3.2: 确认文章卡片左右交替排列，节点和连线清晰
  - `human-judgement` TR-3.3: 检查响应式布局，手机端时间线可改为左对齐单列
  - `programmatic` TR-3.4: `hugo` 构建成功无错误

## [ ] Task 4: 时间线页添加导航入口
- **Priority**: P1
- **Depends On**: Task 3
- **Description**:
  - 在站点侧边栏 widget 配置中添加时间线链接，或修改 `config/_default/menus.*` 添加导航菜单项
  - 或者在首页 archives widget 旁添加时间线入口
- **Acceptance Criteria Addressed**: AC-7
- **Test Requirements**:
  - `human-judgement` TR-4.1: 从首页或任意页面可找到并点击进入时间线页

## [ ] Task 5: 为现有文章添加封面图并美化列表展示
- **Priority**: P1
- **Depends On**: Task 2, Task 3
- **Description**:
  - 为 `content/post/` 下的现有文章在 front matter 中添加 `image` 字段
  - 或创建一个默认封面图机制（如根据标题或分类生成占位图）
  - 验证首页、聚合页、时间线页中的封面图展示效果
- **Acceptance Criteria Addressed**: AC-6
- **Test Requirements**:
  - `human-judgement` TR-5.1: 设置了 `image` 的文章在列表中显示封面图
  - `human-judgement` TR-5.2: 未设置 `image` 的文章在列表中不显示异常占位

## [ ] Task 6: 自定义样式美化
- **Priority**: P1
- **Depends On**: Task 1, Task 2, Task 3
- **Description**:
  - 在 `assets/scss/custom.scss` 中添加聚合页和时间线页的自定义 CSS
  - 使用主题 CSS 变量保持风格一致
  - 添加悬停动效、卡片阴影、平滑过渡等细节美化
- **Acceptance Criteria Addressed**: NFR-1, NFR-2
- **Test Requirements**:
  - `human-judgement` TR-6.1: 检查聚合页卡片有合适的阴影和圆角
  - `human-judgement` TR-6.2: 检查时间线节点样式清晰美观
  - `human-judgement` TR-6.3: 检查明暗模式下颜色正常（使用 CSS 变量）
