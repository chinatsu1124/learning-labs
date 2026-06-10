# learning-labs

一些用来理解概念的小静态页面。部署在 Cloudflare Pages。

**在线**：https://learn.chinatsu1124.com

## labs

lab 列表的单一数据源是根目录的 [`labs.json`](labs.json)，首页卡片、tag 筛选和搜索都从它渲染，README 不再重复维护一份。

## 加新 lab

1. `mkdir <slug>/` 放入 `index.html`（以及需要的 js/css/资源）
   - 头部引入共用资源：`/assets/base.css`（最小 reset）、`/assets/fonts.css`（自托管字体）、`/assets/term.js`（术语 tooltip）
   - 记得加 `<meta name="description">`、og 标签和 favicon（参考现有 lab 的 `<head>`）
2. 在 `labs.json` 的 `labs` 数组末尾加一条（`path` / `tag` / `title` / `sub` / `topics`），并在 lab 页脚加上回首页的链接。首页卡片、计数、tag 筛选会自动生成，不用改 `index.html`
   - `tag` 是首页筛选用的一级分类，尽量复用已有的（crypto / encoding / networking / product / ai / backend），实在不合适再新增
3. `git push` —— Cloudflare Pages 自动构建上线（CI 会先跑内链检查，包括 `labs.json` 里每个 `path` 是否存在）

## lab 内容做深了怎么拆

- 同一主题继续深入 → 在 lab 目录下加子页（如 `/net-lab/tcp/index.html`），原章节末尾放"深入 →"链接
- 能独立成站的 → 按上面流程拆成新 lab，新旧两边互相链接

## 共用资源（`/assets/`）

- `fonts.css` + `fonts/` —— 自托管的 latin 字体（JetBrains Mono / Inter / Syne / Space Grotesk，woff2），不依赖 Google Fonts，大陆可正常访问；中文走系统字体栈
- `base.css` —— 所有 lab 共用的最小基础样式
- `term.js` —— 术语 tooltip，用法见文件头注释
- `favicon.svg` —— 站点图标

## 检查

`node scripts/check-links.mjs` 检查所有页面的内部链接是否有效；GitHub Actions（`.github/workflows/check.yml`）在 push / PR 时自动跑。

## stack

纯静态，无构建步骤。Cloudflare Pages 直接发 `main` 分支根目录。`404.html` 为自定义 404 页。
