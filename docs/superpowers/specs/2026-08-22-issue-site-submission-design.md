# 网站收录 Issue 自动转 PR 设计

## 目标

为 `xcpc.link` 增加一个 GitHub Issue Form。社区成员填写网站信息并提交 Issue 后，GitHub Actions 自动校验表单、更新站点 JSON 数据并创建或更新 Pull Request。仓库连接 Vercel 后，该 PR 由 Vercel 生成 Preview Deployment，维护者可以在合并前检查实际页面效果。

该流程参考 `acmerindex/acmer-info` 的 Issue 转 PR 方案，但适配本项目现有的 Vue 3、Vite 和 `home-galleries` 数据结构。

## 范围

本次只实现“添加网站”模板及其自动化，不增加 Bug、功能建议等其他 Issue 模板，也不在站点内开发独立的投稿后台。

包含：

- GitHub Issue Form；
- Issue 数据解析与校验脚本；
- Issue 创建或编辑时自动创建、更新 PR 的 GitHub Actions 工作流；
- 脚本自动修改 `src/modules/home/home-galleries/*.json`；
- 自动化脚本测试和工作流所需权限；
- Vercel PR Preview 的使用说明。

不包含：

- 自动合并 PR；
- 自动下载或提交第三方网站图标；
- Vercel API、数据库或独立投稿服务；
- 自动创建 GitHub 仓库标签；
- 对现有网站数据的大规模重构。

## 用户流程

1. 用户在 GitHub 创建 Issue，选择“添加网站”。
2. 用户填写网站名称、完整 URL、简介、一级分类、目标分组和可选图标地址。
3. Issue Form 自动添加 `data:site` 标签。
4. `issues: opened` 或 `issues: edited` 事件触发 GitHub Actions。
5. 自动化脚本解析 Issue 正文，执行格式、分类和重复项校验。
6. 校验成功后，脚本修改目标 JSON 文件。
7. 工作流在 `issue/<issue-number>-add-site` 分支创建或更新 PR。
8. PR 正文关联原 Issue，并标注投稿人。
9. Vercel GitHub Integration 为 PR 创建 Preview Deployment；维护者通过 PR 的 deployment 状态访问预览。
10. 维护者审核页面效果和数据内容。PR 合并后关闭关联 Issue。

当用户编辑 Issue 时，同一分支和 PR 会被更新，不重复创建 PR。

## Issue Form

文件：`.github/ISSUE_TEMPLATE/add-site.yml`

模板属性：

- 名称：`添加网站`
- 描述：提交希望收录到 xcpc.link 的网站
- 标题前缀：`[添加网站] `
- 标签：`data:site`

仓库需要预先存在 `data:site` 标签，否则 GitHub 无法为 Issue Form 自动附加该标签，工作流条件也不会成立。实现交付说明中会明确这项一次性仓库设置。

表单字段：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| 网站名称 | input | 是 | 页面展示名称 |
| 网站链接 | input | 是 | 必须是完整的 `http://` 或 `https://` URL |
| 网站简介 | textarea | 是 | 页面卡片的一句话简介 |
| 一级分类 | dropdown | 是 | 初学者、算竞高手、学生教练 & 出题人、退役选手 |
| 目标分组 | input | 否 | 填写已有 `watches[].title`；留空时加入该分类的 `cards` |
| 图标地址 | input | 否 | 只接受仓库内 `/assets/...` 路径或完整 HTTPS URL；留空则写入空字符串 |
| 投稿确认 | checkboxes | 是 | 确认链接可访问、内容与 XCPC 相关、无恶意内容且允许公开展示 |

一级分类到数据文件的映射固定为：

| 一级分类 | 文件 |
| --- | --- |
| 初学者 | `src/modules/home/home-galleries/beginners.json` |
| 算竞高手 | `src/modules/home/home-galleries/advanced.json` |
| 学生教练 & 出题人 | `src/modules/home/home-galleries/coaches.json` |
| 退役选手 | `src/modules/home/home-galleries/authors.json` |

目标分组必须与目标文件中的已有 `watches[].title` 完全一致。自动化不会根据自由输入创建新分组，以避免用户输入造成意外页面结构变化。

## 数据处理脚本

新增一个可在本地和 GitHub Actions 中运行的 Node.js ESM 脚本。脚本通过 `GITHUB_EVENT_PATH` 读取事件，也提供本地测试入口。

处理步骤：

