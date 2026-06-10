# learning-labs

一些用来理解概念的小静态页面。部署在 Cloudflare Pages。

**在线**：https://learn.chinatsu1124.com

## labs

| path | title | topic |
|---|---|---|
| `/decrypt/` | 解密台 | 常见加密算法（凯撒/AES/RSA/Hash/DH） |
| `/byte-lab/` | 字节实验室 | 字节、编码、表示形式 |
| `/net-lab/` | 网络实验室 | 计算机网络（分层/封装/IP/TCP/DNS/HTTP） |
| `/pm-lab/` | 产品实验室 | 产品经理 & 产品运营（RICE/KANO/AARRR/AB 实验） |
| `/agent-lab/` | 智能体实验室 | AI Agent（循环/工具调用/上下文/ReAct/RAG/MCP） |

## 加新 lab

1. `mkdir <slug>/` 放入 `index.html`（以及需要的 js/css/资源）
   - 头部引入共用资源：`/assets/base.css`（最小 reset）、`/assets/fonts.css`（自托管字体）、`/assets/term.js`（术语 tooltip）
   - 记得加 `<meta name="description">`、og 标签和 favicon（参考现有 lab 的 `<head>`）
2. 在根 `index.html` 的 `.grid` 区块加一张 card，并在 lab 页脚加上回首页的链接（计数会自动统计，不用改）
3. `git push` —— Cloudflare Pages 自动构建上线（CI 会先跑内链检查）

## 共用资源（`/assets/`）

- `fonts.css` + `fonts/` —— 自托管的 latin 字体（JetBrains Mono / Inter / Syne / Space Grotesk，woff2），不依赖 Google Fonts，大陆可正常访问；中文走系统字体栈
- `base.css` —— 所有 lab 共用的最小基础样式
- `term.js` —— 术语 tooltip，用法见文件头注释
- `favicon.svg` —— 站点图标

## 检查

`node scripts/check-links.mjs` 检查所有页面的内部链接是否有效；GitHub Actions（`.github/workflows/check.yml`）在 push / PR 时自动跑。

## stack

纯静态，无构建步骤。Cloudflare Pages 直接发 `main` 分支根目录。`404.html` 为自定义 404 页。
