# 照见 · 在线证件照

浏览器本地运行的证件照制作工具，支持 AI 智能抠图换底色、常用/自定义照片尺寸、人像裁切微调，以及 5 寸、6 寸和 A4 相纸自动排版。

**隐私卖点**：照片和抠图推理完全在浏览器本地完成，不上传任何服务器。

## 技术栈

| 层 | 选型 |
|---|---|
| 框架 | Next.js 15 (App Router) + TypeScript |
| UI | Tailwind CSS v3 + 自定义 CSS |
| 状态管理 | Zustand v5 |
| 抠图 | `@imgly/background-removal` (WebGPU 优先，CPU 降级) |
| 认证 | Supabase Auth（邮箱 OTP 免密登录） |
| 数据库 | Supabase Postgres |
| 支付 | 微信支付 Native（Provider 抽象层，可插拔） |
| 部署 | Vercel |
| 测试 | Vitest |

## 本地启动

```bash
npm install
npm run sync:model   # 同步人像模型文件（约 95MB）
npm run dev           # http://localhost:3000
```

生产构建：

```bash
npm run build
npm start
```

## 环境变量

复制 `.env.example` 为 `.env.local` 并填写：

| 变量 | 说明 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名密钥 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 服务角色密钥（用于 webhook） |

微信支付（可选）：

| 变量 | 说明 |
|---|---|
| `WECHAT_MCHID` | 微信商户号 |
| `WECHAT_API_V3_KEY` | API v3 密钥 |
| `WECHAT_SERIAL_NO` | 证书序列号 |
| `WECHAT_PRIVATE_KEY` | 商户私钥 |

未配置微信支付时，订单使用 ManualProvider 占位。

## 功能

- JPG、PNG、WebP 上传与手机拍摄入口
- 浏览器端 FP16 人像模型（WebGPU 优先，自动降级 CPU），照片和推理数据不上传服务器
- 透明、纯色、渐变和自定义底色（10 种预设）
- 23 种常用证件照尺寸库，分类搜索，自定义像素/毫米/DPI
- 人像缩放、水平和垂直位置微调、原图对比
- 防抖预览渲染，拖滑块不再卡顿
- PNG/JPG 无水印寸照导出
- 5 寸、6 寸、A4 排版照，支持间距、页边距和裁切线
- 浅色衣物保护算法（避免白衬衫被误切）
- 最近导出信息记录（本地存储，不保存照片）
- 邮箱 OTP 免密登录（Supabase Auth）
- 用户仪表板：导出历史云同步、自定义尺寸收藏
- 付费会员：高清导出、排版照、多尺寸 ZIP 打包

## 项目结构

```
src/
  app/                          Next.js App Router
    layout.tsx                  根布局（Header + Footer）
    page.tsx                    落地页
    studio/page.tsx             核心工作台
    sizes/page.tsx              尺寸大全 SEO 页
    login/page.tsx              邮箱 OTP 登录
    dashboard/page.tsx          用户中心
    pay/page.tsx                会员支付页
    api/                        Route Handlers
      auth/callback/            OAuth/OTP 回调
      auth/signout/             退出登录
      exports/                  导出记录 CRUD
      custom-sizes/             自定义尺寸 CRUD
      orders/                   订单创建
      pay/webhook/              支付回调
  lib/                          共享库
    backgroundRemoval.ts        抠图模型包装（GPU→CPU 降级）
    imageUtils.ts               画布渲染、排版、衣物保护
    photoSizes.ts               证件照尺寸数据
    utils.ts                    cn() 工具
    entitlements.ts             会员门控
    zipExport.ts                多尺寸 ZIP 打包
    supabase/                   Supabase 客户端
    payment/                    支付 Provider 抽象
  features/studio/              工作室功能模块
    store.ts                    Zustand Store（替代 28 个 useState）
    studio.css                  工作室样式
    components/                 8 个 UI 组件
    hooks/                      useModelPreload, usePreviewRender
  components/layout/            Header, Footer
  stores/auth.ts                认证状态
  middleware.ts                  路由保护
```

## 数据库

迁移文件位于 `supabase/migrations/001_init.sql`：

- `export_records` — 导出记录（仅元数据，不含照片）
- `custom_sizes` — 自定义尺寸收藏
- `orders` — 订单记录
- `entitlements` — 会员有效期

所有表启用 RLS，用户只能访问自己的数据。

## 模型同步

人像模型位于 `public/background-removal`，由站点同源提供并由浏览器缓存。升级 `@imgly/background-removal` 后执行：

```bash
npm run sync:model
```

该脚本从 IMG.LY CDN 下载模型分片并通过 SHA-256 校验。

## COOP/COEP 响应头

多线程 WASM (SharedArrayBuffer) 需要以下响应头，已在 `next.config.ts` 中配置：

```text
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

## 测试

```bash
npm test        # vitest run
npm run test:watch  # vitest (watch mode)
```
