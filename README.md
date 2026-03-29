# 每日专注

一款面向「难开始、易分心、低能量、任务过大、易忘」的个人工具：**收集箱 → 今日最多 3 件 → 拆小步 → 可选专注计时**。数据默认保存在本机浏览器，可导出 JSON 备份。支持 **PWA**，可安装到桌面或手机主屏幕。

## 功能概览

| 模块 | 说明 |
|------|------|
| **收集箱** | 快速记下念头；选能量档位（低/中/高）；认领到今天；**删除**条目；可一键插入低能量示例任务 |
| **今日** | 每日最多认领 3 件事；昨日未完成可「待认领」；按能量筛选；展示「当前下一步」；跳转专注 |
| **任务详情** | 编辑标题、截止日、能量；子步骤拆解；「先只做 2 分钟」提示；「只显示当前一步」；整项完成 / **删除任务** |
| **专注** | 绑定今日任务；可配置专注/休息时长（默认 25/5 分钟）；段末可写下一段最小动作（写入子步骤）；离开标签页时的温和提醒；短提示音 |
| **打卡** | 自建最多 **6** 个打卡习惯，各配**颜色**与**目标坚持天数**；每日勾选（与任务清单无关）；同一天多习惯时月历格**分色叠满**；**连续 7 天 / 21 天**在格角有金色角标（21 天为常见「习惯养成」节点）；可「撤销今日全部」；今日页未打卡时有轻提示 |
| **备份** | 顶栏导出 / 导入 JSON（`version: 2`，含 `checkInHabits`、`dailyCheckIns`；旧版仅 `checkIns` 的备份仍可导入并自动迁移） |

## 环境要求

- [Node.js](https://nodejs.org/) **LTS**（建议 20+ 或当前 LTS）
- npm（随 Node 安装）

## 本地开发

```bash
cd 每日计划
npm install
npm run dev
```

浏览器访问终端中提示的地址（一般为 `http://localhost:5173`）。

## 生产构建

```bash
npm run build
npm run preview
```

`dist/` 目录为静态站点，可部署到任意静态托管。

## 部署（公开访问）

将 `npm run build` 生成的 **`dist`** 上传到例如 **Vercel、Netlify、Cloudflare Pages、GitHub Pages** 等，绑定域名后即可通过 **HTTPS** 访问。HTTPS 有利于 PWA「安装到主屏幕」与离线缓存。

## 安装到主屏幕（PWA）

- **Windows（Chrome / Edge）**：地址栏「安装」图标，或菜单中的「安装应用」。
- **Android（Chrome）**：菜单 → 「安装应用」或「添加到主屏幕」。
- **iOS（Safari）**：分享 → 「添加到主屏幕」。

本地 `localhost` 一般也可触发安装；若未出现，可尝试正式部署后的 HTTPS 地址。

## 数据说明

- 默认使用浏览器 **localStorage**（键名 `daily-focus-v1`），**清除站点数据会丢失任务与打卡**，请定期 **导出 JSON**。
- 导入会**覆盖**当前本地数据（含打卡习惯与每日勾选），导入前建议先导出备份。

## 技术栈

- [Vite](https://vitejs.dev/) 6 + [React](https://react.dev/) 19 + TypeScript  
- [Tailwind CSS](https://tailwindcss.com/) v4  
- [Zustand](https://github.com/pmndrs/zustand)（持久化）  
- [React Router](https://reactrouter.com/)  
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/)  

## 许可

个人使用为主；如需开源协议可自行补充。
