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

## 加新 lab

1. `mkdir <slug>/` 放入 `index.html`（以及需要的 js/css/资源）
2. 在根 `index.html` 的 `.grid` 区块加一张 card
3. `git push` —— Cloudflare Pages 自动构建上线

## stack

纯静态，无构建步骤。Cloudflare Pages 直接发 `main` 分支根目录。
