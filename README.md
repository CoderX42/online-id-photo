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
| 订单 | 免登录 Neon Postgres 订单 |
| 数据库 | Neon Postgres（订单与支付事件） |
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
| `DATABASE_URL` | Neon Postgres 连接字符串 |
| `NEXT_PUBLIC_SITE_URL` | 生产站点 URL，用于微信支付回调 |

微信支付（可选）：

| 变量 | 说明 |
|---|---|
| `WECHAT_MCHID` | 微信商户号 |
| `WECHAT_API_V3_KEY` | API v3 密钥 |
| `WECHAT_SERIAL_NO` | 证书序列号 |
| `WECHAT_PRIVATE_KEY` | 商户私钥 |
| `WECHAT_PLATFORM_PUBLIC_KEY` | 微信支付平台证书公钥，用于回调验签 |
| `WECHAT_PLATFORM_SERIAL_NO` | 微信支付平台证书序列号 |
| `WECHAT_NOTIFY_URL` | 可选，默认 `${NEXT_PUBLIC_SITE_URL}/api/pay/webhook` |

支付订单固定为 ¥0.50/次，订单和支付事件写入 Neon Postgres。未配置数据库或微信支付凭据时，支付接口会返回配置错误，不会以手动确认方式发放导出权益。

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
- 免登录单次支付：¥0.50 解锁本次高清导出、排版照和多尺寸 ZIP

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
    pay/page.tsx                单次支付页
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
    zipExport.ts                多尺寸 ZIP 打包
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

订单迁移文件位于 `migrations/002_orders.sql`：

- `orders` — 单次支付订单
- `payment_events` — 微信支付回调幂等事件

订单表通过订单号和微信回调幂等键保护，照片本身不写入数据库。

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
