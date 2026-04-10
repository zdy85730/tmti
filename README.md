# TMTI

`TMTI` 是 `META-TI` 项目的 `3.0` 前端实现。它不再输出一张人格标签卡，而是先让一阶用户生成一份完整可分享的中文问卷，再让二阶用户像普通测试一样完成作答并拿到结果。

线上地址仍然使用 GitHub Pages：

- 仓库：`https://github.com/zdy85730/tmti`
- 站点：`https://zdy85730.github.io/tmti/`

## 当前结构

- `TMTI`：对外产品名，负责生成完整问卷。
- `META-TI`：项目来源入口，只在 About 页、问卷页脚和结果页末尾出现。
- 内容系统：由 `theme pack + question template + outcome pack + source trace` 四层数据组成。

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

## 数据层

运行时核心数据位于 `src/data/`：

- `generatorQuestions.ts`：一阶生成器题
- `themePacks.ts`：题材包元数据
- `theme-packs/*.ts`：题材题库母版
- `outcomePacks.ts`：二阶结果系统
- `sourceTraces.ts`：来源追踪摘要
- `manifest.ts`：内容总索引

## 说明

- 当前版本继续保持纯静态前端，不接后端、账号或数据库。
- 分享主路径是“完整问卷链接”，不是结果截图。
- 旧的 `TMTI 1.x / 2.0` 文档仍保留在仓库中，作为归档参考，不再代表当前实现方向。
