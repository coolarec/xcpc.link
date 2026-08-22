# xcpc.link

Vue 3 + GSAP prototype for a motion-first bookmark site.

## Current structure

- Fullscreen cursor-driven perspective tilt section with an upper-half ScrambleText algorithm background
- Pinned panels with overscroll transition from part one into part two
- Reusable horizontal gallery components for the second section
- Vue Router scaffold with four placeholder subroutes

## Commands

```sh
npm install
npm run dev
npm run build
```

## 添加网站

社区成员可以在 GitHub Issues 中选择“添加网站”模板。提交或编辑带有 `data:site` 标签的 Issue 后，GitHub Actions 会校验表单、更新 `src/modules/home/home-galleries/` 中对应的 JSON，并创建或更新 `issue/<issue-number>-add-site` Pull Request。

仓库维护者需要完成以下一次性设置：

1. 在 GitHub 仓库中创建 `data:site` 标签，使 Issue Form 可以自动附加工作流路由标签。
2. 在 GitHub 的 Actions → General → Workflow permissions 中启用 “Allow GitHub Actions to create and approve pull requests”。
3. 在 Vercel 中连接该 GitHub 仓库并启用 Pull Request Preview Deployments。自动 PR 创建后，Vercel 会把预览状态和链接显示在 PR checks 中。

自动化不会合并 PR 或执行投稿文本。若已生成 PR 的 Issue 后续被编辑为非法或重复数据，工作流会评论并把旧 PR 转为草稿；Issue 修正并重新通过校验后，同一 PR 会恢复为可审核状态。维护者仍需检查数据内容、目标分类和 Vercel 页面预览后再决定是否合并。

如果投稿填写 HTTPS 图标地址，工作流会校验并下载 PNG、JPEG、WebP 或 ICO 文件，直接保存到项目现有的 `public/assets/icons/`，再把 JSON 中的图标地址替换为 `/assets/icons/...`。图片限制为 1 MiB，并拒绝私网地址、危险跳转和非图片内容。Preview 环境不要设置 `VITE_CDN_BASE_URL`，即可从 PR 分支直接预览新增图标；Production 环境可继续单独配置 CDN，但发布时必须把新增图标同步到 CDN，否则正式站点可能出现 404。

由默认 `GITHUB_TOKEN` 创建的自动 PR 可能不会再次触发仓库内其他 `pull_request` 工作流；Vercel GitHub Integration 的 Preview Deployment 不依赖该重触发机制。如果还需要自动 PR 上运行额外 GitHub Checks，请将工作流的 `GITHUB_TOKEN` 换成具备最小必要权限的 GitHub App 或 PAT secret。
