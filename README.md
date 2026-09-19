# xcpc.link · AWESOME XCPC

面向算法竞赛选手、学生教练和出题人的 XCPC 资源导航。把常用的 OJ、榜单、模板、工具、赛程和赛事资讯集中在一个入口，并提供 ICPC 区域赛名额测算，方便日常训练、备赛和参赛规划。

[访问网站](https://xcpc.link/) · [提交网站](https://github.com/coolarec/xcpc.link/issues/new?template=add-site.yml) · [反馈问题](https://github.com/coolarec/xcpc.link/issues)

## 功能

- **资源导航**：按初学者、算竞高手、学生教练 & 出题人、退役选手分类，收录题库、训练平台、算法模板、可视化工具、获奖查询和选手主页等资源。
- **站内搜索**：搜索分类、分组和网站，快速定位所需资源。
- **赛程与资讯**：查看赛季比赛日期、举办学校、出题方及已整理的名额规则，浏览竞赛新闻和社区动态。
- **名额计算**：结合公开榜单与赛事规则，按学校展示名额，支持搜索、排序和逐项查看计算依据。
- **显示设置**：支持浅色、深色和跟随系统主题，以及紧凑、详细两种浏览模式；适配桌面和手机。
- **社区投稿**：通过 GitHub Issue 提交网站，自动生成数据更新 PR，维护者预览后审核合并。

## 页面

| 路径 | 内容 |
| --- | --- |
| `/` | 资源导航、搜索、赛程公告和资讯 |
| `/quota` | ICPC 区域赛名额计算，按两场网络赛合并校排和七个赛站规则测算 |

名额页基于榜单快照，具体计算范围、未计入项目和规则解释见页面说明，最终分配以赛事组委会公布为准。

## 技术栈

Vue 3、TypeScript、Vite、Vue Router 和 Pinia；样式使用 CSS / Sass，图标使用 Lucide。默认数据存储在仓库内的 JSON 和 TypeScript 文件中，本地运行无需后端服务。项目通过 GitHub Actions 检查构建，使用 Vercel 提供部署及 PR 预览。

## 本地开发

建议使用 Node.js 24，与仓库 CI 保持一致。

```sh
git clone https://github.com/coolarec/xcpc.link.git
cd xcpc.link
npm ci
npm run dev
```

打开终端输出的本地地址。构建与预览：

```sh
npm run build
npm run preview
```

构建产物位于 `dist/`。

## 项目结构

```text
src/
├── views/home/              # 首页及资源导航、搜索、赛程、资讯组件
├── views/cal/               # ICPC 区域赛名额计算页面
├── modules/home/            # 资源目录、赛程、资讯数据及读取逻辑
├── modules/cal-data.json    # ICPC 榜单快照和分配规则数据
├── stores/                  # 主题、显示偏好和首页内容状态
├── router/                  # 页面路由
├── components/              # 通用组件
└── assets/styles/           # 全局样式
public/assets/              # 网站图标、规则 PDF 等静态资源
scripts/                    # 网站投稿处理与榜单更新脚本
.github/                    # Issue 模板和自动化工作流
```

## 内容维护

| 内容 | 维护位置 |
| --- | --- |
| 分类、分组和网站卡片 | `src/modules/home/home-galleries/*.json` |
| 赛季日程、举办方和出题方 | `src/modules/home/seasonSchedule.ts` |
| 新闻与社区资讯 | `src/modules/home/home-news.json` |
| 网站图标 | `public/assets/icons/` |
| 名额规则原文 | `public/assets/icpc-rules/` |

网站卡片包含 `websiteTitle`、`websiteUrl`、`websiteDescription` 和 `avatarUrl`。修改资源目录即可更新首页展示与站内搜索数据。

### 更新榜单

```sh
# 更新两场 ICPC 网络赛快照及合并校排
npm run update:network-ranking

# 将更新后的数据构建为静态页面
npm run build
```

更新脚本需要联网访问 Pintia 公开榜单。网站使用仓库中保存的快照，刷新页面不会自动获取最新成绩。更新后应检查数据差异和页面计算结果，再提交发布。

## 部署与配置

Vercel 项目使用 `npm run build` 构建、`dist` 作为输出目录。`vercel.json` 已配置前端路由回退及静态资源缓存。部署到其他静态服务时，也需要将页面路由请求回退到 `index.html`。

本地开发无需环境变量。以下配置按需使用：

| 变量 | 用途 |
| --- | --- |
| `VITE_CDN_BASE_URL` | 设置构建资源基础地址及资源卡片的本地图标前缀；启用后需同步上传资源到 CDN |
| `VITE_GALLERIES_API_URL` | 从接口读取资源目录；未配置或请求失败时使用仓库内置数据 |

PR Preview 建议不设置 `VITE_CDN_BASE_URL`，以便直接验证分支中新添加的图标。

## 参与贡献

推荐网站可填写 [“添加网站”表单](https://github.com/coolarec/xcpc.link/issues/new?template=add-site.yml)，说明名称、链接、用途和目标分类。带有 `data:site` 标签的投稿会经过自动校验，并生成对应的 Pull Request；维护者检查预览后决定是否合并。

修复失效链接、补充赛事资料或改进功能，也欢迎直接提交 Issue 或 Pull Request。代码改动请先运行 `npm run build`。

<details>
<summary>维护者：投稿自动化配置与注意事项</summary>

仓库维护者需要完成以下一次性设置：

1. 在 GitHub 仓库中创建 `data:site` 标签，使 Issue Form 可以自动附加工作流路由标签。
2. 在 GitHub 的 Actions → General → Workflow permissions 中启用 “Allow GitHub Actions to create and approve pull requests”。
3. 在 Vercel 中连接该 GitHub 仓库并启用 Pull Request Preview Deployments。自动 PR 创建后，Vercel 会把预览状态和链接显示在 PR checks 中；部署成功后，仓库工作流还会把 Preview URL 回写到来源 Issue 的一条固定评论中。

自动化不会合并 PR 或执行投稿文本。若已生成 PR 的 Issue 后续被编辑为非法或重复数据，工作流会评论并把旧 PR 转为草稿；Issue 修正并重新通过校验后，同一 PR 会恢复为可审核状态。维护者仍需检查数据内容、目标分类和 Vercel 页面预览后再决定是否合并。

如果投稿填写 HTTPS 图标地址，工作流会校验并下载 PNG、JPEG、WebP、ICO 或安全的静态 SVG 文件，直接保存到项目现有的 `public/assets/icons/`，再把 JSON 中的图标地址替换为 `/assets/icons/...`。图片限制为 1 MiB，并拒绝私网地址、危险跳转、脚本、外部 SVG 资源和非图片内容。Preview 环境不要设置 `VITE_CDN_BASE_URL`，即可从 PR 分支直接预览新增图标；Production 环境可继续单独配置 CDN，但发布时必须把新增图标同步到 CDN，否则正式站点可能出现 404。

由默认 `GITHUB_TOKEN` 创建的自动 PR 可能不会再次触发仓库内其他 `pull_request` 工作流；Vercel GitHub Integration 的 Preview Deployment 不依赖该重触发机制。如果还需要自动 PR 上运行额外 GitHub Checks，请将工作流的 `GITHUB_TOKEN` 换成具备最小必要权限的 GitHub App 或 PAT secret。

Issue 中的 Preview 评论由 `.github/workflows/comment-site-preview.yml` 监听成功的 `deployment_status` 事件生成。它只处理 `issue/<issue-number>-add-site` 分支，并在后续重新部署时更新已有评论，不会重复刷屏。工作流上线前已经完成的部署不会被追溯处理；编辑对应 Issue 触发一次新的 PR 更新和 Vercel 部署即可生成评论。

投稿 PR 合并后，`.github/workflows/cleanup-site-issue-branch.yml` 会自动删除对应的 `issue/<issue-number>-add-site` 分支。未合并的 PR、普通分支和外部 Fork 分支不会被删除。

</details>
