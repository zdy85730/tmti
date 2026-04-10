# TMTI

TMTI 是一个中文静态人格测试站。它先给出一张适合公开展示的封面卡，再通过叠层、默认态和导出选择，让用户自己意识到封面下面还有一层没有被带走的内容。

线上地址默认使用 GitHub Pages：

- 仓库：`https://github.com/zdy85730/tmti`
- 站点：`https://zdy85730.github.io/tmti/`

## 技术栈

- Vite
- React 18
- TypeScript
- Vitest
- GitHub Actions Pages

## 本地开发

```bash
npm install
npm run dev
```

## 检查与构建

```bash
npm run lint
npm run test
npm run build
npm run preview
```

## 部署

推送到 `main` 后，GitHub Actions 会自动执行：

1. `npm ci`
2. `npm run test`
3. `npm run build`
4. 发布 `dist/` 到 GitHub Pages

工作流文件位于 [`.github/workflows/deploy.yml`](/I:/Project/meta-ti/.github/workflows/deploy.yml)。

## 文档

- 交互和界面规范见 [`interaction-spec.md`](/I:/Project/meta-ti/interaction-spec.md)

首版只做静态前端，不接后端、支付、广告或账号系统。
