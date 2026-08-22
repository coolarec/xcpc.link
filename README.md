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

自动化不会合并 PR、执行投稿文本或下载远程图标。维护者仍需检查数据内容、目标分类和 Vercel 页面预览后再决定是否合并。
