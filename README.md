# xcpc.link · AWESOME XCPC

面向算法竞赛选手、学生教练和出题人的 XCPC 资源导航。把常用的 OJ、榜单、模板、工具、赛程和赛事资讯集中在一个入口，方便日常训练、备赛和参赛规划。

[访问网站](https://xcpc.link/) · [提交网站](https://github.com/coolarec/xcpc.link/issues/new?template=add-site.yml) · [反馈问题](https://github.com/coolarec/xcpc.link/issues)

## 功能

- **资源导航**：按初学者、算竞高手、学生教练 & 出题人、退役选手分类，收录题库、训练平台、算法模板、可视化工具、获奖查询和选手主页等资源。
- **站内搜索**：搜索分类、分组和网站，快速定位所需资源。
- **全站访问榜单**：通过 EdgeOne 边缘函数和 Blob 统计七日常用、全站最近打开的网站，各展示 8 个；无数据时展示随机资源。
- **赛程与资讯**：查看赛季比赛日期、举办学校、出题方及已整理的名额规则，浏览竞赛新闻和社区动态。
- **显示设置**：支持浅色、深色和跟随系统主题，以及紧凑、详细两种浏览模式；适配桌面和手机。
- **社区投稿**：通过 GitHub Issue 提交网站，自动生成数据更新 PR，维护者预览后审核合并。

## 页面

| 路径 | 内容 |
| --- | --- |
| `/` | 资源导航、搜索、赛程公告和资讯 |

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

提交代码前运行 `npm run typecheck` 和 `npm test`。测试使用 Node.js 24 原生 TypeScript 支持，覆盖名额规则边界、学校名称归一化、榜单导入及首页远端刷新失败回退；CI 同样执行这些检查。

## 项目结构

```text
src/
├── views/home/              # 首页及资源导航、搜索、赛程、资讯组件
├── modules/home/            # 资源目录、赛程、资讯数据及读取逻辑
├── modules/cal-data.json    # ICPC 榜单快照和分配规则数据
├── modules/quota/           # 学校身份归一化与名额纯计算函数
├── stores/                  # 主题、显示偏好和首页内容状态
├── router/                  # 页面路由
├── components/              # 通用组件
└── assets/styles/           # 全局样式
public/assets/              # 网站图标、规则 PDF 等静态资源
scripts/                    # 网站投稿处理与榜单更新脚本
server/                     # 全站访问统计服务及接口测试
edge-functions/api/activity/ # EdgeOne 访问榜单与点击上报路由
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
```

更新脚本需要联网访问 Pintia 公开榜单，用于维护仓库中的榜单快照。更新后应检查数据差异，再提交发布。

## 部署与配置

Vercel 项目使用 `npm run build` 构建、`dist` 作为输出目录。`vercel.json` 已配置前端路由回退及静态资源缓存。部署到其他静态服务时，也需要将页面路由请求回退到 `index.html`。

本地开发无需环境变量。以下配置按需使用：

| 变量 | 用途 |
| --- | --- |
| `VITE_CDN_BASE_URL` | 设置构建资源基础地址及资源卡片的本地图标前缀；启用后需同步上传资源到 CDN |
| `VITE_GALLERIES_API_URL` | 首先展示仓库内置目录，后台获取并校验远端目录；5 秒超时或请求失败时保留已有内容 |
| `VITE_ACTIVITY_API_BASE_URL` | 全站访问统计的同源接口路径，默认 `/api/activity`；不接受外部域名 |
| `ACTIVITY_BLOB_STORE` | 仅 EdgeOne 服务端使用的 Blob 命名空间名，例如 `xcpc-link-activity-production`；不得加 `VITE_` 前缀 |
| `VITE_ICP_LICENSE_NUMBER` / `VITE_ICP_LICENSE_URL` | 首页页脚展示工信部 ICP 备案号及查询地址；备案号为空时不展示 |
| `VITE_PUBLIC_SECURITY_RECORD_NUMBER` / `VITE_PUBLIC_SECURITY_RECORD_URL` | 首页页脚展示公安备案号及查询地址；备案号为空时不展示 |

PR Preview 建议不设置 `VITE_CDN_BASE_URL`，以便直接验证分支中新添加的图标。

### EdgeOne 全站访问统计

仓库根目录 `edgeone.json` 配置 Vite 构建和 SPA 回退；`edge-functions/` 由 EdgeOne 独立构建，API 路由优先于 SPA 回退。普通 Vite、Vercel 静态部署不会执行这些边缘函数。统计使用 `@edgeone/pages-blob`，无需等待 KV 审核或绑定 KV。未配置 Blob 或存储不可用时，上报返回 503，页面保留随机资源展示；不会在浏览器本地保存访问记录或生成个人榜单。

按以下步骤配置：

1. 在 EdgeOne Makers 项目设置的服务端环境变量中添加 `ACTIVITY_BLOB_STORE=xcpc-link-activity-production`。名称限 1–64 位字母、数字、下划线或连字符，首位必须是字母或数字。不要配置为 `VITE_` 变量。
2. 正式与预览部署必须使用不同名称，例如预览使用 `xcpc-link-activity-preview`；不配置该变量的部署不会访问 Blob。变量被显式要求是为了避免预览误写正式榜单。
3. 重新部署项目，平台负责 SDK 在函数中的身份认证，无需向浏览器提供 Token。第一次调用会自动创建 Blob 命名空间，可在控制台 Blob 存储页查看。
4. 给 `/api/activity/click` 配置 EdgeOne 精准速率限制：以客户端 IP 为维度，建议从每分钟 60 次开始，超额返回 429。接口中的同源校验和链接白名单不能代替平台限流。

接口行为：

| 接口 | 用途 |
| --- | --- |
| `GET /api/activity` | 返回 `{ version, timeZone, generatedAt, popular, recent }`，条目包含 `url`、`weekCount`、`lastOpened` |
| `POST /api/activity/click` | 同源 JSON 请求 `{ "url": "目录中的完整链接" }`，独立 Blob 记录写入成功后返回 204 |

两个榜单都统计全站用户。七日常用按北京时间今天及前 6 个自然日汇总，次数相同按最近访问排序；最近打开按最后点击时间排序、按 URL 去重，不受七日期限限制。每次点击生成独立文件：

```text
events/v1/YYYY-MM-DD/<13位服务器时间>_<128位随机ID>_<链接SHA-256>.json
```

文件保存 `{ version: 1, linkId, openedAt }`，不记录用户 ID、IP、Cookie 或客户端传入的时间。链接 ID、时间也在文件名中，榜单只需分页列举元数据，无需逐条下载 JSON。先读最近七天全部点击，若不同链接不足 8 个，再列举日期目录并由新到旧补足历史最近打开。移出仓库目录的链接会被忽略；通过 `VITE_GALLERIES_API_URL` 新增的远端链接要同步进仓库并重新部署才会被服务端接受。

榜单读取在同一函数运行实例合并并缓存 30 秒，响应另允许共享缓存至 30 秒；跨日时缓存失效。最近七天的 Blob 目录并行查询。前端在页面可见时每 60 秒刷新，请求超时为 15 秒。首次加载显示加载状态，首次读取失败最多自动重试两次并提供手动重试；只有成功读取且对应榜单为空时才展示随机资源。刷新失败时保留内存中最后一次成功取得的全站列表。点击采用 `fetch(..., { keepalive: true })` 上报，超时或失败不会阻断链接打开，也不会自动重试点击。

Blob 列举显式使用强一致性。各点击使用独立随机键，没有共享统计 JSON 的读改写覆盖问题。统计仍受请求送达、存储故障和展示缓存影响，不保证每次现实点击都被记录；不使用共享 JSON 缓存，以免并发覆盖榜单快照。单次榜单计算限制最多 100 页、100,000 个元数据条目，超限返回 503，不返回截断后的错误排名。

此版本适用于低流量导航站，**每次成功点击占用一个对象，历史记录不会自动删除**，以保留七天以前的最近打开。需要监控 Blob 配额和函数执行时间；流量增长或接近配额时，应先做受控历史汇总和归档，再清理原始事件，不能直接删除七天前所有记录。仓库没有自动执行删除或迁移已有 KV 数据。

本地验证运行 `npm run test:activity`，使用隔离的内存 Blob 测试替身检查跨访客共享、并发独立写入、分页、历史最近打开、缓存、北京时间跨日、非法请求和存储故障。测试替身不用于生产环境。Vite 的 `dev` / `preview` 只提供静态站点，本地随机资源不能证明远端 Blob 已接通。部署后可以这样联调：

```sh
# 未设置 ACTIVITY_BLOB_STORE 应返回 503，配置成功且无记录时返回两个空列表
curl -i https://xcpc.link/api/activity

# 上报目录中已有的链接；成功应返回 204
curl -i https://xcpc.link/api/activity/click \
  -H 'Origin: https://xcpc.link' \
  -H 'Content-Type: application/json' \
  --data '{"url":"https://atcoder.jp/"}'

# 等待榜单缓存更新后，用另一浏览器打开首页验证全站列表
```

参考：[EdgeOne Blob](https://pages.edgeone.ai/document/blob-storage)、[边缘函数路由与运行时](https://edgeone.ai/document/187317955530207232)。真实 Blob 的平台凭证注入与读写需要部署后联调验证。

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

如果投稿填写 HTTPS 图标地址，工作流会校验并下载 PNG、JPEG、WebP、ICO 或安全的静态 SVG 文件，直接保存到项目现有的 `public/assets/icons/`，再把 JSON 中的图标地址替换为 `/assets/icons/...`。图片限制为 1 MiB，并拒绝私网地址、危险跳转、脚本、外部 SVG 资源和非图片内容。PNG、JPEG、WebP 会自动缩放到不超过 96×96 并重新压缩；ICO 与 SVG 原样保存。Preview 环境不要设置 `VITE_CDN_BASE_URL`，即可从 PR 分支直接预览新增图标；Production 环境可继续单独配置 CDN，但发布时必须把新增图标同步到 CDN，否则正式站点可能出现 404。

由默认 `GITHUB_TOKEN` 创建的自动 PR 可能不会再次触发仓库内其他 `pull_request` 工作流；Vercel GitHub Integration 的 Preview Deployment 不依赖该重触发机制。如果还需要自动 PR 上运行额外 GitHub Checks，请将工作流的 `GITHUB_TOKEN` 换成具备最小必要权限的 GitHub App 或 PAT secret。

Issue 中的 Preview 评论由 `.github/workflows/comment-site-preview.yml` 监听成功的 `deployment_status` 事件生成。它只处理 `issue/<issue-number>-add-site` 分支，并在后续重新部署时更新已有评论，不会重复刷屏。工作流上线前已经完成的部署不会被追溯处理；编辑对应 Issue 触发一次新的 PR 更新和 Vercel 部署即可生成评论。

投稿 PR 合并后，`.github/workflows/cleanup-site-issue-branch.yml` 会自动删除对应的 `issue/<issue-number>-add-site` 分支。未合并的 PR、普通分支和外部 Fork 分支不会被删除。

</details>
