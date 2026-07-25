# Home Search and Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在首页增加可跳转页面位置或打开网站的常驻搜索框，并将主题和显示模式收纳到紧凑设置浮层。

**Architecture:** 搜索数据由 `homeViewModel.ts` 中的纯函数从 galleries 构建，搜索组件只处理输入和选择，页面组件处理滚动与外链副作用。页头集中管理搜索和设置浮层的互斥，设置继续复用现有 Pinia store。

**Tech Stack:** Vue 3、TypeScript、Pinia、SCSS、Lucide Vue、Vitest、Playwright 浏览器验证

## Global Constraints

- 不新增远程搜索服务或模糊搜索依赖。
- 不搜索榜单新闻和通知横幅。
- 保持现有主题与显示模式的 localStorage 键和值不变。
- 页面位置结果使用稳定 DOM 标识，不直接把标题拼成选择器。
- 尊重 `prefers-reduced-motion`。
- 按用户要求，本计划不执行 git commit。

---

### Task 1: 搜索视图模型

**Files:**
- Modify: `src/views/home/components/homeViewModel.ts`
- Create: `src/views/home/components/homeViewModel.test.ts`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: `HomeGallerySection`、`getGalleryGroups(gallery)`。
- Produces: `HomeSearchItem`、`getGallerySectionId()`、`getGroupSectionId()`、`buildHomeSearchIndex()`、`searchHomeItems()`。

- [ ] **Step 1: 建立 Vitest 脚本并写失败测试**

测试必须构造包含分类、分组、网站名称和描述的最小 gallery，断言分类和分组生成 location 结果、网站生成 website 结果，并断言中文、英文大小写、描述匹配、空查询和结果上限。

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- --run src/views/home/components/homeViewModel.test.ts`

Expected: FAIL，提示搜索类型或搜索函数尚未导出。

- [ ] **Step 3: 实现纯函数**

使用 `home-category-${index}` 和 `home-group-${galleryIndex}-${groupIndex}` 作为稳定标识。查询先标准化字符串，再按“标题前缀、标题包含、描述或上下文包含”排序，并在指定上限处截断。

- [ ] **Step 4: 运行单元测试**

Run: `npm test -- --run src/views/home/components/homeViewModel.test.ts`

Expected: PASS。

### Task 2: 搜索框与设置浮层组件

**Files:**
- Create: `src/views/home/components/HomeSearch.vue`
- Create: `src/views/home/components/HomeSettingsPopover.vue`
- Modify: `src/views/home/components/HomeHeader.vue`

**Interfaces:**
- Consumes: `HomeSearchItem[]`、`ThemeMode`、`LiteViewMode`。
- Produces: `HomeSearch` 的 `select` 和 `update:open` 事件；`HomeSettingsPopover` 的 `set-theme` 和 `set-view-mode` 事件。

- [ ] **Step 1: 实现受控搜索组件**

搜索组件接收索引、open 和 disabled，维护 query 与 activeIndex。输入实时调用 `searchHomeItems()`，按页面位置与网站分组渲染；ArrowUp、ArrowDown、Enter 和 Escape 操作同一扁平结果顺序。

- [ ] **Step 2: 实现紧凑设置浮层**

设置浮层渲染两组带可访问标签的分段控件，保留 `system/day/night` 和 `compact/detail` 值，并复用现有颜色变量。

- [ ] **Step 3: 重构页头布局**

`HomeHeader` 用搜索框和 Settings 图标按钮替换现有两组控件，管理 activePopover。点击设置时关闭搜索，搜索打开时关闭设置，文档级 pointerdown 负责点击外部关闭。

- [ ] **Step 4: 验证组件编译**

Run: `npm run build`

Expected: 构建成功，无 Vue 模板和 TypeScript 错误。

### Task 3: 页面接线与页内定位

**Files:**
- Modify: `src/views/home/HomePage.vue`
- Modify: `src/views/home/components/HomeDirectory.vue`
- Modify: `src/views/home/components/HomeCategorySection.vue`

**Interfaces:**
- Consumes: `buildHomeSearchIndex()` 和 `HomeSearchItem`。
- Produces: 可滚动的分类/分组 DOM 节点、短暂高亮状态和网站打开行为。

- [ ] **Step 1: 向目录节点传递索引和高亮状态**

`HomeDirectory` 向每个分类传递 galleryIndex 与 highlightedTargetId；`HomeCategorySection` 根据纯函数设置分类和分组 id，并仅对命中的节点增加高亮类。

- [ ] **Step 2: 接入搜索索引与选择处理**

`HomePage` 从 galleries 计算搜索索引。location 结果调用 `scrollIntoView()` 并设置短暂高亮；website 结果通过 `window.open(url, '_blank', 'noopener,noreferrer')` 打开。

- [ ] **Step 3: 处理减少动态效果**

当 `matchMedia('(prefers-reduced-motion: reduce)')` 匹配时使用即时滚动；CSS 媒体查询关闭高亮过渡。

- [ ] **Step 4: 运行单元测试与构建**

Run: `npm test -- --run && npm run build`

Expected: 全部测试通过，生产构建成功。

### Task 4: 浏览器回归验证

**Files:**
- Verify only: 首页桌面端与移动端

**Interfaces:**
- Consumes: 完成后的首页交互。
- Produces: 桌面和移动端的行为与视觉验证结果。

- [ ] **Step 1: 启动开发服务器**

Run: `npm run dev -- --host 127.0.0.1`

Expected: Vite 输出可访问的本地 URL。

- [ ] **Step 2: 验证搜索流程**

检查分类搜索滚动、分组搜索滚动、网站名称和描述匹配、外链新标签、方向键与 Enter、Escape 和无结果状态。

- [ ] **Step 3: 验证设置和互斥**

检查搜索与设置不会同时打开，系统/日间/夜间和简洁/详细立即生效并在刷新后保持。

- [ ] **Step 4: 验证响应式和主题**

在 1440x900 与 390x844 视口检查文字不溢出、浮层不越界、结果可滚动，并检查日间与夜间配色。