1. 确认 Issue 含有 `data:site` 标签。
2. 按 GitHub Issue Form 生成的三级标题解析字段。
3. 清理 `_No response_` 等 GitHub 空值占位符。
4. 校验必填字段和投稿确认项。
5. 使用 `URL` API 校验网站链接，只允许 `http:` 和 `https:`。
6. 校验图标地址：允许空值、以 `/assets/` 开头的仓库路径或 `https:` URL。
7. 将一级分类映射为目标 JSON 文件。
8. 如果填写目标分组，确认该分组已存在；否则使用顶层 `cards`。
9. 扫描四个 gallery JSON，按规范化后的 URL 检查全站重复项。
10. 将新条目追加到目标数组并以两个空格格式化 JSON，保留文件末尾换行。

新增条目结构：

```json
{
  "avatarUrl": "",
  "websiteUrl": "https://example.com/",
  "websiteTitle": "Example",
  "websiteDescription": "一句话简介。"
}
```

重复 URL 会让脚本失败，避免同一网站被重复收录。名称重复但 URL 不同只记录警告，不直接阻止，以兼容镜像站或同名工具。

## GitHub Actions 工作流

新增 `.github/workflows/issue-to-site-pr.yml`：

- 触发事件：`issues` 的 `opened` 和 `edited`；
- Job 条件：Issue 含 `data:site` 标签；
- 权限：`contents: write`、`pull-requests: write`、`issues: read`；
- 从默认分支检出完整历史；
- 使用仓库当前支持的 Node.js 24；
- 运行数据处理脚本和相关测试；
- 使用固定分支 `issue/<issue-number>-add-site` 创建或更新 PR；
- `add-paths` 只允许 gallery JSON 文件，避免意外提交其他内容；
- PR 标题包含网站名称或 Issue 标题；
- PR 正文包含投稿人、原 Issue 链接和 `Closes #<number>`；
- Commit author 使用 Issue 创建者的 GitHub noreply 地址，committer 使用 `github-actions[bot]`。

工作流使用 `peter-evans/create-pull-request` 的固定主版本。若脚本校验失败，工作流停止且不修改默认分支，也不创建无效 PR。

## Vercel 预览

本项目继续使用现有 Vite 构建流程，不新增 Vercel API 代码。仓库需要在 Vercel 中启用 GitHub Integration 和 Pull Request Preview Deployments。

自动 PR 创建后：

- Vercel 检测 PR 分支；
- 执行 `npm run build`；
- 将 Preview Deployment 状态和链接写入 PR；
- 维护者从 PR 直接访问加入网站后的页面。

如果仓库尚未连接 Vercel，代码侧仍能正常创建 PR，但不会出现 Preview Deployment。README 中会补充所需的 Vercel 项目设置说明。

## 错误处理

- 缺少字段、URL 协议不合法、分类未知、分组不存在或 URL 重复：脚本以非零状态退出并打印明确错误。
- Issue 编辑后修正数据：工作流重新运行并创建或更新同一 PR。
- 如果已有 PR 的 Issue 被编辑为非法或重复数据，工作流会保留同一 PR 分支、评论失败原因并将 PR 转为草稿；Issue 修正后重新通过校验时，再将同一 PR 恢复为可审核状态。
- 图标不可访问：不在 Action 中下载或探测，避免不可信网络资源影响自动化；最终由 Vercel 预览和维护者审核确认。
- GitHub Token 权限不足：PR 创建步骤失败，日志指出所需的仓库 Actions 权限。
- Vercel 构建失败：不影响 PR 创建，失败信息由 Vercel deployment check 展示。

## 测试与验收

自动化脚本至少覆盖：

- 正确解析完整 Issue Form；
- 留空目标分组时写入 `cards`；
- 指定已有分组时写入对应 `watches[].links`；
- 拒绝未知分类；
- 拒绝不存在的分组；
- 拒绝非 HTTP(S) 网站 URL；
- 拒绝全站重复 URL；
- 接受空图标和合法图标地址；
- 编辑同一 Issue 时工作流复用同一分支名。

完成标准：

1. GitHub 新建 Issue 页面显示“添加网站”模板。
2. 合法 Issue 会自动产生仅修改一个 gallery JSON 的 PR。
3. 编辑 Issue 后，同一 PR 内容随之更新。
4. 非法或重复数据不会产生可合并的错误变更。
5. `npm test -- --run` 和 `npm run build` 通过。
6. Vercel 已连接仓库时，自动 PR 获得可访问的 Preview Deployment。

## 安全边界

Issue 内容视为不可信输入。脚本不执行表单文本、不拼接 shell 命令、不下载远程文件，并仅允许修改四个明确的数据文件。工作流不会自动合并 PR；所有投稿仍需维护者审核。
